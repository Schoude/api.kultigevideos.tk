import { API_PREFIX } from "./../utils/constants.ts";
import { Router } from "../../deps.ts";
import { createUser, passwordChange } from "../handlers/user.ts";
import { checkJWT } from "../middleware/jwtMiddleware.ts";

const userRouter = new Router();

userRouter
  .prefix(API_PREFIX)
  .post("/user", createUser)
  .post("/password-change", checkJWT, passwordChange);

export { userRouter };
