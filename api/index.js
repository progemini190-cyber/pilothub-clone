var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/const.ts
var COOKIE_NAME, ONE_YEAR_MS, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG;
var init_const = __esm({
  "shared/const.ts"() {
    "use strict";
    COOKIE_NAME = "app_session_id";
    ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
    UNAUTHED_ERR_MSG = "Please login (10001)";
    NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
  }
});

// shared/telegramPlans.ts
function addTelegramPlanMonths(from = /* @__PURE__ */ new Date(), months = 1) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}
function coerceTelegramLimit(value) {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}
function isUnlimitedTelegramLimit(limit) {
  return coerceTelegramLimit(limit) > TELEGRAM_UNLIMITED_THRESHOLD;
}
function hasUsedTelegramStarter(flag) {
  return flag === "true" || flag === true;
}
function isStarterTelegramLimit(limit) {
  const n = coerceTelegramLimit(limit);
  return n > 0 && n <= TELEGRAM_UNLIMITED_THRESHOLD;
}
function parseTelegramPlanTier(value) {
  const v = (value ?? "").toLowerCase().trim();
  if (v === "unlimited" || v === "unlimited_1_month" || v === "pro" || v === "unlimited (1 month)") {
    return "unlimited";
  }
  return "starter";
}
var TELEGRAM_STARTER_MESSAGE_LIMIT, TELEGRAM_UNLIMITED_MESSAGE_LIMIT, TELEGRAM_UNLIMITED_THRESHOLD, TELEGRAM_STARTER_ALREADY_USED_BIZ, TELEGRAM_STARTER_ALREADY_USED_FOUNDER;
var init_telegramPlans = __esm({
  "shared/telegramPlans.ts"() {
    "use strict";
    TELEGRAM_STARTER_MESSAGE_LIMIT = 20;
    TELEGRAM_UNLIMITED_MESSAGE_LIMIT = 999999;
    TELEGRAM_UNLIMITED_THRESHOLD = 5e5;
    TELEGRAM_STARTER_ALREADY_USED_BIZ = "\u1012\u102E\u1021\u1000\u1031\u102C\u1004\u1037\u103A\u101E\u100A\u103A Starter Plan (\u1021\u1000\u103C\u1031\u102C\u1004\u103A\u1038 \u1042\u1040) \u101D\u101A\u103A\u101A\u1030\u1015\u103C\u102E\u1038\u101E\u102C\u1038\u1016\u103C\u1005\u103A\u104D Unlimited Plan \u101E\u102C \u101D\u101A\u103A\u101A\u1030\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1010\u1031\u102C\u1037\u1019\u100A\u103A\u104B";
    TELEGRAM_STARTER_ALREADY_USED_FOUNDER = "\u1012\u102E\u1021\u1000\u1031\u102C\u1004\u1037\u103A\u101E\u100A\u103A Founder Starter Plan (\u1021\u1000\u103C\u1031\u102C\u1004\u103A\u1038 \u1042\u1040) \u101D\u101A\u103A\u101A\u1030\u1015\u103C\u102E\u1038\u101E\u102C\u1038\u1016\u103C\u1005\u103A\u104D Unlimited Plan \u101E\u102C \u101D\u101A\u103A\u101A\u1030\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1010\u1031\u102C\u1037\u1019\u100A\u103A\u104B";
  }
});

// shared/plans.ts
function getPlanDisplayName(planKey) {
  if (!planKey) return "No Plan";
  const key = planKey.toLowerCase().trim();
  return PLAN_DISPLAY_NAMES[key] ?? planKey;
}
function parsePlanKey(planKey) {
  const p = (planKey ?? "").toLowerCase().trim();
  if (!p || p === "free") return { advisor: null, tier: "free" };
  if (p.includes("founder")) {
    if (p.includes("starter")) return { advisor: "founderpilot", tier: "starter" };
    return { advisor: "founderpilot", tier: "pro" };
  }
  if (p.includes("biz")) {
    if (p.includes("starter")) return { advisor: "bizpilot", tier: "starter" };
    return { advisor: "bizpilot", tier: "pro" };
  }
  return { advisor: null, tier: "free" };
}
function hasAnyActivePaidPlan(plan, status) {
  const st = (status ?? "active").toLowerCase().trim();
  if (st !== "active") return false;
  return parsePlanKey(plan).tier !== "free";
}
function isProTierPlan(planKey) {
  return parsePlanKey(planKey).tier === "pro";
}
var PLAN_DISPLAY_NAMES;
var init_plans = __esm({
  "shared/plans.ts"() {
    "use strict";
    PLAN_DISPLAY_NAMES = {
      "": "No Plan",
      free: "Free Trial",
      bizpilot: "BizPilot Pro",
      "bizpilot-starter": "BizPilot Starter",
      "bizpilot-pro": "BizPilot Pro",
      founderpilot: "FounderPilot Pro",
      "founderpilot-starter": "FounderPilot Starter",
      "founderpilot-pro": "FounderPilot Pro"
    };
  }
});

// server/_core/aiKeys.ts
function resolveOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() || process.env.BUILT_IN_FORGE_API_KEY?.trim() || "";
}
function assertOpenAiApiKeyConfigured() {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    console.error("CRITICAL: OPENAI_API_KEY is undefined at runtime!");
    throw new Error("Server configuration error: Missing AI Key.");
  }
  return apiKey;
}
var init_aiKeys = __esm({
  "server/_core/aiKeys.ts"() {
    "use strict";
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    init_aiKeys();
    ENV = {
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
      telegramBizBotToken: process.env.TELEGRAM_BOT_TOKEN_BIZ ?? process.env.TELEGRAM_BIZPILOT_TOKEN ?? process.env.TELEGRAM_BIZ_BOT_TOKEN ?? "",
      telegramFounderBotToken: process.env.TELEGRAM_BOT_TOKEN_FOUNDER ?? process.env.TELEGRAM_FOUNDERPILOT_TOKEN ?? process.env.TELEGRAM_FOUNDER_BOT_TOKEN ?? "",
      /** BizPilot @username without @ — used in t.me activation links. */
      telegramBizBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? process.env.VITE_TELEGRAM_BOT_USERNAME ?? process.env.TELEGRAM_BIZPILOT_BOT_USERNAME ?? process.env.TELEGRAM_BIZ_BOT_USERNAME ?? process.env.TELEGRAM_BOT_USERNAME ?? ""
    };
  }
});

// server/_core/adminAccess.ts
function getAdminEmails() {
  const fromEnv = (process.env.ADMIN_EMAIL ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return [.../* @__PURE__ */ new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv])];
}
function isAdminEmail(email) {
  if (!email) return false;
  return getAdminEmails().includes(normalizeEmail(email));
}
function shouldGrantAdminRole(input) {
  if (input.email && isAdminEmail(input.email)) return true;
  if (input.ownerGoogleSub && input.googleSub && input.googleSub === input.ownerGoogleSub) {
    return true;
  }
  return false;
}
var DEFAULT_ADMIN_EMAILS;
var init_adminAccess = __esm({
  "server/_core/adminAccess.ts"() {
    "use strict";
    init_db();
    DEFAULT_ADMIN_EMAILS = ["progemini190@gmail.com"];
  }
});

// server/_core/userStatus.ts
var userStatus_exports = {};
__export(userStatus_exports, {
  isApprovedUserStatus: () => isApprovedUserStatus,
  isPendingUserStatus: () => isPendingUserStatus,
  isUserApproved: () => isUserApproved,
  normalizeUserStatus: () => normalizeUserStatus,
  pickCanonicalUser: () => pickCanonicalUser
});
function normalizeUserStatus(status) {
  return (status ?? "").trim();
}
function isApprovedUserStatus(status) {
  const s = normalizeUserStatus(status);
  if (!s) return false;
  if (APPROVED_USER_STATUSES.has(s)) return true;
  return s.toLowerCase() === "approved" || s.toLowerCase() === "active";
}
function isPendingUserStatus(status) {
  const s = normalizeUserStatus(status).toLowerCase();
  return s === "pending" || s === "PENDING".toLowerCase();
}
function isUserApproved(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isApprovedUserStatus(user.status);
}
function pickCanonicalUser(candidates, googleSub) {
  if (candidates.length === 0) return void 0;
  const unique = [...new Map(candidates.map((u) => [u.id, u])).values()];
  const approved = unique.filter((u) => isUserApproved(u));
  const pool = approved.length > 0 ? approved : unique;
  const score = (u) => {
    let s = 0;
    if (isUserApproved(u)) s += 100;
    if (u.openId === googleSub) s += 50;
    if (u.openId.startsWith("app_") || u.openId.startsWith("ext_")) s += 30;
    if (u.role === "admin") s += 20;
    if (u.loginMethod === "google") s += 5;
    if (isPendingUserStatus(u.status) && u.loginMethod === "google") s -= 40;
    return s;
  };
  return [...pool].sort((a, b) => score(b) - score(a) || a.id - b.id)[0];
}
var APPROVED_USER_STATUSES;
var init_userStatus = __esm({
  "server/_core/userStatus.ts"() {
    "use strict";
    APPROVED_USER_STATUSES = /* @__PURE__ */ new Set([
      "active",
      "approved",
      "APPROVED",
      "Active",
      "Approved"
    ]);
  }
});

// drizzle/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
var users, conversations, messages, systemPrompts, aiModels, apiKeys, payments, systemSettings, applications, externalApiTokens, announcements, botActivationTokens, telegramLlmTurns;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = sqliteTable("users", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      openId: text("openId", { length: 255 }).notNull().unique(),
      name: text("name"),
      email: text("email", { length: 320 }),
      businessName: text("businessName"),
      businessType: text("businessType", { length: 128 }),
      useCase: text("useCase"),
      phone: text("phone", { length: 20 }),
      loginMethod: text("loginMethod", { length: 64 }),
      role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
      plan: text("plan", { length: 64 }).default("free"),
      status: text("status", { length: 64 }).default("active"),
      subscriptionStart: integer("subscriptionStart", { mode: "timestamp_ms" }),
      subscriptionEnd: integer("subscriptionEnd", { mode: "timestamp_ms" }),
      notes: text("notes"),
      freeBizCount: integer("freeBizCount").default(5).notNull(),
      freeFounderCount: integer("freeFounderCount").default(5).notNull(),
      planTypeBiz: text("planTypeBiz", { enum: ["free", "starter", "pro"] }).notNull().default("free"),
      planTypeFounder: text("planTypeFounder", { enum: ["free", "starter", "pro"] }).notNull().default("free"),
      bizMessageLimit: integer("bizMessageLimit").default(3).notNull(),
      founderMessageLimit: integer("founderMessageLimit").default(3).notNull(),
      bizMessagesUsed: integer("bizMessagesUsed").default(0).notNull(),
      founderMessagesUsed: integer("founderMessagesUsed").default(0).notNull(),
      hasUsedBizStarter: text("hasUsedBizStarter", { enum: ["true", "false"] }).notNull().default("false"),
      hasUsedFounderStarter: text("hasUsedFounderStarter", { enum: ["true", "false"] }).notNull().default("false"),
      telegramChatId: text("telegramChatId", { length: 64 }),
      planExpiryDate: integer("planExpiryDate", { mode: "timestamp_ms" }),
      passwordHash: text("passwordHash"),
      onboardingCompletedAt: integer("onboardingCompletedAt", { mode: "timestamp_ms" }),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date()),
      lastSignedIn: integer("lastSignedIn", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    conversations = sqliteTable("conversations", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: integer("userId").notNull(),
      modelSlug: text("modelSlug", { length: 64 }).notNull(),
      title: text("title"),
      summary: text("summary"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date())
    });
    messages = sqliteTable("messages", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      conversationId: integer("conversationId").notNull(),
      role: text("role", { length: 64 }).notNull(),
      content: text("content").notNull(),
      /** Optional base64 / data-URL image attachment for multimodal chat */
      imageData: text("imageData"),
      tokenCount: integer("tokenCount"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    systemPrompts = sqliteTable("systemPrompts", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      modelSlug: text("modelSlug", { length: 64 }).notNull(),
      content: text("content").notNull(),
      version: integer("version").default(1).notNull(),
      isActive: text("isActive", { enum: ["true", "false"] }).default("false"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date())
    });
    aiModels = sqliteTable("aiModels", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      targetRole: text("targetRole", { length: 64 }).notNull().unique(),
      modelString: text("modelString").notNull(),
      isActive: text("isActive", { enum: ["true", "false"] }).default("true"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date())
    });
    apiKeys = sqliteTable("apiKeys", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      provider: text("provider", { length: 64 }).notNull(),
      keyValue: text("keyValue").notNull(),
      isActive: text("isActive", { enum: ["true", "false"] }).default("false"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date())
    });
    payments = sqliteTable("payments", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: integer("userId"),
      userName: text("userName"),
      userEmail: text("userEmail", { length: 320 }),
      plan: text("plan", { length: 64 }).notNull(),
      amount: integer("amount").notNull(),
      currency: text("currency", { length: 10 }).default("MMK").notNull(),
      status: text("status", { enum: ["pending", "confirmed", "rejected"] }).default("pending").notNull(),
      paymentMethod: text("paymentMethod", { length: 64 }),
      transactionRef: text("transactionRef", { length: 255 }),
      screenshotUrl: text("screenshotUrl"),
      notes: text("notes"),
      source: text("source", { length: 32 }).default("website"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date())
    });
    systemSettings = sqliteTable("systemSettings", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      key: text("key", { length: 128 }).notNull().unique(),
      value: text("value"),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date())
    });
    applications = sqliteTable("applications", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      fullName: text("fullName").notNull(),
      email: text("email", { length: 320 }).notNull(),
      phone: text("phone", { length: 20 }),
      businessName: text("businessName"),
      businessType: text("businessType", { length: 128 }),
      useCase: text("useCase"),
      plan: text("plan", { length: 64 }).default("free"),
      status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
      source: text("source", { length: 32 }).default("website"),
      userId: integer("userId"),
      notes: text("notes"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date())
    });
    externalApiTokens = sqliteTable("externalApiTokens", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name", { length: 128 }).notNull(),
      token: text("token", { length: 256 }).notNull().unique(),
      isActive: text("isActive", { enum: ["true", "false"] }).default("true"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    announcements = sqliteTable("announcements", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      title: text("title", { length: 256 }).notNull(),
      content: text("content").notNull(),
      type: text("type", { enum: ["info", "success", "warning", "urgent"] }).default("info").notNull(),
      isActive: text("isActive", { enum: ["true", "false"] }).default("true").notNull(),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdate(() => /* @__PURE__ */ new Date())
    });
    botActivationTokens = sqliteTable("bot_activation_tokens", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      token: text("token", { length: 64 }).notNull().unique(),
      userId: integer("userId").notNull(),
      isUsed: text("isUsed", { enum: ["true", "false"] }).notNull().default("false"),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    telegramLlmTurns = sqliteTable("telegram_llm_turns", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: integer("userId").notNull(),
      advisor: text("advisor", { length: 32 }).notNull(),
      role: text("role", { length: 16 }).notNull(),
      content: text("content").notNull(),
      createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
  }
});

// drizzle/schema.mysql.ts
var schema_mysql_exports = {};
__export(schema_mysql_exports, {
  aiModels: () => aiModels2,
  announcements: () => announcements2,
  apiKeys: () => apiKeys2,
  applications: () => applications2,
  botActivationTokens: () => botActivationTokens2,
  conversations: () => conversations2,
  externalApiTokens: () => externalApiTokens2,
  messages: () => messages2,
  payments: () => payments2,
  systemPrompts: () => systemPrompts2,
  systemSettings: () => systemSettings2,
  telegramLlmTurns: () => telegramLlmTurns2,
  users: () => users2
});
import {
  mysqlTable,
  varchar,
  text as text2,
  int,
  timestamp,
  mysqlEnum
} from "drizzle-orm/mysql-core";
var users2, payments2, apiKeys2, systemPrompts2, applications2, aiModels2, systemSettings2, conversations2, messages2, externalApiTokens2, announcements2, botActivationTokens2, telegramLlmTurns2;
var init_schema_mysql = __esm({
  "drizzle/schema.mysql.ts"() {
    "use strict";
    users2 = mysqlTable("users", {
      id: int("id").primaryKey().autoincrement(),
      openId: varchar("openId", { length: 255 }).notNull().unique(),
      name: text2("name"),
      email: varchar("email", { length: 320 }),
      businessName: text2("businessName"),
      businessType: varchar("businessType", { length: 128 }),
      useCase: text2("useCase"),
      phone: varchar("phone", { length: 20 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).notNull().default("user"),
      plan: varchar("plan", { length: 64 }).default("free"),
      status: varchar("status", { length: 64 }).default("active"),
      subscriptionStart: timestamp("subscriptionStart"),
      subscriptionEnd: timestamp("subscriptionEnd"),
      notes: text2("notes"),
      freeBizCount: int("freeBizCount").default(5).notNull(),
      freeFounderCount: int("freeFounderCount").default(5).notNull(),
      planTypeBiz: mysqlEnum("planTypeBiz", ["free", "starter", "pro"]).notNull().default("free"),
      planTypeFounder: mysqlEnum("planTypeFounder", ["free", "starter", "pro"]).notNull().default("free"),
      bizMessageLimit: int("bizMessageLimit").default(3).notNull(),
      founderMessageLimit: int("founderMessageLimit").default(3).notNull(),
      bizMessagesUsed: int("bizMessagesUsed").default(0).notNull(),
      founderMessagesUsed: int("founderMessagesUsed").default(0).notNull(),
      hasUsedBizStarter: mysqlEnum("hasUsedBizStarter", ["true", "false"]).notNull().default("false"),
      hasUsedFounderStarter: mysqlEnum("hasUsedFounderStarter", ["true", "false"]).notNull().default("false"),
      telegramChatId: varchar("telegramChatId", { length: 64 }),
      planExpiryDate: timestamp("planExpiryDate"),
      passwordHash: text2("passwordHash"),
      onboardingCompletedAt: timestamp("onboardingCompletedAt"),
      createdAt: timestamp("createdAt").notNull().defaultNow(),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
      lastSignedIn: timestamp("lastSignedIn").notNull().defaultNow()
    });
    payments2 = mysqlTable("payments", {
      id: int("id").primaryKey().autoincrement(),
      userId: int("userId"),
      userName: text2("userName"),
      userEmail: varchar("userEmail", { length: 320 }),
      plan: varchar("plan", { length: 64 }).notNull(),
      amount: int("amount").notNull(),
      currency: varchar("currency", { length: 10 }).default("MMK").notNull(),
      status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
      paymentMethod: varchar("paymentMethod", { length: 64 }),
      transactionRef: varchar("transactionRef", { length: 255 }),
      screenshotUrl: text2("screenshotUrl"),
      notes: text2("notes"),
      source: varchar("source", { length: 32 }).default("website"),
      createdAt: timestamp("createdAt").notNull().defaultNow(),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow()
    });
    apiKeys2 = mysqlTable("apiKeys", {
      id: int("id").primaryKey().autoincrement(),
      provider: varchar("provider", { length: 64 }).notNull(),
      keyValue: text2("keyValue").notNull(),
      isActive: mysqlEnum("isActive", ["true", "false"]).default("false"),
      createdAt: timestamp("createdAt").notNull().defaultNow(),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow()
    });
    systemPrompts2 = mysqlTable("systemPrompts", {
      id: int("id").primaryKey().autoincrement(),
      name: text2("name").notNull(),
      modelSlug: varchar("modelSlug", { length: 64 }).notNull(),
      content: text2("content").notNull(),
      version: int("version").default(1).notNull(),
      isActive: mysqlEnum("isActive", ["true", "false"]).default("false"),
      createdAt: timestamp("createdAt").notNull().defaultNow(),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow()
    });
    applications2 = mysqlTable("applications", {
      id: int("id").primaryKey().autoincrement(),
      fullName: text2("fullName").notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      phone: varchar("phone", { length: 20 }),
      businessName: text2("businessName"),
      businessType: varchar("businessType", { length: 128 }),
      useCase: text2("useCase"),
      plan: varchar("plan", { length: 64 }).default("free"),
      status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
      source: varchar("source", { length: 32 }).default("website"),
      userId: int("userId"),
      notes: text2("notes"),
      createdAt: timestamp("createdAt").notNull().defaultNow(),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow()
    });
    aiModels2 = mysqlTable("aiModels", {
      id: int("id").primaryKey().autoincrement(),
      targetRole: varchar("targetRole", { length: 64 }).notNull().unique(),
      modelString: text2("modelString").notNull(),
      isActive: mysqlEnum("isActive", ["true", "false"]).default("true"),
      createdAt: timestamp("createdAt").notNull().defaultNow(),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow()
    });
    systemSettings2 = mysqlTable("systemSettings", {
      id: int("id").primaryKey().autoincrement(),
      key: varchar("key", { length: 128 }).notNull().unique(),
      value: text2("value"),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow()
    });
    conversations2 = mysqlTable("conversations", {
      id: int("id").primaryKey().autoincrement(),
      userId: int("userId").notNull(),
      modelSlug: varchar("modelSlug", { length: 64 }).notNull(),
      title: text2("title"),
      summary: text2("summary"),
      createdAt: timestamp("createdAt").notNull().defaultNow(),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow()
    });
    messages2 = mysqlTable("messages", {
      id: int("id").primaryKey().autoincrement(),
      conversationId: int("conversationId").notNull(),
      role: varchar("role", { length: 64 }).notNull(),
      content: text2("content").notNull(),
      imageData: text2("imageData"),
      tokenCount: int("tokenCount"),
      createdAt: timestamp("createdAt").notNull().defaultNow()
    });
    externalApiTokens2 = mysqlTable("externalApiTokens", {
      id: int("id").primaryKey().autoincrement(),
      name: varchar("name", { length: 128 }).notNull(),
      token: varchar("token", { length: 256 }).notNull().unique(),
      isActive: mysqlEnum("isActive", ["true", "false"]).default("true"),
      createdAt: timestamp("createdAt").notNull().defaultNow()
    });
    announcements2 = mysqlTable("announcements", {
      id: int("id").primaryKey().autoincrement(),
      title: varchar("title", { length: 256 }).notNull(),
      content: text2("content").notNull(),
      type: mysqlEnum("type", ["info", "success", "warning", "urgent"]).default("info").notNull(),
      isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
      createdAt: timestamp("createdAt").notNull().defaultNow(),
      updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow()
    });
    botActivationTokens2 = mysqlTable("bot_activation_tokens", {
      id: int("id").primaryKey().autoincrement(),
      token: varchar("token", { length: 64 }).notNull().unique(),
      userId: int("userId").notNull(),
      isUsed: mysqlEnum("isUsed", ["true", "false"]).notNull().default("false"),
      createdAt: timestamp("createdAt").notNull().defaultNow()
    });
    telegramLlmTurns2 = mysqlTable("telegram_llm_turns", {
      id: int("id").primaryKey().autoincrement(),
      userId: int("userId").notNull(),
      advisor: varchar("advisor", { length: 32 }).notNull(),
      role: varchar("role", { length: 16 }).notNull(),
      content: text2("content").notNull(),
      createdAt: timestamp("createdAt").notNull().defaultNow()
    });
  }
});

// server/db/ensureTelegramSchema.ts
var ensureTelegramSchema_exports = {};
__export(ensureTelegramSchema_exports, {
  ensureTelegramSchema: () => ensureTelegramSchema,
  resetTelegramSchemaCache: () => resetTelegramSchemaCache
});
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
function resetTelegramSchemaCache() {
  _ready = false;
}
function isBenignMigrationError(err) {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes("duplicate column") || msg.includes("already exists") || msg.includes("duplicate key name");
}
async function runTurso(statement) {
  const config = resolveTursoConfig();
  if (!config) return;
  const client = createClient({
    url: config.url,
    authToken: config.authToken
  });
  try {
    await client.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}
async function runMysql(statement) {
  const pool = getMysqlPool();
  if (!pool) return;
  try {
    await pool.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}
async function runDrizzle(statement) {
  const db = await getDb();
  if (!db) return;
  const query = sql.raw(statement);
  const d = db;
  try {
    if (typeof d.execute === "function") {
      await d.execute(query);
    } else if (typeof d.run === "function") {
      await d.run(query);
    }
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}
async function runStatement(statement) {
  const provider = getDatabaseProvider();
  if (provider === "mysql") {
    await runMysql(statement);
  } else if (resolveTursoConfig()) {
    await runTurso(statement);
  } else {
    await runDrizzle(statement);
  }
}
async function ensureTelegramLlmTurnsTable() {
  const provider = getDatabaseProvider();
  if (provider === "mysql") {
    await runStatement(
      `CREATE TABLE IF NOT EXISTS \`telegram_llm_turns\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`userId\` int NOT NULL,
        \`advisor\` varchar(32) NOT NULL,
        \`role\` varchar(16) NOT NULL,
        \`content\` text NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY \`telegram_llm_turns_user_advisor_created\` (\`userId\`, \`advisor\`, \`createdAt\`)
      )`
    );
    return;
  }
  await runStatement(
    `CREATE TABLE IF NOT EXISTS \`telegram_llm_turns\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` integer NOT NULL,
      \`advisor\` text NOT NULL,
      \`role\` text NOT NULL,
      \`content\` text NOT NULL,
      \`createdAt\` integer NOT NULL
    )`
  );
  await runStatement(
    "CREATE INDEX IF NOT EXISTS `telegram_llm_turns_user_advisor_created_idx` ON `telegram_llm_turns` (`userId`, `advisor`, `createdAt`)"
  );
}
async function ensureTelegramSchema() {
  if (!_ready) {
    const provider = getDatabaseProvider();
    if (provider === "mysql") {
      await runStatement("ALTER TABLE `users` ADD COLUMN `telegramChatId` varchar(64)");
      await runStatement("ALTER TABLE `users` ADD COLUMN `planExpiryDate` timestamp NULL");
      await runStatement(
        `CREATE TABLE IF NOT EXISTS \`bot_activation_tokens\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`token\` varchar(64) NOT NULL UNIQUE,
        \`userId\` int NOT NULL,
        \`isUsed\` enum('true','false') NOT NULL DEFAULT 'false',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
      );
    } else {
      await runStatement("ALTER TABLE `users` ADD COLUMN `telegramChatId` text");
      await runStatement("ALTER TABLE `users` ADD COLUMN `planExpiryDate` integer");
      await runStatement(
        `CREATE TABLE IF NOT EXISTS \`bot_activation_tokens\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        \`token\` text NOT NULL,
        \`userId\` integer NOT NULL,
        \`isUsed\` text DEFAULT 'false' NOT NULL,
        \`createdAt\` integer NOT NULL
      )`
      );
      await runStatement(
        "CREATE UNIQUE INDEX IF NOT EXISTS `bot_activation_tokens_token_unique` ON `bot_activation_tokens` (`token`)"
      );
    }
    _ready = true;
    console.info("[Database] Telegram schema synced", { provider: provider ?? "turso" });
  }
  await ensureTelegramLlmTurnsTable();
}
var _ready;
var init_ensureTelegramSchema = __esm({
  "server/db/ensureTelegramSchema.ts"() {
    "use strict";
    init_connection();
    _ready = false;
  }
});

// server/db/ensureAuthSchema.ts
var ensureAuthSchema_exports = {};
__export(ensureAuthSchema_exports, {
  ensureAuthSchema: () => ensureAuthSchema,
  resetAuthSchemaCache: () => resetAuthSchemaCache
});
import { eq, sql as sql2 } from "drizzle-orm";
function isBenignMigrationError2(err) {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes("duplicate column") || msg.includes("already exists") || msg.includes("duplicate key name");
}
async function runTurso2(statement) {
  const { createClient: createClient4 } = await import("@libsql/client");
  const config = resolveTursoConfig();
  if (!config) return;
  const client = createClient4({ url: config.url, authToken: config.authToken });
  try {
    await client.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError2(err)) throw err;
  }
}
async function runMysql2(statement) {
  const pool = getMysqlPool();
  if (!pool) return;
  try {
    await pool.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError2(err)) throw err;
  }
}
async function runDrizzle2(statement) {
  const db = await getDb();
  if (!db) return;
  const query = sql2.raw(statement);
  const d = db;
  try {
    if (typeof d.execute === "function") await d.execute(query);
    else if (typeof d.run === "function") await d.run(query);
  } catch (err) {
    if (!isBenignMigrationError2(err)) throw err;
  }
}
async function runStatement2(statement) {
  const provider = getDatabaseProvider();
  if (provider === "mysql") await runMysql2(statement);
  else if (resolveTursoConfig()) await runTurso2(statement);
  else await runDrizzle2(statement);
}
async function ensureAuthColumns() {
  if (_columnsReady) return;
  const provider = getDatabaseProvider();
  if (provider === "mysql") {
    await runStatement2("ALTER TABLE `users` ADD COLUMN `passwordHash` text");
    await runStatement2("ALTER TABLE `users` ADD COLUMN `onboardingCompletedAt` timestamp NULL");
  } else {
    await runStatement2("ALTER TABLE `users` ADD COLUMN `passwordHash` text");
    await runStatement2("ALTER TABLE `users` ADD COLUMN `onboardingCompletedAt` integer");
  }
  _columnsReady = true;
  console.info("[Database] Auth columns synced", { provider: provider ?? "turso" });
}
async function migrateLegacyUsersToActive() {
  if (_migrationDone) return;
  const db = await getDb();
  if (!db) return;
  const allUsers = await db.select().from(users3);
  const now = /* @__PURE__ */ new Date();
  let updated = 0;
  for (const user of allUsers) {
    const patch = {};
    const status = user.status ?? "";
    if (isPendingUserStatus(status) || !isApprovedUserStatus(status)) {
      patch.status = "active";
    }
    const hasName = Boolean((user.name ?? "").trim());
    const hasPurpose = Boolean((user.useCase ?? "").trim());
    const completedAt = user.onboardingCompletedAt;
    if (hasName && hasPurpose && !completedAt) {
      patch.onboardingCompletedAt = now;
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users3).set(patch).where(eq(users3.id, user.id));
      updated++;
    }
  }
  _migrationDone = true;
  if (updated > 0) {
    console.info("[Database] Legacy user migration", { usersPatched: updated });
  }
}
async function ensureAuthSchema() {
  await ensureAuthColumns();
  await migrateLegacyUsersToActive();
}
function resetAuthSchemaCache() {
  _columnsReady = false;
  _migrationDone = false;
}
var _columnsReady, _migrationDone;
var init_ensureAuthSchema = __esm({
  "server/db/ensureAuthSchema.ts"() {
    "use strict";
    init_connection();
    init_userStatus();
    _columnsReady = false;
    _migrationDone = false;
  }
});

// server/db/ensureChatSchema.ts
var ensureChatSchema_exports = {};
__export(ensureChatSchema_exports, {
  ensureChatSchema: () => ensureChatSchema
});
import { createClient as createClient2 } from "@libsql/client";
function isBenignMigrationError3(err) {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes("duplicate column") || msg.includes("already exists") || msg.includes("duplicate key name");
}
async function runTurso3(statement) {
  const config = resolveTursoConfig();
  if (!config) return;
  const client = createClient2({ url: config.url, authToken: config.authToken });
  try {
    await client.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError3(err)) throw err;
  }
}
async function runMysql3(statement) {
  const pool = getMysqlPool();
  if (!pool) return;
  try {
    await pool.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError3(err)) throw err;
  }
}
async function runDrizzle3(statement) {
  const db = await getDb();
  if (!db) return;
  try {
    const d = db;
    if (typeof d.run === "function") await d.run(statement);
    else if (typeof d.execute === "function") await d.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError3(err)) throw err;
  }
}
async function runStatement3(statement) {
  const provider = getDatabaseProvider();
  if (provider === "turso") await runTurso3(statement);
  else if (provider === "mysql") await runMysql3(statement);
  else await runDrizzle3(statement);
}
async function ensureChatSchema() {
  if (_ready2) return;
  const provider = getDatabaseProvider();
  if (provider === "mysql") {
    await runStatement3("ALTER TABLE `messages` ADD COLUMN `imageData` text NULL");
  } else {
    await runStatement3("ALTER TABLE `messages` ADD COLUMN `imageData` text");
  }
  _ready2 = true;
}
var _ready2;
var init_ensureChatSchema = __esm({
  "server/db/ensureChatSchema.ts"() {
    "use strict";
    init_connection();
    _ready2 = false;
  }
});

