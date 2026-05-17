import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { SESSION_APP_ID } from "@shared/session";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { isAdminEmail } from "./adminAccess";
import { isUserApproved } from "./userStatus";
import { ENV } from "./env";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/** Session JWT payload: `openId` stores Google `sub`; `appId` stores Google OAuth client id for verification. */
export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

class SessionService {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret =
      (typeof process.env.JWT_SECRET === "string" && process.env.JWT_SECRET.trim()) ||
      ENV.cookieSecret;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }
    return new TextEncoder().encode(secret);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: SESSION_APP_ID,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      const validAppIds = new Set(
        [SESSION_APP_ID, ENV.googleClientId].filter((id): id is string => Boolean(id)),
      );
      if (!validAppIds.has(appId)) {
        console.warn("[Auth] Session appId is not recognized");
        return null;
      }

      return {
        openId,
        appId,
        name: isNonEmptyString(name) ? name : "",
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const signedInAt = new Date();
    let user = await db.getUserByOpenId(session.openId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    if (user.email && isAdminEmail(user.email) && user.role !== "admin") {
      await db.updateUserRole(user.id, "admin");
      user = { ...user, role: "admin" as const };
    }

    const upsertStatus =
      isUserApproved(user) && user.status?.toLowerCase() !== "active"
        ? "active"
        : undefined;

    await db.upsertUser({
      openId: user.openId,
      email: user.email,
      lastSignedIn: signedInAt,
      role: user.role === "admin" ? "admin" : undefined,
      ...(upsertStatus ? { status: upsertStatus as "active" } : {}),
    });

    return user;
  }
}

export const sdk = new SessionService();
