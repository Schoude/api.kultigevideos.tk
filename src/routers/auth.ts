import { API_PREFIX } from "./../utils/constants.ts";
import { checkJWT } from "./../middleware/jwtMiddleware.ts";
import { Router } from "../../deps.ts";
import { loginUser, logoutUser, refreshToken } from "../handlers/auth.ts";

const authRouter = new Router();

authRouter
  .prefix(API_PREFIX)
  .post("/login", loginUser)
  .post("/logout", checkJWT, logoutUser)
  .get("/refresh", refreshToken);

export { authRouter };
