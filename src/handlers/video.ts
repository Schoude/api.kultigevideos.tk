import { createUserLookup } from "./../db/pipeline-helpers/video.ts";
import { User } from "./../db/models/user.d.ts";
import { Video } from "./../db/models/video.d.ts";
import { Bson, Context, RouterContext, Status } from "../../deps.ts";
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
    const videoFeed = await videos.aggregate([
      {
        "$match": {
          "listed": true,
          "approved": true,
        },
      },
      {
        "$sample": {
          "size": 40,
        },
      },
      ...createUserLookup("uploader"),
      {
        "$project": {
          "uploaderId": 0,
          "approvedBy": 0,
          "approvedById": 0,
          "approvedAt": 0,
        },
      },
    ]).toArray();

    c.response.status = Status.OK;
    c.response.body = videoFeed;
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Error getting the video feed." };
  }
}

export async function reloadVideoFeed(c: RouterContext) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const { excludeHashesString } = (await req.value) as {
    excludeHashesString: string;
  };

  try {
    const videoFeed = await videos.aggregate([
      {
        "$match": {
          "hash": {
            "$nin": JSON.parse(excludeHashesString),
          },
          "listed": true,
          "approved": true,
        },
      },
      {
        "$sample": {
          "size": 20,
        },
      },
      ...createUserLookup("uploader"),
      {
        "$project": {
          "uploaderId": 0,
          "approvedBy": 0,
          "approvedById": 0,
          "approvedAt": 0,
        },
      },
    ]).toArray();

    c.response.status = Status.OK;
    c.response.body = videoFeed;
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Error getting the video feed." };
  }
}

export async function getVideoRecommended(c: RouterContext) {
  const params = c.params as { excludeHash: string };

  try {
    const recommendedVideos = await videos.aggregate([
      {
        $match: {
          hash: { $ne: `${params.excludeHash}` },
          approved: true,
          listed: true,
        },
      },
      {
        $sample: {
          size: 15,
        },
      },
      ...createUserLookup("uploader"),
      {
        "$project": {
          "description": 0,
          "uploaderId": 0,
          "approvedBy": 0,
          "approvedById": 0,
          "approvedAt": 0,
        },
      },
    ]).toArray();

    c.response.status = Status.OK;
    c.response.body = recommendedVideos;
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Error getting the recommended videos." };
  }
}

export async function getVideosPanel(c: Context) {
  let videosNotApprovedNotListed;
  let videosApprovedNotListed;
  let videosApprovedAndListed;

  try {
    videosNotApprovedNotListed = await videos.aggregate([
      {
        "$match": {
          "listed": false,
          "approved": false,
        },
      },
      ...createUserLookup("uploader"),
      {
        "$project": {
          "uploaderId": 0,
          "approvedBy": 0,
          "approvedById": 0,
          "approvedAt": 0,
        },
      },
    ]).toArray();
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = {
      message: "Error getting the videos not approved, not listed.",
    };
  }

  try {
    videosApprovedNotListed = await videos.aggregate([
      {
        "$match": {
          "listed": false,
          "approved": true,
        },
      },
      ...createUserLookup("uploader"),
      ...createUserLookup("approver"),
      {
        "$project": {
          "uploaderId": 0,
          "approvedById": 0,
        },
      },
    ]).toArray();
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = {
      message: "Error getting the videos approved, not listed.",
    };
  }

  try {
    videosApprovedAndListed = await videos.aggregate([
      {
        "$match": {
          "listed": true,
          "approved": true,
        },
      },
      {
        "$sort": {
          "approvedAt": -1,
        },
      },
      ...createUserLookup("uploader"),
      ...createUserLookup("approver"),
      {
        "$project": {
          "uploaderId": 0,
          "approvedById": 0,
        },
      },
    ]).toArray();
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Error getting the listed videos." };
  }

  c.response.status = Status.OK;
  c.response.body = {
    videosNotApprovedNotListed,
    videosApprovedNotListed,
    videosApprovedAndListed,
  };
}

