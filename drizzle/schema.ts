import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
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
  // Free-trial caps (cost-cutting): BizPilot = 2 messages, FounderPilot = 0 (immediate paywall).
  bizMessageLimit: integer("bizMessageLimit").default(2).notNull(),
  founderMessageLimit: integer("founderMessageLimit").default(0).notNull(),
  bizMessagesUsed: integer("bizMessagesUsed").default(0).notNull(),
  founderMessagesUsed: integer("founderMessagesUsed").default(0).notNull(),
  hasUsedBizStarter: text("hasUsedBizStarter", { enum: ["true", "false"] }).notNull().default("false"),
  hasUsedFounderStarter: text("hasUsedFounderStarter", { enum: ["true", "false"] }).notNull().default("false"),
  telegramChatId: text("telegramChatId", { length: 64 }),
  planExpiryDate: integer("planExpiryDate", { mode: "timestamp_ms" }),
  passwordHash: text("passwordHash"),
  onboardingCompletedAt: integer("onboardingCompletedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  modelSlug: text("modelSlug", { length: 64 }).notNull(),
  title: text("title"),
  summary: text("summary"),
  /**
   * Structured JSON snapshot of the lean LLM context window:
   * a JSON-stringified array of `{ role, content, imageData? }` objects.
   * Replaces concatenated-text memory to cut token bloat and improve precision.
   */
  messagesJson: text("messagesJson"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversationId").notNull(),
  role: text("role", { length: 64 }).notNull(),
  content: text("content").notNull(),
  /** Optional base64 / data-URL image attachment for multimodal chat */
  imageData: text("imageData"),
  tokenCount: integer("tokenCount"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const systemPrompts = sqliteTable("systemPrompts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  modelSlug: text("modelSlug", { length: 64 }).notNull(),
  content: text("content").notNull(),
  version: integer("version").default(1).notNull(),
  isActive: text("isActive", { enum: ["true", "false"] }).default("false"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type SystemPrompt = typeof systemPrompts.$inferSelect;
export type InsertSystemPrompt = typeof systemPrompts.$inferInsert;

export const aiModels = sqliteTable("aiModels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetRole: text("targetRole", { length: 64 }).notNull().unique(),
  modelString: text("modelString").notNull(),
  isActive: text("isActive", { enum: ["true", "false"] }).default("true"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = typeof aiModels.$inferInsert;

export const apiKeys = sqliteTable("apiKeys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider", { length: 64 }).notNull(),
  keyValue: text("keyValue").notNull(),
  isActive: text("isActive", { enum: ["true", "false"] }).default("false"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

export const payments = sqliteTable("payments", {
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
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const systemSettings = sqliteTable("systemSettings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key", { length: 128 }).notNull().unique(),
  value: text("value"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

export const applications = sqliteTable("applications", {
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
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const externalApiTokens = sqliteTable("externalApiTokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 128 }).notNull(),
  token: text("token", { length: 256 }).notNull().unique(),
  isActive: text("isActive", { enum: ["true", "false"] }).default("true"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type ExternalApiToken = typeof externalApiTokens.$inferSelect;
export type InsertExternalApiToken = typeof externalApiTokens.$inferInsert;

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["info", "success", "warning", "urgent"] }).default("info").notNull(),
  isActive: text("isActive", { enum: ["true", "false"] }).default("true").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

export const botActivationTokens = sqliteTable("bot_activation_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token", { length: 64 }).notNull().unique(),
  userId: integer("userId").notNull(),
  isUsed: text("isUsed", { enum: ["true", "false"] }).notNull().default("false"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type BotActivationToken = typeof botActivationTokens.$inferSelect;
export type InsertBotActivationToken = typeof botActivationTokens.$inferInsert;

/** Telegram ↔ Gemini short-term memory (per user + advisor channel). */
export const telegramLlmTurns = sqliteTable("telegram_llm_turns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  advisor: text("advisor", { length: 32 }).notNull(),
  role: text("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type TelegramLlmTurn = typeof telegramLlmTurns.$inferSelect;
export type InsertTelegramLlmTurn = typeof telegramLlmTurns.$inferInsert;
