import { preventUserRole } from "./../middleware/userRoleMiddleware.ts";
import { API_PREFIX } from "./../utils/constants.ts";
import { Router } from "../../deps.ts";
import { createVideo } from "../handlers/video.ts";

const videoRouter = new Router();

videoRouter.prefix(API_PREFIX).post(
  "/video",
  preventUserRole,
  createVideo,
);

export { videoRouter };
