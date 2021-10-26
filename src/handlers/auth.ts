import { db } from "../db/index.ts";
import { bcrypt, Context, Status } from "../../deps.ts";
import {
  createJwt,
  generateCookieOptions,
  initAuthSession,
  verifyJwt,
} from "../utils/auth.ts";
import { User } from "../db/models/user.d.ts";

const users = db.collection<User>("users");

export async function loginUser(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const loginData = (await req.value) as { email: string; password: string };

  try {
    const foundUser = await users.findOne(
      { email: loginData.email },
      { noCursorTimeout: false },
    );

    if (foundUser == null) {
      c.response.body = "Password or email wrong";
      c.response.status = Status.Unauthorized;
      return;
    }

    if (
      await bcrypt.compare(loginData.password, foundUser.password as string)
    ) {
      delete foundUser.password;
      c.response.status = Status.OK;

      // Generate new JWT and refresh token upon login
      const { cookieConfigRefreshToken, jwt, refreshToken } =
        await initAuthSession<User>({ me: foundUser });

      await c.cookies.set(
        "__refresh-token__",
        refreshToken,
        cookieConfigRefreshToken,
      );
      c.response.body = { me: foundUser, jwt, expires: 300 };
    } else {
      c.response.status = Status.Unauthorized;
      c.response.body = "Password or email wrong";
    }
  } catch (_error) {
    c.response.status = Status.InternalServerError;
  }
}

export async function refreshToken(c: Context) {
  const refreshToken = await c.cookies.get("__refresh-token__");

  if (refreshToken == null) {
    c.response.status = Status.Unauthorized;
    c.response.body = { mesage: "Unauthorized" };
    return;
  }

  try {
    const payload = await verifyJwt(refreshToken);
    const { jwt } = await createJwt(payload);

    c.response.status = 200;
    c.response.body = { jwt, expires: 300, me: payload.me };
  } catch (_error) {
    const cookieOptions = generateCookieOptions();
    c.cookies.delete("__refresh-token__", cookieOptions);

    c.response.status = Status.Unauthorized;
    c.response.body = { mesage: "Unauthorized" };
  }
}

export function logoutUser(c: Context) {
  const cookieOptions = generateCookieOptions();
  c.cookies.delete("__refresh-token__", cookieOptions);

  c.response.status = 200;
  c.response.body = { message: "User logged out." };
}
