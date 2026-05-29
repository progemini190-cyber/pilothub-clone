/**
 * Telegram webhook handlers for BizPilot and FounderPilot paid bots.
 * Webhook URL: POST /api/telegram/webhook?advisor=bizpilot|founderpilot
 * (defaults to bizpilot when omitted)
 */

/** Public webhook path — excluded from auth middleware (see middleware.ts). */
export const TELEGRAM_WEBHOOK_PATH = "/api/telegram/webhook";

import type { Express, Request, Response } from "express";
import { getPublicOrigin } from "./_core/oauth";
import { nanoid } from "nanoid";
import * as db from "./db";
import type { AdvisorSlug } from "./db";
import { ensureTelegramSchema } from "./db/ensureTelegramSchema";
import { fetchWithTimeout, invokeAdvisorLLM } from "./llmWithApiKey";
import { appendAdvisorSafetyPrompt } from "@shared/chatSafety";
import { LLM_USER_ERROR_MESSAGE } from "@shared/llmChat";
import {
  buildTelegramStartLink,
  resolveTelegramActivationBotUsername,
  resolveTelegramBizBotUsername,
  resolveTelegramFounderBotUsername,
  TELEGRAM_BOT_USERNAME_PLACEHOLDER,
} from "@shared/telegramConfig";
import { isUnlimitedTelegramLimit } from "@shared/telegramPlans";

export { TELEGRAM_BOT_USERNAME_PLACEHOLDER };

const NO_ACCESS_MSG =
  "လူကြီးမင်း၏ အသုံးပြုခွင့် ကုန်ဆုံးသွားပါပြီ။ ထပ်မံဝယ်ယူရန် ChatPilot သို့ ဆက်သွယ်ပါ။";
const NO_USER_FOUND_MSG =
  "ဒီ Bot ကို အသုံးပြုဖို့ Website မှာ အရင် Register လုပ်ပေးပါ သို့မဟုတ် ChatPilot Agency သို့ ဆက်သွယ်ပါ။";
const LINK_SUCCESS_MSG =
  "အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါသည်။ စတင်မေးမြန်းနိုင်ပါပြီ။";
const INVALID_TOKEN_MSG =
  "ချိတ်ဆက်မှုမအောင်မြင်ပါ။ Admin ထံမှ ရရှိသော activation link ကို ပြန်စမ်းကြည့်ပါ။";
const ALREADY_LINKED_MSG =
  "အကောင့် ချိတ်ဆက်ပြီးသားဖြစ်ပါသည်။ စာသားပို့ပြီး မေးမြန်းနိုင်ပါပြီ။";

/** Reply keyboard row label — must match Telegram `KeyboardButton.text` exactly. */
const CONTACT_TEAM_BUTTON_TEXT = "📞 ChatPilot Team သို့ ဆက်သွယ်ရန်";

/** Replace YOUR_SALE_AGENT in both URLs with your sales Telegram username (no @). */
const CONTACT_TEAM_REPLY_MSG =
  `မည်သည့်အကြောင်းအရာအတွက် ဆက်သွယ်လိုပါသလဲ ခင်ဗျာ? 👇

၁။ 💎 အကောင့်သက်တမ်း (သို့) အကြိမ်ရေ တိုးရန်
👉 https://t.me/chatpilot_ai_bot?text=မင်္ဂလာပါ၊%20အကောင့်သက်တမ်းတိုးချင်လို့ပါ

၂။ 💬 အခြားသိလိုသည်များ မေးမြန်းရန်
👉 https://t.me/chatpilot_ai_bot?text=မင်္ဂလာပါ၊%20အခြားအကြောင်းအရာလေး%20မေးချင်လို့ပါ`;

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

/** True when webhook `advisor` query targets FounderPilot. */
export function isFounderAdvisorQuery(advisorQuery: string | undefined): boolean {
  return (advisorQuery ?? "").toLowerCase().includes("founder");
}

export function getTelegramBotToken(advisor: AdvisorSlug | string | undefined): string | undefined {
  if (advisor === "founderpilot" || isFounderAdvisorQuery(advisor)) {
    return (
      process.env.TELEGRAM_FOUNDERPILOT_TOKEN?.trim() ||
      process.env.TELEGRAM_FOUNDER_BOT_TOKEN?.trim() ||
      process.env.TELEGRAM_BOT_TOKEN_FOUNDER?.trim()
    );
  }
  return (
    process.env.TELEGRAM_BIZPILOT_TOKEN?.trim() ||
    process.env.TELEGRAM_BIZ_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN_BIZ?.trim()
  );
}

