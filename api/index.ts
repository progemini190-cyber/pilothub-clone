/**
 * Vercel serverless entry: handles all `/api/*` and `/manus-storage/*` requests.
 * @see vercel.json rewrites
 */
import "dotenv/config";
import { createApp } from "../server/_core/app";

export default createApp({ apiOnly: true });
