/**
 * Public REST API endpoints for external website integration.
 * All endpoints require an API key passed via X-API-Key header.
 *
 * Endpoints:
 *   GET  /api/public/info                   - API info (no auth)
 *   POST /api/public/applications/submit    - Submit application form + payment slip
 *   POST /api/public/users/create           - Create a user account (admin generates credentials)
 *   GET  /api/public/users/list             - List all users (admin key required)
 *   POST /api/public/payments/submit        - Submit a payment record
 *   GET  /api/public/payments/list          - List all payments (admin key required)
 */

import type { Express, Request, Response } from "express";
import * as db from "./db";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import { generateTelegramActivationToken } from "./telegram";
import { quickCreateTelegramUser, parsePlanType } from "./quickCreateUser";

// ── API Key auth ──────────────────────────────────────────────────────────────
function getPublicApiKey(): string {
  return process.env.PUBLIC_API_KEY || "pilothub-public-api-key-2026";
}

function getAdminApiKey(): string {
  return process.env.ADMIN_API_KEY || "pilothub-admin-api-key-2026";
}

async function requireApiKey(req: Request, res: Response, adminOnly = false): Promise<boolean> {
  const key = req.headers["x-api-key"] as string | undefined;
  if (!key) {
    res.status(401).json({ success: false, error: "Missing X-API-Key header" });
    return false;
  }
  // Check static keys
  const isPublicKey = key === getPublicApiKey();
  const isAdminKey = key === getAdminApiKey();
  // Check dynamic tokens from DB
  const isDynamicToken = await db.validateExternalApiToken(key);

  if (adminOnly) {
    if (!isAdminKey) {
      res.status(403).json({ success: false, error: "Admin API key required" });
      return false;
    }
  } else {
    if (!isPublicKey && !isAdminKey && !isDynamicToken) {
      res.status(403).json({ success: false, error: "Invalid API key" });
      return false;
    }
  }
  return true;
}

