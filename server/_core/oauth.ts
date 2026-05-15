import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { resolveGoogleLogin } from "./googleLogin";
import { sdk } from "./sdk";

const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
const GOOGLE_OAUTH_REDIRECT_COOKIE = "google_oauth_redirect_uri";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

/** Public origin for redirects (Vercel / reverse proxies). */
export function getPublicOrigin(req: Request): string {
  const configured = readEnv("PUBLIC_APP_URL");
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.warn("[Google OAuth] PUBLIC_APP_URL is not a valid URL:", configured);
    }
  }

  const vercelUrl = readEnv("VERCEL_URL");
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }

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

/**
 * Redirect URI sent to Google — must match exactly on authorize + token exchange.
 * Prefer GOOGLE_REDIRECT_URI, then cookie from authorize step, then computed origin.
 */
export function resolveGoogleRedirectUri(req: Request, cookieRedirectUri?: string): string {
  const fromEnv = readEnv("GOOGLE_REDIRECT_URI") || ENV.googleRedirectUri?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const fromCookie = cookieRedirectUri?.trim();
  if (fromCookie) return fromCookie.replace(/\/+$/, "");

  return `${getPublicOrigin(req)}/api/oauth/callback`;
}

function googleOAuthConfigured(): boolean {
  const clientId = readEnv("GOOGLE_CLIENT_ID") || ENV.googleClientId;
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET") || ENV.googleClientSecret;
  return Boolean(clientId && clientSecret);
}

function getGoogleClientId(): string {
  return readEnv("GOOGLE_CLIENT_ID") || ENV.googleClientId;
}

function getGoogleClientSecret(): string {
  return readEnv("GOOGLE_CLIENT_SECRET") || ENV.googleClientSecret;
}

function oauthStateSecret(): string | null {
  const secret = readEnv("JWT_SECRET") || ENV.cookieSecret;
  return secret.length > 0 ? secret : null;
}

/** Bind OAuth state to redirect_uri so token exchange uses the same URI as authorize. */
function signOAuthPayload(payload: string): string | null {
  const secret = oauthStateSecret();
  if (!secret) return null;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyOAuthPayload(signed: string): string | null {
  const secret = oauthStateSecret();
  if (!secret) return null;
  const lastDot = signed.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return payload;
  } catch {
    return null;
  }
}

function redirectOAuthError(
  res: Response,
  reason: string,
  logContext?: Record<string, unknown>,
) {
  if (logContext) {
    console.error("[Google OAuth] Redirecting with error:", reason, logContext);
  } else {
    console.error("[Google OAuth] Redirecting with error:", reason);
  }
  const url = new URL("/", getSafeRedirectOrigin());
  url.searchParams.set("error", "oauth_failed");
  url.searchParams.set("reason", reason);
  res.redirect(302, url.toString());
}

function getSafeRedirectOrigin(): string {
  const fromEnv = readEnv("PUBLIC_APP_URL");
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      /* fall through */
    }
  }
  return "https://pilothub.vip";
}

type GoogleUserInfo = {
  sub: string;
  email?: string | null;
  name?: string | null;
  email_verified?: boolean | null;
};

type GoogleTokenError = {
  error?: string;
  error_description?: string;
};

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string }> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();

  console.info("[Google OAuth] Token exchange", {
    redirectUri,
    clientIdPrefix: clientId.slice(0, 12),
    hasClientSecret: clientSecret.length > 0,
  });

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const raw = await res.text();
  if (!res.ok) {
    let parsed: GoogleTokenError = {};
    try {
      parsed = JSON.parse(raw) as GoogleTokenError;
    } catch {
      /* ignore */
    }
    console.error("[Google OAuth] Token exchange failed", {
      status: res.status,
      error: parsed.error,
      error_description: parsed.error_description,
      redirectUri,
      bodyPreview: raw.slice(0, 500),
    });
    throw new Error(
      parsed.error_description || parsed.error || `Google token exchange HTTP ${res.status}`,
    );
  }

  let json: { access_token?: string };
  try {
    json = JSON.parse(raw) as { access_token?: string };
  } catch {
    console.error("[Google OAuth] Token response not JSON:", raw.slice(0, 500));
    throw new Error("Google token response was not valid JSON");
  }

  if (!json.access_token) {
    console.error("[Google OAuth] Token response missing access_token:", raw.slice(0, 500));
    throw new Error("Google token response missing access_token");
  }

  return { access_token: json.access_token };
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const raw = await res.text();
  if (!res.ok) {
    console.error("[Google OAuth] Userinfo failed", {
      status: res.status,
      bodyPreview: raw.slice(0, 500),
    });
    throw new Error(`Google userinfo HTTP ${res.status}`);
  }
  try {
    return JSON.parse(raw) as GoogleUserInfo;
  } catch {
    console.error("[Google OAuth] Userinfo not JSON:", raw.slice(0, 500));
    throw new Error("Google userinfo was not valid JSON");
  }
}

