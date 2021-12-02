import { Comment } from "./../db/models/comment.d.ts";
import { Bson, Context, helpers, RouterContext, Status } from "../../deps.ts";
import { db } from "../db/index.ts";
import { createCommentsPipelineForVideohash } from "../db/pipeline-helpers/comment.ts";
import { validateMaxLength, validateMinLength } from "../utils/validation.ts";

const comments = db.collection<Comment>("comments");

export async function createComment(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const comment = (await req.value) as Comment;

  if (validateMaxLength(comment.text, 1000) === false) {
    c.response.status = Status.UnprocessableEntity;
    c.response.body = { message: "The given text was too long." };
    return;
  }

  if (validateMinLength(comment.text, 3) === false) {
    c.response.status = Status.UnprocessableEntity;
    c.response.body = { message: "The given text was too short." };
    return;
  }

  comment.createdAt = new Date();

  try {
    const insertedId = await comments.insertOne(comment);
    c.response.status = Status.Created;
    c.response.body = { message: `Comment created with id ${insertedId}` };
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Error creating a comment." };
  }
}

export async function getCommentsOfVideo(c: RouterContext) {
  interface CommetsOfVideoData {
    totalCount: { value: number };
    comments: Comment[];
  }

  const params = c.params as { videoHash: string };
  try {
    const videoCommentsData = await comments.aggregate<CommetsOfVideoData>([{
      $facet: {
        totalCount: [
          {
            $match: {
              videoHash: params.videoHash,
              parentId: { $exists: false },
            },
          },
          {
            $count: "value",
          },
        ],
        comments: [...createCommentsPipelineForVideohash(params.videoHash)],
      },
    }, {
      $unwind: {
        path: "$totalCount",
      },
    }]).next();

    c.response.status = Status.OK;
    c.response.body = videoCommentsData;
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = {
      message:
        `Error getting the comments for video with hash: ${params.videoHash}`,
    };
  }
}

export async function likeComment(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const { commentId, userId } = (await req.value) as {
    commentId: string;
    userId: string;
  };

  try {
    const comment = await comments.findOne({
      _id: new Bson.ObjectId(commentId),
    }, { noCursorTimeout: false });

    if (comment?.likes.includes(userId)) {
      const { modifiedCount } = await comments.updateOne({
        _id: new Bson.ObjectId(commentId),
      }, {
        $pull: {
          likes: userId,
          dislikes: userId,
        },
      });

      if (modifiedCount > 0) {
        c.response.status = Status.Accepted;
        c.response.body = {
          message: `User ${userId} toggled like for comment ${commentId}`,
        };
      } else {
        c.response.status = Status.InternalServerError;
        c.response.body = { message: "Internal server error." };
      }
    } else {
      const { modifiedCount } = await comments.updateOne({
        _id: new Bson.ObjectId(commentId),
      }, {
        $addToSet: { likes: userId },
        $pull: { dislikes: userId },
      });

      if (modifiedCount > 0) {
        c.response.status = Status.Accepted;
        c.response.body = {
          message: `User ${userId} toggled like for comment ${commentId}`,
        };
      } else {
        c.response.status = Status.InternalServerError;
        c.response.body = { message: "Internal server error." };
      }
    }
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Internal server error." };
  }
}

export async function dislikeComment(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const { commentId, userId } = (await req.value) as {
    commentId: string;
    userId: string;
  };

  try {
    const comment = await comments.findOne({
      _id: new Bson.ObjectId(commentId),
    }, { noCursorTimeout: false });

    if (comment?.dislikes.includes(userId)) {
      const { modifiedCount } = await comments.updateOne({
        _id: new Bson.ObjectId(commentId),
      }, {
        $pull: {
          likes: userId,
          dislikes: userId,
        },
      });

      if (modifiedCount > 0) {
        c.response.status = Status.Accepted;
        c.response.body = {
          message: `User ${userId} toggled dislike for comment ${commentId}`,
        };
      } else {
        c.response.status = Status.InternalServerError;
        c.response.body = { message: "Internal server error." };
      }
    } else {
      const { modifiedCount } = await comments.updateOne({
        _id: new Bson.ObjectId(commentId),
      }, {
        $addToSet: { dislikes: userId },
        $pull: { likes: userId },
      });

      if (modifiedCount > 0) {
        c.response.status = Status.Accepted;
        c.response.body = {
          message: `User ${userId} toggled dislike for comment ${commentId}`,
        };
      } else {
        c.response.status = Status.InternalServerError;
        c.response.body = { message: "Internal server error." };
      }
    }
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Internal server error." };
  }
}

export async function deleteComment(c: Context) {
  const { commentId } = helpers.getQuery(c) as {
    commentId: string;
    userId: string;
  };

  try {
    const deletedCount = await comments.deleteOne({
      _id: new Bson.ObjectId(commentId),
    });

    const deletedCountReplies = await comments.deleteMany({
      parentId: commentId,
    });

    if (deletedCount > 0 && deletedCountReplies === 0) {
      c.response.status = Status.Accepted;
      c.response.body = {
        message: `Comment with id ${commentId} sucessfully deleted.`,
      };
    } else if (deletedCount > 0 && deletedCountReplies > 0) {
      c.response.status = Status.Accepted;
      c.response.body = {
        message:
          `Comment with id ${commentId} sucessfully deleted. Also ${deletedCountReplies} replies where deleted.`,
      };
    }
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Internal server error." };
  }
}