function normalizeAdvisorSlug(raw: string | undefined): AdvisorSlug {
  if (isFounderAdvisorQuery(raw)) return "founderpilot";
  return "bizpilot";
}

/** Telegram `setWebhook` secret_token — most reliable per-bot identifier. */
function extractAdvisorSecretToken(req: Request): string | undefined {
  const raw = req.headers["x-telegram-bot-api-secret-token"];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim()) return raw[0].trim();
  return undefined;
}

function advisorFromUrlString(pathWithQuery: string): string | undefined {
  try {
    const absolute =
      pathWithQuery.startsWith("http://") || pathWithQuery.startsWith("https://")
        ? pathWithQuery
        : `http://internal${pathWithQuery.startsWith("/") ? "" : "/"}${pathWithQuery}`;
    const advisorParam = new URL(absolute).searchParams.get("advisor");
    if (advisorParam?.trim()) return advisorParam.trim();
  } catch {
    // fall through
  }
  return undefined;
}

/**
 * Resolve `advisor` query reliably (Vercel/Express sometimes omit parsed `req.query`).
 */
function extractAdvisorQuery(req: Request): string | undefined {
  const secret = extractAdvisorSecretToken(req);
  if (secret) return secret;

  const urlCandidates = [
    req.originalUrl,
    req.url,
    typeof req.headers["x-vercel-invocation-url"] === "string"
      ? req.headers["x-vercel-invocation-url"]
      : undefined,
    typeof req.headers["x-forwarded-uri"] === "string" ? req.headers["x-forwarded-uri"] : undefined,
  ];

  for (const pathWithQuery of urlCandidates) {
    if (!pathWithQuery?.trim()) continue;
    const advisor = advisorFromUrlString(pathWithQuery.trim());
    if (advisor) return advisor;
  }

  const q = req.query?.advisor;
  if (typeof q === "string" && q.trim()) return q.trim();
  if (Array.isArray(q) && typeof q[0] === "string" && q[0].trim()) return q[0].trim();
  return undefined;
}

/** Infer bot from `/command@BotUsername` suffix when query param is missing. */
function inferAdvisorFromUpdate(update: TelegramUpdate | undefined): AdvisorSlug | undefined {
  const text = update?.message?.text ?? "";
  const match = text.match(/@([\w_]+)/);
  if (!match?.[1]) return undefined;

  const mentioned = match[1].toLowerCase();
  const founderBot = getTelegramFounderBotUsername()?.toLowerCase();
  const bizBot = getTelegramBizBotUsername().toLowerCase();

  if (founderBot && mentioned === founderBot) return "founderpilot";
  if (bizBot && mentioned !== TELEGRAM_BOT_USERNAME_PLACEHOLDER.toLowerCase() && mentioned === bizBot) {
    return "bizpilot";
  }
  return undefined;
}

function parseAdvisor(req: Request, update?: TelegramUpdate): AdvisorSlug {
  const fromQuery = extractAdvisorQuery(req);
  if (fromQuery) return normalizeAdvisorSlug(fromQuery);
  const inferred = inferAdvisorFromUpdate(update);
  if (inferred) return inferred;
  return "bizpilot";
}

export type TelegramActivationPlanType = "bizpilot" | "founderpilot";

export function resolveActivationBotUsername(
  planType?: TelegramActivationPlanType | string | null,
  botUsernameOverride?: string,
): string {
  return resolveTelegramActivationBotUsername(
    process.env,
    planType,
    botUsernameOverride,
  );
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
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: PERSISTENT_REPLY_KEYBOARD,
        }),
      },
      30_000,
    );
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
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action: "typing" }),
      },
      15_000,
    );
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

async function sendLlmFailureReply(
  botToken: string,
  chatId: string | number,
): Promise<void> {
  const sent = await sendTelegramMessage(botToken, chatId, LLM_USER_ERROR_MESSAGE);
  if (!sent) {
    console.error("[Telegram] Failed to deliver LLM error message to chat:", chatId);
  }
}

