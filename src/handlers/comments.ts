import { Comment } from "./../db/models/comment.d.ts";
import { Context, Status } from "../../deps.ts";
import { db } from "../db/index.ts";

const comments = db.collection<Comment>("comments");

export async function createComment(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const comment = (await req.value) as Comment;

  try {
    const insertedId = await comments.insertOne(comment);
    c.response.status = Status.Created;
    c.response.body = { message: `Comment created with id ${insertedId}` };
  } catch (_) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Error creating a comment." };
  }
}
