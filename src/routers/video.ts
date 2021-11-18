import { checkJWT } from "./../middleware/jwtMiddleware.ts";
import { preventUserRole } from "./../middleware/userRoleMiddleware.ts";
import { API_PREFIX } from "./../utils/constants.ts";
import { Router } from "../../deps.ts";
import {
  approveVideo,
  createVideo,
  deleteVideo,
  dislikeVideo,
  getVideoByHash,
  getVideoFeed,
  getVideosPanel,
  likeVideo,
  toggleVideoListed,
} from "../handlers/video.ts";

const videoRouter = new Router();

videoRouter.prefix(API_PREFIX).post(
  "/video",
  preventUserRole,
  createVideo,
)
  .get("/videos/feed", checkJWT, getVideoFeed)
  .get("/videos/panel", preventUserRole, getVideosPanel)
  .get("/video/:hash", checkJWT, getVideoByHash)
  .put("/video/like", checkJWT, likeVideo)
  .put("/video/dislike", checkJWT, dislikeVideo)
  .put("/video/approve", preventUserRole, approveVideo)
  .put("/video/listed", preventUserRole, toggleVideoListed)
  .delete("/video/:id", checkJWT, deleteVideo);

export { videoRouter };
