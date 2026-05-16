/** Telegram paid plan tiers (BizPilot / FounderPilot). */
export type TelegramPlanTier = "starter" | "unlimited";

export const TELEGRAM_STARTER_MESSAGE_LIMIT = 20;
export const TELEGRAM_UNLIMITED_MESSAGE_LIMIT = 999_999;
/** Limits above this are treated as unlimited in webhooks and admin UI. */
export const TELEGRAM_UNLIMITED_THRESHOLD = 500_000;

export const TELEGRAM_STARTER_ALREADY_USED_BIZ =
  "ဒီအကောင့်သည် Starter Plan (အကြောင်း ၂၀) ဝယ်ယူပြီးသားဖြစ်၍ Unlimited Plan သာ ဝယ်ယူနိုင်ပါတော့မည်။";

export const TELEGRAM_STARTER_ALREADY_USED_FOUNDER =
  "ဒီအကောင့်သည် Founder Starter Plan (အကြောင်း ၂၀) ဝယ်ယူပြီးသားဖြစ်၍ Unlimited Plan သာ ဝယ်ယူနိုင်ပါတော့မည်။";

export function addTelegramPlanMonths(from = new Date(), months = 1): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function coerceTelegramLimit(value: unknown): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function isUnlimitedTelegramLimit(limit: unknown): boolean {
  return coerceTelegramLimit(limit) > TELEGRAM_UNLIMITED_THRESHOLD;
}

export function hasUsedTelegramStarter(flag: unknown): boolean {
  return flag === "true" || flag === true;
}

/** Assigning this message cap counts as a one-time Starter purchase. */
export function isStarterTelegramLimit(limit: unknown): boolean {
  const n = coerceTelegramLimit(limit);
  return n > 0 && n <= TELEGRAM_UNLIMITED_THRESHOLD;
}

export function parseTelegramPlanTier(value: string | undefined): TelegramPlanTier {
  const v = (value ?? "").toLowerCase().trim();
  if (
    v === "unlimited" ||
    v === "unlimited_1_month" ||
    v === "pro" ||
    v === "unlimited (1 month)"
  ) {
    return "unlimited";
  }
  return "starter";
}

export function inferTelegramPlanTierFromLimit(limit: unknown): TelegramPlanTier {
  return isUnlimitedTelegramLimit(limit) ? "unlimited" : "starter";
}