// server/db/connection.ts
import { createClient as createClient3 } from "@libsql/client";
import { sql as sql3 } from "drizzle-orm";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
function applySchema(provider) {
  if (provider === "mysql") {
    users3 = users2;
    payments3 = payments2;
    apiKeys3 = apiKeys2;
    systemPrompts3 = systemPrompts2;
    applications3 = applications2;
    aiModels3 = aiModels2;
    systemSettings3 = systemSettings2;
    conversations3 = conversations2;
    messages3 = messages2;
    externalApiTokens3 = externalApiTokens2;
    announcements3 = announcements2;
    botActivationTokens3 = botActivationTokens2;
    telegramLlmTurns3 = telegramLlmTurns2;
  } else {
    users3 = users;
    payments3 = payments;
    apiKeys3 = apiKeys;
    systemPrompts3 = systemPrompts;
    applications3 = applications;
    aiModels3 = aiModels;
    systemSettings3 = systemSettings;
    conversations3 = conversations;
    messages3 = messages;
    externalApiTokens3 = externalApiTokens;
    announcements3 = announcements;
    botActivationTokens3 = botActivationTokens;
    telegramLlmTurns3 = telegramLlmTurns;
  }
}
function resolveMysqlUrl() {
  const direct = [
    process.env.MYSQL_URL,
    process.env.LEGACY_MYSQL_URL,
    process.env.TIDB_DATABASE_URL
  ].map((v) => v?.trim()).find((v) => v && (v.startsWith("mysql://") || v.startsWith("mysql2://")));
  if (direct) return direct;
  const host = process.env.TIDB_HOST ?? process.env.MYSQL_HOST;
  const user = process.env.TIDB_USER ?? process.env.MYSQL_USER;
  const password = process.env.TIDB_PASSWORD ?? process.env.MYSQL_PASSWORD;
  const database = process.env.TIDB_DATABASE ?? process.env.MYSQL_DATABASE;
  const port = process.env.TIDB_PORT ?? process.env.MYSQL_PORT ?? "4000";
  if (host && user && password && database) {
    const encUser = encodeURIComponent(user);
    const encPass = encodeURIComponent(password);
    return `mysql://${encUser}:${encPass}@${host}:${port}/${database}?ssl={"rejectUnauthorized":true}`;
  }
  return void 0;
}
function resolveTursoConfig() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (!tursoUrl) return null;
  return {
    url: tursoUrl,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim() || void 0
  };
}
function maskDatabaseUrl(url) {
  try {
    if (url.startsWith("mysql://") || url.startsWith("mysql2://")) {
      const parsed2 = new URL(url);
      const dbName2 = parsed2.pathname.replace(/^\//, "") || "(default)";
      return `mysql://${parsed2.hostname}:${parsed2.port || "3306"}/${dbName2}`;
    }
    const normalized = url.replace(/^libsql:/, "https:");
    const parsed = new URL(normalized);
    const dbName = parsed.pathname.replace(/^\//, "") || "(default)";
    return `${parsed.hostname}/${dbName}`;
  } catch {
    if (url.startsWith("file:")) return "file:***";
    return url.slice(0, 48);
  }
}
function tokenFingerprint(token) {
  if (!token) return "missing";
  if (token.length < 12) return "set-short";
  return `set:${token.slice(0, 4)}\u2026${token.slice(-4)}`;
}
async function countUsers(database) {
  try {
    const [row] = await database.select({ count: sql3`count(*)` }).from(users3);
    return Number(row?.count ?? 0);
  } catch {
    return -1;
  }
}
async function logHealth(database, provider) {
  try {
    const [userRow] = await database.select({ count: sql3`count(*)` }).from(users3);
    const [payRow] = await database.select({ count: sql3`count(*)` }).from(payments3);
    const [keyRow] = await database.select({ count: sql3`count(*)` }).from(apiKeys3);
    const userCount = Number(userRow?.count ?? 0);
    console.info("[Database] Health check", {
      provider,
      users: userCount,
      payments: Number(payRow?.count ?? 0),
      apiKeys: Number(keyRow?.count ?? 0)
    });
    return userCount;
  } catch (err) {
    console.warn("[Database] Health check failed:", err);
    return -1;
  }
}
async function connectTurso(config) {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || ENV.isProduction;
  if (config.url.startsWith("file:") && isProd) {
    console.error("[Database] Refusing file: SQLite on Vercel/production");
    return null;
  }
  const isRemote = config.url.includes("turso.io") || config.url.startsWith("libsql://");
  if (isRemote && !config.authToken && !config.url.startsWith("file:")) {
    console.error("[Database] TURSO_AUTH_TOKEN is required", {
      target: maskDatabaseUrl(config.url)
    });
    return null;
  }
  const client = createClient3({
    url: config.url,
    authToken: config.authToken
  });
  applySchema("turso");
  return drizzleLibsql(client);
}
async function connectMysql(url) {
  try {
    _mysqlPool = mysql.createPool({
      uri: url,
      connectionLimit: 5,
      waitForConnections: true
    });
    applySchema("mysql");
    return drizzleMysql(_mysqlPool, { schema: schema_mysql_exports, mode: "default" });
  } catch (err) {
    console.error("[Database] MySQL connect failed:", err);
    return null;
  }
}
function getDatabaseProvider() {
  return _provider;
}
async function initializeDatabase() {
  if (_db) return _db;
  const forceMysql = process.env.DATABASE_PROVIDER?.toLowerCase() === "mysql";
  const mysqlUrl = resolveMysqlUrl();
  const tursoConfig = resolveTursoConfig();
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || ENV.isProduction;
  if (forceMysql && mysqlUrl) {
    const mysqlDb = await connectMysql(mysqlUrl);
    if (mysqlDb) {
      _db = mysqlDb;
      _provider = "mysql";
      if (!_initLogged) {
        console.info("[Database] Connected (forced MySQL legacy)", {
          target: maskDatabaseUrl(mysqlUrl)
        });
        await logHealth(_db, "mysql");
        _initLogged = true;
      }
      const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
      await ensureTelegramSchema2().catch(
        (err) => console.warn("[Database] Telegram schema migration skipped:", err)
      );
      const { ensureAuthSchema: ensureAuthSchema2 } = await Promise.resolve().then(() => (init_ensureAuthSchema(), ensureAuthSchema_exports));
      await ensureAuthSchema2().catch(
        (err) => console.warn("[Database] Auth schema migration skipped:", err)
      );
      const { ensureChatSchema: ensureChatSchema2 } = await Promise.resolve().then(() => (init_ensureChatSchema(), ensureChatSchema_exports));
      await ensureChatSchema2().catch(
        (err) => console.warn("[Database] Chat schema migration skipped:", err)
      );
      return _db;
    }
  }
  if (tursoConfig && !(isProd && tursoConfig.url.startsWith("file:"))) {
    try {
      const tursoDb = await connectTurso(tursoConfig);
      if (tursoDb) {
        const userCount = await countUsers(tursoDb);
        const shouldFallback = userCount === 0 && Boolean(mysqlUrl);
        if (shouldFallback) {
          console.warn(
            "[Database] Turso has 0 users \u2014 falling back to legacy MySQL (Manus/TiDB).",
            { tursoTarget: maskDatabaseUrl(tursoConfig.url) }
          );
        } else {
          _db = tursoDb;
          _provider = "turso";
          if (!_initLogged) {
            console.info("[Database] Connected", {
              provider: "turso",
              target: maskDatabaseUrl(tursoConfig.url),
              token: tokenFingerprint(tursoConfig.authToken)
            });
            await logHealth(_db, "turso");
            _initLogged = true;
          }
          const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
          await ensureTelegramSchema2().catch(
            (err) => console.warn("[Database] Telegram schema migration skipped:", err)
          );
          const { ensureAuthSchema: ensureAuthSchema2 } = await Promise.resolve().then(() => (init_ensureAuthSchema(), ensureAuthSchema_exports));
          await ensureAuthSchema2().catch(
            (err) => console.warn("[Database] Auth schema migration skipped:", err)
          );
          const { ensureChatSchema: ensureChatSchema2 } = await Promise.resolve().then(() => (init_ensureChatSchema(), ensureChatSchema_exports));
          await ensureChatSchema2().catch(
            (err) => console.warn("[Database] Chat schema migration skipped:", err)
          );
          return _db;
        }
      }
    } catch (err) {
      console.error("[Database] Turso connect failed:", err);
    }
  }
  if (mysqlUrl) {
    const mysqlDb = await connectMysql(mysqlUrl);
    if (mysqlDb) {
      _db = mysqlDb;
      _provider = "mysql";
      if (!_initLogged) {
        console.info("[Database] Connected (legacy MySQL)", {
          target: maskDatabaseUrl(mysqlUrl)
        });
        await logHealth(_db, "mysql");
        _initLogged = true;
      }
      const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
      await ensureTelegramSchema2().catch(
        (err) => console.warn("[Database] Telegram schema migration skipped:", err)
      );
      const { ensureAuthSchema: ensureAuthSchema2 } = await Promise.resolve().then(() => (init_ensureAuthSchema(), ensureAuthSchema_exports));
      await ensureAuthSchema2().catch(
        (err) => console.warn("[Database] Auth schema migration skipped:", err)
      );
      const { ensureChatSchema: ensureChatSchema2 } = await Promise.resolve().then(() => (init_ensureChatSchema(), ensureChatSchema_exports));
      await ensureChatSchema2().catch(
        (err) => console.warn("[Database] Chat schema migration skipped:", err)
      );
      return _db;
    }
  }
  if (tursoConfig) {
    try {
      const tursoDb = await connectTurso(tursoConfig);
      if (tursoDb) {
        _db = tursoDb;
        _provider = "turso";
        if (!_initLogged) {
          console.info("[Database] Connected (Turso, may be empty)", {
            target: maskDatabaseUrl(tursoConfig.url)
          });
          await logHealth(_db, "turso");
          _initLogged = true;
        }
        const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
        await ensureTelegramSchema2().catch(
          (err) => console.warn("[Database] Telegram schema migration skipped:", err)
        );
        const { ensureAuthSchema: ensureAuthSchema2 } = await Promise.resolve().then(() => (init_ensureAuthSchema(), ensureAuthSchema_exports));
        await ensureAuthSchema2().catch(
          (err) => console.warn("[Database] Auth schema migration skipped:", err)
        );
        const { ensureChatSchema: ensureChatSchema2 } = await Promise.resolve().then(() => (init_ensureChatSchema(), ensureChatSchema_exports));
        await ensureChatSchema2().catch(
          (err) => console.warn("[Database] Chat schema migration skipped:", err)
        );
        return _db;
      }
    } catch {
    }
  }
  if (!_initLogged) {
    console.error(
      "[Database] No database available. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, or MYSQL_URL for legacy TiDB."
    );
    _initLogged = true;
  }
  return null;
}
async function getDb() {
  return initializeDatabase();
}
function getMysqlPool() {
  return _mysqlPool;
}
var _db, _provider, _mysqlPool, _initLogged, users3, payments3, apiKeys3, systemPrompts3, applications3, aiModels3, systemSettings3, conversations3, messages3, externalApiTokens3, announcements3, botActivationTokens3, telegramLlmTurns3;
var init_connection = __esm({
  "server/db/connection.ts"() {
    "use strict";
    init_schema();
    init_schema_mysql();
    init_env();
    _db = null;
    _provider = null;
    _mysqlPool = null;
    _initLogged = false;
    users3 = users;
    payments3 = payments;
    apiKeys3 = apiKeys;
    systemPrompts3 = systemPrompts;
    applications3 = applications;
    aiModels3 = aiModels;
    systemSettings3 = systemSettings;
    conversations3 = conversations;
    messages3 = messages;
    externalApiTokens3 = externalApiTokens;
    announcements3 = announcements;
    botActivationTokens3 = botActivationTokens;
    telegramLlmTurns3 = telegramLlmTurns;
  }
});

// server/db.ts
import { eq as eq2, and, desc, asc, sql as sql4, or } from "drizzle-orm";
async function assertDatabase() {
  const database = await getDb();
  if (!database) {
    throw new Error(
      "Database unavailable. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, or MYSQL_URL for legacy TiDB data."
    );
  }
  return database;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (shouldGrantAdminRole({
      email: user.email,
      googleSub: user.openId,
      ownerGoogleSub: ENV.ownerGoogleSub
    })) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.status !== void 0) {
      values.status = user.status;
      updateSet.status = user.status;
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    await db.insert(users3).values(values).onConflictDoUpdate({
      target: users3.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users3).where(eq2(users3.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users3).where(eq2(users3.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
async function getUsersByEmail(email) {
  const db = await getDb();
  if (!db) return [];
  const normalized = normalizeEmail(email);
  return db.select().from(users3).where(sql4`lower(trim(${users3.email})) = ${normalized}`).orderBy(asc(users3.id));
}
async function getUserByEmail(email) {
  const matches = await getUsersByEmail(email);
  if (matches.length === 0) return void 0;
  return pickCanonicalUser(matches, "");
}
async function resolveUserForGoogleLogin(email, googleSub) {
  const { pickCanonicalUser: pickCanonicalUser2, isPendingUserStatus: isPendingUserStatus2 } = await Promise.resolve().then(() => (init_userStatus(), userStatus_exports));
  const byOpenId = await getUserByOpenId(googleSub);
  const byEmail = email ? await getUsersByEmail(email) : [];
  const candidates = [...byEmail, ...byOpenId ? [byOpenId] : []];
  let canonical = pickCanonicalUser2(candidates, googleSub);
  if (canonical && canonical.openId !== googleSub) {
    if (byOpenId && byOpenId.id !== canonical.id && isPendingUserStatus2(byOpenId.status)) {
      const database = await getDb();
      if (database) {
        await database.delete(users3).where(eq2(users3.id, byOpenId.id));
        console.info("[Database] Removed stale pending Google row", {
          removedId: byOpenId.id,
          keptId: canonical.id,
          email
        });
      }
    }
    await linkUserToGoogleOpenId(canonical.id, googleSub, { loginMethod: "google" });
    canonical = await getUserByOpenId(googleSub) ?? canonical;
  }
  return {
    user: canonical ?? byOpenId,
    byOpenId,
    byEmail
  };
}
async function linkUserToGoogleOpenId(userId, googleOpenId, fields) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conflicting = await getUserByOpenId(googleOpenId);
  if (conflicting && conflicting.id !== userId) {
    if (conflicting.status === "pending" && conflicting.loginMethod === "google") {
      await db.delete(users3).where(eq2(users3.id, conflicting.id));
    } else {
      throw new Error("This Google account is already linked to another user");
    }
  }
  const updateSet = {
    openId: googleOpenId,
    loginMethod: fields.loginMethod ?? "google",
    lastSignedIn: /* @__PURE__ */ new Date()
  };
  if (fields.name !== void 0) updateSet.name = fields.name;
  await db.update(users3).set(updateSet).where(eq2(users3.id, userId));
}
function planAppliesToAdvisor(planKey, advisor) {
  const parsed = parsePlanKey(planKey);
  if (parsed.tier === "free") return false;
  return parsed.advisor === advisor;
}
function isUnlimitedWebAdvisorUsage(advisor, row) {
  const tierPlan = advisor === "bizpilot" ? row.planTypeBiz : row.planTypeFounder;
  if (tierPlan === "pro") return true;
  const limit = advisor === "bizpilot" ? row.bizMessageLimit ?? WEB_CHAT_FREE_TRIAL_LIMIT : row.founderMessageLimit ?? WEB_CHAT_FREE_TRIAL_LIMIT;
  if (limit >= WEB_CHAT_UNLIMITED_LIMIT) return true;
  if (!planAppliesToAdvisor(row.plan, advisor)) return false;
  return isProTierPlan(row.plan);
}
function webMessageLimitForAdvisor(advisor, row) {
  if (isUnlimitedWebAdvisorUsage(advisor, row)) return WEB_CHAT_UNLIMITED_LIMIT;
  const tierPlan = advisor === "bizpilot" ? row.planTypeBiz : row.planTypeFounder;
  const storedLimit = advisor === "bizpilot" ? row.bizMessageLimit ?? WEB_CHAT_FREE_TRIAL_LIMIT : row.founderMessageLimit ?? WEB_CHAT_FREE_TRIAL_LIMIT;
  if (planAppliesToAdvisor(row.plan, advisor)) {
    const tier = parsePlanKey(row.plan).tier;
    if (tier === "starter") return Math.max(storedLimit, WEB_CHAT_STARTER_LIMIT);
    if (tier === "pro") return WEB_CHAT_UNLIMITED_LIMIT;
  }
  if (tierPlan === "starter") return Math.max(storedLimit, WEB_CHAT_STARTER_LIMIT);
  if (!tierPlan || tierPlan === "free") return WEB_CHAT_FREE_TRIAL_LIMIT;
  return storedLimit;
}
async function getMessageUsage(userId, advisor) {
  const db = await getDb();
  if (!db) {
    return {
      used: 0,
      limit: WEB_CHAT_FREE_TRIAL_LIMIT,
      planType: "free",
      hasUsedStarter: false,
      hasPaidPlan: false
    };
  }
  const result = await db.select({
    bizMessagesUsed: users3.bizMessagesUsed,
    founderMessagesUsed: users3.founderMessagesUsed,
    bizMessageLimit: users3.bizMessageLimit,
    founderMessageLimit: users3.founderMessageLimit,
    planTypeBiz: users3.planTypeBiz,
    planTypeFounder: users3.planTypeFounder,
    hasUsedBizStarter: users3.hasUsedBizStarter,
    hasUsedFounderStarter: users3.hasUsedFounderStarter,
    plan: users3.plan,
    status: users3.status
  }).from(users3).where(eq2(users3.id, userId)).limit(1);
  const row = result[0];
  if (!row) {
    return {
      used: 0,
      limit: WEB_CHAT_FREE_TRIAL_LIMIT,
      planType: "free",
      hasUsedStarter: false,
      hasPaidPlan: false
    };
  }
  const unlimited = isUnlimitedWebAdvisorUsage(advisor, row);
  const limit = webMessageLimitForAdvisor(advisor, row);
  const hasPaidPlan = hasAnyActivePaidPlan(row.plan, row.status);
  if (advisor === "bizpilot") {
    const planType = row.planTypeBiz ?? "free";
    return {
      used: row.bizMessagesUsed ?? 0,
      limit,
      planType: unlimited ? "pro" : planType,
      hasUsedStarter: row.hasUsedBizStarter === "true",
      hasPaidPlan: hasPaidPlan && (planAppliesToAdvisor(row.plan, "bizpilot") || planType !== "free")
    };
  } else {
    const planType = row.planTypeFounder ?? "free";
    return {
      used: row.founderMessagesUsed ?? 0,
      limit,
      planType: unlimited ? "pro" : planType,
      hasUsedStarter: row.hasUsedFounderStarter === "true",
      hasPaidPlan: hasPaidPlan && (planAppliesToAdvisor(row.plan, "founderpilot") || planType !== "free")
    };
  }
}
async function incrementMessageUsed(userId, advisor) {
  const db = await getDb();
  if (!db) return;
  const usage = await getMessageUsage(userId, advisor);
  if (usage.limit >= WEB_CHAT_UNLIMITED_LIMIT) return;
  if (advisor === "bizpilot") {
    await db.update(users3).set({ bizMessagesUsed: usage.used + 1 }).where(eq2(users3.id, userId));
  } else {
    await db.update(users3).set({ founderMessagesUsed: usage.used + 1 }).where(eq2(users3.id, userId));
  }
}
async function activateTieredPlan(userId, advisor, planType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = /* @__PURE__ */ new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  if (advisor === "bizpilot") {
    const updateData = {
      planTypeBiz: planType,
      bizMessagesUsed: 0
      // reset counter on new plan
    };
    if (planType === "starter") {
      updateData.bizMessageLimit = 20;
      updateData.hasUsedBizStarter = "true";
      updateData.subscriptionStart = now;
    } else {
      updateData.bizMessageLimit = 999999;
      updateData.planExpiryDate = end;
      updateData.subscriptionStart = now;
      updateData.subscriptionEnd = end;
    }
    await db.update(users3).set(updateData).where(eq2(users3.id, userId));
  } else {
    const updateData = {
      planTypeFounder: planType,
      founderMessagesUsed: 0
      // reset counter on new plan
    };
    if (planType === "starter") {
      updateData.founderMessageLimit = 20;
      updateData.hasUsedFounderStarter = "true";
      updateData.subscriptionStart = now;
    } else {
      updateData.founderMessageLimit = 999999;
      updateData.planExpiryDate = end;
      updateData.subscriptionStart = now;
      updateData.subscriptionEnd = end;
    }
    await db.update(users3).set(updateData).where(eq2(users3.id, userId));
  }
}
async function getFreeTrialCounts(userId) {
  const db = await getDb();
  if (!db) return { freeBizCount: 10, freeFounderCount: 5 };
  const result = await db.select({ freeBizCount: users3.freeBizCount, freeFounderCount: users3.freeFounderCount }).from(users3).where(eq2(users3.id, userId)).limit(1);
  return result[0] ?? { freeBizCount: 10, freeFounderCount: 5 };
}
async function getOrCreateConversation(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (input.conversationId) {
    const existing = await db.select().from(conversations3).where(and(eq2(conversations3.id, input.conversationId), eq2(conversations3.userId, input.userId))).limit(1);
    if (existing.length > 0) return existing[0];
  }
  const [row] = await db.insert(conversations3).values({
    userId: input.userId,
    modelSlug: input.modelSlug,
    title: input.title ?? null
  }).returning();
  return row;
}
async function listUserConversations(userId, modelSlug, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations3).where(and(eq2(conversations3.userId, userId), eq2(conversations3.modelSlug, modelSlug))).orderBy(desc(conversations3.updatedAt), desc(conversations3.createdAt)).limit(limit);
}
async function getConversationById(userId, conversationId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(conversations3).where(and(eq2(conversations3.id, conversationId), eq2(conversations3.userId, userId))).limit(1);
  return result[0];
}
async function listConversationMessages(conversationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages3).where(eq2(messages3.conversationId, conversationId)).orderBy(asc(messages3.createdAt));
}
async function createMessage(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(messages3).values({
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    imageData: input.imageData ?? null,
    tokenCount: input.tokenCount ?? null
  }).returning();
  return row;
}
async function listWebChatHistoryForAdvisor(userId, modelSlug) {
  const convs = await listUserConversations(userId, modelSlug, 1);
  if (convs.length === 0) {
    return { conversationId: null, messages: [] };
  }
  const conv = convs[0];
  const usage = await getMessageUsage(userId, modelSlug);
  let rows = await listConversationMessages(conv.id);
  if (usage.planType === "pro") {
    const fullUser = await getUserById(userId);
    const activation = fullUser?.subscriptionStart;
    if (activation) {
      const activationMs = activation instanceof Date ? activation.getTime() : Number(activation);
      if (Number.isFinite(activationMs)) {
        rows = rows.filter((m) => {
          const created = m.createdAt instanceof Date ? m.createdAt.getTime() : Number(m.createdAt);
          return Number.isFinite(created) && created >= activationMs;
        });
      }
    }
  } else if (usage.planType === "starter") {
    rows = rows.slice(0, WEB_CHAT_STARTER_MEMORY_LIMIT);
  }
  return {
    conversationId: conv.id,
    messages: rows.map((m) => ({
      role: m.role,
      content: m.content,
      imageData: m.imageData ?? null
    }))
  };
}
async function touchConversation(conversationId) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations3).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq2(conversations3.id, conversationId));
}
async function deleteConversation(conversationId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages3).where(eq2(messages3.conversationId, conversationId));
  await db.delete(conversations3).where(and(eq2(conversations3.id, conversationId), eq2(conversations3.userId, userId)));
}
async function updateConversationTitle(conversationId, title) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations3).set({ title }).where(eq2(conversations3.id, conversationId));
}
async function getActiveSystemPrompt(modelSlug) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemPrompts3).where(and(eq2(systemPrompts3.modelSlug, modelSlug), eq2(systemPrompts3.isActive, "true"))).orderBy(desc(systemPrompts3.version)).limit(1);
  return result[0]?.content ?? null;
}
async function listSystemPrompts() {
  const db = await assertDatabase();
  return db.select().from(systemPrompts3).orderBy(desc(systemPrompts3.updatedAt));
}
async function createSystemPromptVersion(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(systemPrompts3).where(eq2(systemPrompts3.modelSlug, input.modelSlug)).orderBy(desc(systemPrompts3.version)).limit(1);
  const nextVersion = (existing[0]?.version ?? 0) + 1;
  if (input.activate) {
    await db.update(systemPrompts3).set({ isActive: "false" }).where(eq2(systemPrompts3.modelSlug, input.modelSlug));
  }
  const [row] = await db.insert(systemPrompts3).values({
    name: input.name,
    modelSlug: input.modelSlug,
    content: input.content,
    version: nextVersion,
    isActive: input.activate ? "true" : "false"
  }).returning();
  return row;
}
async function activateSystemPrompt(promptId, modelSlug) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(systemPrompts3).set({ isActive: "false" }).where(eq2(systemPrompts3.modelSlug, modelSlug));
  await db.update(systemPrompts3).set({ isActive: "true" }).where(eq2(systemPrompts3.id, promptId));
}
async function getAiModel(targetRole) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(aiModels3).where(eq2(aiModels3.targetRole, targetRole)).limit(1);
  return result[0];
}
async function listAllAiModels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiModels3).orderBy(asc(aiModels3.targetRole));
}
async function updateAiModel(targetRole, modelString) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiModels3).set({ modelString, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(aiModels3.targetRole, targetRole));
}
async function getActiveApiKey(provider) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(apiKeys3).where(and(eq2(apiKeys3.provider, provider), eq2(apiKeys3.isActive, "true"))).limit(1);
  return result[0];
}
async function listAllApiKeys() {
  const db = await assertDatabase();
  const keys = await db.select().from(apiKeys3).orderBy(desc(apiKeys3.createdAt));
  return keys.map((k) => ({ ...k, keyValue: k.keyValue.slice(0, 8) + "..." + k.keyValue.slice(-4), keyValueFull: k.keyValue }));
}
async function upsertApiKey(provider, keyValue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys3).set({ isActive: "false" }).where(eq2(apiKeys3.provider, provider));
  await db.insert(apiKeys3).values({ provider, keyValue, isActive: "true" });
}
async function deleteApiKey(keyId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys3).set({ isActive: "false" }).where(eq2(apiKeys3.id, keyId));
}
async function setApiKeyActive(keyId, provider) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys3).set({ isActive: "false" }).where(eq2(apiKeys3.provider, provider));
  await db.update(apiKeys3).set({ isActive: "true" }).where(eq2(apiKeys3.id, keyId));
}
async function listAllUsers() {
  const db = await assertDatabase();
  return db.select().from(users3).orderBy(desc(users3.createdAt));
}
async function listApprovedUserEmails() {
  const db = await assertDatabase();
  const rows = await db.select({
    id: users3.id,
    email: users3.email,
    name: users3.name,
    status: users3.status
  }).from(users3).where(
    or(
      eq2(users3.status, "approved"),
      eq2(users3.status, "active"),
      eq2(users3.status, "APPROVED")
    )
  ).orderBy(desc(users3.createdAt));
  return rows.filter((r) => typeof r.email === "string" && r.email.trim().length > 0).map((r) => ({
    id: r.id,
    email: r.email.trim(),
    name: r.name
  }));
}
async function updateUserRole(userId, role) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users3).set({ role }).where(eq2(users3.id, userId));
}
async function updateUserProfile(userId, data) {
  const db = await getDb();
  if (!db) return;
  const updateSet = {};
  if (data.name !== void 0) updateSet.name = data.name;
  if (data.phone !== void 0) updateSet.phone = data.phone;
  if (data.businessName !== void 0) updateSet.businessName = data.businessName;
  if (data.businessType !== void 0) updateSet.businessType = data.businessType;
  if (data.useCase !== void 0) updateSet.useCase = data.useCase;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users3).set(updateSet).where(eq2(users3.id, userId));
  }
}
async function completeUserOnboarding(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = /* @__PURE__ */ new Date();
  await db.update(users3).set({
    name: data.name.trim(),
    useCase: data.useCase.trim(),
    status: "active",
    onboardingCompletedAt: now,
    updatedAt: now
  }).where(eq2(users3.id, userId));
}
async function createEmailPasswordUser(input) {
  const { nanoid: nanoid4 } = await import("nanoid");
  const db = await assertDatabase();
  const normalized = normalizeEmail(input.email);
  const openId = `email_${nanoid4(24)}`;
  const now = /* @__PURE__ */ new Date();
  await db.insert(users3).values({
    openId,
    email: normalized,
    name: input.name?.trim() || null,
    passwordHash: input.passwordHash,
    loginMethod: "email",
    role: "user",
    status: "active",
    plan: "free",
    lastSignedIn: now
  });
  return { openId };
}
async function applyAdminUserPlan(userId, planKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = /* @__PURE__ */ new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  const { advisor, tier } = parsePlanKey(planKey);
  if (!planKey.trim() || tier === "free") {
    await db.update(users3).set({
      plan: "free",
      status: "inactive",
      updatedAt: now
    }).where(eq2(users3.id, userId));
    return;
  }
  const updateSet = {
    plan: planKey,
    status: "active",
    subscriptionStart: now,
    subscriptionEnd: end,
    updatedAt: now
  };
  if (advisor === "bizpilot") {
    updateSet.planTypeBiz = tier;
    updateSet.bizMessagesUsed = 0;
    updateSet.bizMessageLimit = tier === "pro" ? WEB_CHAT_UNLIMITED_LIMIT : WEB_CHAT_STARTER_LIMIT;
    if (tier === "starter") updateSet.hasUsedBizStarter = "true";
  } else if (advisor === "founderpilot") {
    updateSet.planTypeFounder = tier;
    updateSet.founderMessagesUsed = 0;
    updateSet.founderMessageLimit = tier === "pro" ? WEB_CHAT_UNLIMITED_LIMIT : WEB_CHAT_STARTER_LIMIT;
    if (tier === "starter") updateSet.hasUsedFounderStarter = "true";
  }
  await db.update(users3).set(updateSet).where(eq2(users3.id, userId));
}
async function updateUserSubscription(userId, plan, status) {
  const isActive = status.toLowerCase().trim() === "active";
  if (!isActive || !plan.trim() || plan === "free") {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users3).set({ plan, status, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(users3.id, userId));
    return;
  }
  await applyAdminUserPlan(userId, plan);
}
async function deleteUser(userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users3).where(eq2(users3.id, userId));
}
async function createPayment(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(payments3).values({
    userId: input.userId ?? null,
    userName: input.userName ?? null,
    userEmail: input.userEmail ?? null,
    plan: input.plan,
    amount: input.amount,
    currency: "MMK",
    status: "pending",
    paymentMethod: input.paymentMethod ?? null,
    transactionRef: input.transactionRef ?? null,
    screenshotUrl: input.screenshotUrl ?? null,
    source: input.source ?? "website"
  }).returning();
  return row;
}
async function listAllPayments() {
  const db = await assertDatabase();
  return db.select().from(payments3).orderBy(desc(payments3.createdAt));
}
async function listUserPayments(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments3).where(eq2(payments3.userId, userId)).orderBy(desc(payments3.createdAt));
}
async function updatePaymentStatus(paymentId, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payments3).set({ status }).where(eq2(payments3.id, paymentId));
}
async function updatePayment(paymentId, fields) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = {};
  if (fields.plan !== void 0) updateSet.plan = fields.plan;
  if (fields.amount !== void 0) updateSet.amount = fields.amount;
  if (fields.status !== void 0) updateSet.status = fields.status;
  if (fields.paymentMethod !== void 0) updateSet.paymentMethod = fields.paymentMethod;
  if (fields.transactionRef !== void 0) updateSet.transactionRef = fields.transactionRef;
  if (fields.notes !== void 0) updateSet.notes = fields.notes;
  if (fields.screenshotUrl !== void 0) updateSet.screenshotUrl = fields.screenshotUrl;
  await db.update(payments3).set(updateSet).where(eq2(payments3.id, paymentId));
}
async function deletePayment(paymentId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(payments3).where(eq2(payments3.id, paymentId));
}
async function getSystemSetting(key) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemSettings3).where(eq2(systemSettings3.key, key)).limit(1);
  return result[0]?.value ?? null;
}
async function setSystemSetting(key, value) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(systemSettings3).values({ key, value }).onConflictDoUpdate({
    target: systemSettings3.key,
    set: { value, updatedAt: /* @__PURE__ */ new Date() }
  });
}
async function listSystemSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ key: systemSettings3.key, value: systemSettings3.value }).from(systemSettings3);
}
async function listAllApplications() {
  const db = await assertDatabase();
  return db.select().from(applications3).orderBy(desc(applications3.createdAt));
}
async function getApplicationById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(applications3).where(eq2(applications3.id, id)).limit(1);
  return result[0];
}
async function updateApplicationStatus(id, status, userId, notes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = { status };
  if (userId !== void 0) updateSet.userId = userId;
  if (notes !== void 0) updateSet.notes = notes;
  await db.update(applications3).set(updateSet).where(eq2(applications3.id, id));
}
async function validateExternalApiToken(token) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(externalApiTokens3).where(and(eq2(externalApiTokens3.token, token), eq2(externalApiTokens3.isActive, "true"))).limit(1);
  return result.length > 0;
}
async function listExternalApiTokens() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(externalApiTokens3).orderBy(desc(externalApiTokens3.createdAt));
}
async function createExternalApiToken(name, token) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(externalApiTokens3).values({ name, token, isActive: "true" }).returning();
  return row;
}
async function deleteExternalApiToken(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(externalApiTokens3).set({ isActive: "false" }).where(eq2(externalApiTokens3.id, id));
}
async function createAnnouncement(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(announcements3).values({ ...data, isActive: "true" }).returning();
  return row;
}
async function listAnnouncements(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(announcements3).where(eq2(announcements3.isActive, "true")).orderBy(desc(announcements3.createdAt));
  }
  return db.select().from(announcements3).orderBy(desc(announcements3.createdAt));
}
async function updateAnnouncement(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements3).set(data).where(eq2(announcements3.id, id));
}
async function deleteAnnouncement(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements3).where(eq2(announcements3.id, id));
}
async function getUserByTelegramChatId(chatId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users3).where(eq2(users3.telegramChatId, chatId)).orderBy(desc(users3.updatedAt)).limit(1);
  return result[0];
}
async function linkTelegramChat(userId, chatId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users3).set({ telegramChatId: null }).where(eq2(users3.telegramChatId, chatId));
  await db.update(users3).set({ telegramChatId: chatId }).where(eq2(users3.id, userId));
}
async function getActivationToken(token) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(botActivationTokens3).where(eq2(botActivationTokens3.token, token)).limit(1);
  return result[0];
}
async function createBotActivationToken(userId, token) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  try {
    const inserted = await database.insert(botActivationTokens3).values({ token, userId, isUsed: "false" }).returning();
    if (inserted[0]) return inserted[0];
  } catch (err) {
    console.warn("[Database] bot_activation_tokens insert.returning failed, retrying:", err);
  }
  await database.insert(botActivationTokens3).values({ token, userId, isUsed: "false" });
  const found = await database.select().from(botActivationTokens3).where(eq2(botActivationTokens3.token, token)).limit(1);
  if (!found[0]) throw new Error("Failed to create activation token");
  return found[0];
}
async function markActivationTokenUsed(tokenId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(botActivationTokens3).set({ isUsed: "true" }).where(eq2(botActivationTokens3.id, tokenId));
}
function coerceTelegramMessageLimit(value) {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}
function isTelegramPlanActive(planExpiryDate) {
  if (planExpiryDate == null || planExpiryDate === "") return true;
  let ms;
  if (planExpiryDate instanceof Date) {
    ms = planExpiryDate.getTime();
  } else if (typeof planExpiryDate === "number") {
    ms = planExpiryDate;
  } else {
    const n = Number(planExpiryDate);
    ms = Number.isFinite(n) ? n : NaN;
  }
  if (!Number.isFinite(ms)) return true;
  if (ms > 0 && ms < 1e12) ms *= 1e3;
  return ms > Date.now();
}
function clipTelegramTurnContent(text3) {
  if (text3.length <= MAX_TELEGRAM_TURN_CHARS) return text3;
  return `${text3.slice(0, MAX_TELEGRAM_TURN_CHARS)}
\u2026`;
}
async function listRecentTelegramLlmTurnsForAdvisor(userId, advisor, maxMessages) {
  const db = await getDb();
  if (!db) return [];
  const cap = Math.max(1, maxMessages);
  try {
    const rows = await db.select({
      role: telegramLlmTurns3.role,
      content: telegramLlmTurns3.content
    }).from(telegramLlmTurns3).where(and(eq2(telegramLlmTurns3.userId, userId), eq2(telegramLlmTurns3.advisor, advisor))).orderBy(desc(telegramLlmTurns3.createdAt)).limit(cap);
    return rows.reverse().filter((r) => r.role === "user" || r.role === "assistant").map((r) => ({
      role: r.role,
      content: r.content
    }));
  } catch (err) {
    console.error("[db] listRecentTelegramLlmTurnsForAdvisor (telegram_llm_turns) failed:", err);
    return [];
  }
}
async function appendTelegramLlmTurnPair(userId, advisor, userContent, assistantContent) {
  const db = await getDb();
  if (!db) return;
  try {
    const now = /* @__PURE__ */ new Date();
    await db.insert(telegramLlmTurns3).values([
      {
        userId,
        advisor,
        role: "user",
        content: clipTelegramTurnContent(userContent),
        createdAt: now
      },
      {
        userId,
        advisor,
        role: "assistant",
        content: clipTelegramTurnContent(assistantContent),
        createdAt: now
      }
    ]);
  } catch (err) {
    console.error("[db] appendTelegramLlmTurnPair (telegram_llm_turns) failed:", err);
  }
}
async function listTelegramBotUsers() {
  const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
  await ensureTelegramSchema2();
  const all = await listAllUsers();
  return all.map((u) => mapUserToTelegramRow(u)).sort((a, b) => b.id - a.id);
}
function mapUserToTelegramRow(user) {
  let planExpiryDate = null;
  if (user.planExpiryDate != null) {
    const d = new Date(user.planExpiryDate);
    if (!Number.isNaN(d.getTime())) {
      planExpiryDate = d.toISOString();
    }
  }
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    telegramChatId: user.telegramChatId ?? null,
    bizMessageLimit: user.bizMessageLimit ?? 5,
    founderMessageLimit: user.founderMessageLimit ?? 5,
    planTypeBiz: user.planTypeBiz ?? "free",
    planTypeFounder: user.planTypeFounder ?? "free",
    planExpiryDate,
    hasUsedBizStarter: hasUsedTelegramStarter(user.hasUsedBizStarter),
    hasUsedFounderStarter: hasUsedTelegramStarter(user.hasUsedFounderStarter)
  };
}
function assertCanAssignTelegramStarter(user, advisor) {
  if (advisor === "bizpilot") {
    if (hasUsedTelegramStarter(user.hasUsedBizStarter)) {
      throw new Error(TELEGRAM_STARTER_ALREADY_USED_BIZ);
    }
    return;
  }
  if (hasUsedTelegramStarter(user.hasUsedFounderStarter)) {
    throw new Error(TELEGRAM_STARTER_ALREADY_USED_FOUNDER);
  }
}
function telegramAdvisorClearFields(advisor) {
  if (advisor === "bizpilot") {
    return {
      bizMessageLimit: 0,
      planTypeBiz: "free"
    };
  }
  return {
    founderMessageLimit: 0,
    planTypeFounder: "free"
  };
}
async function clearTelegramAdvisorPlan(userId, advisor) {
  const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
  await ensureTelegramSchema2();
  const db = await assertDatabase();
  await db.update(users3).set({
    ...telegramAdvisorClearFields(advisor),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(users3.id, userId));
}
async function applyTelegramAdvisorPlan(userId, advisor, tier, planExpiryDate) {
  const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
  await ensureTelegramSchema2();
  const db = await assertDatabase();
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  if (tier === "starter") {
    assertCanAssignTelegramStarter(user, advisor);
  }
  const expiry = tier === "unlimited" ? planExpiryDate ?? addTelegramPlanMonths() : planExpiryDate ?? user.planExpiryDate ?? addTelegramPlanMonths();
  const updateSet = {
    updatedAt: /* @__PURE__ */ new Date(),
    planExpiryDate: expiry
  };
  if (advisor === "bizpilot") {
    if (tier === "starter") {
      updateSet.bizMessageLimit = TELEGRAM_STARTER_MESSAGE_LIMIT;
      updateSet.planTypeBiz = "starter";
      updateSet.hasUsedBizStarter = "true";
      updateSet.bizMessagesUsed = 0;
    } else {
      updateSet.bizMessageLimit = TELEGRAM_UNLIMITED_MESSAGE_LIMIT;
      updateSet.planTypeBiz = "pro";
    }
  } else if (tier === "starter") {
    updateSet.founderMessageLimit = TELEGRAM_STARTER_MESSAGE_LIMIT;
    updateSet.planTypeFounder = "starter";
    updateSet.hasUsedFounderStarter = "true";
    updateSet.founderMessagesUsed = 0;
  } else {
    updateSet.founderMessageLimit = TELEGRAM_UNLIMITED_MESSAGE_LIMIT;
    updateSet.planTypeFounder = "pro";
  }
  await db.update(users3).set(updateSet).where(eq2(users3.id, userId));
}
async function updateTelegramUserPlan(input) {
  const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
  await ensureTelegramSchema2();
  const db = await assertDatabase();
  const user = await getUserById(input.userId);
  if (!user) throw new Error("User not found");
  if (input.planType && input.planTier) {
    const otherAdvisor = input.planType === "bizpilot" ? "founderpilot" : "bizpilot";
    await clearTelegramAdvisorPlan(input.userId, otherAdvisor);
    await applyTelegramAdvisorPlan(
      input.userId,
      input.planType,
      input.planTier,
      input.planExpiryDate
    );
    return;
  }
  if (input.bizPlanTier) {
    await applyTelegramAdvisorPlan(
      input.userId,
      "bizpilot",
      input.bizPlanTier,
      input.planExpiryDate
    );
  }
  if (input.founderPlanTier) {
    await applyTelegramAdvisorPlan(
      input.userId,
      "founderpilot",
      input.founderPlanTier,
      input.planExpiryDate
    );
  }
  const hasManualLimits = input.bizMessageLimit !== void 0 || input.addBizMessages !== void 0 || input.founderMessageLimit !== void 0 || input.addFounderMessages !== void 0;
  if ((input.bizPlanTier || input.founderPlanTier) && !hasManualLimits) {
    return;
  }
  let workingUser = await getUserById(input.userId);
  if (!workingUser) throw new Error("User not found");
  const updateSet = { updatedAt: /* @__PURE__ */ new Date() };
  if (input.planExpiryDate !== void 0) {
    updateSet.planExpiryDate = input.planExpiryDate;
  }
  let bizLimit = workingUser.bizMessageLimit ?? 0;
  if (input.bizMessageLimit !== void 0) {
    if (isStarterTelegramLimit(input.bizMessageLimit)) {
      assertCanAssignTelegramStarter(workingUser, "bizpilot");
      updateSet.hasUsedBizStarter = "true";
      updateSet.planTypeBiz = "starter";
    } else if (isUnlimitedTelegramLimit(input.bizMessageLimit)) {
      updateSet.planTypeBiz = "pro";
    }
    bizLimit = input.bizMessageLimit;
  } else if (input.addBizMessages !== void 0) {
    bizLimit = bizLimit + input.addBizMessages;
  }
  if (input.bizMessageLimit !== void 0 || input.addBizMessages !== void 0) {
    updateSet.bizMessageLimit = Math.max(0, bizLimit);
    if (bizLimit > 0 && (workingUser.planTypeBiz ?? "free") === "free" && !isUnlimitedTelegramLimit(bizLimit)) {
      updateSet.planTypeBiz = "starter";
    }
  }
  let founderLimit = workingUser.founderMessageLimit ?? 0;
  if (input.founderMessageLimit !== void 0) {
    if (isStarterTelegramLimit(input.founderMessageLimit)) {
      assertCanAssignTelegramStarter(workingUser, "founderpilot");
      updateSet.hasUsedFounderStarter = "true";
      updateSet.planTypeFounder = "starter";
    } else if (isUnlimitedTelegramLimit(input.founderMessageLimit)) {
      updateSet.planTypeFounder = "pro";
    }
    founderLimit = input.founderMessageLimit;
  } else if (input.addFounderMessages !== void 0) {
    founderLimit = founderLimit + input.addFounderMessages;
  }
  if (input.founderMessageLimit !== void 0 || input.addFounderMessages !== void 0) {
    updateSet.founderMessageLimit = Math.max(0, founderLimit);
    if (founderLimit > 0 && (workingUser.planTypeFounder ?? "free") === "free" && !isUnlimitedTelegramLimit(founderLimit)) {
      updateSet.planTypeFounder = "starter";
    }
  }
  if (Object.keys(updateSet).length > 1) {
    await db.update(users3).set(updateSet).where(eq2(users3.id, input.userId));
  }
}
async function decrementTelegramMessageLimit(userId, isBiz) {
  const db = await assertDatabase();
  if (isBiz) {
    await db.update(users3).set({
      bizMessageLimit: sql4`max(0, ${users3.bizMessageLimit} - 1)`,
      bizMessagesUsed: sql4`${users3.bizMessagesUsed} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(users3.id, userId));
  } else {
    await db.update(users3).set({
      founderMessageLimit: sql4`max(0, ${users3.founderMessageLimit} - 1)`,
      founderMessagesUsed: sql4`${users3.founderMessagesUsed} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(users3.id, userId));
  }
}
var WEB_CHAT_UNLIMITED_LIMIT, WEB_CHAT_STARTER_LIMIT, WEB_CHAT_FREE_TRIAL_LIMIT, WEB_CHAT_STARTER_MEMORY_LIMIT, MAX_TELEGRAM_TURN_CHARS;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_telegramPlans();
    init_plans();
    init_telegramPlans();
    init_env();
    init_adminAccess();
    init_userStatus();
    init_connection();
    WEB_CHAT_UNLIMITED_LIMIT = 999999;
    WEB_CHAT_STARTER_LIMIT = 20;
    WEB_CHAT_FREE_TRIAL_LIMIT = 3;
    WEB_CHAT_STARTER_MEMORY_LIMIT = 20;
    MAX_TELEGRAM_TURN_CHARS = 12e3;
  }
});

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}
var init_cookies = __esm({
  "server/_core/cookies.ts"() {
    "use strict";
  }
});

