import { API_PREFIX } from "./../utils/constants.ts";
import { Router } from "../../deps.ts";
import {
  createUser,
  getUserProfile,
  passwordChange,
  updateUser,
} from "../handlers/user.ts";
import { checkJWT } from "../middleware/jwtMiddleware.ts";

const userRouter = new Router();

userRouter
  .prefix(API_PREFIX)
  .post("/user", createUser)
  .put("/user/password", checkJWT, passwordChange)
  .put("/user", checkJWT, updateUser)
  .get("/user/:id", checkJWT, getUserProfile);
// .get("/user/:id/self", checkJWT, getUserProfileSelf); // the user's OWN profile -> just get the users videos and the totals fields

export { userRouter };
