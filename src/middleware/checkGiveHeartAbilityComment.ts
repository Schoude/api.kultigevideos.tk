import { User } from "./../db/models/user.d.ts";
import { Bson, Middleware, Status } from "../../deps.ts";
import { verifyJwt } from "../utils/auth.ts";
import { db } from "../db/index.ts";
import { IComment } from "../db/models/comment.d.ts";

const users = db.collection<User>("users");
const comments = db.collection<IComment>("comments");

export const checkGiveHeartAbilityComment: Middleware = async (c, next) => {
  try {
    if (!c.request.hasBody) {
      c.response.status = Status.BadRequest;
      return;
    }

    const req = c.request.body({ type: "json" });
    const { commentId } = (await req.value) as {
      commentId: string;
    };

    const jwt = c.request.headers.get("Authentication")?.split(" ")[1];
    const payload = await verifyJwt(jwt as string) as { me: User };

    // 1) Check that the comment to be liked exists.
    const foundComment = await comments.findOne({
      _id: new Bson.ObjectId(commentId),
    }, { noCursorTimeout: false });

    if (foundComment == null) {
      c.response.status = Status.UnprocessableEntity;
      c.response.body = { message: "IComment to give the heart not found" };
      return;
    }

    if (jwt != null) {
      // 2) check if the auth user that gives the heart is the uploader of the comment's video.
      if (foundComment.uploaderId !== payload.me._id) {
        c.response.status = Status.UnprocessableEntity;
        c.response.body = {
          message:
            "Unprocessable Entity. Your are not the uploader of the comment's video.",
        };
        return;
      }
    }

    await next();
  } catch (_) {
    c.response.status = Status.UnprocessableEntity;
    c.response.body = { message: "Unprocessable Entity" };
    return;
  }
};