// shared/onboarding.ts
function userNeedsOnboarding(user) {
  if (!user) return false;
  if (user.role === "admin") return false;
  if (user.onboardingCompletedAt) return false;
  const name = (user.name ?? "").trim();
  const purpose = (user.useCase ?? "").trim();
  return !name || !purpose;
}
var init_onboarding = __esm({
  "shared/onboarding.ts"() {
    "use strict";
  }
});

// server/_core/googleLogin.ts
async function resolveGoogleLogin(userInfo) {
  const googleSub = userInfo.sub;
  const userEmail = userInfo.email ? normalizeEmail(userInfo.email) : null;
  const { user: existingUser } = await resolveUserForGoogleLogin(userEmail, googleSub);
  const grantAdmin = shouldGrantAdminRole({
    email: userEmail,
    googleSub,
    ownerGoogleSub: ENV.ownerGoogleSub
  });
  const upsert = {
    openId: googleSub,
    name: userInfo.name || existingUser?.name || null,
    email: userEmail ?? userInfo.email ?? existingUser?.email ?? null,
    loginMethod: "google",
    lastSignedIn: /* @__PURE__ */ new Date(),
    status: "active"
  };
  if (grantAdmin) {
    upsert.role = "admin";
  }
  if (existingUser && !isUserApproved(existingUser)) {
    upsert.status = "active";
  }
  const mergedProfile = {
    name: upsert.name ?? existingUser?.name,
    useCase: existingUser?.useCase,
    role: grantAdmin ? "admin" : existingUser?.role,
    onboardingCompletedAt: existingUser?.onboardingCompletedAt
  };
  const redirectPath = userNeedsOnboarding(mergedProfile) ? "/onboarding" : "/app";
  console.info("User Login Attempt:", userEmail, "redirect:", redirectPath, {
    existingUserId: existingUser?.id,
    needsOnboarding: userNeedsOnboarding(mergedProfile)
  });
  return {
    sessionOpenId: googleSub,
    redirectPath,
    userStatus: "active",
    userEmail,
    isApproved: true,
    upsert
  };
}
var init_googleLogin = __esm({
  "server/_core/googleLogin.ts"() {
    "use strict";
    init_db();
    init_adminAccess();
    init_env();
    init_userStatus();
    init_onboarding();
  }
});

