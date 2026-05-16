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

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      cookieSecret: process.env.JWT_SECRET ?? "",
      /** @deprecated Prefer TURSO_DATABASE_URL; kept for compatibility */
      databaseUrl: process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "",
      tursoDatabaseUrl: process.env.TURSO_DATABASE_URL ?? "",
      tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
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
      telegramBizBotToken: process.env.TELEGRAM_BIZPILOT_TOKEN ?? process.env.TELEGRAM_BIZ_BOT_TOKEN ?? "",
      telegramFounderBotToken: process.env.TELEGRAM_FOUNDERPILOT_TOKEN ?? process.env.TELEGRAM_FOUNDER_BOT_TOKEN ?? "",
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
      bizMessageLimit: integer("bizMessageLimit").default(5).notNull(),
      founderMessageLimit: integer("founderMessageLimit").default(5).notNull(),
      bizMessagesUsed: integer("bizMessagesUsed").default(0).notNull(),
      founderMessagesUsed: integer("founderMessagesUsed").default(0).notNull(),
      hasUsedBizStarter: text("hasUsedBizStarter", { enum: ["true", "false"] }).notNull().default("false"),
      hasUsedFounderStarter: text("hasUsedFounderStarter", { enum: ["true", "false"] }).notNull().default("false"),
      telegramChatId: text("telegramChatId", { length: 64 }),
      planExpiryDate: integer("planExpiryDate", { mode: "timestamp_ms" }),
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
      bizMessageLimit: int("bizMessageLimit").default(5).notNull(),
      founderMessageLimit: int("founderMessageLimit").default(5).notNull(),
      bizMessagesUsed: int("bizMessagesUsed").default(0).notNull(),
      founderMessagesUsed: int("founderMessagesUsed").default(0).notNull(),
      hasUsedBizStarter: mysqlEnum("hasUsedBizStarter", ["true", "false"]).notNull().default("false"),
      hasUsedFounderStarter: mysqlEnum("hasUsedFounderStarter", ["true", "false"]).notNull().default("false"),
      telegramChatId: varchar("telegramChatId", { length: 64 }),
      planExpiryDate: timestamp("planExpiryDate"),
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

