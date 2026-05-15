/**
 * Telegram webhook handlers for BizPilot and FounderPilot paid bots.
 * Webhook URL: POST /api/telegram/webhook?advisor=bizpilot|founderpilot
 * (defaults to bizpilot when omitted)
 */

import type { Express, Request, Response } from "express";
import { getPublicOrigin } from "./_core/oauth";
import { nanoid } from "nanoid";
import * as db from "./db";
import type { AdvisorSlug } from "./db";
import { ensureTelegramSchema } from "./db/ensureTelegramSchema";
import { invokeAdvisorLLM } from "./llmWithApiKey";
import {
  buildTelegramStartLink,
  resolveTelegramBizBotUsername,
  resolveTelegramFounderBotUsername,
  TELEGRAM_BOT_USERNAME_PLACEHOLDER,
} from "@shared/telegramConfig";

export { TELEGRAM_BOT_USERNAME_PLACEHOLDER };

const NO_ACCESS_MSG =
  "လူကြီးမင်း၏ အသုံးပြုခွင့် ကုန်ဆုံးသွားပါပြီ။ ထပ်မံဝယ်ယူရန် ChatPilot သို့ ဆက်သွယ်ပါ။";
const NO_USER_FOUND_MSG =
  "ဒီ Bot ကို အသုံးပြုဖို့ Website မှာ အရင် Register လုပ်ပေးပါ သို့မဟုတ် ChatPilot Agency သို့ ဆက်သွယ်ပါ။";
const LINK_SUCCESS_MSG =
  "အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါသည်။ စတင်မေးမြန်းနိုင်ပါပြီ။";
const INVALID_TOKEN_MSG =
  "ချိတ်ဆက်မှုမအောင်မြင်ပါ။ Admin ထံမှ ရရှိသော activation link ကို ပြန်စမ်းကြည့်ပါ။";
const SYSTEM_ERROR_MSG =
  "စနစ်ချို့ယွင်းနေပါသည်။ ခဏနေမှ ထပ်မံကြိုးစားကြည့်ပါ။";
const ALREADY_LINKED_MSG =
  "အကောင့် ချိတ်ဆက်ပြီးသားဖြစ်ပါသည်။ စာသားပို့ပြီး မေးမြန်းနိုင်ပါပြီ။";

/** Reply keyboard row label — must match Telegram `KeyboardButton.text` exactly. */
const CONTACT_TEAM_BUTTON_TEXT = "📞 ChatPilot Team သို့ ဆက်သွယ်ရန်";

const CONTACT_TEAM_REPLY_MSG =
  "ChatPilot Team သို့ ဆက်သွယ်ရန် အောက်ပါ Link သို့ ဝင်ရောက်ပါ 👇\n\nhttps://t.me/chatpilot_ai_bot";

/**
 * Shown under the text input on every bot reply.
 * Telegram API field is `is_persistent` (not `persistent`).
 */
const PERSISTENT_REPLY_KEYBOARD = {
  keyboard: [[{ text: CONTACT_TEAM_BUTTON_TEXT }]],
  resize_keyboard: true,
  is_persistent: true,
} as const;

type TelegramUpdate = {
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    text?: string;
    from?: { id: number; username?: string };
  };
};

export function getTelegramBotToken(advisor: AdvisorSlug): string | undefined {
  if (advisor === "bizpilot") {
    return (
      process.env.TELEGRAM_BIZPILOT_TOKEN?.trim() ||
      process.env.TELEGRAM_BIZ_BOT_TOKEN?.trim()
    );
  }
  return (
    process.env.TELEGRAM_FOUNDERPILOT_TOKEN?.trim() ||
    process.env.TELEGRAM_FOUNDER_BOT_TOKEN?.trim()
  );
}

function parseAdvisor(req: Request): AdvisorSlug {
  const raw = (req.query.advisor as string | undefined)?.toLowerCase();
  if (raw === "founderpilot") return "founderpilot";
  return "bizpilot";
}

function parseStartToken(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/start")) return null;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;
  return parts[1]!.replace(/^@/, "").trim() || null;
}

/** `/start` or `/start@BotName` with no activation payload. */
function isBareStartCommand(text: string): boolean {
  return /^\s*\/start(?:@[\w_]+)?\s*$/i.test(text.trim());
}

function extractChatId(update: TelegramUpdate): string | undefined {
  const id = update?.message?.chat?.id;
  return id != null ? String(id) : undefined;
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: PERSISTENT_REPLY_KEYBOARD,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error("[Telegram] sendMessage failed:", response.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Telegram] sendMessage error:", err);
    return false;
  }
}

/** Shows “typing…” while waiting for Gemini. */
async function sendTypingChatAction(
  botToken: string,
  chatId: string | number,
): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.warn("[Telegram] sendChatAction typing failed:", response.status, body);
    }
  } catch (err) {
    console.warn("[Telegram] sendChatAction error:", err);
  }
}