// ── Generate random password ──────────────────────────────────────────────────
function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Register routes ───────────────────────────────────────────────────────────
export function registerPublicApiRoutes(app: Express) {

  // ── GET /api/public/info ───────────────────────────────────────────────────
  app.get("/api/public/info", (_req: Request, res: Response) => {
    res.json({
      name: "PilotHub Public API",
      version: "2.0.0",
      plans: [
        { id: "bizpilot", name: "BizPilot", price: 100000, currency: "MMK" },
        { id: "founderpilot", name: "FounderPilot", price: 300000, currency: "MMK" },
      ],
      endpoints: [
        { method: "POST", path: "/api/public/applications/submit", auth: "X-API-Key (public)", description: "Submit application form + payment slip" },
        { method: "POST", path: "/api/public/users/create", auth: "X-API-Key (public)", description: "Create a user account" },
        { method: "GET",  path: "/api/public/users/list", auth: "X-API-Key (admin)", description: "List all users" },
        { method: "POST", path: "/api/public/payments/submit", auth: "X-API-Key (public)", description: "Submit a payment" },
        { method: "GET",  path: "/api/public/payments/list", auth: "X-API-Key (admin)", description: "List all payments" },
        { method: "POST", path: "/api/admin/telegram/token", auth: "X-API-Key (admin)", description: "Generate Telegram bot activation token for a user" },
        { method: "POST", path: "/api/external/create-user", auth: "X-API-Key (public)", description: "Quick-create shadow user + Telegram activation link (AI sales agent)" },
      ],
    });
  });

  // ── POST /api/public/applications/submit ──────────────────────────────────
  // Submit application form from external website.
  // Body: { fullName, email, phone?, businessName?, businessType?, useCase?, plan?, paymentMethod?, transactionRef?, screenshotBase64?, screenshotMime? }
  // Returns: { success, applicationId, paymentId? }
  app.post("/api/public/applications/submit", async (req: Request, res: Response) => {
    if (!await requireApiKey(req, res)) return;
    try {
      const {
        fullName, email, phone, businessName, businessType, useCase,
        plan, paymentMethod, transactionRef, screenshotBase64, screenshotMime,
      } = req.body as {
        fullName?: string; email?: string; phone?: string;
        businessName?: string; businessType?: string; useCase?: string;
        plan?: string; paymentMethod?: string; transactionRef?: string;
        screenshotBase64?: string; screenshotMime?: string;
      };

      if (!fullName || !email) {
        res.status(400).json({ success: false, error: "fullName and email are required" });
        return;
      }

      const validPlan = (plan === "founderpilot") ? "founderpilot" : "bizpilot";

      // Create application
      const app_ = await db.createApplication({
        fullName, email, phone, businessName, businessType, useCase,
        plan: validPlan, source: "external_api",
      });

      let paymentId: number | undefined;

      // If payment info provided, create payment record
      if (paymentMethod) {
        let screenshotUrl: string | undefined;
        // Upload screenshot if provided
        if (screenshotBase64) {
          try {
            const { storagePut } = await import("./storage");
            const buffer = Buffer.from(screenshotBase64, "base64");
            const ext = screenshotMime?.includes("png") ? "png" : "jpg";
            const key = `payment-screenshots/ext-${Date.now()}-${nanoid(8)}.${ext}`;
            const result = await storagePut(key, buffer, screenshotMime || "image/jpeg");
            screenshotUrl = result.url;
          } catch (e) {
            console.warn("[PublicAPI] Screenshot upload failed:", e);
          }
        }

        const amounts: Record<string, number> = { bizpilot: 100000, founderpilot: 300000 };
        const payment = await db.createPayment({
          userName: fullName, userEmail: email, plan: validPlan,
          amount: amounts[validPlan] ?? 0, paymentMethod, transactionRef,
          screenshotUrl, source: "external_api",
        });
        paymentId = payment.id;
      }

      // Notify admin
      try {
        await notifyOwner({
          title: `📋 External Application: ${fullName} (${validPlan})`,
          content: `New application from external website:\nName: ${fullName}\nEmail: ${email}\nPlan: ${validPlan}\nBusiness: ${businessName ?? "N/A"}\nPayment: ${paymentMethod ?? "Not submitted"}\nRef: ${transactionRef ?? "N/A"}`,
        });
      } catch (e) { /* non-blocking */ }

      res.json({ success: true, applicationId: app_.id, paymentId });
    } catch (err: unknown) {
      console.error("[PublicAPI] /applications/submit error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /api/public/users/create ──────────────────────────────────────────
  app.post("/api/public/users/create", async (req: Request, res: Response) => {
    if (!await requireApiKey(req, res)) return;
    try {
      const { name, email, plan, businessName } = req.body as {
        name?: string; email?: string; plan?: string; businessName?: string;
      };
      if (!name || !email) {
        res.status(400).json({ success: false, error: "name and email are required" });
        return;
      }
      const openId = `ext_${nanoid(16)}`;
      const generatedPassword = generatePassword(14);
      await db.upsertUser({ openId, name, email, loginMethod: "external", lastSignedIn: new Date() });
      const user = await db.getUserByOpenId(openId);
      if (!user) { res.status(500).json({ success: false, error: "Failed to create user" }); return; }
      if (plan && (plan === "bizpilot" || plan === "founderpilot")) {
        await db.updateUserSubscription(user.id, plan, "active");
      }
      res.json({ success: true, userId: user.id, openId, name, email, plan: plan || null, generatedPassword });
    } catch (err: unknown) {
      console.error("[PublicAPI] /users/create error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /api/public/users/list ─────────────────────────────────────────────
  app.get("/api/public/users/list", async (req: Request, res: Response) => {
    if (!await requireApiKey(req, res, true)) return;
    try {
      const users = await db.listAllUsers();
      res.json({ success: true, users });
    } catch (err: unknown) {
      console.error("[PublicAPI] /users/list error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /api/public/payments/submit ──────────────────────────────────────
  app.post("/api/public/payments/submit", async (req: Request, res: Response) => {
    if (!await requireApiKey(req, res)) return;
    try {
      const { userId, userName, userEmail, plan, amount, paymentMethod, transactionRef, screenshotBase64, screenshotMime } = req.body as {
        userId?: number; userName?: string; userEmail?: string; plan?: string; amount?: number;
        paymentMethod?: string; transactionRef?: string; screenshotBase64?: string; screenshotMime?: string;
      };
      if (!plan || !paymentMethod) {
        res.status(400).json({ success: false, error: "plan and paymentMethod are required" });
        return;
      }
      if (plan !== "bizpilot" && plan !== "founderpilot") {
        res.status(400).json({ success: false, error: "plan must be 'bizpilot' or 'founderpilot'" });
        return;
      }
      const amounts: Record<string, number> = { bizpilot: 100000, founderpilot: 300000 };
      const finalAmount = amount ?? amounts[plan] ?? 0;
      let resolvedUserId = userId;
      if (!resolvedUserId && userEmail) {
        const user = await db.getUserByEmail(userEmail);
        if (user) resolvedUserId = user.id;
      }
      let screenshotUrl: string | undefined;
      if (screenshotBase64) {
        try {
          const { storagePut } = await import("./storage");
          const buffer = Buffer.from(screenshotBase64, "base64");
          const ext = screenshotMime?.includes("png") ? "png" : "jpg";
          const key = `payment-screenshots/ext-${Date.now()}-${nanoid(8)}.${ext}`;
          const result = await storagePut(key, buffer, screenshotMime || "image/jpeg");
          screenshotUrl = result.url;
        } catch (e) { console.warn("[PublicAPI] Screenshot upload failed:", e); }
      }
      const payment = await db.createPayment({
        userId: resolvedUserId, userName, userEmail, plan, amount: finalAmount,
        paymentMethod, transactionRef, screenshotUrl, source: "external_api",
      });
      // Notify admin
      try {
        await notifyOwner({
          title: `💰 External Payment: ${userName ?? userEmail} - ${plan}`,
          content: `Payment from external website:\nUser: ${userName ?? "Unknown"} (${userEmail ?? "N/A"})\nPlan: ${plan}\nAmount: ${finalAmount} MMK\nMethod: ${paymentMethod}\nRef: ${transactionRef ?? "N/A"}`,
        });
      } catch (e) { /* non-blocking */ }
      res.json({ success: true, paymentId: payment.id, amount: finalAmount, plan });
    } catch (err: unknown) {
      console.error("[PublicAPI] /payments/submit error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /api/admin/telegram/token ────────────────────────────────────────
  app.post("/api/admin/telegram/token", async (req: Request, res: Response) => {
    if (!await requireApiKey(req, res, true)) return;
    try {
      const { userId } = req.body as { userId?: number };
      if (!userId || typeof userId !== "number") {
        res.status(400).json({ success: false, error: "userId (number) is required" });
        return;
      }
      const result = await generateTelegramActivationToken(userId);
      res.json({ success: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("[PublicAPI] /admin/telegram/token error:", err);
      res.status(400).json({ success: false, error: message });
    }
  });

  // ── POST /api/external/create-user ──────────────────────────────────────────
  // AI sales agent: create or find user, set plan limits, return Telegram start link.
  // Body: { email, name, planType, bizMessageLimit?, founderMessageLimit?, planExpiryDate?, botUsername? }
  app.post("/api/external/create-user", async (req: Request, res: Response) => {
    if (!await requireApiKey(req, res)) return;
    try {
      const body = req.body as {
        email?: string;
        name?: string;
        planType?: string;
        bizMessageLimit?: number;
        founderMessageLimit?: number;
        planExpiryDate?: string | null;
        botUsername?: string;
      };

      if (!body.email?.trim() || !body.name?.trim()) {
        res.status(400).json({ success: false, error: "email and name are required" });
        return;
      }

      let planExpiryDate: Date | null | undefined = undefined;
      if (body.planExpiryDate !== undefined) {
        if (body.planExpiryDate === null || body.planExpiryDate === "") {
          planExpiryDate = null;
        } else {
          const d = new Date(
            body.planExpiryDate.includes("T")
              ? body.planExpiryDate
              : `${body.planExpiryDate}T23:59:59`,
          );
          if (Number.isNaN(d.getTime())) {
            res.status(400).json({ success: false, error: "Invalid planExpiryDate" });
            return;
          }
          planExpiryDate = d;
        }
      }

      const result = await quickCreateTelegramUser({
        email: body.email.trim(),
        name: body.name.trim(),
        planType: parsePlanType(body.planType),
        bizMessageLimit:
          typeof body.bizMessageLimit === "number" ? body.bizMessageLimit : undefined,
        founderMessageLimit:
          typeof body.founderMessageLimit === "number"
            ? body.founderMessageLimit
            : undefined,
        planExpiryDate,
        botUsername: body.botUsername?.trim(),
      });

      res.json({
        success: true,
        userId: result.userId,
        openId: result.openId,
        email: result.email,
        name: result.name,
        planType: result.planType,
        created: result.created,
        token: result.token,
        activationLink: result.activationLink,
        telegramStartLink: result.activationLink,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("[ExternalAPI] /create-user error:", err);
      res.status(400).json({ success: false, error: message });
    }
  });

  // ── GET /api/public/payments/list ─────────────────────────────────────────
  app.get("/api/public/payments/list", async (req: Request, res: Response) => {
    if (!await requireApiKey(req, res, true)) return;
    try {
      const payments = await db.listAllPayments();
      res.json({ success: true, payments });
    } catch (err: unknown) {
      console.error("[PublicAPI] /payments/list error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
}
