import { User } from "./../db/models/user.d.ts";
import { Middleware, Status } from "../../deps.ts";
import { verifyJwt } from "../utils/auth.ts";

export const preventUserRole: Middleware = async (c, next) => {
  try {
    const jwt = c.request.headers.get("Authentication")?.split(" ")[1];

    if (jwt != null) {
      const payload = await verifyJwt(jwt) as { me: User };

      if (payload.me.role == "user") {
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
  }
};
