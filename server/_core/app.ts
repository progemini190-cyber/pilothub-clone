import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerPublicApiRoutes } from "../publicApi";

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
export function createApp(_options: CreateAppOptions = {}): Express {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  registerStorageProxy(app);
  registerPublicApiRoutes(app);
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
