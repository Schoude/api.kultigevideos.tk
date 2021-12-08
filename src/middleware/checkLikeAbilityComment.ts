import { User } from "./../db/models/user.d.ts";
import { Bson, Middleware, Status } from "../../deps.ts";
import { verifyJwt } from "../utils/auth.ts";
import { db } from "../db/index.ts";
import { IComment } from "../db/models/comment.d.ts";

const users = db.collection<User>("users");
const comments = db.collection<IComment>("comments");

export const checkLikeAbilityComment: Middleware = async (c, next) => {
  try {
    if (!c.request.hasBody) {
      c.response.status = Status.BadRequest;
      return;
    }

    const req = c.request.body({ type: "json" });
    const { commentId, userId } = (await req.value) as {
      commentId: string;
      userId: string;
    };

    const jwt = c.request.headers.get("Authentication")?.split(" ")[1];
    const payload = await verifyJwt(jwt as string) as { me: User };

    // 1) Check if the like user is a real user
    const foundUser = await users.findOne({
      _id: new Bson.ObjectId(userId),
    }, { noCursorTimeout: false });

    if (foundUser == null) {
      c.response.status = Status.UnprocessableEntity;
      c.response.body = { message: "Like User not found." };
      return;
    }

    if (jwt != null) {
      // 2) check if the user that likes is the user that sends the request.
      if (payload.me._id !== userId) {
        c.response.status = Status.UnprocessableEntity;
        c.response.body = {
          message:
            "Unprocessable Entity. Like User does not match with auth user.",
        };
        return;
      }
    }

    // 3) Check that the comment to be liked exists.
    const foundComment = await comments.findOne({
      _id: new Bson.ObjectId(commentId),
    }, { noCursorTimeout: false });

    if (foundComment == null) {
      c.response.status = Status.UnprocessableEntity;
      c.response.body = { message: "IComment to like not found" };
      return;
    }

    await next();
  } catch (_) {
    c.response.status = Status.UnprocessableEntity;
    c.response.body = { message: "Unprocessable Entity" };
    return;
  }
};
