import {
  buildTelegramStartLink,
  isTelegramBotUsernameConfigured,
  resolveTelegramBizBotUsername,
  TELEGRAM_BOT_USERNAME_PLACEHOLDER,
} from "@shared/telegramConfig";

export { TELEGRAM_BOT_USERNAME_PLACEHOLDER, isTelegramBotUsernameConfigured };

/** BizPilot bot username from Vite env (NEXT_PUBLIC_* or VITE_*). */
export function getTelegramBizBotUsername(): string {
  return resolveTelegramBizBotUsername(import.meta.env);
}

export function buildActivationLink(token: string, botUsername?: string): string {
  const username = botUsername?.trim().replace(/^@/, "") || getTelegramBizBotUsername();
  return buildTelegramStartLink(token, username);
}