// shared/session.ts
var SESSION_APP_ID;
var init_session = __esm({
  "shared/session.ts"() {
    "use strict";
    SESSION_APP_ID = "pilothub";
  }
});

// shared/_core/errors.ts
var HttpError, ForbiddenError;
var init_errors = __esm({
  "shared/_core/errors.ts"() {
    "use strict";
    HttpError = class extends Error {
      constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
      }
    };
    ForbiddenError = (msg) => new HttpError(403, msg);
  }
});

// server/_core/sdk.ts
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString, SessionService, sdk;
var init_sdk = __esm({
  "server/_core/sdk.ts"() {
    "use strict";
    init_const();
    init_session();
    init_errors();
    init_db();
    init_adminAccess();
    init_userStatus();
    init_env();
    isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
    SessionService = class {
      parseCookies(cookieHeader) {
        if (!cookieHeader) {
          return /* @__PURE__ */ new Map();
        }
        const parsed = parseCookieHeader(cookieHeader);
        return new Map(Object.entries(parsed));
      }
      getSessionSecret() {
        const secret = typeof process.env.JWT_SECRET === "string" && process.env.JWT_SECRET.trim() || ENV.cookieSecret;
        if (!secret) {
          throw new Error("JWT_SECRET is not configured");
        }
        return new TextEncoder().encode(secret);
      }
      async createSessionToken(openId, options = {}) {
        return this.signSession(
          {
            openId,
            appId: SESSION_APP_ID,
            name: options.name || ""
          },
          options
        );
      }
      async signSession(payload, options = {}) {
        const issuedAt = Date.now();
        const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
        const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
        const secretKey = this.getSessionSecret();
        return new SignJWT({
          openId: payload.openId,
          appId: payload.appId,
          name: payload.name
        }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
      }
      async verifySession(cookieValue) {
        if (!cookieValue) {
          console.warn("[Auth] Missing session cookie");
          return null;
        }
        try {
          const secretKey = this.getSessionSecret();
          const { payload } = await jwtVerify(cookieValue, secretKey, {
            algorithms: ["HS256"]
          });
          const { openId, appId, name } = payload;
          if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) {
            console.warn("[Auth] Session payload missing required fields");
            return null;
          }
          const validAppIds = new Set(
            [SESSION_APP_ID, ENV.googleClientId].filter((id) => Boolean(id))
          );
          if (!validAppIds.has(appId)) {
            console.warn("[Auth] Session appId is not recognized");
            return null;
          }
          return {
            openId,
            appId,
            name: isNonEmptyString(name) ? name : ""
          };
        } catch (error) {
          console.warn("[Auth] Session verification failed", String(error));
          return null;
        }
      }
      async authenticateRequest(req) {
        const cookies = this.parseCookies(req.headers.cookie);
        const sessionCookie = cookies.get(COOKIE_NAME);
        const session = await this.verifySession(sessionCookie);
        if (!session) {
          throw ForbiddenError("Invalid session cookie");
        }
        const signedInAt = /* @__PURE__ */ new Date();
        let user = await getUserByOpenId(session.openId);
        if (!user) {
          throw ForbiddenError("User not found");
        }
        if (user.email && isAdminEmail(user.email) && user.role !== "admin") {
          await updateUserRole(user.id, "admin");
          user = { ...user, role: "admin" };
        }
        const upsertStatus = isUserApproved(user) && user.status?.toLowerCase() !== "active" ? "active" : void 0;
        await upsertUser({
          openId: user.openId,
          email: user.email,
          lastSignedIn: signedInAt,
          role: user.role === "admin" ? "admin" : void 0,
          ...upsertStatus ? { status: upsertStatus } : {}
        });
        return user;
      }
    };
    sdk = new SessionService();
  }
});

// server/_core/oauth.ts
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function readEnv(name) {
  return (process.env[name] ?? "").trim();
}
function getPublicOrigin(req) {
  const configured = readEnv("PUBLIC_APP_URL");
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.warn("[Google OAuth] PUBLIC_APP_URL is not a valid URL:", configured);
    }
  }
  const vercelUrl = readEnv("VERCEL_URL");
  if (vercelUrl) {
    const host2 = vercelUrl.replace(/^https?:\/\//i, "");
    return `https://${host2}`;
  }
  const xfProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(xfProto) ? xfProto[0] : xfProto?.split(",")[0])?.trim() || req.protocol || "https";
  const xfHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(xfHost) ? xfHost[0] : xfHost?.split(",")[0]?.trim()) || req.get("host") || "localhost";
  return `${proto}://${host}`;
}
function resolveGoogleRedirectUri(req, cookieRedirectUri) {
  const fromEnv = readEnv("GOOGLE_REDIRECT_URI") || ENV.googleRedirectUri?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const fromCookie = cookieRedirectUri?.trim();
  if (fromCookie) return fromCookie.replace(/\/+$/, "");
  return `${getPublicOrigin(req)}/api/oauth/callback`;
}
function googleOAuthConfigured() {
  const clientId = readEnv("GOOGLE_CLIENT_ID") || ENV.googleClientId;
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET") || ENV.googleClientSecret;
  return Boolean(clientId && clientSecret);
}
function getGoogleClientId() {
  return readEnv("GOOGLE_CLIENT_ID") || ENV.googleClientId;
}
function getGoogleClientSecret() {
  return readEnv("GOOGLE_CLIENT_SECRET") || ENV.googleClientSecret;
}
function oauthStateSecret() {
  const secret = readEnv("JWT_SECRET") || ENV.cookieSecret;
  return secret.length > 0 ? secret : null;
}
function signOAuthPayload(payload) {
  const secret = oauthStateSecret();
  if (!secret) return null;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}
