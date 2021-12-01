import { Video } from "./../db/models/video.d.ts";
import { User } from "./../db/models/user.d.ts";
import { Bson, Middleware, Status } from "../../deps.ts";
import { verifyJwt } from "../utils/auth.ts";
import { db } from "../db/index.ts";

const users = db.collection<User>("users");
const videos = db.collection<Video>("videos");

export const checkLikeAbilityVideo: Middleware = async (c, next) => {
  try {
    if (!c.request.hasBody) {
      c.response.status = Status.BadRequest;
      return;
    }

    const req = c.request.body({ type: "json" });
    const { videoId, userId } = (await req.value) as {
      videoId: string;
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

    // 3) Check that the video to be liked exists.
    const foundVideo = await videos.findOne({
      _id: new Bson.ObjectId(videoId),
    }, { noCursorTimeout: false });

    if (foundVideo == null) {
      c.response.status = Status.UnprocessableEntity;
      c.response.body = { message: "Video to like not found" };
      return;
    }

    await next();
  } catch (_) {
    c.response.status = Status.UnprocessableEntity;
    c.response.body = { message: "Unprocessable Entity" };
  }
};
