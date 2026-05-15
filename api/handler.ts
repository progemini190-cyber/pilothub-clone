import "dotenv/config";
import type { Express } from "express";
import { createApp } from "../server/_core/app";

let cached: Express | undefined;

/** Shared Express app for all Vercel `/api` serverless functions. */
export function getApiApp(): Express {
  if (!cached) {
    cached = createApp({ apiOnly: true });
  }
  return cached;
}

export default getApiApp();
