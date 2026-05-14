import { createClient } from "@libsql/client";
import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import {
  InsertUser,
  users,
  conversations,
  messages,
  systemPrompts,
  aiModels,
  apiKeys,
  payments,
  systemSettings,
  applications,
  externalApiTokens,
  announcements,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (_db) return _db;
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN ?? undefined,
    });
    _db = drizzle(client);
    return _db;
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if ((user as any).status !== undefined) { (values as any).status = (user as any).status; updateSet.status = (user as any).status; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as Record<string, unknown>,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Tiered message counter helpers ──

/**
 * Get the current message usage and limit for a user's advisor.
 * Returns { used, limit, planType, hasUsedStarter }
 */
export async function getMessageUsage(userId: number, advisor: "bizpilot" | "founderpilot") {
  const db = await getDb();
  if (!db) return { used: 0, limit: 5, planType: "free" as const, hasUsedStarter: false };
  const result = await db.select({
    bizMessagesUsed: users.bizMessagesUsed,
    founderMessagesUsed: users.founderMessagesUsed,
    bizMessageLimit: users.bizMessageLimit,
    founderMessageLimit: users.founderMessageLimit,
    planTypeBiz: users.planTypeBiz,
    planTypeFounder: users.planTypeFounder,
    hasUsedBizStarter: users.hasUsedBizStarter,
    hasUsedFounderStarter: users.hasUsedFounderStarter,
  }).from(users).where(eq(users.id, userId)).limit(1);
  const row = result[0];
  if (!row) return { used: 0, limit: 5, planType: "free" as const, hasUsedStarter: false };
  if (advisor === "bizpilot") {
    return {
      used: row.bizMessagesUsed ?? 0,
      limit: row.bizMessageLimit ?? 5,
      planType: (row.planTypeBiz ?? "free") as "free" | "starter" | "pro",
      hasUsedStarter: row.hasUsedBizStarter === "true",
    };
  } else {
    return {
      used: row.founderMessagesUsed ?? 0,
      limit: row.founderMessageLimit ?? 5,
      planType: (row.planTypeFounder ?? "free") as "free" | "starter" | "pro",
      hasUsedStarter: row.hasUsedFounderStarter === "true",
    };
  }
}

/**
 * Increment messages used for an advisor after a successful AI response.
 */
export async function incrementMessageUsed(userId: number, advisor: "bizpilot" | "founderpilot") {
  const db = await getDb();
  if (!db) return;
  const usage = await getMessageUsage(userId, advisor);
  if (advisor === "bizpilot") {
    await db.update(users).set({ bizMessagesUsed: usage.used + 1 }).where(eq(users.id, userId));
  } else {
    await db.update(users).set({ founderMessagesUsed: usage.used + 1 }).where(eq(users.id, userId));
  }
}

/**
 * Activate a tiered plan for a user after payment confirmation.
 * - starter: 20 messages, one-time, sets hasUsedStarter=true
 * - pro: unlimited (limit=999999), monthly subscription
 */
export async function activateTieredPlan(
  userId: number,
  advisor: "bizpilot" | "founderpilot",
  planType: "starter" | "pro"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);

  if (advisor === "bizpilot") {
    const updateData: Record<string, unknown> = {
      planTypeBiz: planType,
      bizMessagesUsed: 0, // reset counter on new plan
    };
    if (planType === "starter") {
      updateData.bizMessageLimit = 20;
      updateData.hasUsedBizStarter = "true";
    } else {
      updateData.bizMessageLimit = 999999; // pro = unlimited
      updateData.subscriptionStart = now;
      updateData.subscriptionEnd = end;
    }
    await db.update(users).set(updateData as any).where(eq(users.id, userId));
  } else {
    const updateData: Record<string, unknown> = {
      planTypeFounder: planType,
      founderMessagesUsed: 0, // reset counter on new plan
    };
    if (planType === "starter") {
      updateData.founderMessageLimit = 20;
      updateData.hasUsedFounderStarter = "true";
    } else {
      updateData.founderMessageLimit = 999999; // pro = unlimited
      updateData.subscriptionStart = now;
      updateData.subscriptionEnd = end;
    }
    await db.update(users).set(updateData as any).where(eq(users.id, userId));
  }
}

// ── Free trial helpers (legacy) ──

export async function decrementFreeTrialCount(userId: number, advisor: "bizpilot" | "founderpilot") {
  const db = await getDb();
  if (!db) return;
  const user = await getUserById(userId);
  if (!user) return;
  if (advisor === "bizpilot") {
    const newCount = Math.max(0, (user.freeBizCount ?? 10) - 1);
    await db.update(users).set({ freeBizCount: newCount }).where(eq(users.id, userId));
  } else {
    const newCount = Math.max(0, (user.freeFounderCount ?? 5) - 1);
    await db.update(users).set({ freeFounderCount: newCount }).where(eq(users.id, userId));
  }
}