async function handleChatMessage(
  chatId: string,
  userText: string,
  advisorSlug: AdvisorSlug,
  advisorQuery: string | undefined,
  botToken: string,
): Promise<void> {
  try {
    const user = await safeGetUserByTelegramChatId(chatId);
    if (!user) {
      await sendTelegramMessage(botToken, chatId, NO_USER_FOUND_MSG);
      return;
    }

    const isBiz = advisorSlug === "bizpilot";
    const rawLimit = isBiz ? user.bizMessageLimit : user.founderMessageLimit;
    const isUnlimited = isUnlimitedTelegramLimit(rawLimit);
    const currentLimit = db.coerceTelegramMessageLimit(rawLimit);
    const isExpired = !db.isTelegramPlanActive(user.planExpiryDate ?? null);

    console.log("Credit check:", {
      userId: user.id,
      advisorQuery,
      advisorSlug,
      isBiz,
      isUnlimited,
      currentLimit,
      bizMessageLimit: user.bizMessageLimit,
      founderMessageLimit: user.founderMessageLimit,
      expiry: user.planExpiryDate,
      isExpired,
    });

    if (isUnlimited) {
      if (isExpired) {
        console.log("[Telegram] Unlimited plan expired — denying access", {
          userId: user.id,
          chatId,
          isBiz,
        });
        await sendTelegramMessage(botToken, chatId, NO_ACCESS_MSG);
        return;
      }
    } else if (currentLimit <= 0 || isExpired) {
      console.log("[Telegram] Credit check failed — denying access", {
        userId: user.id,
        advisorQuery,
        advisorSlug,
        currentLimit,
        isExpired,
      });
      await sendTelegramMessage(botToken, chatId, NO_ACCESS_MSG);
      return;
    }

    const systemPrompt = await db.getActiveSystemPrompt(advisorSlug);
    const fallback =
      advisorSlug === "bizpilot"
        ? "You are BizPilot, an expert business advisor for Myanmar businesses."
        : "You are FounderPilot, a strategic advisor for founders and CEOs.";

    const profileCtx = [
      `\n\n[User Profile]`,
      `- Name: ${user.name ?? "Unknown"}`,
      user.businessName ? `- Business Name: ${user.businessName}` : null,
      user.businessType ? `- Business Type: ${user.businessType}` : null,
      user.useCase ? `- How they use PilotHub: ${user.useCase}` : null,
      `- Channel: Telegram (${advisorSlug})`,
    ]
      .filter(Boolean)
      .join("\n");

    const history = await db.listRecentTelegramLlmTurnsForAdvisor(user.id, advisorSlug, 40);

    const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: appendAdvisorSafetyPrompt((systemPrompt || fallback) + profileCtx, advisorSlug),
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: userText },
    ];

    /** Fire-and-forget so we don't delay LLM; Telegram shows typing while request is in flight. */
    void sendTypingChatAction(botToken, chatId).catch(() => {});

    let reply: string;
    try {
      reply = await invokeAdvisorLLM(advisorSlug, llmMessages);
    } catch (err) {
      console.error("[Telegram Webhook] Error: ", err);
      await sendLlmFailureReply(botToken, chatId);
      return;
    }

    if (!reply?.trim()) {
      console.error("[Telegram] LLM returned empty reply", { userId: user.id, advisorSlug });
      await sendLlmFailureReply(botToken, chatId);
      return;
    }

    const sent = await sendTelegramMessage(botToken, chatId, reply);
    if (!sent) {
      console.error("[Telegram] LLM reply was not delivered; limit not decremented", {
        userId: user.id,
        advisorSlug,
      });
      await sendLlmFailureReply(botToken, chatId);
      return;
    }

    if (isUnlimited) {
      console.log("[Telegram] Unlimited plan — skip limit decrement", { chatId, isBiz });
    } else {
      try {
        await db.decrementTelegramMessageLimit(user.id, isBiz);
        console.log("Successfully decremented limit for chat:", chatId, "isBiz:", isBiz);
      } catch (err) {
        console.error("[Telegram] Failed to decrement message limit:", {
          chatId,
          userId: user.id,
          isBiz,
          advisorSlug,
          err,
        });
      }
    }

    try {
      await db.appendTelegramLlmTurnPair(user.id, advisorSlug, userText, reply);
    } catch (err) {
      console.error("[Telegram] appendTelegramLlmTurnPair failed (reply already sent):", err);
    }
  } catch (err) {
    console.error("[Telegram Webhook] Error: ", err);
    await sendLlmFailureReply(botToken, chatId);
  }
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
  advisorSlug: AdvisorSlug,
  advisorQuery: string | undefined,
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

  await handleChatMessage(chatId, text, advisorSlug, advisorQuery, botToken);
}

