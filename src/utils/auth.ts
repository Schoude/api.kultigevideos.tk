import { ENVIRONMENT } from "../../base-types.ts";
import { create, getNumericDate, verify } from "../../deps.ts";
import { COOKIE_DOMAIN } from "./constants.ts";

// Masterkey - if the server restarts all currently issued jwts will be invalid
const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

export async function createJwt<T>(jwtPayload?: Record<string, T>) {
  const jwt = await create(
    { alg: "HS512", typ: "JWT" },
    {
      exp: getNumericDate(60 * 5),
      ...jwtPayload,
    },
    key,
  );

  return { jwt };
}

export async function verifyJwt(jwt: string) {
  return await verify(jwt, key);
}

export async function initAuthSession<T>(jwtPayload: Record<string, T>) {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);

  const cookieConfigRefreshToken = {
    expires: date,
  } as {
    expires?: Date;
    domain: string;
    sameSite?: boolean | "strict" | "none" | "lax";
  };

  if (Deno.env.get("APP_ENV") === ENVIRONMENT.PROD) {
    cookieConfigRefreshToken.domain = COOKIE_DOMAIN;
    cookieConfigRefreshToken.sameSite = "strict";
  }

  const refreshToken = await create(
    { alg: "HS512", typ: "JWT" },
    {
      exp: getNumericDate(date), // 3 months in the future
      ...jwtPayload,
    },
    key,
  );

  const { jwt } = await createJwt(jwtPayload);

  return {
    refreshToken,
    jwt,
    cookieConfigRefreshToken,
  };
}

export function generateCookieOptions() {
  const cookieOptions = {} as {
    domain: string;
    sameSite: "lax" | "none" | "strict";
  };

  if (Deno.env.get("APP_ENV") === ENVIRONMENT.PROD) {
    cookieOptions.domain = COOKIE_DOMAIN;
    cookieOptions.sameSite = "strict";
  }

  return cookieOptions;
}