export async function getVideoByHash(c: RouterContext) {
  const hash = c.params.hash as string;
  const jwt = c.request.headers.get("Authentication")?.split(" ")[1] as string;
  const payload = await verifyJwt(jwt) as { me: User };

  try {
    const video = await videos.aggregate([
      {
        $match: {
          hash,
          listed: true,
          approved: true,
        },
      },
      ...createUserLookup("uploader"),
      {
        "$project": {
          "uploaderId": 0,
          "approvedBy": 0,
          "approvedById": 0,
          "approvedAt": 0,
        },
      },
    ]).next();

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

export async function likeVideo(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const likeData = (await req.value) as { videoId: string; userId: string };

  try {
    const video = await videos.findOne({
      _id: new Bson.ObjectId(likeData.videoId),
    }, {
      noCursorTimeout: false,
    });

    if (video?.likes.includes(likeData.userId)) {
      const { modifiedCount } = await videos.updateOne({
        _id: new Bson.ObjectId(likeData.videoId),
      }, {
        $pull: {
          likes: likeData.userId,
          dislikes: likeData.userId,
        },
      });

      if (modifiedCount > 0) {
        const video = await videos.findOne({
          _id: new Bson.ObjectId(likeData.videoId),
        }, {
          noCursorTimeout: false,
        });
        c.response.body = video;
        c.response.status = Status.Accepted;
      }
    } else {
      const { modifiedCount } = await videos.updateOne({
        _id: new Bson.ObjectId(likeData.videoId),
      }, {
        $addToSet: { likes: likeData.userId },
        $pull: { dislikes: likeData.userId },
      });

      if (modifiedCount > 0) {
        const video = await videos.findOne({
          _id: new Bson.ObjectId(likeData.videoId),
        }, {
          noCursorTimeout: false,
        });
        c.response.body = video;
        c.response.status = Status.Accepted;
      }
    }
  } catch (_) {
    c.response.body = { message: "Internal Server Error" };
    c.response.status = Status.InternalServerError;
  }
}

export async function dislikeVideo(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const likeData = (await req.value) as { videoId: string; userId: string };

  try {
    const video = await videos.findOne({
      _id: new Bson.ObjectId(likeData.videoId),
    }, {
      noCursorTimeout: false,
    });

    if (video?.dislikes.includes(likeData.userId)) {
      const { modifiedCount } = await videos.updateOne({
        _id: new Bson.ObjectId(likeData.videoId),
      }, {
        $pull: {
          likes: likeData.userId,
          dislikes: likeData.userId,
        },
      });

      if (modifiedCount > 0) {
        const video = await videos.findOne({
          _id: new Bson.ObjectId(likeData.videoId),
        }, {
          noCursorTimeout: false,
        });
        c.response.body = video;
        c.response.status = Status.Accepted;
      }
    } else {
      const { modifiedCount } = await videos.updateOne({
        _id: new Bson.ObjectId(likeData.videoId),
      }, {
        $addToSet: { dislikes: likeData.userId },
        $pull: { likes: likeData.userId },
      });

      if (modifiedCount > 0) {
        const video = await videos.findOne({
          _id: new Bson.ObjectId(likeData.videoId),
        }, {
          noCursorTimeout: false,
        });
        c.response.body = video;
        c.response.status = Status.Accepted;
      }
    }
  } catch (_) {
    c.response.body = { message: "Internal Server Error" };
    c.response.status = Status.InternalServerError;
  }
}

export async function approveVideo(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const approveData = (await req.value) as {
    videoId: string;
    userId: string;
    listVideo: boolean;
  };

  try {
    const { modifiedCount } = await videos.updateOne({
      _id: new Bson.ObjectId(approveData.videoId),
    }, {
      $set: {
        approved: true,
        listed: approveData.listVideo,
        approvedById: approveData.userId,
        approvedAt: new Date(),
      },
    });

    if (modifiedCount > 0) {
      c.response.body = { message: "Video approved." };
      c.response.status = Status.OK;
    } else {
      c.response.body = { message: "Internal Server Error" };
      c.response.status = Status.InternalServerError;
    }
  } catch (_) {
    c.response.body = { message: "Internal Server Error" };
    c.response.status = Status.InternalServerError;
  }
}

export async function toggleVideoListed(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const listedData = (await req.value) as {
    videoId: string;
    listVideo: boolean;
  };

  try {
    const { modifiedCount } = await videos.updateOne({
      _id: new Bson.ObjectId(listedData.videoId),
    }, {
      $set: {
        listed: listedData.listVideo,
      },
    });

    if (modifiedCount > 0) {
      c.response.body = {
        message: `Video listed state set to: ${listedData.listVideo}`,
      };
      c.response.status = Status.OK;
    } else {
      c.response.body = { message: "Internal Server Error" };
      c.response.status = Status.InternalServerError;
    }
  } catch (_) {
    c.response.body = { message: "Internal Server Error" };
    c.response.status = Status.InternalServerError;
  }
}

export async function deleteVideo(c: RouterContext) {
  const params = c.params as { id: string };

  try {
    const deletedCount = await videos.deleteOne({
      _id: new Bson.ObjectId(params.id),
    });

    if (deletedCount > 0) {
      c.response.body = { message: `Video deleted with id: ${params.id}` };
      c.response.status = Status.OK;
    } else {
      c.response.body = { message: "Internal Server Error" };
      c.response.status = Status.InternalServerError;
    }
  } catch (_) {
    c.response.body = { message: "Internal Server Error" };
    c.response.status = Status.InternalServerError;
  }
}