async function processTelegramWebhook(req: Request): Promise<void> {
  let botToken: string | undefined;
  let chatId: string | undefined;

  try {
    const update = (req.body ?? {}) as TelegramUpdate;
    const advisorQuery = extractAdvisorQuery(req);
    const advisor = parseAdvisor(req, update);
    botToken = getTelegramBotToken(advisor);

    console.log(
      "[Telegram Webhook] Advisor detected:",
      advisorQuery ?? req.query?.advisor,
      "Bot Token exists:",
      !!botToken,
      "Resolved advisor:",
      advisor,
    );

    const body = req.body as { message?: { text?: string; chat?: { id?: number } } };
    if (body?.message?.text === CONTACT_TEAM_BUTTON_TEXT) {
      await ensureTelegramSchema();
      chatId =
        body.message.chat?.id != null ? String(body.message.chat.id) : undefined;
      if (botToken && chatId) {
        await sendTelegramMessage(botToken, chatId, CONTACT_TEAM_REPLY_MSG);
      } else if (!botToken) {
        console.error(
          `[Telegram] No bot token for ${advisor}. Set TELEGRAM_BIZPILOT_TOKEN / TELEGRAM_BOT_TOKEN_BIZ or TELEGRAM_FOUNDERPILOT_TOKEN / TELEGRAM_BOT_TOKEN_FOUNDER.`,
        );
      }
      return;
    }

    await ensureTelegramSchema();

    if (!botToken) {
      console.error(
        `[Telegram] No bot token for ${advisor}. Set TELEGRAM_BIZPILOT_TOKEN / TELEGRAM_BOT_TOKEN_BIZ or TELEGRAM_FOUNDERPILOT_TOKEN / TELEGRAM_BOT_TOKEN_FOUNDER.`,
      );
      return;
    }

    chatId = extractChatId(update);
    await processUpdate(update, advisor, advisorQuery, botToken);
  } catch (err) {
    console.error("[Telegram Webhook] Error: ", err);
    if (botToken && chatId) {
      try {
        await sendLlmFailureReply(botToken, chatId);
      } catch (sendErr) {
        console.error("[Telegram Webhook] Error: ", sendErr);
      }
    }
  }
}

export function registerTelegramRoutes(app: Express): void {
  const webhookHandler = (req: Request, res: Response): void => {
    console.log("Received Telegram message:", req.body);

    // Ack Telegram immediately — LLM processing continues in the background.
    res.status(200).send("OK");

    void processTelegramWebhook(req).catch((err) => {
      console.error("[Telegram Webhook] Background processing error:", err);
    });
  };

  app.post(TELEGRAM_WEBHOOK_PATH, webhookHandler);
  app.post(`${TELEGRAM_WEBHOOK_PATH}/`, webhookHandler);
}

export function getTelegramBizBotUsername(): string {
  return resolveTelegramBizBotUsername(process.env);
}

export function getTelegramFounderBotUsername(): string | null {
  return resolveTelegramFounderBotUsername(process.env);
}

export function buildTelegramActivationLink(
  token: string,
  botUsername?: string,
  planType?: TelegramActivationPlanType | string,
): string {
  const username = resolveActivationBotUsername(planType, botUsername);
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
    body: JSON.stringify({
      url: webhookUrl,
      drop_pending_updates: true,
      /** Per-bot routing when query params are stripped by a proxy or rewrite. */
      secret_token: advisor,
    }),
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
  planType: TelegramActivationPlanType = "bizpilot",
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
  const activationLink = buildTelegramActivationLink(token, botUsername, planType);
  const founderBot = getTelegramFounderBotUsername();
  const bizBot = getTelegramBizBotUsername();
  return {
    token: row.token,
    userId: row.userId,
    activationLink,
    deepLinkBiz: buildTelegramActivationLink(token, bizBot, "bizpilot"),
    deepLinkFounder: founderBot
      ? buildTelegramActivationLink(token, founderBot, "founderpilot")
      : null,
  };
}
