import { checkUpdateAbilityComment } from "./../middleware/checkUpdateAbilityComment.ts";
import { checkJWT } from "../middleware/jwtMiddleware.ts";
import { Router } from "../../deps.ts";
import {
  createComment,
  deleteComment,
  dislikeComment,
  getCommentsOfVideo,
  likeComment,
  toggleCommentHeart,
  updateComment,
} from "../handlers/comments.ts";
import { checkLikeAbilityComment } from "../middleware/checkLikeAbilityComment.ts";
import { checkDeleteAbilityComment } from "../middleware/checkDeleteAbilityComment.ts";
import { checkGiveHeartAbilityComment } from "../middleware/checkGiveHeartAbilityComment.ts";

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
  )
  .post(
    "/comment/heart",
    checkJWT,
    checkGiveHeartAbilityComment,
    toggleCommentHeart,
  );

export { commentsRouter };