function verifyOAuthPayload(signed) {
  const secret = oauthStateSecret();
  if (!secret) return null;
  const lastDot = signed.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return payload;
  } catch {
    return null;
  }
}
function redirectOAuthError(res, reason, logContext) {
  if (logContext) {
    console.error("[Google OAuth] Redirecting with error:", reason, logContext);
  } else {
    console.error("[Google OAuth] Redirecting with error:", reason);
  }
  const url = new URL("/", getSafeRedirectOrigin());
  url.searchParams.set("error", "oauth_failed");
  url.searchParams.set("reason", reason);
  res.redirect(302, url.toString());
}
function getSafeRedirectOrigin() {
  const fromEnv = readEnv("PUBLIC_APP_URL");
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
    }
  }
  return "https://pilothub.vip";
}
async function exchangeCodeForTokens(code, redirectUri) {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  console.info("[Google OAuth] Token exchange", {
    redirectUri,
    clientIdPrefix: clientId.slice(0, 12),
    hasClientSecret: clientSecret.length > 0
  });
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const raw = await res.text();
  if (!res.ok) {
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
    }
    console.error("[Google OAuth] Token exchange failed", {
      status: res.status,
      error: parsed.error,
      error_description: parsed.error_description,
      redirectUri,
      bodyPreview: raw.slice(0, 500)
    });
    throw new Error(
      parsed.error_description || parsed.error || `Google token exchange HTTP ${res.status}`
    );
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("[Google OAuth] Token response not JSON:", raw.slice(0, 500));
    throw new Error("Google token response was not valid JSON");
  }
  if (!json.access_token) {
    console.error("[Google OAuth] Token response missing access_token:", raw.slice(0, 500));
    throw new Error("Google token response missing access_token");
  }
  return { access_token: json.access_token };
}
async function fetchGoogleUserInfo(accessToken) {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const raw = await res.text();
  if (!res.ok) {
    console.error("[Google OAuth] Userinfo failed", {
      status: res.status,
      bodyPreview: raw.slice(0, 500)
    });
    throw new Error(`Google userinfo HTTP ${res.status}`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    console.error("[Google OAuth] Userinfo not JSON:", raw.slice(0, 500));
    throw new Error("Google userinfo was not valid JSON");
  }
}
function assertSessionPrerequisites() {
  const jwt = readEnv("JWT_SECRET") || ENV.cookieSecret;
  if (!jwt) {
    throw new Error("JWT_SECRET is not set \u2014 cannot create session cookie");
  }
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not set \u2014 cannot create session cookie");
  }
}
function registerOAuthRoutes(app2) {
  app2.get("/api/auth/google", (req, res) => {
    if (!googleOAuthConfigured()) {
      console.error("[Google OAuth] Start blocked: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      redirectOAuthError(res, "not_configured");
      return;
    }
    if (!oauthStateSecret()) {
      console.error("[Google OAuth] Start blocked: JWT_SECRET is not set");
      redirectOAuthError(res, "missing_jwt_secret");
      return;
    }
    const stateNonce = randomBytes(32).toString("hex");
    const redirectUri = resolveGoogleRedirectUri(req);
    const signedState = signOAuthPayload(`${stateNonce}|${redirectUri}`) ?? stateNonce;
    const cookieOpts = getSessionCookieOptions(req);
    res.cookie(GOOGLE_OAUTH_STATE_COOKIE, signedState, {
      ...cookieOpts,
      maxAge: 10 * 60 * 1e3
    });
    res.cookie(GOOGLE_OAUTH_REDIRECT_COOKIE, redirectUri, {
      ...cookieOpts,
      maxAge: 10 * 60 * 1e3
    });
    console.info("[Google OAuth] Starting authorize", { redirectUri, stateNonce: stateNonce.slice(0, 8) });
    const params = new URLSearchParams({
      client_id: getGoogleClientId(),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: ["openid", "email", "profile"].join(" "),
      state: stateNonce,
      prompt: "select_account"
    });
    res.redirect(302, `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
  });
  app2.get("/api/oauth/callback", async (req, res) => {
    const googleError = getQueryParam(req, "error");
    if (googleError) {
      console.error("[Google OAuth] Google returned error", {
        error: googleError,
        description: getQueryParam(req, "error_description")
      });
      redirectOAuthError(res, googleError, {
        description: getQueryParam(req, "error_description")
      });
      return;
    }
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const cookieState = req.cookies?.[GOOGLE_OAUTH_STATE_COOKIE];
    const cookieRedirect = req.cookies?.[GOOGLE_OAUTH_REDIRECT_COOKIE];
    const clearOAuthCookies = () => {
      const opts = getSessionCookieOptions(req);
      res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, { ...opts, maxAge: -1 });
      res.clearCookie(GOOGLE_OAUTH_REDIRECT_COOKIE, { ...opts, maxAge: -1 });
    };
    if (!code || !state) {
      clearOAuthCookies();
      console.error("[Google OAuth] Missing code or state", { hasCode: Boolean(code), hasState: Boolean(state) });
      redirectOAuthError(res, "missing_code_or_state");
      return;
    }
    const redirectUri = resolveGoogleRedirectUri(req, cookieRedirect);
    const verifiedPayload = cookieState ? verifyOAuthPayload(cookieState) : null;
    let stateValid = false;
    if (verifiedPayload) {
      const pipe = verifiedPayload.indexOf("|");
      if (pipe > 0) {
        const nonce = verifiedPayload.slice(0, pipe);
        const uriFromCookie = verifiedPayload.slice(pipe + 1);
        stateValid = nonce === state && uriFromCookie === redirectUri;
      }
    } else if (cookieState === state) {
      stateValid = true;
    }
    if (!cookieState || !stateValid) {
      clearOAuthCookies();
      console.error("[Google OAuth] Invalid OAuth state", {
        hasCookie: Boolean(cookieState),
        stateFromQuery: state.slice(0, 8),
        cookieRedirect,
        verifiedPayload: verifiedPayload?.slice(0, 40)
      });
      redirectOAuthError(res, "invalid_state");
      return;
    }
    if (!googleOAuthConfigured()) {
      clearOAuthCookies();
      console.error("[Google OAuth] Callback blocked: OAuth not configured");
      redirectOAuthError(res, "not_configured");
      return;
    }
    try {
      assertSessionPrerequisites();
      const { access_token } = await exchangeCodeForTokens(code, redirectUri);
      console.info("[Google OAuth] Token exchange succeeded");
      const userInfo = await fetchGoogleUserInfo(access_token);
      console.info("[Google OAuth] Userinfo received", {
        sub: userInfo.sub?.slice(0, 8),
        email: userInfo.email,
        email_verified: userInfo.email_verified
      });
      if (!userInfo.sub) {
        clearOAuthCookies();
        redirectOAuthError(res, "missing_sub");
        return;
      }
      if (userInfo.email_verified === false) {
        clearOAuthCookies();
        res.redirect(302, "/login-required?reason=unverified");
        return;
      }
      const turso = resolveTursoConfig();
      const mysql2 = resolveMysqlUrl();
      if (!turso && !mysql2) {
        console.error(
          "[Google OAuth] Database not configured \u2014 set TURSO_* or MYSQL_URL (legacy TiDB) on Vercel"
        );
      } else {
        console.info("[Google OAuth] Database targets", {
          turso: turso ? maskDatabaseUrl(turso.url) : null,
          mysql: mysql2 ? maskDatabaseUrl(mysql2) : null
        });
      }
      const dbReady = await initializeDatabase();
      if (!dbReady) {
        console.error("[Google OAuth] Database connection failed \u2014 check Turso env vars");
      }
      const login = await resolveGoogleLogin(userInfo);
      try {
        await upsertUser(login.upsert);
        console.info("[Google OAuth] User upserted", {
          openId: userInfo.sub.slice(0, 8),
          isApproved: login.isApproved,
          userStatus: login.userStatus
        });
      } catch (dbErr) {
        console.error("[Google OAuth] upsertUser failed:", dbErr);
        throw new Error(
          `Database upsert failed: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`
        );
      }
      const redirectPath = login.redirectPath;
      const sessionToken = await sdk.createSessionToken(login.sessionOpenId, {
        name: userInfo.name || userInfo.email || "User",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      clearOAuthCookies();
      console.info("[Google OAuth] Login complete, redirecting", { redirectPath });
      res.redirect(302, redirectPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : void 0;
      console.error("[Google OAuth] Callback failed", {
        message,
        stack,
        redirectUri,
        hasCode: true,
        clientIdPrefix: getGoogleClientId().slice(0, 12),
        hasJwtSecret: Boolean(readEnv("JWT_SECRET") || ENV.cookieSecret),
        hasDatabaseUrl: Boolean(readEnv("TURSO_DATABASE_URL") || readEnv("DATABASE_URL"))
      });
      clearOAuthCookies();
      redirectOAuthError(res, "callback_failed", { message });
    }
  });
}
var GOOGLE_OAUTH_STATE_COOKIE, GOOGLE_OAUTH_REDIRECT_COOKIE, GOOGLE_AUTH_ENDPOINT, GOOGLE_TOKEN_URL, GOOGLE_USERINFO_URL;
var init_oauth = __esm({
  "server/_core/oauth.ts"() {
    "use strict";
    init_const();
    init_db();
    init_cookies();
    init_env();
    init_googleLogin();
    init_sdk();
    GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
    GOOGLE_OAUTH_REDIRECT_COOKIE = "google_oauth_redirect_uri";
    GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
  }
});

// server/_core/llm.ts
async function invokeLLM(params) {
  const apiKey = assertApiKey();
  const {
    messages: messages4,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-pro",
    messages: messages4.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
var ensureArray, normalizeContentPart, normalizeMessage, normalizeToolChoice, resolveApiUrl, assertApiKey, normalizeResponseFormat;
var init_llm = __esm({
  "server/_core/llm.ts"() {
    "use strict";
    init_aiKeys();
    init_env();
    ensureArray = (value) => Array.isArray(value) ? value : [value];
    normalizeContentPart = (part) => {
      if (typeof part === "string") {
        return { type: "text", text: part };
      }
      if (part.type === "text") {
        return part;
      }
      if (part.type === "image_url") {
        return part;
      }
      if (part.type === "file_url") {
        return part;
      }
      throw new Error("Unsupported message content part");
    };
    normalizeMessage = (message) => {
      const { role, name, tool_call_id } = message;
      if (role === "tool" || role === "function") {
        const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
        return {
          role,
          name,
          tool_call_id,
          content
        };
      }
      const contentParts = ensureArray(message.content).map(normalizeContentPart);
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        return {
          role,
          name,
          content: contentParts[0].text
        };
      }
      return {
        role,
        name,
        content: contentParts
      };
    };
    normalizeToolChoice = (toolChoice, tools) => {
      if (!toolChoice) return void 0;
      if (toolChoice === "none" || toolChoice === "auto") {
        return toolChoice;
      }
      if (toolChoice === "required") {
        if (!tools || tools.length === 0) {
          throw new Error(
            "tool_choice 'required' was provided but no tools were configured"
          );
        }
        if (tools.length > 1) {
          throw new Error(
            "tool_choice 'required' needs a single tool or specify the tool name explicitly"
          );
        }
        return {
          type: "function",
          function: { name: tools[0].function.name }
        };
      }
      if ("name" in toolChoice) {
        return {
          type: "function",
          function: { name: toolChoice.name }
        };
      }
      return toolChoice;
    };
    resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
    assertApiKey = () => assertOpenAiApiKeyConfigured();
    normalizeResponseFormat = ({
      responseFormat,
      response_format,
      outputSchema,
      output_schema
    }) => {
      const explicitFormat = responseFormat || response_format;
      if (explicitFormat) {
        if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
          throw new Error(
            "responseFormat json_schema requires a defined schema object"
          );
        }
        return explicitFormat;
      }
      const schema = outputSchema || output_schema;
      if (!schema) return void 0;
      if (!schema.name || !schema.schema) {
        throw new Error("outputSchema requires both name and schema");
      }
      return {
        type: "json_schema",
        json_schema: {
          name: schema.name,
          schema: schema.schema,
          ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
        }
      };
    };
  }
});

// shared/llmChat.ts
function isVisionCapableGeminiModel(model) {
  const m = model.toLowerCase();
  return VISION_GEMINI_MODELS.some((v) => m.includes(v.replace("-latest", "")) || m === v);
}
function parseImagePayload(input) {
  if (!input?.trim()) return null;
  const trimmed = input.trim();
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
  if (dataUrlMatch) {
    return { mimeType: dataUrlMatch[1], base64: dataUrlMatch[2] };
  }
  return { mimeType: "image/jpeg", base64: trimmed };
}
var LLM_USER_ERROR_MESSAGE, VISION_GEMINI_MODELS;
var init_llmChat = __esm({
  "shared/llmChat.ts"() {
    "use strict";
    LLM_USER_ERROR_MESSAGE = "pilothub ai model \u1019\u103B\u102C\u1038 \u1015\u103C\u103F\u1014\u102C \u1021\u1014\u100A\u103A\u1038\u1004\u101A\u103A\u101B\u103E\u102D\u1015\u102B\u101E\u100A\u103A\u104B \u1014\u1031\u102C\u1000\u103A\u1019\u103E \u1015\u103C\u1014\u103A\u101C\u100A\u103A\u1005\u1019\u103A\u1038\u101E\u1015\u103A\u1015\u102B\u104B";
    VISION_GEMINI_MODELS = [
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.5-pro"
    ];
  }
});

// server/llmWithApiKey.ts
async function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`LLM request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
function chatHasImages(msgs) {
  return msgs.some((m) => m.role !== "system" && Boolean(m.imageBase64?.trim()));
}
function resolveGeminiModel(configured, hasImages) {
  if (hasImages && !isVisionCapableGeminiModel(configured)) {
    return DEFAULT_VISION_MODEL;
  }
  return configured;
}
async function invokeAdvisorLLM(advisorSlug, messages4) {
  try {
    return await _invokeAdvisorLLMInner(advisorSlug, messages4);
  } catch (err) {
    console.error("[LLM] invokeAdvisorLLM Generation Error Details:", err);
    throw err;
  }
}
async function _invokeAdvisorLLMInner(advisorSlug, messages4) {
  const envOpenAiKey = resolveOpenAiApiKey();
  const aiModel = await getAiModel(advisorSlug);
  const configuredModel = aiModel?.modelString ?? DEFAULT_VISION_MODEL;
  const hasImages = chatHasImages(messages4);
  const modelString = resolveGeminiModel(configuredModel, hasImages);
  const isGeminiModel = modelString.startsWith("gemini");
  console.log(`[LLM] advisor=${advisorSlug} model=${modelString} hasImages=${hasImages}`);
  const systemMsg = messages4.find((m) => m.role === "system");
  const systemPromptText = systemMsg?.content ?? "";
  const chatMessages = messages4.filter((m) => m.role !== "system").map((m) => ({
    role: m.role,
    content: m.content,
    imageBase64: m.imageBase64,
    imageMimeType: m.imageMimeType
  }));
  if (isGeminiModel) {
    const geminiKey = await getActiveApiKey("gemini");
    if (geminiKey?.keyValue) {
      try {
        console.log(`[LLM] Attempting Gemini primary model: ${modelString}`);
        return await invokeWithGemini({
          apiKey: geminiKey.keyValue,
          model: modelString,
          systemPrompt: systemPromptText,
          chatMessages
        });
      } catch (err) {
        console.error(`[LLM] Gemini primary model (${modelString}) failed:`, err);
      }
      if (modelString !== FALLBACK_VISION_MODEL) {
        try {
          console.log(`[LLM] Attempting Gemini fallback model: ${FALLBACK_VISION_MODEL}`);
          return await invokeWithGemini({
            apiKey: geminiKey.keyValue,
            model: FALLBACK_VISION_MODEL,
            systemPrompt: systemPromptText,
            chatMessages
          });
        } catch (err) {
          console.error(`[LLM] Gemini fallback model (${FALLBACK_VISION_MODEL}) also failed:`, err);
        }
      }
    } else {
      console.warn("[LLM] No Gemini API key found in database for advisor:", advisorSlug);
    }
  } else {
    const openaiKey = await getActiveApiKey("openai");
    const openAiApiKey = openaiKey?.keyValue?.trim() || envOpenAiKey;
    if (openAiApiKey) {
      try {
        console.log(`[LLM] Attempting OpenAI model: ${modelString}`);
        return await invokeWithOpenAI({
          apiKey: openAiApiKey,
          model: modelString,
          systemPrompt: systemPromptText,
          chatMessages
        });
      } catch (err) {
        console.error("[LLM] OpenAI key failed, trying Gemini:", err);
      }
    }
    const geminiKey = await getActiveApiKey("gemini");
    if (geminiKey?.keyValue) {
      try {
        console.log(`[LLM] Attempting Gemini cross-fallback model: ${DEFAULT_VISION_MODEL}`);
        return await invokeWithGemini({
          apiKey: geminiKey.keyValue,
          model: resolveGeminiModel(DEFAULT_VISION_MODEL, hasImages),
          systemPrompt: systemPromptText,
          chatMessages
        });
      } catch (err) {
        console.error("[LLM] Gemini cross-fallback also failed:", err);
      }
    }
  }
  if (envOpenAiKey && !isGeminiModel) {
    try {
      console.log("[LLM] Attempting env OPENAI_API_KEY fallback");
      return await invokeWithOpenAI({
        apiKey: assertOpenAiApiKeyConfigured(),
        model: modelString,
        systemPrompt: systemPromptText,
        chatMessages
      });
    } catch (err) {
      console.error("[LLM] Env OPENAI_API_KEY fallback also failed:", err);
    }
  }
  console.log("[LLM] All key-based paths exhausted, attempting platform built-in LLM");
  const fallbackMessages = messages4.map((m) => ({
    role: m.role,
    content: m.content
  }));
  assertOpenAiApiKeyConfigured();
  const response = await invokeLLM({ messages: fallbackMessages });
  const content = response.choices[0]?.message?.content;
  return typeof content === "string" ? content : "Sorry, I could not generate a response.";
}
async function invokeWithOpenAI(params) {
  const messages4 = [];
  if (params.systemPrompt) {
    messages4.push({ role: "system", content: params.systemPrompt });
  }
  const sanitizedChat = sanitizeChatMessages(params.chatMessages);
  for (const msg of sanitizedChat) {
    const image = parseImagePayload(msg.imageBase64);
    if (image && msg.role === "user") {
      const parts = [];
      if (msg.content.trim()) {
        parts.push({ type: "text", text: msg.content });
      }
      parts.push({
        type: "image_url",
        image_url: { url: `data:${image.mimeType};base64,${image.base64}` }
      });
      messages4.push({ role: "user", content: parts });
    } else {
      messages4.push({ role: msg.role, content: msg.content });
    }
  }
  const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${params.apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      messages: messages4,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} \u2013 ${errorText}`);
  }
  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  return typeof content === "string" ? content : "No response";
}
function buildGeminiParts(msg) {
  const parts = [];
  if (msg.content.trim()) {
    parts.push({ text: msg.content });
  }
  const image = parseImagePayload(msg.imageBase64);
  if (image) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64
      }
    });
  }
  if (parts.length === 0) {
    parts.push({ text: "(no text)" });
  }
  return parts;
}
async function invokeWithGemini(params) {
  const sanitizedChat = sanitizeChatMessages(params.chatMessages);
  const geminiContents = sanitizedChat.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: buildGeminiParts(m)
  }));
  if (geminiContents.length === 0 || geminiContents[geminiContents.length - 1].role !== "user") {
    throw new Error("Gemini requires the last message to be from the user");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`;
  const body = {
    contents: geminiContents,
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      topP: 0.8,
      topK: 40
    }
  };
  if (params.systemPrompt && params.systemPrompt.trim().length > 0) {
    body.systemInstruction = {
      role: "user",
      parts: [{ text: params.systemPrompt }]
    };
  }
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} \u2013 ${errorText}`);
  }
  const data = await response.json();
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new Error(`Gemini returned no candidates. Block reason: ${blockReason ?? "unknown"}`);
  }
  const text3 = candidate?.content?.parts?.[0]?.text;
  return typeof text3 === "string" && text3.trim().length > 0 ? text3 : "No response generated.";
}
function sanitizeChatMessages(messages4) {
  if (messages4.length === 0) return messages4;
  const result = [];
  for (const msg of messages4) {
    const last = result[result.length - 1];
    if (last && last.role === msg.role) {
      last.content = `${last.content}

${msg.content}`;
      if (msg.imageBase64 && !last.imageBase64) {
        last.imageBase64 = msg.imageBase64;
        last.imageMimeType = msg.imageMimeType;
      }
    } else {
      result.push({ ...msg });
    }
  }
  return result;
}
var TEMPERATURE, MAX_OUTPUT_TOKENS, DEFAULT_VISION_MODEL, FALLBACK_VISION_MODEL, FETCH_TIMEOUT_MS;
var init_llmWithApiKey = __esm({
  "server/llmWithApiKey.ts"() {
    "use strict";
    init_aiKeys();
    init_db();
    init_llm();
    init_llmChat();
    TEMPERATURE = 0.3;
    MAX_OUTPUT_TOKENS = 4096;
    DEFAULT_VISION_MODEL = "gemini-2.5-pro";
    FALLBACK_VISION_MODEL = "gemini-2.5-flash";
    FETCH_TIMEOUT_MS = 55e3;
  }
});

// shared/chatSafety.ts
function buildAdvisorSafetySuffix(advisor) {
  const purpose = ADVISOR_PURPOSE[advisor];
  return `
${GLOBAL_SAFETY_PROMPT_BLOCK}

### Advisor-specific refusal templates (use verbatim meaning)

Burmese refusal:
${REFUSAL_TEMPLATE_MY(purpose.my, "[\u1021\u1011\u1000\u103A\u1016\u1031\u102C\u103A\u1015\u103C\u1011\u102C\u1038\u101E\u1031\u102C \u1000\u102C\u1000\u103D\u101A\u103A\u101B\u1019\u100A\u1037\u103A \u1001\u1031\u102B\u1004\u103A\u1038\u1005\u1009\u103A]")}

English refusal:
${REFUSAL_TEMPLATE_EN(purpose.en, "[protected topic listed above]")}
`.trim();
}
function appendAdvisorSafetyPrompt(basePrompt, advisor) {
  return `${basePrompt.trim()}

${buildAdvisorSafetySuffix(advisor)}`;
}
var ADVISOR_PURPOSE, REFUSAL_TEMPLATE_MY, REFUSAL_TEMPLATE_EN, GLOBAL_SAFETY_PROMPT_BLOCK;
var init_chatSafety = __esm({
  "shared/chatSafety.ts"() {
    "use strict";
    ADVISOR_PURPOSE = {
      bizpilot: {
        en: "Myanmar business strategy, operations, and growth",
        my: "\u1019\u103C\u1014\u103A\u1019\u102C\u1005\u102E\u1038\u1015\u103D\u102C\u1038\u101B\u1031\u1038 \u1017\u103B\u1030\u101F\u102C\u104A \u101C\u102F\u1015\u103A\u1004\u1014\u103A\u1038\u101C\u100A\u103A\u1015\u1010\u103A\u1019\u103E\u102F\u1014\u103E\u1004\u1037\u103A \u1000\u103C\u102E\u1038\u1011\u103D\u102C\u1038\u1019\u103E\u102F"
      },
      founderpilot: {
        en: "startup leadership, fundraising, and founder strategy",
        my: "\u1005\u1010\u102C\u1038\u1010\u1015\u103A\u1001\u1031\u102B\u1004\u103A\u1038\u1006\u1031\u102C\u1004\u103A\u104A \u101B\u1014\u103A\u1015\u102F\u1036\u1004\u103D\u1031\u101B\u103E\u102C\u1016\u103D\u1031\u1019\u103E\u102F\u1014\u103E\u1004\u1037\u103A \u1016\u1031\u102C\u1004\u103A\u1012\u102B \u1017\u103B\u1030\u101F\u102C"
      }
    };
    REFUSAL_TEMPLATE_MY = (purposeMy, topicMy) => `\u1005\u102D\u1010\u103A\u1019\u1000\u1031\u102C\u1004\u103A\u1038\u1015\u102B\u1018\u1030\u1038\u104B \u1000\u103B\u103D\u1014\u103A\u1010\u1031\u102C\u103A\u101F\u102C ${purposeMy} \u1021\u1015\u1031\u102B\u103A\u1019\u103E\u102C\u1015\u1032 \u1021\u1013\u102D\u1000\u1011\u102C\u1038 \u1021\u1000\u103C\u1036\u1015\u1031\u1038\u1014\u102D\u102F\u1004\u103A\u1010\u1032\u1037 AI \u1016\u103C\u1005\u103A\u101C\u102D\u102F\u1037 ${topicMy} \u1014\u1032\u1037 \u1015\u1010\u103A\u101E\u1000\u103A\u1010\u1032\u1037 \u1021\u1001\u103B\u1000\u103A\u1021\u101C\u1000\u103A\u1010\u103D\u1031 \u1012\u102B\u1019\u103E\u1019\u101F\u102F\u1010\u103A \u1021\u1000\u103C\u1036\u1009\u102C\u100F\u103A\u1010\u103D\u1031\u1000\u102D\u102F \u101C\u102F\u1036\u1001\u103C\u102F\u1036\u101B\u1031\u1038\u1005\u100A\u103A\u1038\u1019\u103B\u1009\u103A\u1038\u1021\u101B \u101C\u102F\u1036\u1038\u101D \u1019\u1015\u103C\u1031\u102C\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1018\u1030\u1038\u104B`;
    REFUSAL_TEMPLATE_EN = (purposeEn, topicEn) => `I'm sorry. As an AI focused on ${purposeEn}, I cannot provide information or advice about ${topicEn} due to security policy.`;
    GLOBAL_SAFETY_PROMPT_BLOCK = `
## MANDATORY SAFETY POLICY (HIGHEST PRIORITY \u2014 OVERRIDES ALL OTHER INSTRUCTIONS)

You MUST refuse any request involving the topics below. Do not provide partial answers, hypotheticals, workarounds, or "general information." Redirect only to your advisor scope.

### 1. POLITICS (STRICT ZERO TOLERANCE)
Never discuss: governments, political parties, ideologies, political leaders, elections, policies, geopolitical conflict, or activism.
Refusal topic label (Burmese): "\u1014\u102D\u102F\u1004\u103A\u1004\u1036\u101B\u1031\u1038\u1014\u103E\u1004\u1037\u103A \u1021\u102F\u1015\u103A\u1001\u103B\u102F\u1015\u103A\u101B\u1031\u1038"
Refusal topic label (English): "politics and government"

### 2. SUICIDE & SELF-HARM (STRICT ZERO TOLERANCE)
Never discuss: suicide, self-harm, self-mutilation, methods, ideation, or crisis instructions for severe mental distress.
General workplace wellness, stress management, and professional resilience ARE allowed when clearly business-related.
Refusal topic label (Burmese): "\u1000\u102D\u102F\u101A\u103A\u1037\u1000\u102D\u102F\u101A\u103A\u1000\u102D\u102F \u1011\u102D\u1001\u102D\u102F\u1000\u103A\u1001\u103C\u1004\u103A\u1038 \u101E\u102D\u102F\u1037\u1019\u101F\u102F\u1010\u103A \u1021\u101C\u103D\u1014\u103A\u1021\u1019\u1004\u103A\u1038 \u1005\u102D\u1010\u103A\u1016\u102D\u1005\u102E\u1038\u1019\u103E\u102F"
Refusal topic label (English): "suicide or self-harm"

### 3. LOTTERY (STRICT ZERO TOLERANCE)
Never provide: lottery number predictions, gambling strategies, odds analysis, or "lucky number" advice for any lottery.
Refusal topic label (Burmese): "\u1011\u102E\u1015\u1031\u102B\u1000\u103A\u1019\u103E\u102F \u1001\u1014\u1037\u103A\u1019\u103E\u1014\u103A\u1038\u1001\u103C\u1004\u103A\u1038"
Refusal topic label (English): "lottery predictions"

### REQUIRED REFUSAL FORMAT
When refusing, reply in the user's language (Burmese and/or English as appropriate) using this exact meaning:

Burmese: [Use the advisor-specific template provided in the next section]
English: [Use the advisor-specific English template provided in the next section]

Do not preach, moralize, or cite policy numbers. Keep refusals brief and offer one on-scope alternative question.
`.trim();
  }
});

// shared/telegramConfig.ts
var telegramConfig_exports = {};
__export(telegramConfig_exports, {
  TELEGRAM_BOT_USERNAME_PLACEHOLDER: () => TELEGRAM_BOT_USERNAME_PLACEHOLDER,
  TELEGRAM_SUPPORT_BOT_USERNAME_DEFAULT: () => TELEGRAM_SUPPORT_BOT_USERNAME_DEFAULT,
  buildTelegramStartLink: () => buildTelegramStartLink,
  buildTelegramSupportLink: () => buildTelegramSupportLink,
  isFounderTelegramPlan: () => isFounderTelegramPlan,
  isTelegramBotUsernameConfigured: () => isTelegramBotUsernameConfigured,
  normalizeTelegramBotUsername: () => normalizeTelegramBotUsername,
  resolveTelegramActivationBotUsername: () => resolveTelegramActivationBotUsername,
  resolveTelegramBizBotUsername: () => resolveTelegramBizBotUsername,
  resolveTelegramFounderBotUsername: () => resolveTelegramFounderBotUsername,
  resolveTelegramSupportBotUsername: () => resolveTelegramSupportBotUsername
});
function normalizeTelegramBotUsername(raw) {
  return (raw ?? "").trim().replace(/^@/, "");
}
function resolveTelegramBizBotUsername(env) {
  const username = normalizeTelegramBotUsername(env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME) || normalizeTelegramBotUsername(env.VITE_TELEGRAM_BOT_USERNAME) || normalizeTelegramBotUsername(env.TELEGRAM_BIZPILOT_BOT_USERNAME) || normalizeTelegramBotUsername(env.TELEGRAM_BIZ_BOT_USERNAME) || normalizeTelegramBotUsername(env.TELEGRAM_BOT_USERNAME) || "";
  return username || TELEGRAM_BOT_USERNAME_PLACEHOLDER;
}
function resolveTelegramFounderBotUsername(env) {
  const username = normalizeTelegramBotUsername(env.NEXT_PUBLIC_TELEGRAM_FOUNDERPILOT_USERNAME) || normalizeTelegramBotUsername(env.NEXT_PUBLIC_TELEGRAM_FOUNDER_BOT_USERNAME) || normalizeTelegramBotUsername(env.VITE_TELEGRAM_FOUNDERPILOT_USERNAME) || normalizeTelegramBotUsername(env.VITE_TELEGRAM_FOUNDER_BOT_USERNAME) || normalizeTelegramBotUsername(env.TELEGRAM_FOUNDERPILOT_BOT_USERNAME) || normalizeTelegramBotUsername(env.TELEGRAM_FOUNDER_BOT_USERNAME) || "";
  return username || null;
}
function isFounderTelegramPlan(planType) {
  return (planType ?? "").toLowerCase().includes("founder");
}
function resolveTelegramActivationBotUsername(env, planType, botUsernameOverride) {
  const override = normalizeTelegramBotUsername(botUsernameOverride);
  if (override) return override;
  if (isFounderTelegramPlan(planType)) {
    const founder = resolveTelegramFounderBotUsername(env);
    if (founder) return founder;
  }
  return resolveTelegramBizBotUsername(env);
}
function isTelegramBotUsernameConfigured(username) {
  return Boolean(username) && username !== TELEGRAM_BOT_USERNAME_PLACEHOLDER;
}
function buildTelegramStartLink(token, botUsername) {
  const user = normalizeTelegramBotUsername(botUsername) || TELEGRAM_BOT_USERNAME_PLACEHOLDER;
  return `https://t.me/${user}?start=${token}`;
}
function resolveTelegramSupportBotUsername(env) {
  const username = normalizeTelegramBotUsername(env.VITE_TELEGRAM_SUPPORT_BOT_USERNAME) || normalizeTelegramBotUsername(env.NEXT_PUBLIC_TELEGRAM_SUPPORT_BOT_USERNAME) || normalizeTelegramBotUsername(env.TELEGRAM_SUPPORT_BOT_USERNAME) || "";
  return username || TELEGRAM_SUPPORT_BOT_USERNAME_DEFAULT;
}
function buildTelegramSupportLink(env) {
  return `https://t.me/${resolveTelegramSupportBotUsername(env)}`;
}
var TELEGRAM_BOT_USERNAME_PLACEHOLDER, TELEGRAM_SUPPORT_BOT_USERNAME_DEFAULT;
var init_telegramConfig = __esm({
  "shared/telegramConfig.ts"() {
    "use strict";
    TELEGRAM_BOT_USERNAME_PLACEHOLDER = "YOUR_BOT_USERNAME";
    TELEGRAM_SUPPORT_BOT_USERNAME_DEFAULT = "chatpilot_ai_bot";
  }
});

// server/telegram.ts
var telegram_exports = {};
__export(telegram_exports, {
  TELEGRAM_BOT_USERNAME_PLACEHOLDER: () => TELEGRAM_BOT_USERNAME_PLACEHOLDER,
  TELEGRAM_WEBHOOK_PATH: () => TELEGRAM_WEBHOOK_PATH,
  buildTelegramActivationLink: () => buildTelegramActivationLink,
  generateTelegramActivationToken: () => generateTelegramActivationToken,
  getTelegramBizBotUsername: () => getTelegramBizBotUsername,
  getTelegramBotToken: () => getTelegramBotToken,
  getTelegramFounderBotUsername: () => getTelegramFounderBotUsername,
  isFounderAdvisorQuery: () => isFounderAdvisorQuery,
  parseAdvisorFromRequest: () => parseAdvisorFromRequest,
  registerTelegramRoutes: () => registerTelegramRoutes,
  resolveActivationBotUsername: () => resolveActivationBotUsername,
  resolveWebhookBaseUrl: () => resolveWebhookBaseUrl,
  setupTelegramWebhook: () => setupTelegramWebhook
});
import { nanoid } from "nanoid";
function isFounderAdvisorQuery(advisorQuery) {
  return (advisorQuery ?? "").toLowerCase().includes("founder");
}
function getTelegramBotToken(advisor) {
  if (advisor === "founderpilot" || isFounderAdvisorQuery(advisor)) {
    return process.env.TELEGRAM_BOT_TOKEN_FOUNDER?.trim() || process.env.TELEGRAM_FOUNDERPILOT_TOKEN?.trim() || process.env.TELEGRAM_FOUNDER_BOT_TOKEN?.trim();
  }
  return process.env.TELEGRAM_BOT_TOKEN_BIZ?.trim() || process.env.TELEGRAM_BIZPILOT_TOKEN?.trim() || process.env.TELEGRAM_BIZ_BOT_TOKEN?.trim();
}
function parseAdvisorFromRequest(req) {
  const raw = `${req.originalUrl ?? ""} ${req.url ?? ""}`.toLowerCase();
  if (raw.includes("founder")) return "founderpilot";
  if (raw.includes("bizpilot")) return "bizpilot";
  return "bizpilot";
}
function extractAdvisorQuery(req) {
  const raw = `${req.originalUrl ?? ""} ${req.url ?? ""}`.toLowerCase();
  if (raw.includes("founderpilot") || raw.includes("founder")) return "founderpilot";
  if (raw.includes("bizpilot")) return "bizpilot";
  const q = req.query?.advisor;
  if (typeof q === "string" && q.trim()) return q.trim();
  if (Array.isArray(q) && typeof q[0] === "string" && q[0].trim()) return q[0].trim();
  return void 0;
}
function resolveActivationBotUsername(planType, botUsernameOverride) {
  return resolveTelegramActivationBotUsername(
    process.env,
    planType,
    botUsernameOverride
  );
}
function parseStartToken(text3) {
  const trimmed = text3.trim();
  if (!trimmed.startsWith("/start")) return null;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;
  return parts[1].replace(/^@/, "").trim() || null;
}
function isBareStartCommand(text3) {
  return /^\s*\/start(?:@[\w_]+)?\s*$/i.test(text3.trim());
}
function extractChatId(update) {
  const id = update?.message?.chat?.id;
  return id != null ? String(id) : void 0;
}
async function sendTelegramMessage(botToken, chatId, text3) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text3,
          reply_markup: PERSISTENT_REPLY_KEYBOARD
        })
      },
      3e4
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
async function sendTypingChatAction(botToken, chatId) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action: "typing" })
      },
      15e3
    );
    if (!response.ok) {
      const body = await response.text();
      console.warn("[Telegram] sendChatAction typing failed:", response.status, body);
    }
  } catch (err) {
    console.warn("[Telegram] sendChatAction error:", err);
  }
}
async function handleStartLink(chatId, token, botToken) {
  const activation = await getActivationToken(token);
  if (!activation || activation.isUsed === "true") {
    await sendTelegramMessage(botToken, chatId, INVALID_TOKEN_MSG);
    return;
  }
  const user = await getUserById(activation.userId);
  if (!user) {
    await sendTelegramMessage(botToken, chatId, INVALID_TOKEN_MSG);
    return;
  }
  await linkTelegramChat(user.id, chatId);
  await markActivationTokenUsed(activation.id);
  await sendTelegramMessage(botToken, chatId, LINK_SUCCESS_MSG);
}
async function sendLlmFailureReply(botToken, chatId) {
  const sent = await sendTelegramMessage(botToken, chatId, LLM_USER_ERROR_MESSAGE);
  if (!sent) {
    console.error("[Telegram] Failed to deliver LLM error message to chat:", chatId);
  }
}
async function handleChatMessage(chatId, userText, advisorSlug, advisorQuery, botToken) {
  try {
    const user = await safeGetUserByTelegramChatId(chatId);
    if (!user) {
      await sendTelegramMessage(botToken, chatId, NO_USER_FOUND_MSG);
      return;
    }
    const isBiz = advisorSlug === "bizpilot";
    const rawLimit = isBiz ? user.bizMessageLimit : user.founderMessageLimit;
    const isUnlimited = isUnlimitedTelegramLimit(rawLimit);
    const currentLimit = coerceTelegramMessageLimit(rawLimit);
    const isExpired = !isTelegramPlanActive(user.planExpiryDate ?? null);
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
      isExpired
    });
    if (isUnlimited) {
      if (isExpired) {
        console.log("[Telegram] Unlimited plan expired \u2014 denying access", {
          userId: user.id,
          chatId,
          isBiz
        });
        await sendTelegramMessage(botToken, chatId, NO_ACCESS_MSG);
        return;
      }
    } else if (currentLimit <= 0 || isExpired) {
      console.log("[Telegram] Credit check failed \u2014 denying access", {
        userId: user.id,
        advisorQuery,
        advisorSlug,
        currentLimit,
        isExpired
      });
      await sendTelegramMessage(botToken, chatId, NO_ACCESS_MSG);
      return;
    }
    const systemPrompt = await getActiveSystemPrompt(advisorSlug);
    const fallback = advisorSlug === "bizpilot" ? "You are BizPilot, an expert business advisor for Myanmar businesses." : "You are FounderPilot, a strategic advisor for founders and CEOs.";
    const profileCtx = [
      `

[User Profile]`,
      `- Name: ${user.name ?? "Unknown"}`,
      user.businessName ? `- Business Name: ${user.businessName}` : null,
      user.businessType ? `- Business Type: ${user.businessType}` : null,
      user.useCase ? `- How they use PilotHub: ${user.useCase}` : null,
      `- Channel: Telegram (${advisorSlug})`
    ].filter(Boolean).join("\n");
    const history = await listRecentTelegramLlmTurnsForAdvisor(user.id, advisorSlug, 40);
    const llmMessages = [
      {
        role: "system",
        content: appendAdvisorSafetyPrompt((systemPrompt || fallback) + profileCtx, advisorSlug)
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: userText }
    ];
    void sendTypingChatAction(botToken, chatId).catch(() => {
    });
    let reply;
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
        advisorSlug
      });
      await sendLlmFailureReply(botToken, chatId);
      return;
    }
    if (isUnlimited) {
      console.log("[Telegram] Unlimited plan \u2014 skip limit decrement", { chatId, isBiz });
    } else {
      try {
        await decrementTelegramMessageLimit(user.id, isBiz);
        console.log("Successfully decremented limit for chat:", chatId, "isBiz:", isBiz);
      } catch (err) {
        console.error("[Telegram] Failed to decrement message limit:", {
          chatId,
          userId: user.id,
          isBiz,
          advisorSlug,
          err
        });
      }
    }
    try {
      await appendTelegramLlmTurnPair(user.id, advisorSlug, userText, reply);
    } catch (err) {
      console.error("[Telegram] appendTelegramLlmTurnPair failed (reply already sent):", err);
    }
  } catch (err) {
    console.error("[Telegram Webhook] Error: ", err);
    await sendLlmFailureReply(botToken, chatId);
  }
}
async function safeGetUserByTelegramChatId(chatId) {
  try {
    return await getUserByTelegramChatId(chatId);
  } catch (err) {
    console.error("[Telegram] getUserByTelegramChatId failed:", err);
    return void 0;
  }
}
async function handleBareStart(chatId, botToken) {
  const user = await safeGetUserByTelegramChatId(chatId);
  if (!user) {
    await sendTelegramMessage(botToken, chatId, NO_USER_FOUND_MSG);
    return;
  }
  await sendTelegramMessage(botToken, chatId, ALREADY_LINKED_MSG);
}
async function processUpdate(update, advisorSlug, advisorQuery, botToken) {
  const message = update?.message;
  if (!message?.text) {
    console.log("[Telegram] Ignoring update without text message");
    return;
  }
  const chatId = String(message.chat.id);
  const text3 = message.text;
  if (isBareStartCommand(text3)) {
    await handleBareStart(chatId, botToken);
    return;
  }
  const startToken = parseStartToken(text3);
  if (startToken) {
    await handleStartLink(chatId, startToken, botToken);
    return;
  }
  if (text3.startsWith("/")) {
    console.log("[Telegram] Ignoring unhandled command:", text3.slice(0, 32));
    return;
  }
  await handleChatMessage(chatId, text3, advisorSlug, advisorQuery, botToken);
}
async function processTelegramWebhook(req) {
  let botToken;
  let chatId;
  try {
    const update = req.body ?? {};
    const advisorQuery = extractAdvisorQuery(req);
    const advisor = parseAdvisorFromRequest(req);
    botToken = getTelegramBotToken(advisor);
    console.log("[Telegram Webhook] Advisor:", advisor, "Token exists:", !!botToken);
    const body = req.body;
    if (body?.message?.text === CONTACT_TEAM_BUTTON_TEXT) {
      await ensureTelegramSchema();
      chatId = body.message.chat?.id != null ? String(body.message.chat.id) : void 0;
      if (botToken && chatId) {
        await sendTelegramMessage(botToken, chatId, CONTACT_TEAM_REPLY_MSG);
      } else if (!botToken) {
        console.error(
          `[Telegram] No bot token for ${advisor}. Set TELEGRAM_BIZPILOT_TOKEN / TELEGRAM_BOT_TOKEN_BIZ or TELEGRAM_FOUNDERPILOT_TOKEN / TELEGRAM_BOT_TOKEN_FOUNDER.`
        );
      }
      return;
    }
    await ensureTelegramSchema();
    if (!botToken) {
      console.error(
        `[Telegram] No bot token for ${advisor}. Set TELEGRAM_BIZPILOT_TOKEN / TELEGRAM_BOT_TOKEN_BIZ or TELEGRAM_FOUNDERPILOT_TOKEN / TELEGRAM_BOT_TOKEN_FOUNDER.`
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
function registerTelegramRoutes(app2) {
  const webhookHandler = (req, res) => {
    console.log(
      "[CRITICAL] Webhook Hit! URL:",
      req.url,
      "Original:",
      req.originalUrl,
      "Query:",
      req.query
    );
    res.status(200).send("OK");
    void processTelegramWebhook(req).catch((err) => {
      console.error("[Telegram Webhook] Background processing error:", err);
    });
  };
  app2.post(TELEGRAM_WEBHOOK_PATH, webhookHandler);
  app2.post(`${TELEGRAM_WEBHOOK_PATH}/`, webhookHandler);
  app2.post("/api", webhookHandler);
}
function getTelegramBizBotUsername() {
  return resolveTelegramBizBotUsername(process.env);
}
function getTelegramFounderBotUsername() {
  return resolveTelegramFounderBotUsername(process.env);
}
function buildTelegramActivationLink(token, botUsername, planType) {
  const username = resolveActivationBotUsername(planType, botUsername);
  return buildTelegramStartLink(token, username);
}
function resolveWebhookBaseUrl(req) {
  const explicit = process.env.WEBHOOK_BASE_URL?.trim() || process.env.PUBLIC_APP_URL?.trim();
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
    "Cannot determine public URL. Set WEBHOOK_BASE_URL or PUBLIC_APP_URL (e.g. https://your-domain.com)"
  );
}
function assertPublicWebhookBaseUrl(baseUrl) {
  let host = "";
  try {
    host = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    throw new Error(`Invalid webhook base URL: ${baseUrl}`);
  }
  if (host.endsWith("-projects.vercel.app")) {
    throw new Error(
      `Webhook base URL must be your production domain (e.g. https://pilothub.vip), not a Vercel preview URL (${host}). Set PUBLIC_APP_URL=https://pilothub.vip in Vercel env, then run Setup Bot from the live admin panel.`
    );
  }
}
async function setupTelegramWebhook(advisor, baseUrl) {
  const botToken = getTelegramBotToken(advisor);
  if (!botToken) {
    throw new Error(
      advisor === "bizpilot" ? "TELEGRAM_BIZPILOT_TOKEN is not set in environment" : "TELEGRAM_FOUNDERPILOT_TOKEN is not set in environment"
    );
  }
  assertPublicWebhookBaseUrl(baseUrl);
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook?advisor=${advisor}`;
  const apiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true })
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description ?? `Telegram setWebhook failed (${response.status})`);
  }
  console.info("[Telegram] Webhook registered", { advisor, webhookUrl });
  return { ok: true, webhookUrl, description: data.description };
}
async function generateTelegramActivationToken(userId, botUsername, planType = "bizpilot") {
  await ensureTelegramSchema();
  const token = nanoid(32);
  const row = await createBotActivationToken(userId, token);
  const activationLink = buildTelegramActivationLink(token, botUsername, planType);
  const founderBot = getTelegramFounderBotUsername();
  const bizBot = getTelegramBizBotUsername();
  return {
    token: row.token,
    userId: row.userId,
    activationLink,
    deepLinkBiz: buildTelegramActivationLink(token, bizBot, "bizpilot"),
    deepLinkFounder: founderBot ? buildTelegramActivationLink(token, founderBot, "founderpilot") : null
  };
}
var TELEGRAM_WEBHOOK_PATH, NO_ACCESS_MSG, NO_USER_FOUND_MSG, LINK_SUCCESS_MSG, INVALID_TOKEN_MSG, ALREADY_LINKED_MSG, CONTACT_TEAM_BUTTON_TEXT, CONTACT_TEAM_REPLY_MSG, PERSISTENT_REPLY_KEYBOARD;
var init_telegram = __esm({
  "server/telegram.ts"() {
    "use strict";
    init_oauth();
    init_db();
    init_ensureTelegramSchema();
    init_llmWithApiKey();
    init_chatSafety();
    init_llmChat();
    init_telegramConfig();
    init_telegramPlans();
    TELEGRAM_WEBHOOK_PATH = "/api/telegram/webhook";
    NO_ACCESS_MSG = "\u101C\u1030\u1000\u103C\u102E\u1038\u1019\u1004\u103A\u1038\u104F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1001\u103D\u1004\u1037\u103A \u1000\u102F\u1014\u103A\u1006\u102F\u1036\u1038\u101E\u103D\u102C\u1038\u1015\u102B\u1015\u103C\u102E\u104B \u1011\u1015\u103A\u1019\u1036\u101D\u101A\u103A\u101A\u1030\u101B\u1014\u103A ChatPilot \u101E\u102D\u102F\u1037 \u1006\u1000\u103A\u101E\u103D\u101A\u103A\u1015\u102B\u104B";
    NO_USER_FOUND_MSG = "\u1012\u102E Bot \u1000\u102D\u102F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1016\u102D\u102F\u1037 Website \u1019\u103E\u102C \u1021\u101B\u1004\u103A Register \u101C\u102F\u1015\u103A\u1015\u1031\u1038\u1015\u102B \u101E\u102D\u102F\u1037\u1019\u101F\u102F\u1010\u103A ChatPilot Agency \u101E\u102D\u102F\u1037 \u1006\u1000\u103A\u101E\u103D\u101A\u103A\u1015\u102B\u104B";
    LINK_SUCCESS_MSG = "\u1021\u1000\u1031\u102C\u1004\u1037\u103A\u1001\u103B\u102D\u1010\u103A\u1006\u1000\u103A\u1019\u103E\u102F \u1021\u1031\u102C\u1004\u103A\u1019\u103C\u1004\u103A\u1015\u102B\u101E\u100A\u103A\u104B \u1005\u1010\u1004\u103A\u1019\u1031\u1038\u1019\u103C\u1014\u103A\u1038\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1015\u103C\u102E\u104B";
    INVALID_TOKEN_MSG = "\u1001\u103B\u102D\u1010\u103A\u1006\u1000\u103A\u1019\u103E\u102F\u1019\u1021\u1031\u102C\u1004\u103A\u1019\u103C\u1004\u103A\u1015\u102B\u104B Admin \u1011\u1036\u1019\u103E \u101B\u101B\u103E\u102D\u101E\u1031\u102C activation link \u1000\u102D\u102F \u1015\u103C\u1014\u103A\u1005\u1019\u103A\u1038\u1000\u103C\u100A\u1037\u103A\u1015\u102B\u104B";
    ALREADY_LINKED_MSG = "\u1021\u1000\u1031\u102C\u1004\u1037\u103A \u1001\u103B\u102D\u1010\u103A\u1006\u1000\u103A\u1015\u103C\u102E\u1038\u101E\u102C\u1038\u1016\u103C\u1005\u103A\u1015\u102B\u101E\u100A\u103A\u104B \u1005\u102C\u101E\u102C\u1038\u1015\u102D\u102F\u1037\u1015\u103C\u102E\u1038 \u1019\u1031\u1038\u1019\u103C\u1014\u103A\u1038\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1015\u103C\u102E\u104B";
    CONTACT_TEAM_BUTTON_TEXT = "\u{1F4DE} ChatPilot Team \u101E\u102D\u102F\u1037 \u1006\u1000\u103A\u101E\u103D\u101A\u103A\u101B\u1014\u103A";
    CONTACT_TEAM_REPLY_MSG = `\u1019\u100A\u103A\u101E\u100A\u1037\u103A\u1021\u1000\u103C\u1031\u102C\u1004\u103A\u1038\u1021\u101B\u102C\u1021\u1010\u103D\u1000\u103A \u1006\u1000\u103A\u101E\u103D\u101A\u103A\u101C\u102D\u102F\u1015\u102B\u101E\u101C\u1032 \u1001\u1004\u103A\u1017\u103B\u102C? \u{1F447}

\u1041\u104B \u{1F48E} \u1021\u1000\u1031\u102C\u1004\u1037\u103A\u101E\u1000\u103A\u1010\u1019\u103A\u1038 (\u101E\u102D\u102F\u1037) \u1021\u1000\u103C\u102D\u1019\u103A\u101B\u1031 \u1010\u102D\u102F\u1038\u101B\u1014\u103A
\u{1F449} https://t.me/chatpilot_ai_bot?text=\u1019\u1004\u103A\u1039\u1002\u101C\u102C\u1015\u102B\u104A%20\u1021\u1000\u1031\u102C\u1004\u1037\u103A\u101E\u1000\u103A\u1010\u1019\u103A\u1038\u1010\u102D\u102F\u1038\u1001\u103B\u1004\u103A\u101C\u102D\u102F\u1037\u1015\u102B

\u1042\u104B \u{1F4AC} \u1021\u1001\u103C\u102C\u1038\u101E\u102D\u101C\u102D\u102F\u101E\u100A\u103A\u1019\u103B\u102C\u1038 \u1019\u1031\u1038\u1019\u103C\u1014\u103A\u1038\u101B\u1014\u103A
\u{1F449} https://t.me/chatpilot_ai_bot?text=\u1019\u1004\u103A\u1039\u1002\u101C\u102C\u1015\u102B\u104A%20\u1021\u1001\u103C\u102C\u1038\u1021\u1000\u103C\u1031\u102C\u1004\u103A\u1038\u1021\u101B\u102C\u101C\u1031\u1038%20\u1019\u1031\u1038\u1001\u103B\u1004\u103A\u101C\u102D\u102F\u1037\u1015\u102B`;
    PERSISTENT_REPLY_KEYBOARD = {
      keyboard: [[{ text: CONTACT_TEAM_BUTTON_TEXT }]],
      resize_keyboard: true,
      is_persistent: true
    };
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storageGet: () => storageGet,
  storageGetSignedUrl: () => storageGetSignedUrl,
  storagePut: () => storagePut
});
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}
async function storageGet(relKey) {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}
async function storageGetSignedUrl(relKey) {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);
  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }
  const { url } = await resp.json();
  return url;
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// scripts/vercel-api-entry.ts
import "dotenv/config";

