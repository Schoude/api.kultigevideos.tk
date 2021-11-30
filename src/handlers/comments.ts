import { Comment } from "./../db/models/comment.d.ts";
import { Context, RouterContext, Status } from "../../deps.ts";
import { db } from "../db/index.ts";
import { createCommentsPipelineForVideohash } from "../db/pipeline-helpers/comment.ts";

const comments = db.collection<Comment>("comments");

export async function createComment(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const comment = (await req.value) as Comment;
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
            $match: { videoHash: params.videoHash },
          },
          {
            $count: "value",
          },
        ],
        comments: [...createCommentsPipelineForVideohash(params.videoHash)],
      },
    }, {
      $unwind: { path: "$totalCount" },
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
