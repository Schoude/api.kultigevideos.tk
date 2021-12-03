import { User } from "./../db/models/user.d.ts";
import { Bson, helpers, Middleware, Status } from "../../deps.ts";
import { verifyJwt } from "../utils/auth.ts";
import { db } from "../db/index.ts";
import { Comment } from "../db/models/comment.d.ts";

const users = db.collection<User>("users");
const comments = db.collection<Comment>("comments");

export const checkDeleteAbilityComment: Middleware = async (c, next) => {
  const { commentId, userId } = helpers.getQuery(c) as {
    commentId: string;
    userId: string;
  };

  try {
    const jwt = c.request.headers.get("Authentication")?.split(" ")[1];
    const payload = await verifyJwt(jwt as string) as { me: User };

    // 1) check if the comment exists
    const foundComment = await comments.findOne({
      _id: new Bson.ObjectId(commentId),
    }, { noCursorTimeout: false });

    if (foundComment == null) {
      c.response.status = Status.UnprocessableEntity;
      c.response.body = { message: "Comment to delete not found" };
      return;
    }

    // 2) Check if the like user is a real user
    const foundUser = await users.findOne({
      _id: new Bson.ObjectId(userId),
    }, { noCursorTimeout: false });

    if (foundUser == null) {
      c.response.status = Status.UnprocessableEntity;
      c.response.body = { message: "Deleting User not found." };
      return;
    }

    if (jwt != null) {
      // 3) check if the user that deletes is the user that sends the request.
      if (payload.me._id !== userId) {
        c.response.status = Status.UnprocessableEntity;
        c.response.body = {
          message: "Unprocessable Entity. Delete User does not match.",
        };
        return;
      }
    }

    // 4) check if the auth user is an admin
    const foundAuthUser = await users.findOne({
      _id: new Bson.ObjectId(payload.me._id),
    }, { noCursorTimeout: false });

    if (foundAuthUser != null && foundAuthUser.role === "admin") {
      await next();
      return;
    }

    // 5) check if the auth user is the comment author or an admin
    if (
      foundComment.authorId !== payload.me._id ||
      foundComment.authorId !== userId
    ) {
      c.response.status = Status.UnprocessableEntity;
      c.response.body = {
        message:
          "Unprocessable Entity. Delete User does is not the comment's author.",
      };
      return;
    }

    await next();
  } catch (_) {
    c.response.status = Status.UnprocessableEntity;
    c.response.body = { message: "Unprocessable Entity" };
    return;
  }
};