// server/_core/app.ts
init_oauth();
import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/storageProxy.ts
init_env();
var LOCAL_ASSET_REDIRECTS = {
  "pilothub-logo.png": "/pilothub-logo.PNG",
  "pilothub-logo.PNG": "/pilothub-logo.PNG"
};
function resolveLocalAsset(key) {
  const normalized = key.replace(/^\/+/, "").toLowerCase();
  const basename = normalized.split("/").pop() ?? normalized;
  if (LOCAL_ASSET_REDIRECTS[basename]) {
    return LOCAL_ASSET_REDIRECTS[basename];
  }
  if (basename.includes("pilothub-logo")) {
    return "/pilothub-logo.PNG";
  }
  return null;
}
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params["0"];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    const localPath = resolveLocalAsset(key);
    if (localPath) {
      res.set("Cache-Control", "public, max-age=86400");
      res.redirect(307, localPath);
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(404).send("Storage asset not found");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.warn(`[StorageProxy] forge miss for "${key}": ${forgeResp.status} ${body}`);
        res.status(404).send("Storage asset not found");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(404).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(404).send("Storage proxy error");
    }
  });
}

// server/routers.ts
init_cookies();

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
init_const();
init_onboarding();
init_userStatus();
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var requireApproved = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  if (!isUserApproved(ctx.user)) {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Your account is not active." });
  }
  if (userNeedsOnboarding(ctx.user)) {
    throw new TRPCError2({
      code: "FORBIDDEN",
      message: "Please complete onboarding to continue."
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
var approvedProcedure = t.procedure.use(requireApproved);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
import { z as z3 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/advisorChat.ts
init_db();
init_llmWithApiKey();
init_chatSafety();
init_llmChat();
import { z as z2 } from "zod";
var advisorChatInputSchema = z2.object({
  message: z2.string().max(1e4),
  conversationId: z2.number().optional(),
  imageBase64: z2.string().max(6e6).optional()
}).refine((d) => d.message.trim().length > 0 || Boolean(d.imageBase64?.trim()), {
  message: "Message or image is required"
});
var FALLBACK_PROMPTS = {
  bizpilot: "You are BizPilot, an expert business advisor for Myanmar businesses.",
  founderpilot: "You are FounderPilot, a strategic advisor for founders and CEOs."
};
function toDataUrl(imageBase64) {
  if (!imageBase64?.trim()) return null;
  const parsed = parseImagePayload(imageBase64);
  if (!parsed) return null;
  return `data:${parsed.mimeType};base64,${parsed.base64}`;
}
async function runAdvisorChatMutation(advisor, user, input) {
  const usage = await getMessageUsage(user.id, advisor);
  const text3 = input.message.trim();
  const imageDataUrl = toDataUrl(input.imageBase64);
  const userContent = text3 || (imageDataUrl ? "[Image attached]" : "");
  const conv = await getOrCreateConversation({
    userId: user.id,
    modelSlug: advisor,
    conversationId: input.conversationId
  });
  await createMessage({
    conversationId: conv.id,
    role: "user",
    content: userContent,
    imageData: imageDataUrl
  });
  const history = await listConversationMessages(conv.id);
  const recentHistory = history.slice(-20);
  const systemPrompt = await getActiveSystemPrompt(advisor);
  const fullUser = await getUserById(user.id);
  const userProfileLines = [
    `

[User Profile]`,
    `- Name: ${fullUser?.name ?? user.name ?? "Unknown"}`,
    fullUser?.businessName ? `- Business Name: ${fullUser.businessName}` : null,
    fullUser?.businessType ? `- Business Type: ${fullUser.businessType}` : null,
    fullUser?.useCase ? `- How they use PilotHub: ${fullUser.useCase}` : null,
    `- Plan: ${usage.planType}`
  ].filter(Boolean);
  const userProfileCtx = userProfileLines.join("\n");
  const olderHistory = history.slice(0, Math.max(0, history.length - 21));
  const memoryNote = olderHistory.length > 0 ? `

[Conversation Memory: ${history.length} total messages. Earlier: ${olderHistory.slice(-5).map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content.slice(0, 120)}`).join(" | ")}]` : "";
  const baseSystem = (systemPrompt || FALLBACK_PROMPTS[advisor]) + userProfileCtx + memoryNote;
  const safeSystem = appendAdvisorSafetyPrompt(baseSystem, advisor);
  const llmMessages = [
    { role: "system", content: safeSystem },
    ...recentHistory.slice(0, -1).map((m) => {
      const row = m;
      return {
        role: m.role,
        content: m.content,
        imageBase64: row.imageData ?? void 0
      };
    }),
    {
      role: "user",
      content: userContent,
      imageBase64: imageDataUrl ?? void 0
    }
  ];
  let assistantMessage;
  try {
    assistantMessage = await invokeAdvisorLLM(advisor, llmMessages);
  } catch (err) {
    console.error(`[AdvisorChat] LLM Generation Error Details for advisor=${advisor} userId=${user.id}:`, err);
    throw err;
  }
  await createMessage({ conversationId: conv.id, role: "assistant", content: assistantMessage });
  await touchConversation(conv.id);
  if (history.length <= 1) {
    await updateConversationTitle(conv.id, (text3 || "Image message").slice(0, 80));
  }
  await incrementMessageUsed(user.id, advisor);
  const newUsage = await getMessageUsage(user.id, advisor);
  return { conversationId: conv.id, message: assistantMessage, usage: newUsage };
}

// server/routers.ts
init_telegram();

// server/quickCreateUser.ts
init_db();
init_ensureTelegramSchema();
init_telegram();
init_telegramPlans();
import { nanoid as nanoid2 } from "nanoid";
function generateShadowOpenId() {
  return `shadow_${nanoid2(24)}`;
}
async function quickCreateTelegramUser(input) {
  await ensureTelegramSchema();
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  if (!email || !name) {
    throw new Error("email and name are required");
  }
  let user = await getUserByEmail(email);
  let created = false;
  if (!user) {
    const openId = generateShadowOpenId();
    await upsertUser({
      openId,
      name,
      email,
      loginMethod: "telegram_shadow",
      status: "active",
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    user = await getUserByOpenId(openId);
    if (!user) throw new Error("Failed to create user");
    created = true;
  } else {
    await updateUserProfile(user.id, { name });
  }
  const expiry = input.planTier === "unlimited" ? input.planExpiryDate ?? addTelegramPlanMonths() : input.planExpiryDate ?? addTelegramPlanMonths();
  await applyTelegramAdvisorPlan(user.id, input.planType, input.planTier, expiry);
  await updateUserSubscription(user.id, input.planType, "active");
  const tokenResult = await generateTelegramActivationToken(
    user.id,
    input.botUsername,
    input.planType
  );
  return {
    userId: user.id,
    openId: user.openId,
    email: user.email ?? email,
    name: user.name ?? name,
    planType: input.planType,
    planTier: input.planTier,
    created,
    token: tokenResult.token,
    activationLink: tokenResult.activationLink
  };
}
function parsePlanType(value) {
  const v = (value ?? "").toLowerCase().trim();
  if (v === "founderpilot" || v === "founder" || v === "founder_pilot") {
    return "founderpilot";
  }
  return "bizpilot";
}

// server/emailHelper.ts
import nodemailer from "nodemailer";
var PILOTHUB_ADMIN_NOTIFICATION_EMAIL = "chatpilot.mm@gmail.com";
function htmlToPlainText(html) {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n").replace(/<\/tr>/gi, "\n").replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
}
function wrapPilotHubEmailHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>PilotHub</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f1f5f9; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 32px 40px 20px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
              <h1 style="color: #0d9488; margin: 0; font-family: sans-serif;">PilotHub</h1>
              <p style="color: #64748b; margin-top: 5px; font-size: 14px;">by ChatPilot</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; color: #334155; font-size: 15px; line-height: 1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center; background-color: #f8fafc;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">Powered by ChatPilot \xB7 Myanmar Business AI Platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function escapeHtml(text3) {
  return text3.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function textToEmailHtml(text3) {
  return escapeHtml(text3).replace(/\r?\n/g, "<br />");
}
async function sendEmail({
  to,
  subject,
  html,
  text: text3
}) {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    console.warn("[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set. Email not sent.", {
      hasUser: Boolean(user),
      hasPass: Boolean(pass)
    });
    return false;
  }
  const from = `"PilotHub Team" <${user}>`;
  const htmlContent = html ?? "";
  const textContent = text3 ?? (htmlContent ? htmlToPlainText(htmlContent) : "");
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass: pass.replace(/\s/g, "")
      }
    });
    await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent || void 0
    });
    console.log(`[Email] Sent to ${to}: ${subject} (from ${user})`);
    return true;
  } catch (error) {
    console.error("Email send error details: ", error);
    return false;
  }
}
async function sendBroadcastEmail({
  to,
  subject,
  message
}) {
  const bodyHtml = `
    <div style="color: #475569; line-height: 1.7; font-size: 15px;">
      ${textToEmailHtml(message)}
    </div>
  `;
  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);
  return sendEmail({
    to,
    subject,
    html: wrappedHtml,
    text: `${subject}

${message}

\u2014 PilotHub by ChatPilot`
  });
}
async function sendApprovalEmail({
  to,
  name,
  plan,
  loginUrl
}) {
  const planName = plan === "bizpilot" ? "BizPilot" : plan === "founderpilot" ? "FounderPilot" : "Free Trial";
  const bodyHtml = `
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px; font-weight: 600;">\u1000\u103C\u102D\u102F\u1006\u102D\u102F\u1015\u102B\u101E\u100A\u103A, ${escapeHtml(name)}!</h2>
      <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
        \u101E\u1004\u103A\u104F PilotHub application \u1000\u102D\u102F approved \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B
        \u101A\u1001\u102F <strong style="color: #0d9488;">free plan</strong> \u1016\u103C\u1004\u1037\u103A \u1005\u1010\u1004\u103A\u1005\u1019\u103A\u1038\u101E\u1015\u103A\u1014\u102D\u102F\u1004\u103A\u1015\u103C\u102E\u1038 AI advisors \u1019\u103B\u102C\u1038\u1000\u102D\u102F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1015\u103C\u102E\u104B
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 14px 28px; background-color: #0d9488; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 6px;">\u101D\u1004\u103A\u101B\u1031\u102C\u1000\u103A\u1015\u102B \u2192</a>
          </td>
        </tr>
      </table>
      <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0 0 24px;">${escapeHtml(loginUrl)}</p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">\u101B\u101B\u103E\u102D\u1019\u100A\u1037\u103A features (${escapeHtml(planName)})</p>
        <ul style="color: #475569; line-height: 2; margin: 0; padding-left: 20px;">
          <li><strong style="color: #0d9488;">BizPilot AI</strong> \u2014 Business strategy &amp; operations</li>
          <li><strong style="color: #d97706;">FounderPilot AI</strong> \u2014 Founder &amp; CEO advisory</li>
          <li>Myanmar business context \u1014\u102C\u1038\u101C\u100A\u103A\u101E\u1031\u102C AI</li>
        </ul>
      </div>
      <p style="color: #64748b; font-size: 13px; margin: 24px 0 0; text-align: center;">
        \u1019\u1031\u1038\u1001\u103D\u1014\u103A\u1038\u1019\u103B\u102C\u1038\u101B\u103E\u102D\u1015\u102B\u1000 <a href="mailto:chatpilot.mm@gmail.com" style="color: #0d9488; text-decoration: none;">chatpilot.mm@gmail.com</a> \u101E\u102D\u102F\u1037 \u1006\u1000\u103A\u101E\u103D\u101A\u103A\u1015\u102B
      </p>
  `;
  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);
  return sendEmail({
    to,
    subject: `PilotHub Application Approved \u2014 \u1000\u103C\u102D\u102F\u1006\u102D\u102F\u1015\u102B\u101E\u100A\u103A ${name}!`,
    html: wrappedHtml,
    text: `\u1000\u103C\u102D\u102F\u1006\u102D\u102F\u1015\u102B\u101E\u100A\u103A ${name}!

\u101E\u1004\u103A\u104F PilotHub application \u1000\u102D\u102F approved \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B
free plan \u1016\u103C\u1004\u1037\u103A \u1005\u1010\u1004\u103A\u1005\u1019\u103A\u1038\u101E\u1015\u103A\u1014\u102D\u102F\u1004\u103A\u1015\u103C\u102E\u1038 AI advisors \u1019\u103B\u102C\u1038\u1000\u102D\u102F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1015\u103C\u102E\u104B

\u101D\u1004\u103A\u101B\u1031\u102C\u1000\u103A\u1015\u102B: ${loginUrl}

Powered by ChatPilot`
  });
}
async function sendNewPaymentSubmittedEmail(payment) {
  const rows = [
    ["Name", payment.userName],
    ["Email", payment.userEmail],
    ["Plan", payment.plan],
    ["Amount", `${payment.amount.toLocaleString()} MMK`],
    ["Payment Method", payment.paymentMethod],
    ["Transaction Ref", payment.transactionRef ?? "\u2014"]
  ];
  const tableRows = rows.map(
    ([label, value]) => `<tr>
          <td style="padding: 10px 14px; color: #64748b; font-size: 13px; vertical-align: top; width: 140px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(label)}</td>
          <td style="padding: 10px 14px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(value)}</td>
        </tr>`
  ).join("");
  const bodyHtml = `
    <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 20px; font-weight: 600;">New payment submitted</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      ${tableRows}
    </table>
    <p style="color: #64748b; font-size: 13px; margin: 24px 0 0;">
      Review in the <a href="https://www.pilothub.vip/admin/payments" style="color: #0d9488; text-decoration: none;">Admin Payments</a> panel.
    </p>
  `;
  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);
  const plain = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return sendEmail({
    to: PILOTHUB_ADMIN_NOTIFICATION_EMAIL,
    subject: "New Payment Submitted!",
    html: wrappedHtml,
    text: `New Payment Submitted!

${plain}

Review: https://www.pilothub.vip/admin/payments`
  });
}
async function sendAccountUpgradedEmail({
  to,
  name,
  planName
}) {
  const bodyHtml = `
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px; font-weight: 600;">Account Upgraded</h2>
      <p style="color: #475569; line-height: 1.8; margin: 0 0 16px;">
        \u1019\u1004\u103A\u1039\u1002\u101C\u102C\u1015\u102B ${escapeHtml(name)}\u104B \u101E\u1004\u1037\u103A\u1021\u1000\u1031\u102C\u1004\u1037\u103A\u1000\u102D\u102F <strong style="color: #0d9488;">${escapeHtml(planName)}</strong> \u101E\u102D\u102F\u1037 \u1021\u1031\u102C\u1004\u103A\u1019\u103C\u1004\u103A\u1005\u103D\u102C \u1021\u1006\u1004\u1037\u103A\u1019\u103C\u103E\u1004\u1037\u103A\u1010\u1004\u103A\u1015\u1031\u1038\u101C\u102D\u102F\u1000\u103A\u1015\u102B\u1015\u103C\u102E\u104B
      </p>
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        \u101A\u1001\u102F PilotHub \u101E\u102D\u102F\u1037 \u101D\u1004\u103A\u101B\u1031\u102C\u1000\u103A\u1015\u103C\u102E\u1038 AI advisors \u1019\u103B\u102C\u1038\u1000\u102D\u102F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1015\u103C\u102E\u104B
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <a href="https://www.pilothub.vip/app" style="display: inline-block; padding: 14px 28px; background-color: #0d9488; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 6px;">Dashboard \u101E\u102D\u102F\u1037 \u101E\u103D\u102C\u1038\u1015\u102B \u2192</a>
          </td>
        </tr>
      </table>
  `;
  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);
  const plain = `\u1019\u1004\u103A\u1039\u1002\u101C\u102C\u1015\u102B\u104B \u101E\u1004\u1037\u103A\u1021\u1000\u1031\u102C\u1004\u1037\u103A\u1000\u102D\u102F ${planName} \u101E\u102D\u102F\u1037 \u1021\u1031\u102C\u1004\u103A\u1019\u103C\u1004\u103A\u1005\u103D\u102C \u1021\u1006\u1004\u1037\u103A\u1019\u103C\u103E\u1004\u1037\u103A\u1010\u1004\u103A\u1015\u1031\u1038\u101C\u102D\u102F\u1000\u103A\u1015\u102B\u1015\u103C\u102E\u104B

https://www.pilothub.vip/app`;
  return sendEmail({
    to,
    subject: "PilotHub - Account Upgraded!",
    html: wrappedHtml,
    text: plain
  });
}
async function sendPaymentConfirmationEmail({
  to,
  name,
  plan
}) {
  const planName = plan === "bizpilot" ? "BizPilot" : plan === "founderpilot" ? "FounderPilot" : plan;
  const bodyHtml = `
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px; font-weight: 600;">Payment Confirmed</h2>
      <p style="color: #475569; line-height: 1.7; margin: 0;">
        ${escapeHtml(name)} \u104F <strong style="color: #0d9488;">${escapeHtml(planName)}</strong> plan payment \u1000\u102D\u102F confirmed \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B
        Subscription \u1000\u102D\u102F activate \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B
      </p>
  `;
  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);
  return sendEmail({
    to,
    subject: `PilotHub Payment Confirmed \u2014 ${planName} Plan`,
    html: wrappedHtml,
    text: `${name} \u104F ${planName} plan payment \u1000\u102D\u102F confirmed \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B

Powered by ChatPilot`
  });
}