// server/db/connection.ts
import { createClient as createClient2 } from "@libsql/client";
import { sql as sql2 } from "drizzle-orm";
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
    const [row] = await database.select({ count: sql2`count(*)` }).from(users3);
    return Number(row?.count ?? 0);
  } catch {
    return -1;
  }
}
async function logHealth(database, provider) {
  try {
    const [userRow] = await database.select({ count: sql2`count(*)` }).from(users3);
    const [payRow] = await database.select({ count: sql2`count(*)` }).from(payments3);
    const [keyRow] = await database.select({ count: sql2`count(*)` }).from(apiKeys3);
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
  const client = createClient2({
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
import { eq, and, desc, asc, sql as sql3, inArray, or } from "drizzle-orm";
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
  const result = await db.select().from(users3).where(eq(users3.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users3).where(eq(users3.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
async function getUsersByEmail(email) {
  const db = await getDb();
  if (!db) return [];
  const normalized = normalizeEmail(email);
  return db.select().from(users3).where(sql3`lower(trim(${users3.email})) = ${normalized}`).orderBy(asc(users3.id));
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
        await database.delete(users3).where(eq(users3.id, byOpenId.id));
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
      await db.delete(users3).where(eq(users3.id, conflicting.id));
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
  await db.update(users3).set(updateSet).where(eq(users3.id, userId));
}
async function getMessageUsage(userId, advisor) {
  const db = await getDb();
  if (!db) return { used: 0, limit: 5, planType: "free", hasUsedStarter: false };
  const result = await db.select({
    bizMessagesUsed: users3.bizMessagesUsed,
    founderMessagesUsed: users3.founderMessagesUsed,
    bizMessageLimit: users3.bizMessageLimit,
    founderMessageLimit: users3.founderMessageLimit,
    planTypeBiz: users3.planTypeBiz,
    planTypeFounder: users3.planTypeFounder,
    hasUsedBizStarter: users3.hasUsedBizStarter,
    hasUsedFounderStarter: users3.hasUsedFounderStarter
  }).from(users3).where(eq(users3.id, userId)).limit(1);
  const row = result[0];
  if (!row) return { used: 0, limit: 5, planType: "free", hasUsedStarter: false };
  if (advisor === "bizpilot") {
    return {
      used: row.bizMessagesUsed ?? 0,
      limit: row.bizMessageLimit ?? 5,
      planType: row.planTypeBiz ?? "free",
      hasUsedStarter: row.hasUsedBizStarter === "true"
    };
  } else {
    return {
      used: row.founderMessagesUsed ?? 0,
      limit: row.founderMessageLimit ?? 5,
      planType: row.planTypeFounder ?? "free",
      hasUsedStarter: row.hasUsedFounderStarter === "true"
    };
  }
}
async function incrementMessageUsed(userId, advisor) {
  const db = await getDb();
  if (!db) return;
  const usage = await getMessageUsage(userId, advisor);
  if (advisor === "bizpilot") {
    await db.update(users3).set({ bizMessagesUsed: usage.used + 1 }).where(eq(users3.id, userId));
  } else {
    await db.update(users3).set({ founderMessagesUsed: usage.used + 1 }).where(eq(users3.id, userId));
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
    } else {
      updateData.bizMessageLimit = 999999;
      updateData.subscriptionStart = now;
      updateData.subscriptionEnd = end;
    }
    await db.update(users3).set(updateData).where(eq(users3.id, userId));
  } else {
    const updateData = {
      planTypeFounder: planType,
      founderMessagesUsed: 0
      // reset counter on new plan
    };
    if (planType === "starter") {
      updateData.founderMessageLimit = 20;
      updateData.hasUsedFounderStarter = "true";
    } else {
      updateData.founderMessageLimit = 999999;
      updateData.subscriptionStart = now;
      updateData.subscriptionEnd = end;
    }
    await db.update(users3).set(updateData).where(eq(users3.id, userId));
  }
}
async function getFreeTrialCounts(userId) {
  const db = await getDb();
  if (!db) return { freeBizCount: 10, freeFounderCount: 5 };
  const result = await db.select({ freeBizCount: users3.freeBizCount, freeFounderCount: users3.freeFounderCount }).from(users3).where(eq(users3.id, userId)).limit(1);
  return result[0] ?? { freeBizCount: 10, freeFounderCount: 5 };
}
async function getOrCreateConversation(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (input.conversationId) {
    const existing = await db.select().from(conversations3).where(and(eq(conversations3.id, input.conversationId), eq(conversations3.userId, input.userId))).limit(1);
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
  return db.select().from(conversations3).where(and(eq(conversations3.userId, userId), eq(conversations3.modelSlug, modelSlug))).orderBy(desc(conversations3.updatedAt), desc(conversations3.createdAt)).limit(limit);
}
async function getConversationById(userId, conversationId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(conversations3).where(and(eq(conversations3.id, conversationId), eq(conversations3.userId, userId))).limit(1);
  return result[0];
}
async function listConversationMessages(conversationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages3).where(eq(messages3.conversationId, conversationId)).orderBy(asc(messages3.createdAt));
}
async function createMessage(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(messages3).values({
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    tokenCount: input.tokenCount ?? null
  }).returning();
  return row;
}
async function touchConversation(conversationId) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations3).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations3.id, conversationId));
}
async function deleteConversation(conversationId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages3).where(eq(messages3.conversationId, conversationId));
  await db.delete(conversations3).where(and(eq(conversations3.id, conversationId), eq(conversations3.userId, userId)));
}
async function updateConversationTitle(conversationId, title) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations3).set({ title }).where(eq(conversations3.id, conversationId));
}
async function getActiveSystemPrompt(modelSlug) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemPrompts3).where(and(eq(systemPrompts3.modelSlug, modelSlug), eq(systemPrompts3.isActive, "true"))).orderBy(desc(systemPrompts3.version)).limit(1);
  return result[0]?.content ?? null;
}
async function listSystemPrompts() {
  const db = await assertDatabase();
  return db.select().from(systemPrompts3).orderBy(desc(systemPrompts3.updatedAt));
}
async function createSystemPromptVersion(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(systemPrompts3).where(eq(systemPrompts3.modelSlug, input.modelSlug)).orderBy(desc(systemPrompts3.version)).limit(1);
  const nextVersion = (existing[0]?.version ?? 0) + 1;
  if (input.activate) {
    await db.update(systemPrompts3).set({ isActive: "false" }).where(eq(systemPrompts3.modelSlug, input.modelSlug));
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
  await db.update(systemPrompts3).set({ isActive: "false" }).where(eq(systemPrompts3.modelSlug, modelSlug));
  await db.update(systemPrompts3).set({ isActive: "true" }).where(eq(systemPrompts3.id, promptId));
}
async function getAiModel(targetRole) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(aiModels3).where(eq(aiModels3.targetRole, targetRole)).limit(1);
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
  await db.update(aiModels3).set({ modelString, updatedAt: /* @__PURE__ */ new Date() }).where(eq(aiModels3.targetRole, targetRole));
}
async function getActiveApiKey(provider) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(apiKeys3).where(and(eq(apiKeys3.provider, provider), eq(apiKeys3.isActive, "true"))).limit(1);
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
  await db.update(apiKeys3).set({ isActive: "false" }).where(eq(apiKeys3.provider, provider));
  await db.insert(apiKeys3).values({ provider, keyValue, isActive: "true" });
}
async function deleteApiKey(keyId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys3).set({ isActive: "false" }).where(eq(apiKeys3.id, keyId));
}
async function setApiKeyActive(keyId, provider) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys3).set({ isActive: "false" }).where(eq(apiKeys3.provider, provider));
  await db.update(apiKeys3).set({ isActive: "true" }).where(eq(apiKeys3.id, keyId));
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
      eq(users3.status, "approved"),
      eq(users3.status, "active"),
      eq(users3.status, "APPROVED")
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
  await db.update(users3).set({ role }).where(eq(users3.id, userId));
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
    await db.update(users3).set(updateSet).where(eq(users3.id, userId));
  }
}
async function updateUserSubscription(userId, plan, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = /* @__PURE__ */ new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  await db.update(users3).set({ plan, status, subscriptionStart: now, subscriptionEnd: end, updatedAt: now }).where(eq(users3.id, userId));
}
async function deleteUser(userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users3).where(eq(users3.id, userId));
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
  return db.select().from(payments3).where(eq(payments3.userId, userId)).orderBy(desc(payments3.createdAt));
}
async function updatePaymentStatus(paymentId, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payments3).set({ status }).where(eq(payments3.id, paymentId));
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
  await db.update(payments3).set(updateSet).where(eq(payments3.id, paymentId));
}
async function deletePayment(paymentId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(payments3).where(eq(payments3.id, paymentId));
}
async function getSystemSetting(key) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemSettings3).where(eq(systemSettings3.key, key)).limit(1);
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
async function createApplication(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(applications3).values({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone ?? null,
    businessName: input.businessName ?? null,
    businessType: input.businessType ?? null,
    useCase: input.useCase ?? null,
    plan: input.plan ?? "free",
    source: input.source ?? "website",
    status: "pending"
  }).returning();
  return row;
}
async function listAllApplications() {
  const db = await assertDatabase();
  return db.select().from(applications3).orderBy(desc(applications3.createdAt));
}
async function getApplicationById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(applications3).where(eq(applications3.id, id)).limit(1);
  return result[0];
}
async function getApplicationByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const normalized = normalizeEmail(email);
  const result = await db.select().from(applications3).where(sql3`lower(trim(${applications3.email})) = ${normalized}`).orderBy(desc(applications3.createdAt)).limit(1);
  return result[0];
}
async function getApprovedApplicationByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const normalized = normalizeEmail(email);
  const result = await db.select().from(applications3).where(
    and(
      sql3`lower(trim(${applications3.email})) = ${normalized}`,
      eq(applications3.status, "approved")
    )
  ).orderBy(desc(applications3.createdAt)).limit(1);
  return result[0];
}
async function updateApplicationStatus(id, status, userId, notes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = { status };
  if (userId !== void 0) updateSet.userId = userId;
  if (notes !== void 0) updateSet.notes = notes;
  await db.update(applications3).set(updateSet).where(eq(applications3.id, id));
}
async function validateExternalApiToken(token) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(externalApiTokens3).where(and(eq(externalApiTokens3.token, token), eq(externalApiTokens3.isActive, "true"))).limit(1);
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
  await db.update(externalApiTokens3).set({ isActive: "false" }).where(eq(externalApiTokens3.id, id));
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
    return db.select().from(announcements3).where(eq(announcements3.isActive, "true")).orderBy(desc(announcements3.createdAt));
  }
  return db.select().from(announcements3).orderBy(desc(announcements3.createdAt));
}
async function updateAnnouncement(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements3).set(data).where(eq(announcements3.id, id));
}
async function deleteAnnouncement(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements3).where(eq(announcements3.id, id));
}
async function getUserByTelegramChatId(chatId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users3).where(eq(users3.telegramChatId, chatId)).orderBy(desc(users3.updatedAt)).limit(1);
  return result[0];
}
async function linkTelegramChat(userId, chatId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users3).set({ telegramChatId: null }).where(eq(users3.telegramChatId, chatId));
  await db.update(users3).set({ telegramChatId: chatId }).where(eq(users3.id, userId));
}
async function getActivationToken(token) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(botActivationTokens3).where(eq(botActivationTokens3.token, token)).limit(1);
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
  const found = await database.select().from(botActivationTokens3).where(eq(botActivationTokens3.token, token)).limit(1);
  if (!found[0]) throw new Error("Failed to create activation token");
  return found[0];
}
async function markActivationTokenUsed(tokenId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(botActivationTokens3).set({ isUsed: "true" }).where(eq(botActivationTokens3.id, tokenId));
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
  const cap = Math.min(Math.max(1, maxMessages), MAX_TELEGRAM_LLM_TURNS);
  try {
    const rows = await db.select({
      role: telegramLlmTurns3.role,
      content: telegramLlmTurns3.content
    }).from(telegramLlmTurns3).where(and(eq(telegramLlmTurns3.userId, userId), eq(telegramLlmTurns3.advisor, advisor))).orderBy(desc(telegramLlmTurns3.createdAt)).limit(cap);
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
    const ids = await db.select({ id: telegramLlmTurns3.id }).from(telegramLlmTurns3).where(and(eq(telegramLlmTurns3.userId, userId), eq(telegramLlmTurns3.advisor, advisor))).orderBy(desc(telegramLlmTurns3.createdAt));
    const toDrop = ids.slice(MAX_TELEGRAM_LLM_TURNS);
    if (toDrop.length === 0) return;
    await db.delete(telegramLlmTurns3).where(
      inArray(
        telegramLlmTurns3.id,
        toDrop.map((r) => r.id)
      )
    );
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
    planExpiryDate
  };
}
async function updateTelegramUserPlan(input) {
  const { ensureTelegramSchema: ensureTelegramSchema2 } = await Promise.resolve().then(() => (init_ensureTelegramSchema(), ensureTelegramSchema_exports));
  await ensureTelegramSchema2();
  const db = await assertDatabase();
  const user = await getUserById(input.userId);
  if (!user) throw new Error("User not found");
  const updateSet = { updatedAt: /* @__PURE__ */ new Date() };
  if (input.planExpiryDate !== void 0) {
    updateSet.planExpiryDate = input.planExpiryDate;
  }
  let bizLimit = user.bizMessageLimit ?? 0;
  if (input.bizMessageLimit !== void 0) {
    bizLimit = input.bizMessageLimit;
  } else if (input.addBizMessages !== void 0) {
    bizLimit = bizLimit + input.addBizMessages;
  }
  if (input.bizMessageLimit !== void 0 || input.addBizMessages !== void 0) {
    updateSet.bizMessageLimit = Math.max(0, bizLimit);
    if (bizLimit > 0 && (user.planTypeBiz ?? "free") === "free") {
      updateSet.planTypeBiz = "starter";
    }
  }
  let founderLimit = user.founderMessageLimit ?? 0;
  if (input.founderMessageLimit !== void 0) {
    founderLimit = input.founderMessageLimit;
  } else if (input.addFounderMessages !== void 0) {
    founderLimit = founderLimit + input.addFounderMessages;
  }
  if (input.founderMessageLimit !== void 0 || input.addFounderMessages !== void 0) {
    updateSet.founderMessageLimit = Math.max(0, founderLimit);
    if (founderLimit > 0 && (user.planTypeFounder ?? "free") === "free") {
      updateSet.planTypeFounder = "starter";
    }
  }
  await db.update(users3).set(updateSet).where(eq(users3.id, input.userId));
}
async function decrementTelegramMessageLimit(userId, isBiz) {
  const db = await assertDatabase();
  if (isBiz) {
    await db.update(users3).set({
      bizMessageLimit: sql3`max(0, ${users3.bizMessageLimit} - 1)`,
      bizMessagesUsed: sql3`${users3.bizMessagesUsed} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users3.id, userId));
  } else {
    await db.update(users3).set({
      founderMessageLimit: sql3`max(0, ${users3.founderMessageLimit} - 1)`,
      founderMessagesUsed: sql3`${users3.founderMessagesUsed} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users3.id, userId));
  }
}
var MAX_TELEGRAM_LLM_TURNS, MAX_TELEGRAM_TURN_CHARS;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_env();
    init_adminAccess();
    init_userStatus();
    init_connection();
    MAX_TELEGRAM_LLM_TURNS = 40;
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

