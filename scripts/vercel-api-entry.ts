/** Vercel serverless max duration (seconds). Applies to all `/api/*` routes, including Telegram webhook. */
export const maxDuration = 60;

import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/_core/app";

const app = createApp({ apiOnly: true });

/**
 * Vercel Node serverless handler (bundled to api/index.js).
 * Serves all /api/* routes including OAuth and tRPC.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
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
