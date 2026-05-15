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

const NO_ACCESS_MSG =
  "လူကြီးမင်း၏ အသုံးပြုခွင့် ကုန်ဆုံးသွားပါပြီ။ ထပ်မံဝယ်ယူရန် ChatPilot သို့ ဆက်သွယ်ပါ။";
const NO_USER_FOUND_MSG =
  "ဒီ Bot ကို အသုံးပြုဖို့ Website မှာ အရင် Register လုပ်ပေးပါ သို့မဟုတ် ChatPilot Agency သို့ ဆက်သွယ်ပါ။";
const LINK_SUCCESS_MSG =
  "အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါသည်။ စတင်မေးမြန်းနိုင်ပါပြီ။";
const INVALID_TOKEN_MSG =
  "ချိတ်ဆက်မှုမအောင်မြင်ပါ။ Admin ထံမှ ရရှိသော activation link ကို ပြန်စမ်းကြည့်ပါ။";

/** Replace with your bot username (no @). Used in admin activation links. */
export const TELEGRAM_BOT_USERNAME_PLACEHOLDER = "YOUR_BOT_USERNAME";

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

async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error("[Telegram] sendMessage failed:", response.status, body);
    }
  } catch (err) {
    console.error("[Telegram] sendMessage error:", err);
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
  let user;
  try {
    user = await db.getUserByTelegramChatId(chatId);
  } catch (err) {
    console.error("[Telegram] getUserByTelegramChatId failed:", err);
    user = undefined;
  }
  if (!user) {
    await sendTelegramMessage(botToken, chatId, NO_USER_FOUND_MSG);
    return;
  }

  if (!db.hasTelegramCredits(user, advisor)) {
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

  let reply: string;
  try {
    reply = await invokeAdvisorLLM(advisor, llmMessages);
  } catch (err) {
    console.error("[Telegram] LLM error:", err);
    await sendTelegramMessage(
      botToken,
      chatId,
      "စနစ်တွင် ယာယီပြဿနာရှိပါသည်။ ခဏနေမှ ပြန်ကြိုးစားပါ။",
    );
    return;
  }

  await db.decrementTelegramMessageLimit(user.id, advisor);
  await sendTelegramMessage(botToken, chatId, reply);
}

async function processUpdate(
  update: TelegramUpdate,
  advisor: AdvisorSlug,
  botToken: string,
): Promise<void> {
  const message = update?.message;
  if (!message?.text) return;

  const chatId = String(message.chat.id);
  const text = message.text;

  const startToken = parseStartToken(text);
  if (startToken) {
    await handleStartLink(chatId, startToken, botToken);
    return;
  }

  if (text.startsWith("/")) return;

  await handleChatMessage(chatId, text, advisor, botToken);
}

export function registerTelegramRoutes(app: Express): void {
  app.post("/api/telegram/webhook", async (req: Request, res: Response) => {
    // Always acknowledge Telegram immediately to prevent retries
    res.status(200).json({ ok: true });

    try {
      await ensureTelegramSchema();

      const advisor = parseAdvisor(req);
      const botToken = getTelegramBotToken(advisor);
      if (!botToken) {
        console.error(
          `[Telegram] No bot token for ${advisor}. Set TELEGRAM_BIZPILOT_TOKEN or TELEGRAM_FOUNDERPILOT_TOKEN.`,
        );
        return;
      }

      const update = (req.body ?? {}) as TelegramUpdate;
      await processUpdate(update, advisor, botToken);
    } catch (err) {
      console.error("[Telegram] Webhook processing error:", err);
    }
  });
}

export function buildTelegramActivationLink(token: string, botUsername?: string): string {
  const username =
    botUsername?.trim() ||
    process.env.TELEGRAM_BIZ_BOT_USERNAME?.trim() ||
    TELEGRAM_BOT_USERNAME_PLACEHOLDER;
  return `https://t.me/${username}?start=${token}`;
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
    botUsername?.trim() ||
    process.env.TELEGRAM_BIZ_BOT_USERNAME?.trim() ||
    TELEGRAM_BOT_USERNAME_PLACEHOLDER;
  const activationLink = buildTelegramActivationLink(token, username);
  const founderBot = process.env.TELEGRAM_FOUNDER_BOT_USERNAME?.trim();
  return {
    token: row.token,
    userId: row.userId,
    activationLink,
    deepLinkBiz: activationLink,
    deepLinkFounder: founderBot ? buildTelegramActivationLink(token, founderBot) : null,
  };
}
