import { Middleware, Status } from "../../deps.ts";
import { verifyJwt } from "../utils/auth.ts";

export const checkJWT: Middleware = async (c, next) => {
  try {
    const jwt = c.request.headers.get("Authentication")?.split(" ")[1];

    if (jwt != null) {
      await verifyJwt(jwt);
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
