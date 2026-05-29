import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerPublicApiRoutes } from "../publicApi";
import { registerTelegramRoutes, TELEGRAM_WEBHOOK_PATH } from "../telegram";

export type CreateAppOptions = {
  /**
   * Vercel serverless: API routes only (OAuth, tRPC, public API).
   * Static assets are served from `outputDirectory` in vercel.json.
   */
  apiOnly?: boolean;
};

/**
 * Creates and configures the Express application.
 * Used by the Node server (`index.ts`) and Vercel (`api/index.ts`).
 */
function isTelegramWebhookPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === TELEGRAM_WEBHOOK_PATH;
}

/** Telegram webhooks must bypass auth — unauthenticated POSTs must never redirect. */
function isLikelyTelegramWebhookRequest(req: Request): boolean {
  const pathname = req.path || req.url?.split("?")[0] || "";
  if (isTelegramWebhookPath(pathname)) return true;

  // Vercel catch-all rewrite `/api/*` → `/api` strips the path but keeps query/body.
  if (pathname !== "/api" && pathname !== "/api/index") return false;
  if (req.method !== "POST") return false;

  if (req.headers["x-telegram-bot-api-secret-token"]) return true;

  const url = req.originalUrl ?? req.url ?? "";
  if (url.includes("advisor=")) return true;

  const q = req.query?.advisor;
  if (typeof q === "string" && q.trim()) return true;
  if (Array.isArray(q) && typeof q[0] === "string" && q[0].trim()) return true;

  return false;
}

function allowTelegramWebhook(req: Request, _res: Response, next: NextFunction): void {
  let pathname = req.path || req.url?.split("?")[0] || "";
  const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";

  if (isLikelyTelegramWebhookRequest(req) && !isTelegramWebhookPath(pathname)) {
    req.url = `${TELEGRAM_WEBHOOK_PATH}${query}`;
    pathname = TELEGRAM_WEBHOOK_PATH;
  }

  if (!isTelegramWebhookPath(pathname)) {
    next();
    return;
  }
  if (pathname.endsWith("/") && pathname.length > 1) {
    req.url = `${TELEGRAM_WEBHOOK_PATH}${query}`;
  }
  next();
}

export function createApp(_options: CreateAppOptions = {}): Express {
  const app = express();

  app.use(allowTelegramWebhook);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  registerStorageProxy(app);
  registerPublicApiRoutes(app);
  registerTelegramRoutes(app);
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