async function handleStartLink(
  chatId: string,
  token: string,
  botToken: string,
): Promise<void> {
  const activation = await db.getActivationToken(token);
  if (!activation || activation.isUsed === "true") {
    await sendTelegramMessage(botToken, chatId, INVALID_TOKEN_MSG);
    return;
  }

  const user = await db.getUserById(activation.userId);
  if (!user) {
    await sendTelegramMessage(botToken, chatId, INVALID_TOKEN_MSG);
    return;
  }

  await db.linkTelegramChat(user.id, chatId);
  await db.markActivationTokenUsed(activation.id);
  await sendTelegramMessage(botToken, chatId, LINK_SUCCESS_MSG);
}

async function handleChatMessage(
  chatId: string,
  userText: string,
  advisor: AdvisorSlug,
  botToken: string,
): Promise<void> {
  const user = await safeGetUserByTelegramChatId(chatId);
  if (!user) {
    await sendTelegramMessage(botToken, chatId, NO_USER_FOUND_MSG);
    return;
  }

  console.log("Credit check:", {
    userId: user.id,
    advisor,
    limit:
      advisor === "bizpilot"
        ? db.coerceTelegramMessageLimit(user.bizMessageLimit)
        : db.coerceTelegramMessageLimit(user.founderMessageLimit),
    bizMessageLimit: user.bizMessageLimit,
    founderMessageLimit: user.founderMessageLimit,
    expiry: user.planExpiryDate,
    expiryActive: db.isTelegramPlanActive(user.planExpiryDate ?? null),
  });

  if (!db.hasTelegramCredits(user, advisor)) {
    console.log("[Telegram] Credit check failed — denying access", {
      userId: user.id,
      advisor,
    });
    await sendTelegramMessage(botToken, chatId, NO_ACCESS_MSG);
    return;
  }

  const systemPrompt = await db.getActiveSystemPrompt(advisor);
  const fallback =
    advisor === "bizpilot"
      ? "You are BizPilot, an expert business advisor for Myanmar businesses."
      : "You are FounderPilot, a strategic advisor for founders and CEOs.";

  const profileCtx = [
    `\n\n[User Profile]`,
    `- Name: ${user.name ?? "Unknown"}`,
    user.businessName ? `- Business Name: ${user.businessName}` : null,
    user.businessType ? `- Business Type: ${user.businessType}` : null,
    user.useCase ? `- How they use PilotHub: ${user.useCase}` : null,
    `- Channel: Telegram (${advisor})`,
  ]
    .filter(Boolean)
    .join("\n");

  const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: (systemPrompt || fallback) + profileCtx },
    { role: "user", content: userText },
  ];

  await sendTypingChatAction(botToken, chatId);

  let reply: string;
  try {
    reply = await invokeAdvisorLLM(advisor, llmMessages);
  } catch (err) {
    console.error("[Telegram] LLM error:", err);
    await sendTelegramMessage(botToken, chatId, SYSTEM_ERROR_MSG);
    return;
  }

  const sent = await sendTelegramMessage(botToken, chatId, reply);
  if (!sent) {
    console.error("[Telegram] Gemini reply was not delivered; limit not decremented", {
      userId: user.id,
      advisor,
    });
    return;
  }

  await db.decrementTelegramMessageLimit(user.id, advisor);
  console.log("[Telegram] Message limit decremented after successful delivery", {
    userId: user.id,
    advisor,
  });
}

async function safeGetUserByTelegramChatId(chatId: string) {
  try {
    return await db.getUserByTelegramChatId(chatId);
  } catch (err) {
    console.error("[Telegram] getUserByTelegramChatId failed:", err);
    return undefined;
  }
}

async function handleBareStart(chatId: string, botToken: string): Promise<void> {
  const user = await safeGetUserByTelegramChatId(chatId);
  if (!user) {
    await sendTelegramMessage(botToken, chatId, NO_USER_FOUND_MSG);
    return;
  }
  await sendTelegramMessage(botToken, chatId, ALREADY_LINKED_MSG);
}

async function processUpdate(
  update: TelegramUpdate,
  advisor: AdvisorSlug,
  botToken: string,
): Promise<void> {
  const message = update?.message;
  if (!message?.text) {
    console.log("[Telegram] Ignoring update without text message");
    return;
  }

  const chatId = String(message.chat.id);
  const text = message.text;

  if (isBareStartCommand(text)) {
    await handleBareStart(chatId, botToken);
    return;
  }

  const startToken = parseStartToken(text);
  if (startToken) {
    await handleStartLink(chatId, startToken, botToken);
    return;
  }

  if (text.startsWith("/")) {
    console.log("[Telegram] Ignoring unhandled command:", text.slice(0, 32));
    return;
  }

  await handleChatMessage(chatId, text, advisor, botToken);
}

