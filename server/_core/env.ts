import { resolveOpenAiApiKey } from "./aiKeys";

export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  /** @deprecated Prefer TURSO_DATABASE_URL; kept for compatibility */
  databaseUrl: process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "",
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  /** OpenAI / built-in forge key — prefers OPENAI_API_KEY, then BUILT_IN_FORGE_API_KEY */
  forgeApiKey: resolveOpenAiApiKey(),
  openaiApiKey: resolveOpenAiApiKey(),

  /** Google OAuth Web client ID */
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  /**
   * Optional fixed redirect URI (must match Google Cloud console exactly).
   * Use when `Host` / `X-Forwarded-*` does not match the URL registered with Google (e.g. some proxies).
   */
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",

  /**
   * Google `sub` for the project owner — first login upserts this user as admin.
   * Legacy: OWNER_OPEN_ID (Manus openId) is still read for one release if unset.
   */
  ownerGoogleSub: process.env.GOOGLE_OWNER_SUB ?? process.env.OWNER_OPEN_ID ?? "",

  /** Comma-separated emails auto-promoted to admin on Google login (see adminAccess.ts). */
  adminEmail: process.env.ADMIN_EMAIL ?? "",

  /** Telegram bot tokens (BizPilot / FounderPilot paid channels). */
  telegramBizBotToken:
    process.env.TELEGRAM_BIZPILOT_TOKEN ??
    process.env.TELEGRAM_BIZ_BOT_TOKEN ??
    "",
  telegramFounderBotToken:
    process.env.TELEGRAM_FOUNDERPILOT_TOKEN ??
    process.env.TELEGRAM_FOUNDER_BOT_TOKEN ??
    "",

  /** BizPilot @username without @ — used in t.me activation links. */
  telegramBizBotUsername:
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ??
    process.env.VITE_TELEGRAM_BOT_USERNAME ??
    process.env.TELEGRAM_BIZPILOT_BOT_USERNAME ??
    process.env.TELEGRAM_BIZ_BOT_USERNAME ??
    process.env.TELEGRAM_BOT_USERNAME ??
    "",
};
