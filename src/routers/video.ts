import { checkLikeAbilityVideo } from "./../middleware/checkLikeAbilityVIdeo.ts";
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
  getVideoRecommended,
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
  .get("/videos/recommended/:excludeHash", checkJWT, getVideoRecommended)
  .get("/videos/panel", preventUserRole, getVideosPanel)
  .get("/video/:hash", checkJWT, getVideoByHash)
  .put("/video/like", checkJWT, checkLikeAbilityVideo, likeVideo)
  .put("/video/dislike", checkJWT, checkLikeAbilityVideo, dislikeVideo)
  .put("/video/approve", preventUserRole, approveVideo)
  .put("/video/listed", preventUserRole, toggleVideoListed)
  .delete("/video/:id", checkJWT, deleteVideo);

export { videoRouter };
