import { randomBytes } from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/** Public origin for redirects (Vercel / reverse proxies). */
export function getPublicOrigin(req: Request): string {
  const xfProto = req.headers["x-forwarded-proto"];
  const proto =
    (Array.isArray(xfProto) ? xfProto[0] : xfProto?.split(",")[0])?.trim() ||
    req.protocol ||
    "https";
  const xfHost = req.headers["x-forwarded-host"];
  const host =
    (Array.isArray(xfHost) ? xfHost[0] : xfHost?.split(",")[0]?.trim()) ||
    req.get("host") ||
    "localhost";
  return `${proto}://${host}`;
}

function getGoogleRedirectUri(req: Request): string {
  const configured = ENV.googleRedirectUri?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return `${getPublicOrigin(req)}/api/oauth/callback`;
}

function googleOAuthConfigured(): boolean {
  return Boolean(ENV.googleClientId?.trim() && ENV.googleClientSecret?.trim());
}

type GoogleUserInfo = {
  sub: string;
  email?: string | null;
  name?: string | null;
  email_verified?: boolean | null;
};

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    code,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[Google OAuth] Token exchange failed:", res.status, text);
    throw new Error("Google token exchange failed");
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Google token response missing access_token");
  }
  return { access_token: json.access_token };
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[Google OAuth] Userinfo failed:", res.status, text);
    throw new Error("Google userinfo failed");
  }
  return (await res.json()) as GoogleUserInfo;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!googleOAuthConfigured()) {
      res.status(503).send(
        "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
      );
      return;
    }

    const state = randomBytes(32).toString("hex");
    const redirectUri = getGoogleRedirectUri(req);
    const cookieOpts = getSessionCookieOptions(req);

    res.cookie(GOOGLE_OAUTH_STATE_COOKIE, state, {
      ...cookieOpts,
      maxAge: 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: ["openid", "email", "profile"].join(" "),
      state,
      prompt: "select_account",
    });

    res.redirect(302, `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const cookieState = req.cookies?.[GOOGLE_OAUTH_STATE_COOKIE] as string | undefined;

    const clearStateCookie = () => {
      const opts = getSessionCookieOptions(req);
      res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, { ...opts, maxAge: -1 });
    };

    if (!code || !state) {
      clearStateCookie();
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    if (!cookieState || cookieState !== state) {
      clearStateCookie();
      res.status(400).json({ error: "invalid OAuth state" });
      return;
    }

    if (!googleOAuthConfigured()) {
      clearStateCookie();
      res.status(503).json({ error: "Google OAuth is not configured" });
      return;
    }

    const redirectUri = getGoogleRedirectUri(req);

    try {
      const { access_token } = await exchangeCodeForTokens(code, redirectUri);
      const userInfo = await fetchGoogleUserInfo(access_token);

      if (!userInfo.sub) {
        clearStateCookie();
        res.status(400).json({ error: "Google account id (sub) missing" });
        return;
      }

      if (userInfo.email_verified === false) {
        clearStateCookie();
        res.redirect(302, "/login-required?reason=unverified");
        return;
      }

      const userEmail = userInfo.email ?? null;
      let isApproved = false;
      if (userEmail) {
        const application = await db.getApprovedApplicationByEmail(userEmail);
        isApproved = !!(application && application.status === "approved");
      }

      await db.upsertUser({
        openId: userInfo.sub,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
        status: isApproved ? "active" : "pending",
      });

      let redirectPath = "/app";
      if (!isApproved) {
        redirectPath = `/login-required?email=${encodeURIComponent(userEmail ?? "")}`;
      }

      const sessionToken = await sdk.createSessionToken(userInfo.sub, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      clearStateCookie();

      res.redirect(302, redirectPath);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      clearStateCookie();
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