function assertSessionPrerequisites(): void {
  const jwt = readEnv("JWT_SECRET") || ENV.cookieSecret;
  if (!jwt) {
    throw new Error("JWT_SECRET is not set — cannot create session cookie");
  }
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not set — cannot create session cookie");
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!googleOAuthConfigured()) {
      console.error("[Google OAuth] Start blocked: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      redirectOAuthError(res, "not_configured");
      return;
    }

    if (!oauthStateSecret()) {
      console.error("[Google OAuth] Start blocked: JWT_SECRET is not set");
      redirectOAuthError(res, "missing_jwt_secret");
      return;
    }

    const stateNonce = randomBytes(32).toString("hex");
    const redirectUri = resolveGoogleRedirectUri(req);
    const signedState =
      signOAuthPayload(`${stateNonce}|${redirectUri}`) ?? stateNonce;

    const cookieOpts = getSessionCookieOptions(req);

    res.cookie(GOOGLE_OAUTH_STATE_COOKIE, signedState, {
      ...cookieOpts,
      maxAge: 10 * 60 * 1000,
    });
    res.cookie(GOOGLE_OAUTH_REDIRECT_COOKIE, redirectUri, {
      ...cookieOpts,
      maxAge: 10 * 60 * 1000,
    });

    console.info("[Google OAuth] Starting authorize", { redirectUri, stateNonce: stateNonce.slice(0, 8) });

    const params = new URLSearchParams({
      client_id: getGoogleClientId(),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: ["openid", "email", "profile"].join(" "),
      state: stateNonce,
      prompt: "select_account",
    });

    res.redirect(302, `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const googleError = getQueryParam(req, "error");
    if (googleError) {
      console.error("[Google OAuth] Google returned error", {
        error: googleError,
        description: getQueryParam(req, "error_description"),
      });
      redirectOAuthError(res, googleError, {
        description: getQueryParam(req, "error_description"),
      });
      return;
    }

    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const cookieState = req.cookies?.[GOOGLE_OAUTH_STATE_COOKIE] as string | undefined;
    const cookieRedirect = req.cookies?.[GOOGLE_OAUTH_REDIRECT_COOKIE] as string | undefined;

    const clearOAuthCookies = () => {
      const opts = getSessionCookieOptions(req);
      res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, { ...opts, maxAge: -1 });
      res.clearCookie(GOOGLE_OAUTH_REDIRECT_COOKIE, { ...opts, maxAge: -1 });
    };

    if (!code || !state) {
      clearOAuthCookies();
      console.error("[Google OAuth] Missing code or state", { hasCode: Boolean(code), hasState: Boolean(state) });
      redirectOAuthError(res, "missing_code_or_state");
      return;
    }

    const redirectUri = resolveGoogleRedirectUri(req, cookieRedirect);
    const verifiedPayload = cookieState ? verifyOAuthPayload(cookieState) : null;
    let stateValid = false;
    if (verifiedPayload) {
      const pipe = verifiedPayload.indexOf("|");
      if (pipe > 0) {
        const nonce = verifiedPayload.slice(0, pipe);
        const uriFromCookie = verifiedPayload.slice(pipe + 1);
        stateValid = nonce === state && uriFromCookie === redirectUri;
      }
    } else if (cookieState === state) {
      stateValid = true;
    }

    if (!cookieState || !stateValid) {
      clearOAuthCookies();
      console.error("[Google OAuth] Invalid OAuth state", {
        hasCookie: Boolean(cookieState),
        stateFromQuery: state.slice(0, 8),
        cookieRedirect,
        verifiedPayload: verifiedPayload?.slice(0, 40),
      });
      redirectOAuthError(res, "invalid_state");
      return;
    }

    if (!googleOAuthConfigured()) {
      clearOAuthCookies();
      console.error("[Google OAuth] Callback blocked: OAuth not configured");
      redirectOAuthError(res, "not_configured");
      return;
    }

    try {
      assertSessionPrerequisites();

      const { access_token } = await exchangeCodeForTokens(code, redirectUri);
      console.info("[Google OAuth] Token exchange succeeded");

      const userInfo = await fetchGoogleUserInfo(access_token);
      console.info("[Google OAuth] Userinfo received", {
        sub: userInfo.sub?.slice(0, 8),
        email: userInfo.email,
        email_verified: userInfo.email_verified,
      });

      if (!userInfo.sub) {
        clearOAuthCookies();
        redirectOAuthError(res, "missing_sub");
        return;
      }

      if (userInfo.email_verified === false) {
        clearOAuthCookies();
        res.redirect(302, "/login-required?reason=unverified");
        return;
      }

      const config = db.resolveDatabaseConfig();
      if (!config) {
        console.error("[Google OAuth] Database not configured — set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on Vercel");
      } else {
        console.info("[Google OAuth] Database target", {
          target: db.maskDatabaseUrl(config.url),
          source: config.source,
        });
      }
      const dbReady = await db.getDb();
      if (!dbReady) {
        console.error("[Google OAuth] Database connection failed — check Turso env vars");
      }

      const login = await resolveGoogleLogin(userInfo);

      try {
        await db.upsertUser(login.upsert);
        console.info("[Google OAuth] User upserted", {
          openId: userInfo.sub.slice(0, 8),
          isApproved: login.isApproved,
          userStatus: login.userStatus,
        });
      } catch (dbErr) {
        console.error("[Google OAuth] upsertUser failed:", dbErr);
        throw new Error(
          `Database upsert failed: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`,
        );
      }

      const redirectPath = login.redirectPath;

      const sessionToken = await sdk.createSessionToken(login.sessionOpenId, {
        name: userInfo.name || userInfo.email || "User",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      clearOAuthCookies();

      console.info("[Google OAuth] Login complete, redirecting", { redirectPath });
      res.redirect(302, redirectPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      console.error("[Google OAuth] Callback failed", {
        message,
        stack,
        redirectUri,
        hasCode: true,
        clientIdPrefix: getGoogleClientId().slice(0, 12),
        hasJwtSecret: Boolean(readEnv("JWT_SECRET") || ENV.cookieSecret),
        hasDatabaseUrl: Boolean(readEnv("TURSO_DATABASE_URL") || readEnv("DATABASE_URL")),
      });
      clearOAuthCookies();
      redirectOAuthError(res, "callback_failed", { message });
    }
  });
}
