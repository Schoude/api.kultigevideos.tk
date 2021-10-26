import { Router } from "../../deps.ts";
import { createUser, passwordChange } from "../handlers/user.ts";
import { checkJWT } from "../middleware/jwtMiddleware.ts";

const userRouter = new Router();

userRouter
  .prefix("/api/v1/")
  .post("/user", createUser)
  .post("/password-change", checkJWT, passwordChange);

export { userRouter };
