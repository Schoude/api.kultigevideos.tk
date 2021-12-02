import { User } from "./../db/models/user.d.ts";
import { Bson, Middleware, Status } from "../../deps.ts";
import { verifyJwt } from "../utils/auth.ts";
import { db } from "../db/index.ts";

const users = db.collection<User>("users");

export const preventUserRole: Middleware = async (c, next) => {
  try {
    const jwt = c.request.headers.get("Authentication")?.split(" ")[1];

    if (jwt != null) {
      const payload = await verifyJwt(jwt) as { me: User };

      const foundUser = await users.findOne({
        _id: new Bson.ObjectId(payload.me._id),
      }, { noCursorTimeout: false });

      if (foundUser?.role == "user") {
        c.response.status = Status.Unauthorized;
        c.response.body = {
          message:
            "Unauthorized! You have to be an Admin or a Maintainer to do this action.",
        };
        return;
      }
    } else {
      c.response.status = Status.Unauthorized;
      c.response.body = { message: "Unauthorized" };
      return;
    }

    await next();
  } catch (_error) {
    c.response.status = Status.Unauthorized;
    c.response.body = { message: "Unauthorized" };
    return;
  }
};
