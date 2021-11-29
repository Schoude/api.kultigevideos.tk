import { checkJWT } from "../middleware/jwtMiddleware.ts";
import { Router } from "../../deps.ts";
import { createComment, getCommentsOfVideo } from "../handlers/comments.ts";

const commentsRouter = new Router();

commentsRouter.prefix("/api/v1")
  .post("/comment", checkJWT, createComment)
  .get("/comments/:videoHash", checkJWT, getCommentsOfVideo);

export { commentsRouter };