// server/_core/googleLogin.ts
async function resolveGoogleLogin(userInfo) {
  const googleSub = userInfo.sub;
  const userEmail = userInfo.email ? normalizeEmail(userInfo.email) : null;
  const { user: existingUser, byOpenId, byEmail } = await resolveUserForGoogleLogin(
    userEmail,
    googleSub
  );
  let approvedApplication;
  let latestApplication;
  if (userEmail) {
    try {
      approvedApplication = await getApprovedApplicationByEmail(userEmail);
      latestApplication = await getApplicationByEmail(userEmail);
    } catch (dbErr) {
      console.error("[Google OAuth] Application lookup failed (non-fatal):", dbErr);
    }
  }
  const isOwner = Boolean(ENV.ownerGoogleSub && googleSub === ENV.ownerGoogleSub);
  const isAdmin = Boolean(userEmail && isAdminEmail(userEmail));
  const isApproved = isOwner || isAdmin || isUserApproved(existingUser) || Boolean(approvedApplication) || latestApplication?.status === "approved";
  const userStatus = existingUser?.status ?? (isApproved ? "active" : latestApplication?.status === "approved" ? "active" : "pending");
  const grantAdmin = shouldGrantAdminRole({
    email: userEmail,
    googleSub,
    ownerGoogleSub: ENV.ownerGoogleSub
  });
  console.log("User Login Attempt:", userEmail, "Status:", userStatus, "Role:", grantAdmin ? "admin" : existingUser?.role ?? "user", {
    matchedByOpenId: Boolean(byOpenId),
    matchedByEmail: byEmail.length,
    existingUserId: existingUser?.id,
    isApproved
  });
  const upsert = {
    openId: googleSub,
    name: userInfo.name || existingUser?.name || null,
    email: userEmail ?? userInfo.email ?? existingUser?.email ?? null,
    loginMethod: "google",
    lastSignedIn: /* @__PURE__ */ new Date()
  };
  if (grantAdmin) {
    upsert.role = "admin";
    upsert.status = "active";
  } else if (!existingUser) {
    upsert.status = isApproved ? "active" : "pending";
  } else if (isApproved && !isApprovedUserStatus(existingUser.status)) {
    upsert.status = "active";
  }
  let redirectPath = "/app";
  if (!isApproved) {
    const hasExistingAccount = Boolean(existingUser || latestApplication);
    const pendingUser = existingUser && isPendingUserStatus(existingUser.status);
    const pendingApp = latestApplication?.status === "pending";
    if (hasExistingAccount && (pendingUser || pendingApp)) {
      redirectPath = `/login-required?reason=pending&email=${encodeURIComponent(userEmail ?? "")}`;
    } else {
      redirectPath = `/login-required?reason=not_approved&email=${encodeURIComponent(userEmail ?? "")}`;
    }
  }
  return {
    sessionOpenId: googleSub,
    redirectPath,
    userStatus,
    userEmail,
    isApproved,
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
            appId: ENV.googleClientId,
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
          if (!ENV.googleClientId || appId !== ENV.googleClientId) {
            console.warn("[Auth] Session appId does not match configured Google client");
            return null;
          }
          return { openId, appId, name };
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
  assertApiKey();
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
    model: "gemini-2.5-flash",
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
      authorization: `Bearer ${ENV.forgeApiKey}`
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
    assertApiKey = () => {
      if (!ENV.forgeApiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
    };
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

// server/llmWithApiKey.ts
async function invokeAdvisorLLM(advisorSlug, messages4) {
  const aiModel = await getAiModel(advisorSlug);
  const modelString = aiModel?.modelString ?? "gemini-2.5-pro-preview-05-06";
  const isGeminiModel = modelString.startsWith("gemini");
  const systemMsg = messages4.find((m) => m.role === "system");
  const systemPromptText = systemMsg?.content ?? "";
  const chatMessages = messages4.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));
  if (isGeminiModel) {
    const geminiKey = await getActiveApiKey("gemini");
    if (geminiKey?.keyValue) {
      try {
        return await invokeWithGemini({
          apiKey: geminiKey.keyValue,
          model: modelString,
          systemPrompt: systemPromptText,
          chatMessages
        });
      } catch (err) {
        console.warn("[LLM] Gemini key failed, falling back to built-in:", err);
      }
    }
  } else {
    const openaiKey = await getActiveApiKey("openai");
    if (openaiKey?.keyValue) {
      try {
        return await invokeWithOpenAI({
          apiKey: openaiKey.keyValue,
          model: modelString,
          systemPrompt: systemPromptText,
          chatMessages
        });
      } catch (err) {
        console.warn("[LLM] OpenAI key failed, trying Gemini:", err);
      }
    }
    const geminiKey = await getActiveApiKey("gemini");
    if (geminiKey?.keyValue) {
      try {
        return await invokeWithGemini({
          apiKey: geminiKey.keyValue,
          model: "gemini-2.5-pro-preview-05-06",
          systemPrompt: systemPromptText,
          chatMessages
        });
      } catch (err) {
        console.warn("[LLM] Gemini fallback failed, using built-in:", err);
      }
    }
  }
  const fallbackMessages = messages4.map((m) => ({ role: m.role, content: m.content }));
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
  messages4.push(...sanitizedChat);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
async function invokeWithGemini(params) {
  const sanitizedChat = sanitizeChatMessages(params.chatMessages);
  const geminiContents = sanitizedChat.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
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
  const response = await fetch(url, {
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
    } else {
      result.push({ role: msg.role, content: msg.content });
    }
  }
  return result;
}
var TEMPERATURE, MAX_OUTPUT_TOKENS;
var init_llmWithApiKey = __esm({
  "server/llmWithApiKey.ts"() {
    "use strict";
    init_db();
    init_llm();
    TEMPERATURE = 0.3;
    MAX_OUTPUT_TOKENS = 4096;
  }
});

// shared/telegramConfig.ts
var telegramConfig_exports = {};
__export(telegramConfig_exports, {
  TELEGRAM_BOT_USERNAME_PLACEHOLDER: () => TELEGRAM_BOT_USERNAME_PLACEHOLDER,
  buildTelegramStartLink: () => buildTelegramStartLink,
  isFounderTelegramPlan: () => isFounderTelegramPlan,
  isTelegramBotUsernameConfigured: () => isTelegramBotUsernameConfigured,
  normalizeTelegramBotUsername: () => normalizeTelegramBotUsername,
  resolveTelegramActivationBotUsername: () => resolveTelegramActivationBotUsername,
  resolveTelegramBizBotUsername: () => resolveTelegramBizBotUsername,
  resolveTelegramFounderBotUsername: () => resolveTelegramFounderBotUsername
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
var TELEGRAM_BOT_USERNAME_PLACEHOLDER;
var init_telegramConfig = __esm({
  "shared/telegramConfig.ts"() {
    "use strict";
    TELEGRAM_BOT_USERNAME_PLACEHOLDER = "YOUR_BOT_USERNAME";
  }
});

// server/telegram.ts
var telegram_exports = {};
__export(telegram_exports, {
  TELEGRAM_BOT_USERNAME_PLACEHOLDER: () => TELEGRAM_BOT_USERNAME_PLACEHOLDER,
  buildTelegramActivationLink: () => buildTelegramActivationLink,
  generateTelegramActivationToken: () => generateTelegramActivationToken,
  getTelegramBizBotUsername: () => getTelegramBizBotUsername,
  getTelegramBotToken: () => getTelegramBotToken,
  getTelegramFounderBotUsername: () => getTelegramFounderBotUsername,
  isFounderAdvisorQuery: () => isFounderAdvisorQuery,
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
  if (isFounderAdvisorQuery(advisor)) {
    return process.env.TELEGRAM_FOUNDERPILOT_TOKEN?.trim() || process.env.TELEGRAM_FOUNDER_BOT_TOKEN?.trim();
  }
  return process.env.TELEGRAM_BIZPILOT_TOKEN?.trim() || process.env.TELEGRAM_BIZ_BOT_TOKEN?.trim();
}
function normalizeAdvisorSlug(raw) {
  if (isFounderAdvisorQuery(raw)) return "founderpilot";
  return "bizpilot";
}
function extractAdvisorQuery(req) {
  try {
    const pathWithQuery = req.originalUrl ?? req.url ?? "";
    if (pathWithQuery) {
      const absolute = pathWithQuery.startsWith("http://") || pathWithQuery.startsWith("https://") ? pathWithQuery : `http://internal${pathWithQuery.startsWith("/") ? "" : "/"}${pathWithQuery}`;
      const advisorParam = new URL(absolute).searchParams.get("advisor");
      if (advisorParam?.trim()) return advisorParam.trim();
    }
  } catch (err) {
    console.warn("[Telegram] extractAdvisorQuery failed:", err);
  }
  const q = req.query?.advisor;
  if (typeof q === "string" && q.trim()) return q.trim();
  if (Array.isArray(q) && typeof q[0] === "string" && q[0].trim()) return q[0].trim();
  return void 0;
}
function parseAdvisor(req) {
  return normalizeAdvisorSlug(extractAdvisorQuery(req));
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
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text3,
        reply_markup: PERSISTENT_REPLY_KEYBOARD
      })
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
async function sendTypingChatAction(botToken, chatId) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" })
    });
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
async function handleChatMessage(chatId, userText, advisorSlug, advisorQuery, botToken) {
  const user = await safeGetUserByTelegramChatId(chatId);
  if (!user) {
    await sendTelegramMessage(botToken, chatId, NO_USER_FOUND_MSG);
    return;
  }
  const isBiz = advisorSlug === "bizpilot";
  const currentLimit = coerceTelegramMessageLimit(
    isBiz ? user.bizMessageLimit : user.founderMessageLimit
  );
  const isExpired = !isTelegramPlanActive(user.planExpiryDate ?? null);
  console.log("Credit check:", {
    userId: user.id,
    advisorQuery,
    advisorSlug,
    isBiz,
    currentLimit,
    bizMessageLimit: user.bizMessageLimit,
    founderMessageLimit: user.founderMessageLimit,
    expiry: user.planExpiryDate,
    isExpired
  });
  if (currentLimit <= 0 || isExpired) {
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
    { role: "system", content: (systemPrompt || fallback) + profileCtx },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userText }
  ];
  void sendTypingChatAction(botToken, chatId).catch(() => {
  });
  let reply;
  try {
    reply = await invokeAdvisorLLM(advisorSlug, llmMessages);
  } catch (err) {
    console.error("[Telegram] LLM error:", err);
    await sendTelegramMessage(botToken, chatId, SYSTEM_ERROR_MSG);
    return;
  }
  const sent = await sendTelegramMessage(botToken, chatId, reply);
  if (!sent) {
    console.error("[Telegram] Gemini reply was not delivered; limit not decremented", {
      userId: user.id,
      advisorSlug
    });
    return;
  }
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
  try {
    await appendTelegramLlmTurnPair(user.id, advisorSlug, userText, reply);
  } catch (err) {
    console.error("[Telegram] appendTelegramLlmTurnPair failed (reply already sent):", err);
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
function registerTelegramRoutes(app2) {
  app2.post("/api/telegram/webhook", async (req, res) => {
    console.log("Received Telegram message:", req.body);
    let botToken;
    let chatId;
    try {
      const body = req.body;
      if (body?.message?.text === CONTACT_TEAM_BUTTON_TEXT) {
        await ensureTelegramSchema();
        const advisorQuery2 = extractAdvisorQuery(req);
        const advisor2 = parseAdvisor(req);
        console.log("[Telegram] Contact tap advisor:", { advisorQuery: advisorQuery2, advisor: advisor2 });
        botToken = getTelegramBotToken(advisor2);
        chatId = body.message.chat?.id != null ? String(body.message.chat.id) : void 0;
        if (botToken && chatId) {
          await sendTelegramMessage(botToken, chatId, CONTACT_TEAM_REPLY_MSG);
        } else if (!botToken) {
          console.error(
            `[Telegram] No bot token for ${advisor2}. Set TELEGRAM_BIZPILOT_TOKEN or TELEGRAM_FOUNDERPILOT_TOKEN.`
          );
        }
        return;
      }
      await ensureTelegramSchema();
      const advisorQuery = extractAdvisorQuery(req);
      const advisor = parseAdvisor(req);
      console.log("[Telegram] Webhook advisor:", { advisorQuery, advisor });
      botToken = getTelegramBotToken(advisor);
      if (!botToken) {
        console.error(
          `[Telegram] No bot token for ${advisor}. Set TELEGRAM_BIZPILOT_TOKEN or TELEGRAM_FOUNDERPILOT_TOKEN.`
        );
        return;
      }
      const update = req.body ?? {};
      chatId = extractChatId(update);
      await processUpdate(update, advisor, advisorQuery, botToken);
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
var NO_ACCESS_MSG, NO_USER_FOUND_MSG, LINK_SUCCESS_MSG, INVALID_TOKEN_MSG, SYSTEM_ERROR_MSG, ALREADY_LINKED_MSG, CONTACT_TEAM_BUTTON_TEXT, CONTACT_TEAM_REPLY_MSG, PERSISTENT_REPLY_KEYBOARD;
var init_telegram = __esm({
  "server/telegram.ts"() {
    "use strict";
    init_oauth();
    init_db();
    init_ensureTelegramSchema();
    init_llmWithApiKey();
    init_telegramConfig();
    NO_ACCESS_MSG = "\u101C\u1030\u1000\u103C\u102E\u1038\u1019\u1004\u103A\u1038\u104F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1001\u103D\u1004\u1037\u103A \u1000\u102F\u1014\u103A\u1006\u102F\u1036\u1038\u101E\u103D\u102C\u1038\u1015\u102B\u1015\u103C\u102E\u104B \u1011\u1015\u103A\u1019\u1036\u101D\u101A\u103A\u101A\u1030\u101B\u1014\u103A ChatPilot \u101E\u102D\u102F\u1037 \u1006\u1000\u103A\u101E\u103D\u101A\u103A\u1015\u102B\u104B";
    NO_USER_FOUND_MSG = "\u1012\u102E Bot \u1000\u102D\u102F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1016\u102D\u102F\u1037 Website \u1019\u103E\u102C \u1021\u101B\u1004\u103A Register \u101C\u102F\u1015\u103A\u1015\u1031\u1038\u1015\u102B \u101E\u102D\u102F\u1037\u1019\u101F\u102F\u1010\u103A ChatPilot Agency \u101E\u102D\u102F\u1037 \u1006\u1000\u103A\u101E\u103D\u101A\u103A\u1015\u102B\u104B";
    LINK_SUCCESS_MSG = "\u1021\u1000\u1031\u102C\u1004\u1037\u103A\u1001\u103B\u102D\u1010\u103A\u1006\u1000\u103A\u1019\u103E\u102F \u1021\u1031\u102C\u1004\u103A\u1019\u103C\u1004\u103A\u1015\u102B\u101E\u100A\u103A\u104B \u1005\u1010\u1004\u103A\u1019\u1031\u1038\u1019\u103C\u1014\u103A\u1038\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1015\u103C\u102E\u104B";
    INVALID_TOKEN_MSG = "\u1001\u103B\u102D\u1010\u103A\u1006\u1000\u103A\u1019\u103E\u102F\u1019\u1021\u1031\u102C\u1004\u103A\u1019\u103C\u1004\u103A\u1015\u102B\u104B Admin \u1011\u1036\u1019\u103E \u101B\u101B\u103E\u102D\u101E\u1031\u102C activation link \u1000\u102D\u102F \u1015\u103C\u1014\u103A\u1005\u1019\u103A\u1038\u1000\u103C\u100A\u1037\u103A\u1015\u102B\u104B";
    SYSTEM_ERROR_MSG = "\u1005\u1014\u1005\u103A\u1001\u103B\u102D\u102F\u1037\u101A\u103D\u1004\u103A\u1038\u1014\u1031\u1015\u102B\u101E\u100A\u103A\u104B \u1001\u100F\u1014\u1031\u1019\u103E \u1011\u1015\u103A\u1019\u1036\u1000\u103C\u102D\u102F\u1038\u1005\u102C\u1038\u1000\u103C\u100A\u1037\u103A\u1015\u102B\u104B";
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
  if (!isUserApproved(ctx.user) && isPendingUserStatus(ctx.user.status)) {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Your account is pending admin approval." });
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
init_llmWithApiKey();
init_telegram();
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/quickCreateUser.ts
init_db();
init_ensureTelegramSchema();
init_telegram();
import { nanoid as nanoid2 } from "nanoid";
function generateShadowOpenId() {
  return `shadow_${nanoid2(24)}`;
}
function defaultExpiryOneMonth() {
  const d = /* @__PURE__ */ new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
}
function resolveLimits(input) {
  const biz = input.bizMessageLimit ?? (input.planType === "bizpilot" ? 20 : 0);
  const founder = input.founderMessageLimit ?? (input.planType === "founderpilot" ? 20 : 0);
  return {
    bizMessageLimit: Math.max(0, biz),
    founderMessageLimit: Math.max(0, founder)
  };
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
  const limits = resolveLimits(input);
  await updateTelegramUserPlan({
    userId: user.id,
    bizMessageLimit: limits.bizMessageLimit,
    founderMessageLimit: limits.founderMessageLimit,
    planExpiryDate: input.planExpiryDate ?? defaultExpiryOneMonth()
  });
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

// server/routers.ts
init_storage();

// server/emailHelper.ts
import nodemailer from "nodemailer";
var PILOTHUB_ADMIN_NOTIFICATION_EMAIL = "chatpilot.mm@gmail.com";
var PILOTHUB_LOGO_URL = "https://www.pilothub.vip/pilothub-logo.png";
function getSmtpUser() {
  return process.env.GMAIL_USER?.trim();
}
function getPilotHubEmailFrom() {
  const smtpUser = getSmtpUser();
  const noreply = process.env.PILOTHUB_NOREPLY_EMAIL?.trim() || "noreply@pilothub.vip";
  const fromAddress = noreply.includes("@") ? noreply : smtpUser ?? noreply;
  return `"PilotHub Team" <${fromAddress}>`;
}
function wrapPilotHubEmailHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a1628; color: #e2e8f0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #0f1f35; border-radius: 16px; overflow: hidden; border: 1px solid #1e3a5f;">
    <div style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #1e3a5f; background: linear-gradient(135deg, #0f2a1e 0%, #0a1628 100%);">
      <img src="${PILOTHUB_LOGO_URL}" alt="PilotHub Logo" style="height: 50px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
      <p style="color: #64748b; font-size: 13px; margin: 0;">by ChatPilot</p>
    </div>
    <div style="padding: 32px 40px;">
      ${bodyHtml}
    </div>
    <div style="padding: 20px 40px; border-top: 1px solid #1e3a5f; text-align: center;">
      <p style="color: #334155; font-size: 12px; margin: 0;">Powered by ChatPilot \xB7 Myanmar Business AI Platform</p>
    </div>
  </div>
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
  const user = getSmtpUser();
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn("[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set. Email not sent.");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
    await transporter.sendMail({
      from: getPilotHubEmailFrom(),
      to,
      subject,
      text: text3,
      html
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}
async function sendNewApplicationNotificationEmail(app2) {
  const rows = [
    ["Name", app2.fullName],
    ["Email", app2.email],
    ["Phone", app2.phone ?? "\u2014"],
    ["Business", app2.businessName ?? "\u2014"],
    ["Business Type", app2.businessType ?? "\u2014"],
    ["Use Case", app2.useCase ?? "\u2014"],
    ["Plan", app2.plan ?? "free"],
    ["Source", app2.source ?? "website"],
    ...app2.applicationId != null ? [["Application ID", String(app2.applicationId)]] : []
  ];
  const tableRows = rows.map(
    ([label, value]) => `<tr>
          <td style="padding: 8px 12px; color: #64748b; font-size: 13px; vertical-align: top; width: 140px;">${escapeHtml(label)}</td>
          <td style="padding: 8px 12px; color: #f1f5f9; font-size: 14px;">${escapeHtml(value)}</td>
        </tr>`
  ).join("");
  const bodyHtml = `
    <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 20px;">New application received</h2>
    <table style="width: 100%; border-collapse: collapse; background: #0a1628; border-radius: 12px; border: 1px solid #1e3a5f;">
      ${tableRows}
    </table>
    <p style="color: #475569; font-size: 13px; margin: 24px 0 0;">
      Review in the <a href="https://www.pilothub.vip/admin/applications" style="color: #22c55e;">Admin Applications</a> panel.
    </p>
  `;
  const plain = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return sendEmail({
    to: PILOTHUB_ADMIN_NOTIFICATION_EMAIL,
    subject: "New PilotHub Application Received!",
    html: wrapPilotHubEmailHtml(bodyHtml),
    text: `New PilotHub Application Received!

${plain}`
  });
}
async function sendBroadcastEmail({
  to,
  subject,
  message
}) {
  const bodyHtml = `
    <div style="color: #94a3b8; line-height: 1.7; font-size: 15px;">
      ${textToEmailHtml(message)}
    </div>
  `;
  return sendEmail({
    to,
    subject,
    html: wrapPilotHubEmailHtml(bodyHtml),
    text: message
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
      <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">\u1000\u103C\u102D\u102F\u1006\u102D\u102F\u1015\u102B\u101E\u100A\u103A, ${escapeHtml(name)}!</h2>
      <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 24px;">
        \u101E\u1004\u103A\u104F PilotHub application \u1000\u102D\u102F approved \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B
        \u101A\u1001\u102F <strong style="color: #22c55e;">free plan</strong> \u1016\u103C\u1004\u1037\u103A \u1005\u1010\u1004\u103A\u1005\u1019\u103A\u1038\u101E\u1015\u103A\u1014\u102D\u102F\u1004\u103A\u1015\u103C\u102E\u1038 AI advisors \u1019\u103B\u102C\u1038\u1000\u102D\u102F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1015\u103C\u102E\u104B
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0;">${escapeHtml(loginUrl)} \u101E\u102D\u102F\u1037 \u101D\u1004\u103A\u101B\u1031\u102C\u1000\u103A\u1015\u102B</p>
      </div>
      <div style="background: #0a1628; border-radius: 12px; padding: 24px; border: 1px solid #1e3a5f;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">\u101B\u101B\u103E\u102D\u1019\u100A\u1037\u103A features (${escapeHtml(planName)})</p>
        <ul style="color: #94a3b8; line-height: 2; margin: 0; padding-left: 20px;">
          <li><strong style="color: #22c55e;">BizPilot AI</strong> \u2014 Business strategy & operations</li>
          <li><strong style="color: #f59e0b;">FounderPilot AI</strong> \u2014 Founder & CEO advisory</li>
          <li>Myanmar business context \u1014\u102C\u1038\u101C\u100A\u103A\u101E\u1031\u102C AI</li>
        </ul>
      </div>
      <p style="color: #475569; font-size: 13px; margin: 24px 0 0; text-align: center;">
        \u1019\u1031\u1038\u1001\u103D\u1014\u103A\u1038\u1019\u103B\u102C\u1038\u101B\u103E\u102D\u1015\u102B\u1000 <a href="mailto:chatpilot.mm@gmail.com" style="color: #22c55e;">chatpilot.mm@gmail.com</a> \u101E\u102D\u102F\u1037 \u1006\u1000\u103A\u101E\u103D\u101A\u103A\u1015\u102B
      </p>
  `;
  return sendEmail({
    to,
    subject: `\u2705 PilotHub Application Approved \u2014 \u1000\u103C\u102D\u102F\u1006\u102D\u102F\u1015\u102B\u101E\u100A\u103A ${name}!`,
    html: wrapPilotHubEmailHtml(bodyHtml),
    text: `\u1000\u103C\u102D\u102F\u1006\u102D\u102F\u1015\u102B\u101E\u100A\u103A ${name}!

\u101E\u1004\u103A\u104F PilotHub application \u1000\u102D\u102F approved \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B
free plan \u1016\u103C\u1004\u1037\u103A \u1005\u1010\u1004\u103A\u1005\u1019\u103A\u1038\u101E\u1015\u103A\u1014\u102D\u102F\u1004\u103A\u1015\u103C\u102E\u1038 AI advisors \u1019\u103B\u102C\u1038\u1000\u102D\u102F \u1021\u101E\u102F\u1036\u1038\u1015\u103C\u102F\u1014\u102D\u102F\u1004\u103A\u1015\u102B\u1015\u103C\u102E\u104B

${loginUrl} \u101E\u102D\u102F\u1037 \u101D\u1004\u103A\u101B\u1031\u102C\u1000\u103A\u1015\u102B

Powered by ChatPilot`
  });
}
async function sendPaymentConfirmationEmail({
  to,
  name,
  plan
}) {
  const planName = plan === "bizpilot" ? "BizPilot" : plan === "founderpilot" ? "FounderPilot" : plan;
  const bodyHtml = `
      <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">\u{1F4B3} Payment Confirmed!</h2>
      <p style="color: #94a3b8; line-height: 1.7;">
        ${escapeHtml(name)} \u104F <strong style="color: #22c55e;">${escapeHtml(planName)}</strong> plan payment \u1000\u102D\u102F confirmed \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B
        Subscription \u1000\u102D\u102F activate \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B
      </p>
  `;
  return sendEmail({
    to,
    subject: `\u2705 PilotHub Payment Confirmed \u2014 ${planName} Plan`,
    html: wrapPilotHubEmailHtml(bodyHtml),
    text: `${name} \u104F ${planName} plan payment \u1000\u102D\u102F confirmed \u1015\u103C\u102F\u101C\u102F\u1015\u103A\u1015\u103C\u102E\u1038\u1015\u102B\u1015\u103C\u102E\u104B

Powered by ChatPilot`
  });
}

// server/routers.ts
init_adminAccess();
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
    updateProfile: protectedProcedure.input(z2.object({
      name: z2.string().min(1).optional(),
      phone: z2.string().optional(),
      businessName: z2.string().optional()
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
  // ── Application submission (public, no login required) ──
  applications: router({
    submit: publicProcedure.input(z2.object({
      fullName: z2.string().min(1),
      email: z2.string().email(),
      phone: z2.string().optional(),
      businessName: z2.string().optional(),
      businessType: z2.string().optional(),
      useCase: z2.string().optional(),
      plan: z2.enum(["bizpilot", "founderpilot", "free"]).optional().default("free")
    })).mutation(async ({ input }) => {
      const normalizedEmail = normalizeEmail(input.email);
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser) {
        if (existingUser.status === "active") {
          throw new TRPCError3({
            code: "CONFLICT",
            message: "An account with this email already exists. Please sign in with Google."
          });
        }
        throw new TRPCError3({
          code: "CONFLICT",
          message: "Your application is already on file. Please wait for admin approval, then sign in with Google."
        });
      }
      const existingApplication = await getApplicationByEmail(normalizedEmail);
      if (existingApplication) {
        if (existingApplication.status === "approved") {
          throw new TRPCError3({
            code: "CONFLICT",
            message: "This email is already approved. Please sign in with Google."
          });
        }
        if (existingApplication.status === "pending") {
          throw new TRPCError3({
            code: "CONFLICT",
            message: "An application with this email is already pending review. Please wait for admin approval."
          });
        }
        throw new TRPCError3({
          code: "CONFLICT",
          message: "An application with this email was already reviewed. Contact support if you need access."
        });
      }
      const app2 = await createApplication({
        fullName: input.fullName,
        email: normalizedEmail,
        phone: input.phone,
        businessName: input.businessName,
        businessType: input.businessType,
        useCase: input.useCase,
        plan: input.plan,
        source: "website"
      });
      try {
        await sendNewApplicationNotificationEmail({
          fullName: input.fullName,
          email: normalizedEmail,
          phone: input.phone,
          businessName: input.businessName,
          businessType: input.businessType,
          useCase: input.useCase,
          plan: input.plan,
          source: "website",
          applicationId: app2.id
        });
      } catch (e) {
        console.error("[applications.submit] Application notification email failed:", e);
      }
      try {
        await notifyOwner({
          title: `\u{1F4CB} New Application: ${input.fullName}`,
          content: `New application from ${input.fullName} (${input.email})
Plan: ${input.plan}
Business: ${input.businessName ?? "N/A"}
Use case: ${input.useCase ?? "N/A"}`
        });
      } catch (e) {
      }
      return { success: true, applicationId: app2.id };
    })
  }),
  // ── AI chat and conversation routers ──
  ai: router({
    conversations: router({
      list: approvedProcedure.input(z2.object({ modelSlug: z2.enum(["bizpilot", "founderpilot"]) })).query(async ({ ctx, input }) => {
        const convs = await listUserConversations(ctx.user.id, input.modelSlug);
        return { conversations: convs };
      }),
      get: approvedProcedure.input(z2.object({ conversationId: z2.number() })).query(async ({ ctx, input }) => {
        const conv = await getConversationById(ctx.user.id, input.conversationId);
        if (!conv) throw new TRPCError3({ code: "NOT_FOUND" });
        const msgs = await listConversationMessages(input.conversationId);
        return { conversation: conv, messages: msgs };
      }),
      create: approvedProcedure.input(z2.object({ modelSlug: z2.enum(["bizpilot", "founderpilot"]), title: z2.string().optional() })).mutation(async ({ ctx, input }) => {
        const conv = await getOrCreateConversation({ userId: ctx.user.id, modelSlug: input.modelSlug, title: input.title });
        return { conversation: conv };
      }),
      delete: approvedProcedure.input(z2.object({ conversationId: z2.number() })).mutation(async ({ ctx, input }) => {
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
    bizpilot: approvedProcedure.input(z2.object({ message: z2.string().min(1).max(1e4), conversationId: z2.number().optional() })).mutation(async ({ ctx, input }) => {
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
      const conv = await getOrCreateConversation({ userId: user.id, modelSlug: "bizpilot", conversationId: input.conversationId });
      await createMessage({ conversationId: conv.id, role: "user", content: input.message });
      const history = await listConversationMessages(conv.id);
      const recentHistory = history.slice(-20);
      const systemPrompt = await getActiveSystemPrompt("bizpilot");
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
      const llmMessages = [
        { role: "system", content: (systemPrompt || "You are BizPilot, an expert business advisor for Myanmar businesses.") + userProfileCtx + memoryNote },
        ...recentHistory.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: input.message }
      ];
      const assistantMessage = await invokeAdvisorLLM("bizpilot", llmMessages);
      await createMessage({ conversationId: conv.id, role: "assistant", content: assistantMessage });
      await touchConversation(conv.id);
      if (history.length <= 1) await updateConversationTitle(conv.id, input.message.slice(0, 80));
      await incrementMessageUsed(user.id, "bizpilot");
      const newUsage = await getMessageUsage(user.id, "bizpilot");
      return { conversationId: conv.id, message: assistantMessage, usage: newUsage };
    }),
    founderpilot: approvedProcedure.input(z2.object({ message: z2.string().min(1).max(1e4), conversationId: z2.number().optional() })).mutation(async ({ ctx, input }) => {
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
      const conv = await getOrCreateConversation({ userId: user.id, modelSlug: "founderpilot", conversationId: input.conversationId });
      await createMessage({ conversationId: conv.id, role: "user", content: input.message });
      const history = await listConversationMessages(conv.id);
      const recentHistory = history.slice(-20);
      const systemPrompt = await getActiveSystemPrompt("founderpilot");
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
      const llmMessages = [
        { role: "system", content: (systemPrompt || "You are FounderPilot, a strategic advisor for founders and CEOs.") + userProfileCtx + memoryNote },
        ...recentHistory.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: input.message }
      ];
      const assistantMessage = await invokeAdvisorLLM("founderpilot", llmMessages);
      await createMessage({ conversationId: conv.id, role: "assistant", content: assistantMessage });
      await touchConversation(conv.id);
      if (history.length <= 1) await updateConversationTitle(conv.id, input.message.slice(0, 80));
      await incrementMessageUsed(user.id, "founderpilot");
      const newUsage = await getMessageUsage(user.id, "founderpilot");
      return { conversationId: conv.id, message: assistantMessage, usage: newUsage };
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
    submit: protectedProcedure.input(z2.object({
      plan: z2.enum(["bizpilot", "founderpilot", "bizpilot-starter", "bizpilot-pro", "founderpilot-starter", "founderpilot-pro"]),
      paymentMethod: z2.string(),
      transactionRef: z2.string().optional(),
      screenshotUrl: z2.string().optional()
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
        screenshotUrl: input.screenshotUrl,
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
      return { success: true, paymentId: payment.id };
    }),
    // Upload screenshot
    uploadScreenshot: protectedProcedure.input(z2.object({
      filename: z2.string(),
      contentType: z2.string(),
      dataBase64: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.dataBase64, "base64");
      const key = `payment-screenshots/${ctx.user.id}-${Date.now()}-${input.filename}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url };
    }),
    myPayments: protectedProcedure.query(async ({ ctx }) => {
      const userPayments = await listUserPayments(ctx.user.id);
      return { payments: userPayments };
    })
  }),
  // ── Admin router ──
  admin: router({
    login: publicProcedure.input(z2.object({ username: z2.string(), password: z2.string() })).mutation(async ({ ctx, input }) => {
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
      set: publicProcedure.input(z2.object({ key: z2.string(), value: z2.string() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await setSystemSetting(input.key, input.value);
        return { success: true };
      }),
      // Upload QR code image (supports per-method: kbzpay, wavepay, ayapay)
      uploadQr: publicProcedure.input(z2.object({
        filename: z2.string(),
        contentType: z2.string(),
        dataBase64: z2.string(),
        method: z2.enum(["kbzpay", "wavepay", "ayapay", "default"]).optional().default("default")
      })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const buffer = Buffer.from(input.dataBase64, "base64");
        const key = `payment-qr/${input.method}-${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        const settingKey = input.method === "default" ? "payment_qr_url" : `${input.method}_qr_url`;
        await setSystemSetting(settingKey, url);
        return { success: true, url };
      })
    }),
    // ── Applications management ──
    applications: router({
      list: publicProcedure.query(async ({ ctx }) => {
        await requireAdmin(ctx);
        const apps = await listAllApplications();
        return { applications: apps };
      }),
      approve: publicProcedure.input(z2.object({ applicationId: z2.number(), notes: z2.string().optional() })).mutation(async ({ ctx, input }) => {
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
      reject: publicProcedure.input(z2.object({ applicationId: z2.number(), notes: z2.string().optional() })).mutation(async ({ ctx, input }) => {
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
      updateRole: publicProcedure.input(z2.object({ userId: z2.number(), role: z2.enum(["user", "admin"]) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
      updateSubscription: publicProcedure.input(z2.object({ userId: z2.number(), plan: z2.string(), status: z2.string() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updateUserSubscription(input.userId, input.plan, input.status);
        return { success: true };
      }),
      generate: publicProcedure.input(z2.object({ name: z2.string().min(1), email: z2.string().email(), plan: z2.enum(["bizpilot", "founderpilot"]).optional(), businessName: z2.string().optional() })).mutation(async ({ ctx, input }) => {
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
      delete: publicProcedure.input(z2.object({ userId: z2.number() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await deleteUser(input.userId);
        return { success: true };
      }),
      generateTelegramToken: publicProcedure.input(z2.object({ userId: z2.number() })).mutation(async ({ ctx, input }) => {
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
      updateStatus: publicProcedure.input(z2.object({ paymentId: z2.number(), status: z2.enum(["pending", "confirmed", "rejected"]) })).mutation(async ({ ctx, input }) => {
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
      update: publicProcedure.input(z2.object({
        paymentId: z2.number(),
        plan: z2.string().optional(),
        amount: z2.number().optional(),
        status: z2.enum(["pending", "confirmed", "rejected"]).optional(),
        paymentMethod: z2.string().optional(),
        transactionRef: z2.string().optional(),
        notes: z2.string().optional()
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
      delete: publicProcedure.input(z2.object({ paymentId: z2.number() })).mutation(async ({ ctx, input }) => {
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
      getActive: publicProcedure.input(z2.object({ modelSlug: z2.enum(["bizpilot", "founderpilot"]) })).query(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const content = await getActiveSystemPrompt(input.modelSlug);
        return { content };
      }),
      save: publicProcedure.input(z2.object({ name: z2.string().min(1), modelSlug: z2.enum(["bizpilot", "founderpilot"]), content: z2.string().min(10), activate: z2.boolean().default(false) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const result = await createSystemPromptVersion({ name: input.name, modelSlug: input.modelSlug, content: input.content, activate: input.activate });
        return { success: true, promptId: result.id };
      }),
      activate: publicProcedure.input(z2.object({ promptId: z2.number(), modelSlug: z2.string() })).mutation(async ({ ctx, input }) => {
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
      upsert: publicProcedure.input(z2.object({ provider: z2.enum(["openai", "gemini"]), keyValue: z2.string().min(10) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await upsertApiKey(input.provider, input.keyValue);
        return { success: true };
      }),
      setActive: publicProcedure.input(z2.object({ keyId: z2.number(), provider: z2.string() })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await setApiKeyActive(input.keyId, input.provider);
        return { success: true };
      }),
      delete: publicProcedure.input(z2.object({ keyId: z2.number() })).mutation(async ({ ctx, input }) => {
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
      update: publicProcedure.input(z2.object({ targetRole: z2.enum(["bizpilot", "founderpilot"]), modelString: z2.string().min(1) })).mutation(async ({ ctx, input }) => {
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
      create: publicProcedure.input(z2.object({
        title: z2.string().min(1),
        content: z2.string().min(1),
        type: z2.enum(["info", "success", "warning", "urgent"]).default("info")
      })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const result = await createAnnouncement(input);
        return { success: true, id: result.id };
      }),
      toggle: publicProcedure.input(z2.object({ id: z2.number(), isActive: z2.enum(["true", "false"]) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        await updateAnnouncement(input.id, { isActive: input.isActive });
        return { success: true };
      }),
      delete: publicProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
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
        z2.object({
          advisor: z2.enum(["bizpilot", "founderpilot"]).default("bizpilot")
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
        z2.object({
          userId: z2.number(),
          bizMessageLimit: z2.number().int().min(0).optional(),
          founderMessageLimit: z2.number().int().min(0).optional(),
          addBizMessages: z2.number().int().min(0).optional(),
          addFounderMessages: z2.number().int().min(0).optional(),
          planExpiryDate: z2.string().nullable().optional()
        })
      ).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        try {
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
        z2.object({
          name: z2.string().min(1),
          email: z2.string().email(),
          planType: z2.enum(["bizpilot", "founderpilot"]).default("bizpilot"),
          bizMessageLimit: z2.number().int().min(0).default(20),
          founderMessageLimit: z2.number().int().min(0).default(0),
          planExpiryDate: z2.string().optional(),
          botUsername: z2.string().min(1).optional()
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
            bizMessageLimit: input.bizMessageLimit,
            founderMessageLimit: input.founderMessageLimit,
            planExpiryDate,
            botUsername: input.botUsername
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to create user";
          throw new TRPCError3({ code: "BAD_REQUEST", message });
        }
      }),
      createActivationToken: publicProcedure.input(
        z2.object({
          userId: z2.number(),
          botUsername: z2.string().min(1).optional(),
          planType: z2.enum(["bizpilot", "founderpilot"]).default("bizpilot")
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
        z2.object({
          userId: z2.number(),
          botUsername: z2.string().min(1).optional(),
          planType: z2.enum(["bizpilot", "founderpilot"]).default("bizpilot")
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
      z2.object({
        mode: z2.enum(["all_approved", "single"]),
        userId: z2.number().int().positive().optional(),
        subject: z2.string().min(1).max(200),
        message: z2.string().min(1).max(2e4)
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
      create: publicProcedure.input(z2.object({ name: z2.string().min(1) })).mutation(async ({ ctx, input }) => {
        await requireAdmin(ctx);
        const { nanoid: nanoid4 } = await import("nanoid");
        const token = `ph_ext_${nanoid4(32)}`;
        const result = await createExternalApiToken(input.name, token);
        return { success: true, id: result.id, token };
      }),
      delete: publicProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
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
    try {
      const {
        fullName,
        email,
        phone,
        businessName,
        businessType,
        useCase,
        plan,
        paymentMethod,
        transactionRef,
        screenshotBase64,
        screenshotMime
      } = req.body;
      if (!fullName || !email) {
        res.status(400).json({ success: false, error: "fullName and email are required" });
        return;
      }
      const validPlan = plan === "founderpilot" ? "founderpilot" : "bizpilot";
      const app_ = await createApplication({
        fullName,
        email,
        phone,
        businessName,
        businessType,
        useCase,
        plan: validPlan,
        source: "external_api"
      });
      let paymentId;
      if (paymentMethod) {
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
        const amounts = { bizpilot: 1e5, founderpilot: 3e5 };
        const payment = await createPayment({
          userName: fullName,
          userEmail: email,
          plan: validPlan,
          amount: amounts[validPlan] ?? 0,
          paymentMethod,
          transactionRef,
          screenshotUrl,
          source: "external_api"
        });
        paymentId = payment.id;
      }
      try {
        await sendNewApplicationNotificationEmail({
          fullName,
          email,
          phone,
          businessName,
          businessType,
          useCase,
          plan: validPlan,
          source: "external_api",
          applicationId: app_.id
        });
      } catch (e) {
        console.error("[PublicAPI] Application notification email failed:", e);
      }
      try {
        await notifyOwner({
          title: `\u{1F4CB} External Application: ${fullName} (${validPlan})`,
          content: `New application from external website:
Name: ${fullName}
Email: ${email}
Plan: ${validPlan}
Business: ${businessName ?? "N/A"}
Payment: ${paymentMethod ?? "Not submitted"}
Ref: ${transactionRef ?? "N/A"}`
        });
      } catch (e) {
      }
      res.json({ success: true, applicationId: app_.id, paymentId });
    } catch (err) {
      console.error("[PublicAPI] /applications/submit error:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
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
        bizMessageLimit: typeof body.bizMessageLimit === "number" ? body.bizMessageLimit : void 0,
        founderMessageLimit: typeof body.founderMessageLimit === "number" ? body.founderMessageLimit : void 0,
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
function createApp(_options = {}) {
  const app2 = express();
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
