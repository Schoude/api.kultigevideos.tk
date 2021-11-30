import { checkJWT } from "../middleware/jwtMiddleware.ts";
import { Router } from "../../deps.ts";
import {
  createComment,
  getCommentsOfVideo,
  likeComment,
} from "../handlers/comments.ts";

const commentsRouter = new Router();

commentsRouter.prefix("/api/v1")
  .post("/comment", checkJWT, createComment)
  .get("/comments/:videoHash", checkJWT, getCommentsOfVideo)
  .put("/comment/like", checkJWT, likeComment);

export { commentsRouter };
