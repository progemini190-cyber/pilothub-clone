/** Shown when no bot username env var is configured. */
export const TELEGRAM_BOT_USERNAME_PLACEHOLDER = "YOUR_BOT_USERNAME";

export function normalizeTelegramBotUsername(raw?: string | null): string {
  return (raw ?? "").trim().replace(/^@/, "");
}

/**
 * Resolve BizPilot bot username (no @) from environment.
 * Supports NEXT_PUBLIC_* (Vercel/build), VITE_* (local Vite), and server-only names.
 */
export function resolveTelegramBizBotUsername(
  env: Record<string, string | boolean | undefined>,
): string {
  const username =
    normalizeTelegramBotUsername(env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.VITE_TELEGRAM_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.TELEGRAM_BIZPILOT_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.TELEGRAM_BIZ_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.TELEGRAM_BOT_USERNAME as string) ||
    "";
  return username || TELEGRAM_BOT_USERNAME_PLACEHOLDER;
}

export function resolveTelegramFounderBotUsername(
  env: Record<string, string | boolean | undefined>,
): string | null {
  const username =
    normalizeTelegramBotUsername(env.NEXT_PUBLIC_TELEGRAM_FOUNDERPILOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.NEXT_PUBLIC_TELEGRAM_FOUNDER_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.VITE_TELEGRAM_FOUNDERPILOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.VITE_TELEGRAM_FOUNDER_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.TELEGRAM_FOUNDERPILOT_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.TELEGRAM_FOUNDER_BOT_USERNAME as string) ||
    "";
  return username || null;
}

/** True when plan/advisor string targets FounderPilot (e.g. `founderpilot`, `founder`). */
export function isFounderTelegramPlan(planType?: string | null): boolean {
  return (planType ?? "").toLowerCase().includes("founder");
}

/**
 * Bot username for `t.me/...?start=` links from plan type.
 * Founder plans → FounderPilot bot; otherwise BizPilot.
 */
export function resolveTelegramActivationBotUsername(
  env: Record<string, string | boolean | undefined>,
  planType?: string | null,
  botUsernameOverride?: string | null,
): string {
  const override = normalizeTelegramBotUsername(botUsernameOverride);
  if (override) return override;
  if (isFounderTelegramPlan(planType)) {
    const founder = resolveTelegramFounderBotUsername(env);
    if (founder) return founder;
  }
  return resolveTelegramBizBotUsername(env);
}

export function isTelegramBotUsernameConfigured(username: string): boolean {
  return (
    Boolean(username) &&
    username !== TELEGRAM_BOT_USERNAME_PLACEHOLDER
  );
}

export function buildTelegramStartLink(token: string, botUsername: string): string {
  const user = normalizeTelegramBotUsername(botUsername) || TELEGRAM_BOT_USERNAME_PLACEHOLDER;
  return `https://t.me/${user}?start=${token}`;
}

/** Customer support / sales Telegram bot (ChatPilot team). */
export const TELEGRAM_SUPPORT_BOT_USERNAME_DEFAULT = "chatpilot_ai_bot";

export function resolveTelegramSupportBotUsername(
  env: Record<string, string | boolean | undefined>,
): string {
  const username =
    normalizeTelegramBotUsername(env.VITE_TELEGRAM_SUPPORT_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.NEXT_PUBLIC_TELEGRAM_SUPPORT_BOT_USERNAME as string) ||
    normalizeTelegramBotUsername(env.TELEGRAM_SUPPORT_BOT_USERNAME as string) ||
    "";
  return username || TELEGRAM_SUPPORT_BOT_USERNAME_DEFAULT;
}

export function buildTelegramSupportLink(
  env: Record<string, string | boolean | undefined>,
): string {
  return `https://t.me/${resolveTelegramSupportBotUsername(env)}`;
}
