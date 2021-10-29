import { checkJWT } from "./../middleware/jwtMiddleware.ts";
import { preventUserRole } from "./../middleware/userRoleMiddleware.ts";
import { API_PREFIX } from "./../utils/constants.ts";
import { Router } from "../../deps.ts";
import {
  createVideo,
  getVideoByHash,
  getVideoFeed,
} from "../handlers/video.ts";

const videoRouter = new Router();

videoRouter.prefix(API_PREFIX).post(
  "/video",
  preventUserRole,
  createVideo,
).get("/videos/feed", checkJWT, getVideoFeed)
  .get("/video/:hash", checkJWT, getVideoByHash);

export { videoRouter };