// server/routers.ts
init_plans();
init_adminAccess();

// server/_core/passwordAuth.ts
import { randomBytes as randomBytes2, scrypt, timingSafeEqual as timingSafeEqual2 } from "node:crypto";
import { promisify } from "node:util";
var scryptAsync = promisify(scrypt);
var SCRYPT_KEYLEN = 64;
async function hashPassword(password) {
  const salt = randomBytes2(16).toString("hex");
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}
async function verifyPassword(password, stored) {
  if (!stored.startsWith("scrypt:")) return false;
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const expectedHex = parts[2];
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = derived;
    return a.length === b.length && timingSafeEqual2(a, b);
  } catch {
    return false;
  }
}

// server/_core/sessionCookie.ts
init_const();
init_cookies();
init_sdk();
async function setUserSessionCookie(req, res, openId, name) {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

// server/routers.ts
init_onboarding();
init_llmChat();
var COOKIE_NAME2 = "app_session_id";
async function requireAdmin(ctx) {
  const hasAdminCookie = ctx.req.cookies?.admin_session === "authenticated";
  const hasAdminRole = ctx.user?.role === "admin";
  const hasAdminEmail = Boolean(ctx.user?.email && isAdminEmail(ctx.user.email));
  if (!hasAdminCookie && !hasAdminRole && !hasAdminEmail) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: "Admin access required" });
  }
  try {
    await assertDatabase();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database unavailable";
    throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message });
  }
}
async function sendApprovalEmail2(userEmail, userName, plan) {
  const loginUrl = "https://pilothub.vip";
  const sent = await sendApprovalEmail({ to: userEmail, name: userName, plan, loginUrl });
  if (!sent) {
    await notifyOwner({
      title: `\u2705 New User Approved: ${userName}`,
      content: `User ${userName} (${userEmail}) has been approved.

Please send welcome email to ${userEmail}
Login URL: ${loginUrl}`
    });
  }
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure.input(
      z3.object({
        email: z3.string().email(),
        password: z3.string().min(8, "Password must be at least 8 characters"),
        name: z3.string().min(1).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      await assertDatabase();
      const normalizedEmail = normalizeEmail(input.email);
      const existing = await getUserByEmail(normalizedEmail);
      if (existing) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "An account with this email already exists. Please sign in."
        });
      }
      const passwordHash = await hashPassword(input.password);
      const { openId } = await createEmailPasswordUser({
        email: normalizedEmail,
        passwordHash,
        name: input.name
      });
      await setUserSessionCookie(ctx.req, ctx.res, openId, input.name ?? normalizedEmail);
      return {
        success: true,
        redirectTo: "/onboarding",
        needsOnboarding: true
      };
    }),
    login: publicProcedure.input(
      z3.object({
        email: z3.string().email(),
        password: z3.string().min(1)
      })
    ).mutation(async ({ ctx, input }) => {
      await assertDatabase();
      const normalizedEmail = normalizeEmail(input.email);
      const user = await getUserByEmail(normalizedEmail);
      if (!user) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }
      const storedHash = user.passwordHash;
      if (!storedHash) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "This account uses Google sign-in. Continue with Google instead."
        });
      }
      const valid = await verifyPassword(input.password, storedHash);
      if (!valid) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }
      await upsertUser({
        openId: user.openId,
        email: user.email,
        lastSignedIn: /* @__PURE__ */ new Date(),
        status: "active"
      });
      await setUserSessionCookie(
        ctx.req,
        ctx.res,
        user.openId,
        user.name ?? user.email ?? "User"
      );
      const needsOnboarding = userNeedsOnboarding(user);
      return {
        success: true,
        redirectTo: needsOnboarding ? "/onboarding" : "/app",
        needsOnboarding
      };
    }),
    completeOnboarding: protectedProcedure.input(
      z3.object({
        name: z3.string().min(1, "Name is required"),
        useCase: z3.string().min(1, "Purpose is required")
      })
    ).mutation(async ({ ctx, input }) => {
      await completeUserOnboarding(ctx.user.id, {
        name: input.name,
        useCase: input.useCase
      });
      return { success: true, redirectTo: "/app" };
    }),
    updateProfile: protectedProcedure.input(z3.object({
      name: z3.string().min(1).optional(),
      phone: z3.string().optional(),
      businessName: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, {
        name: input.name,
        phone: input.phone,
        businessName: input.businessName
      });
      return { success: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME2, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ── AI chat and conversation routers ──
  ai: router({
    conversations: router({
      list: approvedProcedure.input(z3.object({ modelSlug: z3.enum(["bizpilot", "founderpilot"]) })).query(async ({ ctx, input }) => {
        const convs = await listUserConversations(ctx.user.id, input.modelSlug);
        return { conversations: convs };
      }),
      get: approvedProcedure.input(z3.object({ conversationId: z3.number() })).query(async ({ ctx, input }) => {
        const conv = await getConversationById(ctx.user.id, input.conversationId);
        if (!conv) throw new TRPCError3({ code: "NOT_FOUND" });
        const msgs = await listConversationMessages(input.conversationId);
        return { conversation: conv, messages: msgs };
      }),
      create: approvedProcedure.input(z3.object({ modelSlug: z3.enum(["bizpilot", "founderpilot"]), title: z3.string().optional() })).mutation(async ({ ctx, input }) => {
        const conv = await getOrCreateConversation({ userId: ctx.user.id, modelSlug: input.modelSlug, title: input.title });
        return { conversation: conv };
      }),
      delete: approvedProcedure.input(z3.object({ conversationId: z3.number() })).mutation(async ({ ctx, input }) => {
        const conv = await getConversationById(ctx.user.id, input.conversationId);
        if (!conv) throw new TRPCError3({ code: "NOT_FOUND" });
        await deleteConversation(input.conversationId, ctx.user.id);
        return { success: true };
      })
    }),
    freeCounts: approvedProcedure.query(async ({ ctx }) => {
      return await getFreeTrialCounts(ctx.user.id);
    }),
    // Get message usage for both advisors (for UI counter)
    messageUsage: approvedProcedure.query(async ({ ctx }) => {
      const biz = await getMessageUsage(ctx.user.id, "bizpilot");
      const founder = await getMessageUsage(ctx.user.id, "founderpilot");
      return { biz, founder };
    }),
    /** Latest conversation + plan-scoped messages for web chat restore on mount. */
    getHistory: approvedProcedure.input(z3.object({ modelSlug: z3.enum(["bizpilot", "founderpilot"]) })).query(async ({ ctx, input }) => {
      return await listWebChatHistoryForAdvisor(ctx.user.id, input.modelSlug);
    }),
    bizpilot: approvedProcedure.input(advisorChatInputSchema).mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const usage = await getMessageUsage(user.id, "bizpilot");
      if (usage.used >= usage.limit) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: JSON.stringify({
            code: "MESSAGE_LIMIT_REACHED",
            advisor: "bizpilot",
            planType: usage.planType,
            used: usage.used,
            limit: usage.limit,
            hasUsedStarter: usage.hasUsedStarter
          })
        });
      }
      try {
        return await runAdvisorChatMutation("bizpilot", user, input);
      } catch (err) {
        console.error("[Router] bizpilot mutation failed:", err);
        if (err instanceof TRPCError3) throw err;
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: LLM_USER_ERROR_MESSAGE
        });
      }
    }),
    founderpilot: approvedProcedure.input(advisorChatInputSchema).mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const usage = await getMessageUsage(user.id, "founderpilot");
      if (usage.used >= usage.limit) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: JSON.stringify({
            code: "MESSAGE_LIMIT_REACHED",
            advisor: "founderpilot",
            planType: usage.planType,
            used: usage.used,
            limit: usage.limit,
            hasUsedStarter: usage.hasUsedStarter
          })
        });
      }
      try {
        return await runAdvisorChatMutation("founderpilot", user, input);
      } catch (err) {
        console.error("[Router] founderpilot mutation failed:", err);
        if (err instanceof TRPCError3) throw err;
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: LLM_USER_ERROR_MESSAGE
        });
      }
    })
  }),
  // ── Payment submission ──
  payments: router({
    // Get payment settings (phone, QR) for display
    settings: publicProcedure.query(async () => {
      const kbzpayPhone = await getSystemSetting("kbzpay_phone");
      const kbzpayName = await getSystemSetting("kbzpay_name");
      const kbzpayQr = await getSystemSetting("kbzpay_qr_url");
      const wavepayPhone = await getSystemSetting("wavepay_phone");
      const wavepayName = await getSystemSetting("wavepay_name");
      const wavepayQr = await getSystemSetting("wavepay_qr_url");
      const ayapayPhone = await getSystemSetting("ayapay_phone");
      const ayapayName = await getSystemSetting("ayapay_name");
      const ayapayQr = await getSystemSetting("ayapay_qr_url");
      const phone = await getSystemSetting("payment_phone");
      const qrUrl = await getSystemSetting("payment_qr_url");
      const kpayName = await getSystemSetting("payment_kpay_name");
      return {
        phone,
        qrUrl,
        kpayName,
        kbzpay: { phone: kbzpayPhone, name: kbzpayName, qrUrl: kbzpayQr },
        wavepay: { phone: wavepayPhone, name: wavepayName, qrUrl: wavepayQr },
        ayapay: { phone: ayapayPhone, name: ayapayName, qrUrl: ayapayQr }
      };
    }),
    submit: protectedProcedure.input(z3.object({
      plan: z3.enum(["bizpilot", "founderpilot", "bizpilot-starter", "bizpilot-pro", "founderpilot-starter", "founderpilot-pro"]),
      paymentMethod: z3.string(),
      transactionRef: z3.string().optional(),
      screenshotDataUrl: z3.string().optional().refine(
        (value) => value === void 0 || value.startsWith("data:image/"),
        "Screenshot must be a data:image/... URL"
      )
    })).mutation(async ({ ctx, input }) => {
      const amounts = {
        "bizpilot": 1e5,
        "founderpilot": 3e5,
        "bizpilot-starter": 2e4,
        "bizpilot-pro": 1e5,
        "founderpilot-starter": 4e4,
        "founderpilot-pro": 3e5
      };
      const payment = await createPayment({
        userId: ctx.user.id,
        userName: ctx.user.name ?? void 0,
        userEmail: ctx.user.email ?? void 0,
        plan: input.plan,
        amount: amounts[input.plan] ?? 0,
        paymentMethod: input.paymentMethod,
        transactionRef: input.transactionRef,
        screenshotUrl: input.screenshotDataUrl,
        source: "website"
      });
      try {
        await notifyOwner({
          title: `\u{1F4B0} New Payment: ${ctx.user.name} - ${input.plan}`,
          content: `Payment submitted by ${ctx.user.name} (${ctx.user.email})
Plan: ${input.plan}
Method: ${input.paymentMethod}
Ref: ${input.transactionRef ?? "N/A"}`
        });
      } catch (e) {
      }
      try {
        await sendNewPaymentSubmittedEmail({
          userName: ctx.user.name ?? "Unknown",
          userEmail: ctx.user.email ?? "",
          plan: input.plan,
          amount: amounts[input.plan] ?? 0,
          paymentMethod: input.paymentMethod,
          transactionRef: input.transactionRef
        });
      } catch (e) {
      }
      return { success: true, paymentId: payment.id };
    }),
    myPayments: protectedProcedure.query(async ({ ctx }) => {
      const userPayments = await listUserPayments(ctx.user.id);
      return { payments: userPayments };
    })
  }),
  // ── Admin router ──
  admin: router({
    login: publicProcedure.input(z3.object({ username: z3.string(), password: z3.string() })).mutation(async ({ ctx, input }) => {
      const adminUser = process.env.ADMIN_USERNAME || "admin";
      const adminPass = process.env.ADMIN_PASSWORD || "pilothub2026";
      if (input.username !== adminUser || input.password !== adminPass) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie("admin_session", "authenticated", { ...cookieOptions, maxAge: 60 * 60 * 8 * 1e3 });
      return { success: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("admin_session", { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    isAuthenticated: publicProcedure.query(({ ctx }) => {
      const hasAdminCookie = ctx.req.cookies?.admin_session === "authenticated";
      const hasAdminRole = ctx.user?.role === "admin";
      return { authenticated: hasAdminCookie || hasAdminRole };
    }),
    // ── System Settings ──
    settings: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        return await listSystemSettings();
      }),
      set: publicProcedure.input(
        z3.union([
          z3.object({ key: z3.string(), value: z3.string() }),
          z3.object({
            method: z3.enum(["kbzpay", "wavepay", "ayapay"]),
            phone: z3.string(),
            name: z3.string(),
            qrDataUrl: z3.string().optional().refine(
              (s) => s === void 0 || s.startsWith("data:image/"),
              "QR must be a data:image/... URL"
            )
          })
        ])
      ).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        if ("key" in input) {
          await setSystemSetting(input.key, input.value);
        } else {
          await setSystemSetting(`${input.method}_phone`, input.phone);
          await setSystemSetting(`${input.method}_name`, input.name);
          if (input.qrDataUrl) {
            await setSystemSetting(`${input.method}_qr_url`, input.qrDataUrl);
          }
        }
        return { success: true };
      })
    }),
    // ── Applications management ──
    applications: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const apps = await listAllApplications();
        return { applications: apps };
      }),
      approve: publicProcedure.input(z3.object({ applicationId: z3.number(), notes: z3.string().optional() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const app2 = await getApplicationById(input.applicationId);
        if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
        const { nanoid: nanoid4 } = await import("nanoid");
        const openId = `app_${nanoid4(16)}`;
        await upsertUser({
          openId,
          name: app2.fullName,
          email: app2.email,
          loginMethod: "application",
          lastSignedIn: /* @__PURE__ */ new Date(),
          status: "active"
        });
        const createdUser = await getUserByOpenId(openId);
        if (createdUser) {
          await updateUserProfile(createdUser.id, {
            businessName: app2.businessName ?? void 0,
            businessType: app2.businessType ?? void 0,
            useCase: app2.useCase ?? void 0
          });
        }
        const user = await getUserByOpenId(openId);
        if (!user) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
        await updateApplicationStatus(app2.id, "approved", user.id, input.notes);
        if (app2.email) {
          try {
            await sendApprovalEmail2(app2.email, app2.fullName, app2.plan ?? "free");
          } catch (e) {
          }
        }
        return { success: true, userId: user.id, openId };
      }),
      reject: publicProcedure.input(z3.object({ applicationId: z3.number(), notes: z3.string().optional() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updateApplicationStatus(input.applicationId, "rejected", void 0, input.notes);
        return { success: true };
      })
    }),
    // ── User management ──
    users: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const users4 = await listAllUsers();
        return { users: users4 };
      }),
      updateRole: publicProcedure.input(z3.object({ userId: z3.number(), role: z3.enum(["user", "admin"]) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
      updateSubscription: publicProcedure.input(z3.object({ userId: z3.number(), plan: z3.string(), status: z3.string() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updateUserSubscription(input.userId, input.plan, input.status);
        return { success: true };
      }),
      updateUserPlan: publicProcedure.input(
        z3.object({
          userId: z3.number(),
          plan: z3.enum([
            "",
            "bizpilot-starter",
            "bizpilot-pro",
            "founderpilot-starter",
            "founderpilot-pro"
          ])
        })
      ).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const user = await getUserById(input.userId);
        if (!user) {
          throw new TRPCError3({ code: "NOT_FOUND", message: "User not found" });
        }
        await applyAdminUserPlan(input.userId, input.plan);
        if (input.plan && user.email) {
          try {
            await sendAccountUpgradedEmail({
              to: user.email,
              name: user.name ?? "User",
              planName: getPlanDisplayName(input.plan)
            });
          } catch {
          }
        }
        return { success: true, plan: input.plan || null };
      }),
      generate: publicProcedure.input(z3.object({ name: z3.string().min(1), email: z3.string().email(), plan: z3.enum(["bizpilot", "founderpilot"]).optional(), businessName: z3.string().optional() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const { nanoid: nanoid4 } = await import("nanoid");
        const openId = `ext_${nanoid4(16)}`;
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        const generatedPassword = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        await upsertUser({ openId, name: input.name, email: input.email, loginMethod: "admin_generated", lastSignedIn: /* @__PURE__ */ new Date() });
        const user = await getUserByOpenId(openId);
        if (!user) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
        if (input.plan) await updateUserSubscription(user.id, input.plan, "active");
        return { success: true, userId: user.id, openId, name: input.name, email: input.email, plan: input.plan || null, generatedPassword };
      }),
      delete: publicProcedure.input(z3.object({ userId: z3.number() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await deleteUser(input.userId);
        return { success: true };
      }),
      generateTelegramToken: publicProcedure.input(z3.object({ userId: z3.number() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        try {
          return await generateTelegramActivationToken(input.userId);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to generate token";
          throw new TRPCError3({ code: "BAD_REQUEST", message });
        }
      })
    }),
    // ── Payment management ──
    payments: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const payments4 = await listAllPayments();
        return { payments: payments4 };
      }),
      updateStatus: publicProcedure.input(z3.object({ paymentId: z3.number(), status: z3.enum(["pending", "confirmed", "rejected"]) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updatePaymentStatus(input.paymentId, input.status);
        if (input.status === "confirmed") {
          const allPayments = await listAllPayments();
          const payment = allPayments.find((p) => p.id === input.paymentId);
          if (payment?.userId != null) {
            const planStr = payment.plan ?? "";
            const advisor = planStr.includes("founder") ? "founderpilot" : "bizpilot";
            const planType = planStr.includes("starter") ? "starter" : "pro";
            await activateTieredPlan(payment.userId, advisor, planType);
            await updateUserSubscription(payment.userId, payment.plan, "active");
            if (payment.userEmail) {
              try {
                const sent = await sendPaymentConfirmationEmail({
                  to: payment.userEmail,
                  name: payment.userName ?? "User",
                  plan: payment.plan
                });
                if (!sent) {
                  await notifyOwner({
                    title: `\u{1F4B3} Payment Confirmed: ${payment.userName ?? "User"} - ${payment.plan}`,
                    content: `Payment confirmed for ${payment.userName} (${payment.userEmail})
Plan: ${payment.plan}
Amount: ${payment.amount} MMK

Email not sent (no GMAIL credentials). Please send manually to ${payment.userEmail}`
                  });
                }
              } catch (e) {
              }
            }
          }
        }
        return { success: true };
      }),
      update: publicProcedure.input(z3.object({
        paymentId: z3.number(),
        plan: z3.string().optional(),
        amount: z3.number().optional(),
        status: z3.enum(["pending", "confirmed", "rejected"]).optional(),
        paymentMethod: z3.string().optional(),
        transactionRef: z3.string().optional(),
        notes: z3.string().optional()
      })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const { paymentId, ...fields } = input;
        await updatePayment(paymentId, fields);
        if (fields.status === "confirmed" || fields.plan) {
          const allPayments = await listAllPayments();
          const payment = allPayments.find((p) => p.id === paymentId);
          if (payment && payment.status === "confirmed" && payment.userId != null) {
            const planStr = payment.plan ?? "";
            const advisor = planStr.includes("founder") ? "founderpilot" : "bizpilot";
            const planType = planStr.includes("starter") ? "starter" : "pro";
            await activateTieredPlan(payment.userId, advisor, planType);
            await updateUserSubscription(payment.userId, payment.plan, "active");
          }
        }
        return { success: true };
      }),
      delete: publicProcedure.input(z3.object({ paymentId: z3.number() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await deletePayment(input.paymentId);
        return { success: true };
      })
    }),
    // ── System Prompt management ──
    prompts: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const prompts = await listSystemPrompts();
        return { prompts };
      }),
      getActive: publicProcedure.input(z3.object({ modelSlug: z3.enum(["bizpilot", "founderpilot"]) })).query(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const content = await getActiveSystemPrompt(input.modelSlug);
        return { content };
      }),
      save: publicProcedure.input(z3.object({ name: z3.string().min(1), modelSlug: z3.enum(["bizpilot", "founderpilot"]), content: z3.string().min(10), activate: z3.boolean().default(false) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const result = await createSystemPromptVersion({ name: input.name, modelSlug: input.modelSlug, content: input.content, activate: input.activate });
        return { success: true, promptId: result.id };
      }),
      activate: publicProcedure.input(z3.object({ promptId: z3.number(), modelSlug: z3.string() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await activateSystemPrompt(input.promptId, input.modelSlug);
        return { success: true };
      })
    }),
    // ── API Key management ──
    apiKeys: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const keys = await listAllApiKeys();
        return { keys };
      }),
      upsert: publicProcedure.input(z3.object({ provider: z3.enum(["openai", "gemini"]), keyValue: z3.string().min(10) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await upsertApiKey(input.provider, input.keyValue);
        return { success: true };
      }),
      setActive: publicProcedure.input(z3.object({ keyId: z3.number(), provider: z3.string() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await setApiKeyActive(input.keyId, input.provider);
        return { success: true };
      }),
      delete: publicProcedure.input(z3.object({ keyId: z3.number() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await deleteApiKey(input.keyId);
        return { success: true };
      })
    }),
    // ── AI Model management ──
    models: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const models = await listAllAiModels();
        return { models };
      }),
      update: publicProcedure.input(z3.object({ targetRole: z3.enum(["bizpilot", "founderpilot"]), modelString: z3.string().min(1) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updateAiModel(input.targetRole, input.modelString);
        return { success: true };
      })
    }),
    // ── Announcements management ──
    announcements: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const items = await listAnnouncements(false);
        return { announcements: items };
      }),
      create: publicProcedure.input(z3.object({
        title: z3.string().min(1),
        content: z3.string().min(1),
        type: z3.enum(["info", "success", "warning", "urgent"]).default("info")
      })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const result = await createAnnouncement(input);
        return { success: true, id: result.id };
      }),
      toggle: publicProcedure.input(z3.object({ id: z3.number(), isActive: z3.enum(["true", "false"]) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updateAnnouncement(input.id, { isActive: input.isActive });
        return { success: true };
      }),
      delete: publicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await deleteAnnouncement(input.id);
        return { success: true };
      })
    }),
    // ── Telegram bot management ──
    telegram: router({
      getSettings: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const { getTelegramBizBotUsername: getTelegramBizBotUsername2, getTelegramFounderBotUsername: getTelegramFounderBotUsername2 } = await Promise.resolve().then(() => (init_telegram(), telegram_exports));
        const { isTelegramBotUsernameConfigured: isTelegramBotUsernameConfigured2 } = await Promise.resolve().then(() => (init_telegramConfig(), telegramConfig_exports));
        const bizBotUsername = getTelegramBizBotUsername2();
        const founderBotUsername = getTelegramFounderBotUsername2();
        return {
          bizBotUsername,
          founderBotUsername,
          bizBotUsernameConfigured: isTelegramBotUsernameConfigured2(bizBotUsername),
          founderBotUsernameConfigured: founderBotUsername ? isTelegramBotUsernameConfigured2(founderBotUsername) : false
        };
      }),
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const users4 = await listTelegramBotUsers();
        return { users: users4 };
      }),
      syncSchema: publicProcedure.mutation(async ({ ctx }) => {
        await requireAdmin(ctx);
        const { ensureTelegramSchema: ensureTelegramSchema2, resetTelegramSchemaCache: resetTelegramSchemaCache2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
        resetTelegramSchemaCache2();
        await ensureTelegramSchema2();
        return { success: true };
      }),
      setupWebhook: publicProcedure.input(
        z3.object({
          advisor: z3.enum(["bizpilot", "founderpilot"]).default("bizpilot")
        })
      ).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        try {
          const baseUrl = resolveWebhookBaseUrl(ctx.req);
          return await setupTelegramWebhook(input.advisor, baseUrl);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Webhook setup failed";
          throw new TRPCError3({ code: "BAD_REQUEST", message });
        }
      }),
      updatePlan: publicProcedure.input(
        z3.object({
          userId: z3.number(),
          planType: z3.enum(["bizpilot", "founderpilot"]).optional(),
          planTier: z3.enum(["starter", "unlimited"]).optional(),
          bizPlanTier: z3.enum(["starter", "unlimited"]).optional(),
          founderPlanTier: z3.enum(["starter", "unlimited"]).optional(),
          bizMessageLimit: z3.number().int().min(0).optional(),
          founderMessageLimit: z3.number().int().min(0).optional(),
          addBizMessages: z3.number().int().min(0).optional(),
          addFounderMessages: z3.number().int().min(0).optional(),
          planExpiryDate: z3.string().nullable().optional()
        })
      ).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        try {
          const hasExclusivePlan = input.planType != null && input.planTier != null;
          const hasLegacyPlan = input.bizPlanTier != null || input.founderPlanTier != null;
          if (hasExclusivePlan && hasLegacyPlan) {
            throw new Error("Use either planType/planTier or bizPlanTier/founderPlanTier, not both");
          }
          let parsedExpiry = void 0;
          if (input.planExpiryDate !== void 0) {
            if (input.planExpiryDate === null || input.planExpiryDate === "") {
              parsedExpiry = null;
            } else {
              const d = new Date(input.planExpiryDate.includes("T") ? input.planExpiryDate : `${input.planExpiryDate}T23:59:59`);
              if (Number.isNaN(d.getTime())) {
                throw new Error("Invalid expiry date");
              }
              parsedExpiry = d;
            }
          }
          await updateTelegramUserPlan({
            userId: input.userId,
            planType: input.planType,
            planTier: input.planTier,
            bizPlanTier: input.bizPlanTier,
            founderPlanTier: input.founderPlanTier,
            bizMessageLimit: input.bizMessageLimit,
            founderMessageLimit: input.founderMessageLimit,
            addBizMessages: input.addBizMessages,
            addFounderMessages: input.addFounderMessages,
            planExpiryDate: parsedExpiry
          });
          return { success: true };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to update plan";
          throw new TRPCError3({ code: "BAD_REQUEST", message });
        }
      }),
      quickAddUser: publicProcedure.input(
        z3.object({
          name: z3.string().min(1),
          email: z3.string().email(),
          planType: z3.enum(["bizpilot", "founderpilot"]).default("bizpilot"),
          planTier: z3.enum(["starter", "unlimited"]).default("starter"),
          planExpiryDate: z3.string().optional(),
          botUsername: z3.string().min(1).optional()
        })
      ).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        try {
          let planExpiryDate = void 0;
          if (input.planExpiryDate) {
            const d = new Date(
              input.planExpiryDate.includes("T") ? input.planExpiryDate : `${input.planExpiryDate}T23:59:59`
            );
            if (Number.isNaN(d.getTime())) {
              throw new Error("Invalid expiry date");
            }
            planExpiryDate = d;
          }
          return await quickCreateTelegramUser({
            email: input.email,
            name: input.name,
            planType: input.planType,
            planTier: input.planTier,
            planExpiryDate,
            botUsername: input.botUsername
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to create user";
          throw new TRPCError3({ code: "BAD_REQUEST", message });
        }
      }),
      createActivationToken: publicProcedure.input(
        z3.object({
          userId: z3.number(),
          botUsername: z3.string().min(1).optional(),
          planType: z3.enum(["bizpilot", "founderpilot"]).default("bizpilot")
        })
      ).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        try {
          return await generateTelegramActivationToken(
            input.userId,
            input.botUsername,
            input.planType
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to generate token";
          throw new TRPCError3({ code: "BAD_REQUEST", message });
        }
      }),
      /** @deprecated Use createActivationToken */
      generateLink: publicProcedure.input(
        z3.object({
          userId: z3.number(),
          botUsername: z3.string().min(1).optional(),
          planType: z3.enum(["bizpilot", "founderpilot"]).default("bizpilot")
        })
      ).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        try {
          return await generateTelegramActivationToken(
            input.userId,
            input.botUsername,
            input.planType
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to generate link";
          throw new TRPCError3({ code: "BAD_REQUEST", message });
        }
      })
    }),
    sendBroadcastEmail: publicProcedure.input(
      z3.object({
        mode: z3.enum(["all_approved", "single"]),
        userId: z3.number().int().positive().optional(),
        subject: z3.string().min(1).max(200),
        message: z3.string().min(1).max(2e4)
      })
    ).mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      let recipients;
      if (input.mode === "single") {
        if (!input.userId) {
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "userId is required for single-user broadcast"
          });
        }
        const user = await getUserById(input.userId);
        if (!user?.email?.trim()) {
          throw new TRPCError3({ code: "NOT_FOUND", message: "User not found or has no email" });
        }
        recipients = [
          { id: user.id, email: user.email.trim(), name: user.name ?? null }
        ];
      } else {
        recipients = await listApprovedUserEmails();
        if (recipients.length === 0) {
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "No approved users with email addresses found"
          });
        }
      }
      let sent = 0;
      let failed = 0;
      for (const recipient of recipients) {
        const ok = await sendBroadcastEmail({
          to: recipient.email,
          subject: input.subject,
          message: input.message
        });
        if (ok) sent += 1;
        else failed += 1;
      }
      return {
        success: failed === 0,
        sent,
        failed,
        total: recipients.length
      };
    }),
    // ── External API Token management ──
    externalTokens: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        return await listExternalApiTokens();
      }),
      create: publicProcedure.input(z3.object({ name: z3.string().min(1) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const { nanoid: nanoid4 } = await import("nanoid");
        const token = `ph_ext_${nanoid4(32)}`;
        const result = await createExternalApiToken(input.name, token);
        return { success: true, id: result.id, token };
      }),
      delete: publicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await deleteExternalApiToken(input.id);
        return { success: true };
      })
    })
  }),
  // ── User-facing announcements (active only) ──
  announcements: router({
    list: publicProcedure.query(async () => {
      const items = await listAnnouncements(true);
      return { announcements: items };
    })
  })
});

