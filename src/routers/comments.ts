import { checkJWT } from "../middleware/jwtMiddleware.ts";
import { Router } from "../../deps.ts";
import {
  createComment,
  dislikeComment,
  getCommentsOfVideo,
  likeComment,
} from "../handlers/comments.ts";
import { checkLikeAbilityComment } from "../middleware/checkLikeAbilityComment.ts";

const commentsRouter = new Router();

commentsRouter.prefix("/api/v1")
  .post("/comment", checkJWT, createComment)
  .get("/comments/:videoHash", checkJWT, getCommentsOfVideo)
  .put("/comment/like", checkJWT, checkLikeAbilityComment, likeComment)
  .put("/comment/dislike", checkJWT, checkLikeAbilityComment, dislikeComment);

export { commentsRouter };