export function registerTelegramRoutes(app: Express): void {
  app.post("/api/telegram/webhook", async (req: Request, res: Response) => {
    console.log("Received Telegram message:", req.body);

    let botToken: string | undefined;
    let chatId: string | undefined;

    try {
      const body = req.body as { message?: { text?: string; chat?: { id?: number } } };
      if (body?.message?.text === CONTACT_TEAM_BUTTON_TEXT) {
        await ensureTelegramSchema();
        const advisor = parseAdvisor(req);
        botToken = getTelegramBotToken(advisor);
        chatId =
          body.message.chat?.id != null ? String(body.message.chat.id) : undefined;
        if (botToken && chatId) {
          await sendTelegramMessage(botToken, chatId, CONTACT_TEAM_REPLY_MSG);
        } else if (!botToken) {
          console.error(
            `[Telegram] No bot token for ${advisor}. Set TELEGRAM_BIZPILOT_TOKEN or TELEGRAM_FOUNDERPILOT_TOKEN.`,
          );
        }
        return;
      }

      await ensureTelegramSchema();

      const advisor = parseAdvisor(req);
      botToken = getTelegramBotToken(advisor);
      if (!botToken) {
        console.error(
          `[Telegram] No bot token for ${advisor}. Set TELEGRAM_BIZPILOT_TOKEN or TELEGRAM_FOUNDERPILOT_TOKEN.`,
        );
        return;
      }

      const update = (req.body ?? {}) as TelegramUpdate;
      chatId = extractChatId(update);
      await processUpdate(update, advisor, botToken);
    } catch (err) {
      console.error("[Telegram] Webhook processing error:", err);
      if (botToken && chatId) {
        try {
          await sendTelegramMessage(botToken, chatId, SYSTEM_ERROR_MSG);
        } catch (sendErr) {
          console.error("[Telegram] Failed to send error reply:", sendErr);
        }
      }
    } finally {
      res.status(200).json({ ok: true });
    }
  });
}

export function getTelegramBizBotUsername(): string {
  return resolveTelegramBizBotUsername(process.env);
}

export function getTelegramFounderBotUsername(): string | null {
  return resolveTelegramFounderBotUsername(process.env);
}

export function buildTelegramActivationLink(token: string, botUsername?: string): string {
  const username =
    botUsername?.trim().replace(/^@/, "") || getTelegramBizBotUsername();
  return buildTelegramStartLink(token, username);
}

export function resolveWebhookBaseUrl(req?: Request): string {
  const explicit =
    process.env.WEBHOOK_BASE_URL?.trim() ||
    process.env.PUBLIC_APP_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      console.warn("[Telegram] WEBHOOK_BASE_URL / PUBLIC_APP_URL invalid:", explicit);
    }
  }
  if (req) {
    return getPublicOrigin(req);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  throw new Error(
    "Cannot determine public URL. Set WEBHOOK_BASE_URL or PUBLIC_APP_URL (e.g. https://your-domain.com)",
  );
}

function assertPublicWebhookBaseUrl(baseUrl: string): void {
  let host = "";
  try {
    host = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    throw new Error(`Invalid webhook base URL: ${baseUrl}`);
  }
  // Vercel *preview* deployments use Deployment Protection → Telegram gets 401.
  if (host.endsWith("-projects.vercel.app")) {
    throw new Error(
      `Webhook base URL must be your production domain (e.g. https://pilothub.vip), not a Vercel preview URL (${host}). Set PUBLIC_APP_URL=https://pilothub.vip in Vercel env, then run Setup Bot from the live admin panel.`,
    );
  }
}

export async function setupTelegramWebhook(
  advisor: AdvisorSlug,
  baseUrl: string,
): Promise<{ ok: true; webhookUrl: string; description?: string }> {
  const botToken = getTelegramBotToken(advisor);
  if (!botToken) {
    throw new Error(
      advisor === "bizpilot"
        ? "TELEGRAM_BIZPILOT_TOKEN is not set in environment"
        : "TELEGRAM_FOUNDERPILOT_TOKEN is not set in environment",
    );
  }

  assertPublicWebhookBaseUrl(baseUrl);

  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook?advisor=${advisor}`;
  const apiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true }),
  });

  const data = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: boolean;
  };

  if (!response.ok || !data.ok) {
    throw new Error(data.description ?? `Telegram setWebhook failed (${response.status})`);
  }

  console.info("[Telegram] Webhook registered", { advisor, webhookUrl });
  return { ok: true, webhookUrl, description: data.description };
}

export async function generateTelegramActivationToken(
  userId: number,
  botUsername?: string,
): Promise<{
  token: string;
  userId: number;
  activationLink: string;
  deepLinkBiz: string;
  deepLinkFounder: string | null;
}> {
  await ensureTelegramSchema();
  const token = nanoid(32);
  const row = await db.createBotActivationToken(userId, token);
  const username =
    botUsername?.trim().replace(/^@/, "") || getTelegramBizBotUsername();
  const activationLink = buildTelegramActivationLink(token, username);
  const founderBot = getTelegramFounderBotUsername();
  return {
    token: row.token,
    userId: row.userId,
    activationLink,
    deepLinkBiz: activationLink,
    deepLinkFounder: founderBot ? buildTelegramActivationLink(token, founderBot) : null,
  };
}