// server/_core/context.ts
init_sdk();
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/publicApi.ts
init_db();
import { nanoid as nanoid3 } from "nanoid";
init_telegram();
init_telegramPlans();
init_telegram();
init_telegramConfig();
function getPublicApiKey() {
  return process.env.PUBLIC_API_KEY || "pilothub-public-api-key-2026";
}
function getAdminApiKey() {
  return process.env.ADMIN_API_KEY || "pilothub-admin-api-key-2026";
}
async function requireApiKey(req, res, adminOnly = false) {
  const key = req.headers["x-api-key"];
  if (!key) {
    res.status(401).json({ success: false, error: "Missing X-API-Key header" });
    return false;
  }
  const isPublicKey = key === getPublicApiKey();
  const isAdminKey = key === getAdminApiKey();
  const isDynamicToken = await validateExternalApiToken(key);
  if (adminOnly) {
    if (!isAdminKey) {
      res.status(403).json({ success: false, error: "Admin API key required" });
      return false;
    }
  } else {
    if (!isPublicKey && !isAdminKey && !isDynamicToken) {
      res.status(403).json({ success: false, error: "Invalid API key" });
      return false;
    }
  }
  return true;
}
function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function registerPublicApiRoutes(app2) {
  app2.get("/api/public/info", (_req, res) => {
    const bizBotUsername = getTelegramBizBotUsername();
    res.json({
      name: "PilotHub Public API",
      version: "2.0.0",
      telegram: {
        bizBotUsername,
        bizBotUsernameConfigured: isTelegramBotUsernameConfigured(bizBotUsername)
      },
      plans: [
        { id: "bizpilot", name: "BizPilot", price: 1e5, currency: "MMK" },
        { id: "founderpilot", name: "FounderPilot", price: 3e5, currency: "MMK" }
      ],
      endpoints: [
        { method: "POST", path: "/api/public/applications/submit", auth: "X-API-Key (public)", description: "Submit application form + payment slip" },
        { method: "POST", path: "/api/public/users/create", auth: "X-API-Key (public)", description: "Create a user account" },
        { method: "GET", path: "/api/public/users/list", auth: "X-API-Key (admin)", description: "List all users" },
        { method: "POST", path: "/api/public/payments/submit", auth: "X-API-Key (public)", description: "Submit a payment" },
        { method: "GET", path: "/api/public/payments/list", auth: "X-API-Key (admin)", description: "List all payments" },
        { method: "POST", path: "/api/admin/telegram/token", auth: "X-API-Key (admin)", description: "Generate Telegram bot activation token for a user" },
        { method: "POST", path: "/api/external/create-user", auth: "X-API-Key (public)", description: "Quick-create shadow user + Telegram activation link (AI sales agent)" }
      ]
    });
  });
  app2.post("/api/public/applications/submit", async (req, res) => {
    if (!await requireApiKey(req, res)) return;
    res.status(410).json({
      success: false,
      error: "The application waitlist API has been removed. Direct users to https://www.pilothub.vip/sign-up instead."
    });
  });
  app2.post("/api/public/users/create", async (req, res) => {
    if (!await requireApiKey(req, res)) return;
    try {
      const { name, email, plan, businessName } = req.body;
      if (!name || !email) {
        res.status(400).json({ success: false, error: "name and email are required" });
        return;
      }
      const openId = `ext_${nanoid3(16)}`;
      const generatedPassword = generatePassword(14);
      await upsertUser({ openId, name, email, loginMethod: "external", lastSignedIn: /* @__PURE__ */ new Date() });
      const user = await getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ success: false, error: "Failed to create user" });
        return;
      }
      if (plan && (plan === "bizpilot" || plan === "founderpilot")) {
        await updateUserSubscription(user.id, plan, "active");
      }
      res.json({ success: true, userId: user.id, openId, name, email, plan: plan || null, generatedPassword });
    } catch (err) {
      console.error("[PublicAPI] /users/create error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  app2.get("/api/public/users/list", async (req, res) => {
    if (!await requireApiKey(req, res, true)) return;
    try {
      const users4 = await listAllUsers();
      res.json({ success: true, users: users4 });
    } catch (err) {
      console.error("[PublicAPI] /users/list error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  app2.post("/api/public/payments/submit", async (req, res) => {
    if (!await requireApiKey(req, res)) return;
    try {
      const { userId, userName, userEmail, plan, amount, paymentMethod, transactionRef, screenshotBase64, screenshotMime } = req.body;
      if (!plan || !paymentMethod) {
        res.status(400).json({ success: false, error: "plan and paymentMethod are required" });
        return;
      }
      if (plan !== "bizpilot" && plan !== "founderpilot") {
        res.status(400).json({ success: false, error: "plan must be 'bizpilot' or 'founderpilot'" });
        return;
      }
      const amounts = { bizpilot: 1e5, founderpilot: 3e5 };
      const finalAmount = amount ?? amounts[plan] ?? 0;
      let resolvedUserId = userId;
      if (!resolvedUserId && userEmail) {
        const user = await getUserByEmail(userEmail);
        if (user) resolvedUserId = user.id;
      }
      let screenshotUrl;
      if (screenshotBase64) {
        try {
          const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
          const buffer = Buffer.from(screenshotBase64, "base64");
          const ext = screenshotMime?.includes("png") ? "png" : "jpg";
          const key = `payment-screenshots/ext-${Date.now()}-${nanoid3(8)}.${ext}`;
          const result = await storagePut2(key, buffer, screenshotMime || "image/jpeg");
          screenshotUrl = result.url;
        } catch (e) {
          console.warn("[PublicAPI] Screenshot upload failed:", e);
        }
      }
      const payment = await createPayment({
        userId: resolvedUserId,
        userName,
        userEmail,
        plan,
        amount: finalAmount,
        paymentMethod,
        transactionRef,
        screenshotUrl,
        source: "external_api"
      });
      try {
        await notifyOwner({
          title: `\u{1F4B0} External Payment: ${userName ?? userEmail} - ${plan}`,
          content: `Payment from external website:
User: ${userName ?? "Unknown"} (${userEmail ?? "N/A"})
Plan: ${plan}
Amount: ${finalAmount} MMK
Method: ${paymentMethod}
Ref: ${transactionRef ?? "N/A"}`
        });
      } catch (e) {
      }
      res.json({ success: true, paymentId: payment.id, amount: finalAmount, plan });
    } catch (err) {
      console.error("[PublicAPI] /payments/submit error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  app2.post("/api/admin/telegram/token", async (req, res) => {
    if (!await requireApiKey(req, res, true)) return;
    try {
      const { userId } = req.body;
      if (!userId || typeof userId !== "number") {
        res.status(400).json({ success: false, error: "userId (number) is required" });
        return;
      }
      const result = await generateTelegramActivationToken(userId);
      res.json({ success: true, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("[PublicAPI] /admin/telegram/token error:", err);
      res.status(400).json({ success: false, error: message });
    }
  });
  app2.post("/api/external/create-user", async (req, res) => {
    if (!await requireApiKey(req, res)) return;
    try {
      const body = req.body;
      if (!body.email?.trim() || !body.name?.trim()) {
        res.status(400).json({ success: false, error: "email and name are required" });
        return;
      }
      let planExpiryDate = void 0;
      if (body.planExpiryDate !== void 0) {
        if (body.planExpiryDate === null || body.planExpiryDate === "") {
          planExpiryDate = null;
        } else {
          const d = new Date(
            body.planExpiryDate.includes("T") ? body.planExpiryDate : `${body.planExpiryDate}T23:59:59`
          );
          if (Number.isNaN(d.getTime())) {
            res.status(400).json({ success: false, error: "Invalid planExpiryDate" });
            return;
          }
          planExpiryDate = d;
        }
      }
      const result = await quickCreateTelegramUser({
        email: body.email.trim(),
        name: body.name.trim(),
        planType: parsePlanType(body.planType),
        planTier: parseTelegramPlanTier(body.planTier),
        planExpiryDate,
        botUsername: body.botUsername?.trim()
      });
      res.json({
        success: true,
        userId: result.userId,
        openId: result.openId,
        email: result.email,
        name: result.name,
        planType: result.planType,
        created: result.created,
        token: result.token,
        botUsername: getTelegramBizBotUsername(),
        activationLink: result.activationLink,
        telegramStartLink: result.activationLink
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("[ExternalAPI] /create-user error:", err);
      res.status(400).json({ success: false, error: message });
    }
  });
  app2.get("/api/public/payments/list", async (req, res) => {
    if (!await requireApiKey(req, res, true)) return;
    try {
      const payments4 = await listAllPayments();
      res.json({ success: true, payments: payments4 });
    } catch (err) {
      console.error("[PublicAPI] /payments/list error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
}

// server/_core/app.ts
init_telegram();
function isTelegramWebhookPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === TELEGRAM_WEBHOOK_PATH;
}
function allowTelegramWebhook(req, _res, next) {
  const pathname = req.path || req.url?.split("?")[0] || "";
  const raw = `${req.originalUrl ?? ""} ${req.url ?? ""}`;
  if (!isTelegramWebhookPath(pathname) && (raw.includes("telegram/webhook") || raw.includes("advisor="))) {
    const query = req.originalUrl?.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    req.url = `${TELEGRAM_WEBHOOK_PATH}${query}`;
  }
  const fixedPath = req.url?.split("?")[0] || "";
  if (isTelegramWebhookPath(fixedPath) && fixedPath.endsWith("/") && fixedPath.length > 1) {
    const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    req.url = `${TELEGRAM_WEBHOOK_PATH}${query}`;
  }
  next();
}
function createApp(_options = {}) {
  const app2 = express();
  app2.use(allowTelegramWebhook);
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  app2.use(cookieParser());
  registerStorageProxy(app2);
  registerPublicApiRoutes(app2);
  registerTelegramRoutes(app2);
  registerOAuthRoutes(app2);
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app2;
}

// scripts/vercel-api-entry.ts
var maxDuration = 60;
var app = createApp({ apiOnly: true });
async function handler(req, res) {
  try {
    await new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err) {
    console.error("[api] Unhandled error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Internal Server Error",
          message: err instanceof Error ? err.message : String(err)
        })
      );
    }
  }
}
export {
  handler as default,
  maxDuration
};
//# sourceMappingURL=index.js.map