export async function getFreeTrialCounts(userId: number) {
  const db = await getDb();
  if (!db) return { freeBizCount: 10, freeFounderCount: 5 };
  const result = await db.select({ freeBizCount: users.freeBizCount, freeFounderCount: users.freeFounderCount })
    .from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? { freeBizCount: 10, freeFounderCount: 5 };
}

// ── Conversation helpers ──

export async function getOrCreateConversation(input: {
  userId: number;
  modelSlug: "bizpilot" | "founderpilot";
  conversationId?: number;
  title?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (input.conversationId) {
    const existing = await db.select().from(conversations)
      .where(and(eq(conversations.id, input.conversationId), eq(conversations.userId, input.userId)))
      .limit(1);
    if (existing.length > 0) return existing[0];
  }
  const [row] = await db
    .insert(conversations)
    .values({
      userId: input.userId,
      modelSlug: input.modelSlug,
      title: input.title ?? null,
    })
    .returning();
  return row;
}

export async function listUserConversations(userId: number, modelSlug: "bizpilot" | "founderpilot", limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.modelSlug, modelSlug)))
    .orderBy(desc(conversations.updatedAt), desc(conversations.createdAt))
    .limit(limit);
}

export async function getConversationById(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1);
  return result[0];
}

export async function listConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
}

export async function createMessage(input: { conversationId: number; role: "user" | "assistant"; content: string; tokenCount?: number; }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      tokenCount: input.tokenCount ?? null,
    })
    .returning();
  return row;
}

export async function touchConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
}

export async function deleteConversation(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.conversationId, conversationId));
  await db.delete(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
}

export async function updateConversationTitle(conversationId: number, title: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set({ title }).where(eq(conversations.id, conversationId));
}

// ── System prompt helpers ──

export async function getActiveSystemPrompt(modelSlug: "bizpilot" | "founderpilot") {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemPrompts)
    .where(and(eq(systemPrompts.modelSlug, modelSlug), eq(systemPrompts.isActive, "true")))
    .orderBy(desc(systemPrompts.version)).limit(1);
  return result[0]?.content ?? null;
}

export async function listSystemPrompts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemPrompts).orderBy(desc(systemPrompts.updatedAt));
}

export async function createSystemPromptVersion(input: { name: string; modelSlug: "bizpilot" | "founderpilot"; content: string; activate?: boolean; }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(systemPrompts).where(eq(systemPrompts.modelSlug, input.modelSlug)).orderBy(desc(systemPrompts.version)).limit(1);
  const nextVersion = (existing[0]?.version ?? 0) + 1;
  if (input.activate) {
    await db.update(systemPrompts).set({ isActive: "false" }).where(eq(systemPrompts.modelSlug, input.modelSlug));
  }
  const [row] = await db
    .insert(systemPrompts)
    .values({
      name: input.name,
      modelSlug: input.modelSlug,
      content: input.content,
      version: nextVersion,
      isActive: input.activate ? "true" : "false",
    })
    .returning();
  return row;
}

export async function activateSystemPrompt(promptId: number, modelSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(systemPrompts).set({ isActive: "false" }).where(eq(systemPrompts.modelSlug, modelSlug as "bizpilot" | "founderpilot"));
  await db.update(systemPrompts).set({ isActive: "true" }).where(eq(systemPrompts.id, promptId));
}

export async function getSystemPromptById(promptId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(systemPrompts).where(eq(systemPrompts.id, promptId)).limit(1);
  return result[0];
}

export async function upsertSystemPrompt(modelSlug: "bizpilot" | "founderpilot", content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(systemPrompts).set({ isActive: "false" }).where(eq(systemPrompts.modelSlug, modelSlug));
  await db.insert(systemPrompts).values({ name: `${modelSlug} system prompt`, modelSlug, content, version: 1, isActive: "true" });
}

// ── AI Model helpers ──

export async function getAiModel(targetRole: "bizpilot" | "founderpilot") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiModels).where(eq(aiModels.targetRole, targetRole)).limit(1);
  return result[0];
}

export async function listAllAiModels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiModels).orderBy(asc(aiModels.targetRole));
}

export async function updateAiModel(targetRole: string, modelString: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiModels).set({ modelString, updatedAt: new Date() }).where(eq(aiModels.targetRole, targetRole));
}

// ── API Key helpers ──

export async function getActiveApiKey(provider: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiKeys).where(and(eq(apiKeys.provider, provider), eq(apiKeys.isActive, "true"))).limit(1);
  return result[0];
}

export async function listAllApiKeys() {
  const db = await getDb();
  if (!db) return [];
  const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  return keys.map(k => ({ ...k, keyValue: k.keyValue.slice(0, 8) + '...' + k.keyValue.slice(-4), keyValueFull: k.keyValue }));
}

export async function upsertApiKey(provider: string, keyValue: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys).set({ isActive: "false" }).where(eq(apiKeys.provider, provider));
  await db.insert(apiKeys).values({ provider, keyValue, isActive: "true" });
}

