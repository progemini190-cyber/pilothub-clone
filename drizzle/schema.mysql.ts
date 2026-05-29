/**
 * MySQL / TiDB schema (Manus production). Table + column names match the legacy database.
 */
import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  businessName: text("businessName"),
  businessType: varchar("businessType", { length: 128 }),
  useCase: text("useCase"),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).notNull().default("user"),
  plan: varchar("plan", { length: 64 }).default("free"),
  status: varchar("status", { length: 64 }).default("active"),
  subscriptionStart: timestamp("subscriptionStart"),
  subscriptionEnd: timestamp("subscriptionEnd"),
  notes: text("notes"),
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
  passwordHash: text("passwordHash"),
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  lastSignedIn: timestamp("lastSignedIn").notNull().defaultNow(),
});

export const payments = mysqlTable("payments", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId"),
  userName: text("userName"),
  userEmail: varchar("userEmail", { length: 320 }),
  plan: varchar("plan", { length: 64 }).notNull(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("MMK").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  transactionRef: varchar("transactionRef", { length: 255 }),
  screenshotUrl: text("screenshotUrl"),
  notes: text("notes"),
  source: varchar("source", { length: 32 }).default("website"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").primaryKey().autoincrement(),
  provider: varchar("provider", { length: 64 }).notNull(),
  keyValue: text("keyValue").notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("false"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const systemPrompts = mysqlTable("systemPrompts", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  modelSlug: varchar("modelSlug", { length: 64 }).notNull(),
  content: text("content").notNull(),
  version: int("version").default(1).notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("false"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const applications = mysqlTable("applications", {
  id: int("id").primaryKey().autoincrement(),
  fullName: text("fullName").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  businessName: text("businessName"),
  businessType: varchar("businessType", { length: 128 }),
  useCase: text("useCase"),
  plan: varchar("plan", { length: 64 }).default("free"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  source: varchar("source", { length: 32 }).default("website"),
  userId: int("userId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const aiModels = mysqlTable("aiModels", {
  id: int("id").primaryKey().autoincrement(),
  targetRole: varchar("targetRole", { length: 64 }).notNull().unique(),
  modelString: text("modelString").notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").primaryKey().autoincrement(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  modelSlug: varchar("modelSlug", { length: 64 }).notNull(),
  title: text("title"),
  summary: text("summary"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  conversationId: int("conversationId").notNull(),
  role: varchar("role", { length: 64 }).notNull(),
  content: text("content").notNull(),
  imageData: text("imageData"),
  tokenCount: int("tokenCount"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const externalApiTokens = mysqlTable("externalApiTokens", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 128 }).notNull(),
  token: varchar("token", { length: 256 }).notNull().unique(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const announcements = mysqlTable("announcements", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "urgent"]).default("info").notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const botActivationTokens = mysqlTable("bot_activation_tokens", {
  id: int("id").primaryKey().autoincrement(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull(),
  isUsed: mysqlEnum("isUsed", ["true", "false"]).notNull().default("false"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const telegramLlmTurns = mysqlTable("telegram_llm_turns", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  advisor: varchar("advisor", { length: 32 }).notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
