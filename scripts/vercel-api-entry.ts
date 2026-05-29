/** Vercel serverless max duration (seconds). Applies to all `/api/*` routes, including Telegram webhook. */
export const maxDuration = 60;

import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/_core/app";
import { TELEGRAM_WEBHOOK_PATH } from "../server/telegram";

const app = createApp({ apiOnly: true });

/** Restore path/query when Vercel rewrites `/api/*` → `/api`. */
function restoreVercelRequestUrl(req: IncomingMessage): void {
  const rawUrl = req.url ?? "/";
  const pathname = rawUrl.split("?")[0] ?? "/";
  if (pathname.includes(TELEGRAM_WEBHOOK_PATH)) return;

  const headerCandidates = [
    req.headers["x-forwarded-uri"],
    req.headers["x-vercel-invocation-url"],
    req.headers["x-invoke-path"],
  ];

  for (const candidate of headerCandidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    const value = candidate.trim();
    try {
      const parsed = value.startsWith("http") ? new URL(value) : new URL(value, "http://internal");
      if (parsed.pathname.includes(TELEGRAM_WEBHOOK_PATH) || parsed.searchParams.has("advisor")) {
        req.url = `${parsed.pathname}${parsed.search}`;
        return;
      }
    } catch {
      if (value.includes(TELEGRAM_WEBHOOK_PATH) || value.includes("advisor=")) {
        req.url = value.startsWith("/") ? value : `/${value}`;
        return;
      }
    }
  }

  const query = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "";
  if (
    (pathname === "/api" || pathname === "/api/index") &&
    (query.includes("advisor=") || req.headers["x-telegram-bot-api-secret-token"])
  ) {
    req.url = `${TELEGRAM_WEBHOOK_PATH}${query}`;
  }
}

/**
 * Vercel Node serverless handler (bundled to api/index.js).
 * Serves all /api/* routes including OAuth and tRPC.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    restoreVercelRequestUrl(req);
    await new Promise<void>((resolve, reject) => {
      app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1], (err: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err) {
    console.error("[api] Unhandled error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Internal Server Error",
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }
}