export async function deleteApiKey(keyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys).set({ isActive: "false" }).where(eq(apiKeys.id, keyId));
}

export async function setApiKeyActive(keyId: number, provider: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys).set({ isActive: "false" }).where(eq(apiKeys.provider, provider));
  await db.update(apiKeys).set({ isActive: "true" }).where(eq(apiKeys.id, keyId));
}

// ── User management helpers ──

export async function listAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name?: string; phone?: string; businessName?: string; businessType?: string; useCase?: string }) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.phone !== undefined) updateSet.phone = data.phone;
  if (data.businessName !== undefined) updateSet.businessName = data.businessName;
  if (data.businessType !== undefined) (updateSet as any).businessType = data.businessType;
  if (data.useCase !== undefined) (updateSet as any).useCase = data.useCase;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet as any).where(eq(users.id, userId));
  }
}

export async function updateUserSubscription(userId: number, plan: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  await db.update(users).set({ plan, status, subscriptionStart: now, subscriptionEnd: end, updatedAt: now }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

// ── Payment helpers ──

export async function createPayment(input: {
  userId?: number;
  userName?: string;
  userEmail?: string;
  plan: string;
  amount: number;
  paymentMethod?: string;
  transactionRef?: string;
  screenshotUrl?: string;
  source?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db
    .insert(payments)
    .values({
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
      source: input.source ?? "website",
    })
    .returning();
  return row;
}

export async function listAllPayments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function listUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

export async function updatePaymentStatus(paymentId: number, status: "pending" | "confirmed" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payments).set({ status }).where(eq(payments.id, paymentId));
}

export async function updatePayment(paymentId: number, fields: {
  plan?: string; amount?: number; status?: "pending" | "confirmed" | "rejected";
  paymentMethod?: string; transactionRef?: string; notes?: string; screenshotUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  if (fields.plan !== undefined) updateSet.plan = fields.plan;
  if (fields.amount !== undefined) updateSet.amount = fields.amount;
  if (fields.status !== undefined) updateSet.status = fields.status;
  if (fields.paymentMethod !== undefined) updateSet.paymentMethod = fields.paymentMethod;
  if (fields.transactionRef !== undefined) updateSet.transactionRef = fields.transactionRef;
  if (fields.notes !== undefined) updateSet.notes = fields.notes;
  if (fields.screenshotUrl !== undefined) updateSet.screenshotUrl = fields.screenshotUrl;
  await db.update(payments).set(updateSet).where(eq(payments.id, paymentId));
}

export async function deletePayment(paymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(payments).where(eq(payments.id, paymentId));
}

// ── System Settings helpers ──

export async function getSystemSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function setSystemSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function listSystemSettings(): Promise<Array<{ key: string; value: string | null }>> {
  const db = await getDb();
  if (!db) return [];
  return db.select({ key: systemSettings.key, value: systemSettings.value }).from(systemSettings);
}

// ── Application helpers ──

export async function createApplication(input: {
  fullName: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  useCase?: string;
  plan?: string;
  source?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db
    .insert(applications)
    .values({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      businessName: input.businessName ?? null,
      businessType: input.businessType ?? null,
      useCase: input.useCase ?? null,
      plan: input.plan ?? "free",
      source: input.source ?? "website",
      status: "pending",
    })
    .returning();
  return row;
}

export async function listAllApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0];
}

export async function getApprovedApplicationByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(applications)
    .where(eq(applications.email, email))
    .limit(1);
  return result[0];
}

export async function updateApplicationStatus(id: number, status: "pending" | "approved" | "rejected", userId?: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = { status };
  if (userId !== undefined) updateSet.userId = userId;
  if (notes !== undefined) updateSet.notes = notes;
  await db.update(applications).set(updateSet).where(eq(applications.id, id));
}

// ── External API Token helpers ──

export async function validateExternalApiToken(token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(externalApiTokens)
    .where(and(eq(externalApiTokens.token, token), eq(externalApiTokens.isActive, "true")))
    .limit(1);
  return result.length > 0;
}

export async function listExternalApiTokens() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(externalApiTokens).orderBy(desc(externalApiTokens.createdAt));
}

export async function createExternalApiToken(name: string, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(externalApiTokens).values({ name, token, isActive: "true" }).returning();
  return row;
}

export async function deleteExternalApiToken(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(externalApiTokens).set({ isActive: "false" }).where(eq(externalApiTokens.id, id));
}

// ── Announcement helpers ──
export async function createAnnouncement(data: { title: string; content: string; type: "info" | "success" | "warning" | "urgent" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(announcements).values({ ...data, isActive: "true" }).returning();
  return row;
}
export async function listAnnouncements(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(announcements).where(eq(announcements.isActive, "true")).orderBy(desc(announcements.createdAt));
  }
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}
export async function updateAnnouncement(id: number, data: Partial<{ title: string; content: string; type: "info" | "success" | "warning" | "urgent"; isActive: "true" | "false" }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}
export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements).where(eq(announcements.id, id));
}
