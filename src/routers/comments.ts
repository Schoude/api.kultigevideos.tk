import { checkUpdateAbilityComment } from "./../middleware/checkUpdateAbilityComment.ts";
import { checkJWT } from "../middleware/jwtMiddleware.ts";
import { Router } from "../../deps.ts";
import {
  createComment,
  deleteComment,
  dislikeComment,
  getCommentsOfVideo,
  likeComment,
  updateComment,
} from "../handlers/comments.ts";
import { checkLikeAbilityComment } from "../middleware/checkLikeAbilityComment.ts";
import { checkDeleteAbilityComment } from "../middleware/checkDeleteAbilityComment.ts";

const commentsRouter = new Router();

commentsRouter.prefix("/api/v1")
  .post("/comment", checkJWT, createComment)
  .put("/comment", checkJWT, checkUpdateAbilityComment, updateComment)
  .get("/comments/:videoHash", checkJWT, getCommentsOfVideo)
  .put("/comment/like", checkJWT, checkLikeAbilityComment, likeComment)
  .put("/comment/dislike", checkJWT, checkLikeAbilityComment, dislikeComment)
  .delete(
    "/comment",
    checkJWT,
    checkDeleteAbilityComment,
    deleteComment,
  );

export { commentsRouter };
