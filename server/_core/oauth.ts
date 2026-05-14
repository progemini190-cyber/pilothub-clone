import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Check if this email has an approved application
      const loginEmail = userInfo.email ?? null;
      if (loginEmail) {
        const application = await db.getApprovedApplicationByEmail(loginEmail);
        if (!application) {
          // Check if there's any approved application at all (user might be using wrong account)
          // We'll let them in but they'll see limited access — no blocking here
          // Just proceed normally; access control is handled by plan checks
        }
      }

      // Check approval status BEFORE creating session
      const userEmail = userInfo.email ?? null;
      let isApproved = false;
      if (userEmail) {
        const application = await db.getApprovedApplicationByEmail(userEmail);
        isApproved = !!(application && application.status === "approved");
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
        // Mark unapproved users as pending so frontend can gate them
        status: isApproved ? "active" : "pending",
      });

      // Determine redirect path based on approval
      let redirectPath = "/app";
      if (!isApproved) {
        redirectPath = `/login-required?email=${encodeURIComponent(userEmail ?? "")}`;
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, redirectPath);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
