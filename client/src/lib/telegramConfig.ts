import {
  buildTelegramStartLink,
  buildTelegramSupportLink,
  isTelegramBotUsernameConfigured,
  resolveTelegramActivationBotUsername,
  resolveTelegramBizBotUsername,
  resolveTelegramFounderBotUsername,
  TELEGRAM_BOT_USERNAME_PLACEHOLDER,
} from "@shared/telegramConfig";

export {
  TELEGRAM_BOT_USERNAME_PLACEHOLDER,
  isTelegramBotUsernameConfigured,
  resolveTelegramFounderBotUsername,
};

/** BizPilot bot username from Vite env (NEXT_PUBLIC_* or VITE_*). */
export function getTelegramBizBotUsername(): string {
  return resolveTelegramBizBotUsername(import.meta.env);
}

/** FounderPilot bot username from env, or null if unset. */
export function getTelegramFounderBotUsername(): string | null {
  return resolveTelegramFounderBotUsername(import.meta.env);
}

export function buildActivationLink(
  token: string,
  botUsername?: string,
  planType?: "bizpilot" | "founderpilot",
): string {
  const username = resolveTelegramActivationBotUsername(
    import.meta.env,
    planType,
    botUsername,
  );
  return buildTelegramStartLink(token, username);
}

/** Customer support Telegram bot link for dashboard FAB. */
export function getTelegramCustomerSupportUrl(): string {
  return buildTelegramSupportLink(import.meta.env);
}
