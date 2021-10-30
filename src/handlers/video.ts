import { User } from "./../db/models/user.d.ts";
import { Video } from "./../db/models/video.d.ts";
import { Context, RouterContext, Status } from "../../deps.ts";
import { db } from "../db/index.ts";
import { viewcountLimiter } from "../utils/viewcount-limiter.ts";
import { verifyJwt } from "../utils/auth.ts";

const videos = db.collection<Video>("videos");

export async function createVideo(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const video = (await req.value) as Video;
  video.uploadedAt = new Date();

  try {
    const insertedId = await videos.insertOne(video);

    if (insertedId) {
      c.response.status = Status.Created;
      c.response.body = { message: `Video created: ${insertedId}` };
    } else {
      c.response.status = Status.InternalServerError;
      c.response.body = { message: "Error creating a video" };
    }
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Error creating a video" };
  }
}

export async function getVideoFeed(c: Context) {
  try {
    const videoFeed = await videos.find({ approved: true, listed: true }, {
      noCursorTimeout: false,
      limit: 20,
      projection: {
        approvedBy: 0,
        listed: 0,
        approved: 0,
        approvedAt: 0,
      },
    })
      .toArray();

    c.response.status = Status.OK;
    c.response.body = videoFeed;
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Error getting the video feed." };
  }
}

export async function getVideoByHash(c: RouterContext) {
  const hash = c.params.hash as string;
  const jwt = c.request.headers.get("Authentication")?.split(" ")[1] as string;
  const payload = await verifyJwt(jwt) as { me: User };

  try {
    const video = await videos.findOne({ hash }, {
      noCursorTimeout: false,
      projection: {
        approvedBy: 0,
        approved: 0,
        approvedAt: 0,
      },
    });

    if (video == null) {
      c.response.body = { message: "Video not found." };
      c.response.status = Status.NotFound;
    } else {
      if (viewcountLimiter.userIsLimited(hash, payload.me._id) === false) {
        await videos.updateOne({ hash }, { $inc: { viewCount: 1 } });
        viewcountLimiter.addViewerToLimit(hash, payload.me._id);
      }

      c.response.body = video;
      c.response.status = Status.OK;
    }
  } catch (_) {
    c.response.body = { message: "Internal Server Error" };
    c.response.status = Status.InternalServerError;
  }
}
