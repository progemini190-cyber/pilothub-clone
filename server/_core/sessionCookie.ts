import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Response } from "express";
import type { Request } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export async function setUserSessionCookie(
  req: Request,
  res: Response,
  openId: string,
  name: string,
): Promise<void> {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}
