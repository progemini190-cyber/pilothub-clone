import { eq, and, desc, asc, sql, inArray, or } from "drizzle-orm";
import {
  addTelegramPlanMonths,
  hasUsedTelegramStarter,
  isStarterTelegramLimit,
  isUnlimitedTelegramLimit,
  TELEGRAM_STARTER_ALREADY_USED_BIZ,
  TELEGRAM_STARTER_ALREADY_USED_FOUNDER,
  TELEGRAM_STARTER_MESSAGE_LIMIT,
  TELEGRAM_UNLIMITED_MESSAGE_LIMIT,
  type TelegramPlanTier,
} from "@shared/telegramPlans";
import {
  hasAnyActivePaidPlan,
  isProTierPlan,
  parsePlanKey,
} from "@shared/plans";

export { isUnlimitedTelegramLimit } from "@shared/telegramPlans";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { shouldGrantAdminRole } from "./_core/adminAccess";
import { pickCanonicalUser } from "./_core/userStatus";
import {
  getDb,
  initializeDatabase,
  maskDatabaseUrl,
  resolveMysqlUrl,
  resolveTursoConfig,
  getDatabaseProvider,
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
  botActivationTokens,
  telegramLlmTurns,
} from "./db/connection";

export {
  getDb,
  initializeDatabase,
  maskDatabaseUrl,
  resolveMysqlUrl,
  resolveTursoConfig,
  getDatabaseProvider,
};
export type { InsertUser };

/** @deprecated Use resolveTursoConfig */
export function resolveDatabaseConfig() {
  const turso = resolveTursoConfig();
  if (!turso) return null;
  return { url: turso.url, authToken: turso.authToken, source: "TURSO_DATABASE_URL" as const };
}

export async function assertDatabase() {
  const database = await getDb();
  if (!database) {
    throw new Error(
      "Database unavailable. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, or MYSQL_URL for legacy TiDB data.",
    );
  }
  return database;
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
    else if (
      shouldGrantAdminRole({
        email: user.email,
        googleSub: user.openId,
        ownerGoogleSub: ENV.ownerGoogleSub,
      })
    ) {
      values.role = "admin";
      updateSet.role = "admin";
    }
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

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUsersByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  const normalized = normalizeEmail(email);
  return db
    .select()
    .from(users)
    .where(sql`lower(trim(${users.email})) = ${normalized}`)
    .orderBy(asc(users.id));
}

export async function getUserByEmail(email: string) {
  const matches = await getUsersByEmail(email);
  if (matches.length === 0) return undefined;
  return pickCanonicalUser(matches, "");
}

/** Resolve existing account for Google OAuth (email + openId, handles duplicate rows). */
export async function resolveUserForGoogleLogin(
  email: string | null,
  googleSub: string,
) {
  const { pickCanonicalUser, isPendingUserStatus } = await import("./_core/userStatus");

  const byOpenId = await getUserByOpenId(googleSub);
  const byEmail = email ? await getUsersByEmail(email) : [];

  const candidates = [...byEmail, ...(byOpenId ? [byOpenId] : [])];
  let canonical = pickCanonicalUser(candidates, googleSub);

  if (canonical && canonical.openId !== googleSub) {
    if (byOpenId && byOpenId.id !== canonical.id && isPendingUserStatus(byOpenId.status)) {
      const database = await getDb();
      if (database) {
        await database.delete(users).where(eq(users.id, byOpenId.id));
        console.info("[Database] Removed stale pending Google row", {
          removedId: byOpenId.id,
          keptId: canonical.id,
          email,
        });
      }
    }
    await linkUserToGoogleOpenId(canonical.id, googleSub, { loginMethod: "google" });
    canonical = (await getUserByOpenId(googleSub)) ?? canonical;
  }

  return {
    user: canonical ?? byOpenId,
    byOpenId,
    byEmail,
  };
}

/** Re-attach an admin-provisioned account (`app_*` openId) to the user's Google `sub`. */
export async function linkUserToGoogleOpenId(
  userId: number,
  googleOpenId: string,
  fields: { name?: string | null; loginMethod?: string },
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conflicting = await getUserByOpenId(googleOpenId);
  if (conflicting && conflicting.id !== userId) {
    if (conflicting.status === "pending" && conflicting.loginMethod === "google") {
      await db.delete(users).where(eq(users.id, conflicting.id));
    } else {
      throw new Error("This Google account is already linked to another user");
    }
  }

  const updateSet: Record<string, unknown> = {
    openId: googleOpenId,
    loginMethod: fields.loginMethod ?? "google",
    lastSignedIn: new Date(),
  };
  if (fields.name !== undefined) updateSet.name = fields.name;

  await db.update(users).set(updateSet as Record<string, unknown>).where(eq(users.id, userId));
}

// ── Tiered message counter helpers ──

export const WEB_CHAT_UNLIMITED_LIMIT = 999999;
export const WEB_CHAT_STARTER_LIMIT = 20;

function planAppliesToAdvisor(
  planKey: string | null | undefined,
  advisor: "bizpilot" | "founderpilot",
): boolean {
  const parsed = parsePlanKey(planKey);
  if (parsed.tier === "free") return false;
  return parsed.advisor === advisor;
}

function isUnlimitedWebAdvisorUsage(
  advisor: "bizpilot" | "founderpilot",
  row: {
    plan?: string | null;
    status?: string | null;
    planTypeBiz?: string | null;
    planTypeFounder?: string | null;
    bizMessageLimit?: number | null;
    founderMessageLimit?: number | null;
  },
): boolean {
  const tierPlan = advisor === "bizpilot" ? row.planTypeBiz : row.planTypeFounder;
  if (tierPlan === "pro") return true;
  const limit =
    advisor === "bizpilot" ? row.bizMessageLimit ?? 5 : row.founderMessageLimit ?? 5;
  if (limit >= WEB_CHAT_UNLIMITED_LIMIT) return true;
  if (!planAppliesToAdvisor(row.plan, advisor)) return false;
  return isProTierPlan(row.plan);
}

function webMessageLimitForAdvisor(
  advisor: "bizpilot" | "founderpilot",
  row: {
    plan?: string | null;
    status?: string | null;
    planTypeBiz?: string | null;
    planTypeFounder?: string | null;
    bizMessageLimit?: number | null;
    founderMessageLimit?: number | null;
  },
): number {
  if (isUnlimitedWebAdvisorUsage(advisor, row)) return WEB_CHAT_UNLIMITED_LIMIT;
  const tierPlan = advisor === "bizpilot" ? row.planTypeBiz : row.planTypeFounder;
  const storedLimit =
    advisor === "bizpilot" ? row.bizMessageLimit ?? 5 : row.founderMessageLimit ?? 5;
  if (planAppliesToAdvisor(row.plan, advisor)) {
    const tier = parsePlanKey(row.plan).tier;
    if (tier === "starter") return Math.max(storedLimit, WEB_CHAT_STARTER_LIMIT);
    if (tier === "pro") return WEB_CHAT_UNLIMITED_LIMIT;
  }
  if (tierPlan === "starter") return Math.max(storedLimit, WEB_CHAT_STARTER_LIMIT);
  return storedLimit;
}

/**
 * Get the current message usage and limit for a user's advisor.
 * Returns { used, limit, planType, hasUsedStarter }
 */
export async function getMessageUsage(userId: number, advisor: "bizpilot" | "founderpilot") {
  const db = await getDb();
  if (!db) {
    return {
      used: 0,
      limit: 5,
      planType: "free" as const,
      hasUsedStarter: false,
      hasPaidPlan: false,
    };
  }
  const result = await db.select({
    bizMessagesUsed: users.bizMessagesUsed,
    founderMessagesUsed: users.founderMessagesUsed,
    bizMessageLimit: users.bizMessageLimit,
    founderMessageLimit: users.founderMessageLimit,
    planTypeBiz: users.planTypeBiz,
    planTypeFounder: users.planTypeFounder,
    hasUsedBizStarter: users.hasUsedBizStarter,
    hasUsedFounderStarter: users.hasUsedFounderStarter,
    plan: users.plan,
    status: users.status,
  }).from(users).where(eq(users.id, userId)).limit(1);
  const row = result[0];
  if (!row) {
    return {
      used: 0,
      limit: 5,
      planType: "free" as const,
      hasUsedStarter: false,
      hasPaidPlan: false,
    };
  }
  const unlimited = isUnlimitedWebAdvisorUsage(advisor, row);
  const limit = webMessageLimitForAdvisor(advisor, row);
  const hasPaidPlan = hasAnyActivePaidPlan(row.plan, row.status);
  if (advisor === "bizpilot") {
    const planType = (row.planTypeBiz ?? "free") as "free" | "starter" | "pro";
    return {
      used: row.bizMessagesUsed ?? 0,
      limit,
      planType: unlimited ? ("pro" as const) : planType,
      hasUsedStarter: row.hasUsedBizStarter === "true",
      hasPaidPlan: hasPaidPlan && (planAppliesToAdvisor(row.plan, "bizpilot") || planType !== "free"),
    };
  } else {
    const planType = (row.planTypeFounder ?? "free") as "free" | "starter" | "pro";
    return {
      used: row.founderMessagesUsed ?? 0,
      limit,
      planType: unlimited ? ("pro" as const) : planType,
      hasUsedStarter: row.hasUsedFounderStarter === "true",
      hasPaidPlan: hasPaidPlan && (planAppliesToAdvisor(row.plan, "founderpilot") || planType !== "free"),
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
  if (usage.limit >= WEB_CHAT_UNLIMITED_LIMIT) return;
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
      updateData.planExpiryDate = end;
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
      updateData.planExpiryDate = end;
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
  const db = await assertDatabase();
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
  const db = await assertDatabase();
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
  const db = await assertDatabase();
  return db.select().from(users).orderBy(desc(users.createdAt));
}

/** Users eligible for admin email broadcast (approved / active with email). */
export async function listApprovedUserEmails(): Promise<
  Array<{ id: number; email: string; name: string | null }>
> {
  const db = await assertDatabase();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      status: users.status,
    })
    .from(users)
    .where(
      or(
        eq(users.status, "approved"),
        eq(users.status, "active"),
        eq(users.status, "APPROVED"),
      ),
    )
    .orderBy(desc(users.createdAt));

  return rows
    .filter((r) => typeof r.email === "string" && r.email.trim().length > 0)
    .map((r) => ({
      id: r.id,
      email: r.email!.trim(),
      name: r.name,
    }));
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

export async function completeUserOnboarding(
  userId: number,
  data: { name: string; useCase: string },
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db
    .update(users)
    .set({
      name: data.name.trim(),
      useCase: data.useCase.trim(),
      status: "active",
      onboardingCompletedAt: now,
      updatedAt: now,
    } as never)
    .where(eq(users.id, userId));
}

export async function createEmailPasswordUser(input: {
  email: string;
  passwordHash: string;
  name?: string;
}): Promise<{ openId: string }> {
  const { nanoid } = await import("nanoid");
  const db = await assertDatabase();
  const normalized = normalizeEmail(input.email);
  const openId = `email_${nanoid(24)}`;
  const now = new Date();

  await db.insert(users).values({
    openId,
    email: normalized,
    name: input.name?.trim() || null,
    passwordHash: input.passwordHash,
    loginMethod: "email",
    role: "user",
    status: "active",
    plan: "free",
    lastSignedIn: now,
  } as never);

  return { openId };
}

export async function setUserPasswordHash(userId: number, passwordHash: string): Promise<void> {
  const db = await assertDatabase();
  await db.update(users).set({ passwordHash } as never).where(eq(users.id, userId));
}

/** Apply admin-selected plan key; syncs web chat tiers and limits. */
export async function applyAdminUserPlan(userId: number, planKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  const { advisor, tier } = parsePlanKey(planKey);

  if (!planKey.trim() || tier === "free") {
    await db
      .update(users)
      .set({
        plan: "free",
        status: "inactive",
        updatedAt: now,
      } as never)
      .where(eq(users.id, userId));
    return;
  }

  const updateSet: Record<string, unknown> = {
    plan: planKey,
    status: "active",
    subscriptionStart: now,
    subscriptionEnd: end,
    updatedAt: now,
  };

  if (advisor === "bizpilot") {
    updateSet.planTypeBiz = tier;
    updateSet.bizMessagesUsed = 0;
    updateSet.bizMessageLimit =
      tier === "pro" ? WEB_CHAT_UNLIMITED_LIMIT : WEB_CHAT_STARTER_LIMIT;
    if (tier === "starter") updateSet.hasUsedBizStarter = "true";
  } else if (advisor === "founderpilot") {
    updateSet.planTypeFounder = tier;
    updateSet.founderMessagesUsed = 0;
    updateSet.founderMessageLimit =
      tier === "pro" ? WEB_CHAT_UNLIMITED_LIMIT : WEB_CHAT_STARTER_LIMIT;
    if (tier === "starter") updateSet.hasUsedFounderStarter = "true";
  }

  await db.update(users).set(updateSet as never).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, plan: string, status: string) {
  const isActive = status.toLowerCase().trim() === "active";
  if (!isActive || !plan.trim() || plan === "free") {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .update(users)
      .set({ plan, status, updatedAt: new Date() } as never)
      .where(eq(users.id, userId));
    return;
  }
  await applyAdminUserPlan(userId, plan);
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
  const db = await assertDatabase();
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
  const db = await assertDatabase();
  return db.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0];
}

export async function getApplicationByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalized = normalizeEmail(email);
  const result = await db
    .select()
    .from(applications)
    .where(sql`lower(trim(${applications.email})) = ${normalized}`)
    .orderBy(desc(applications.createdAt))
    .limit(1);
  return result[0];
}

export async function getApprovedApplicationByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalized = normalizeEmail(email);
  const result = await db
    .select()
    .from(applications)
    .where(
      and(
        sql`lower(trim(${applications.email})) = ${normalized}`,
        eq(applications.status, "approved"),
      ),
    )
    .orderBy(desc(applications.createdAt))
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

// ── Telegram bot helpers ──

export type AdvisorSlug = "bizpilot" | "founderpilot";

export async function getUserByTelegramChatId(chatId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.telegramChatId, chatId))
    .orderBy(desc(users.updatedAt))
    .limit(1);
  return result[0];
}

export async function linkTelegramChat(userId: number, chatId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ telegramChatId: null }).where(eq(users.telegramChatId, chatId));
  await db.update(users).set({ telegramChatId: chatId }).where(eq(users.id, userId));
}

export async function getActivationToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(botActivationTokens)
    .where(eq(botActivationTokens.token, token))
    .limit(1);
  return result[0];
}

export async function createBotActivationToken(userId: number, token: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  try {
    const inserted = await database
      .insert(botActivationTokens)
      .values({ token, userId, isUsed: "false" })
      .returning();
    if (inserted[0]) return inserted[0];
  } catch (err) {
    console.warn("[Database] bot_activation_tokens insert.returning failed, retrying:", err);
  }

  await database.insert(botActivationTokens).values({ token, userId, isUsed: "false" });
  const found = await database
    .select()
    .from(botActivationTokens)
    .where(eq(botActivationTokens.token, token))
    .limit(1);
  if (!found[0]) throw new Error("Failed to create activation token");
  return found[0];
}

export async function markActivationTokenUsed(tokenId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(botActivationTokens)
    .set({ isUsed: "true" })
    .where(eq(botActivationTokens.id, tokenId));
}

/** Coerce DB integer/text values to a non-negative message limit. */
export function coerceTelegramMessageLimit(value: unknown): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/**
 * Plan is active when expiry is null/unset, invalid, or strictly in the future.
 * Handles legacy rows where unix **seconds** were stored instead of ms.
 */
export function isTelegramPlanActive(
  planExpiryDate: Date | string | number | null | undefined,
): boolean {
  if (planExpiryDate == null || planExpiryDate === "") return true;

  let ms: number;
  if (planExpiryDate instanceof Date) {
    ms = planExpiryDate.getTime();
  } else if (typeof planExpiryDate === "number") {
    ms = planExpiryDate;
  } else {
    const n = Number(planExpiryDate);
    ms = Number.isFinite(n) ? n : NaN;
  }

  if (!Number.isFinite(ms)) return true;
  if (ms > 0 && ms < 1e12) ms *= 1000;
  return ms > Date.now();
}

/** Telegram access: advisor limit > 0 and plan not expired. */
export function hasTelegramCredits(
  user: {
    bizMessageLimit?: number | string | null;
    founderMessageLimit?: number | string | null;
    planExpiryDate?: Date | string | number | null;
  },
  advisor: AdvisorSlug,
): boolean {
  if (!isTelegramPlanActive(user.planExpiryDate ?? null)) return false;
  const limit =
    advisor === "bizpilot"
      ? coerceTelegramMessageLimit(user.bizMessageLimit)
      : coerceTelegramMessageLimit(user.founderMessageLimit);
  return limit > 0;
}

/** Max stored messages (user + assistant); ~20 full exchanges for paid Telegram packs. */
const MAX_TELEGRAM_LLM_TURNS = 40;

const MAX_TELEGRAM_TURN_CHARS = 12000;

function clipTelegramTurnContent(text: string): string {
  if (text.length <= MAX_TELEGRAM_TURN_CHARS) return text;
  return `${text.slice(0, MAX_TELEGRAM_TURN_CHARS)}\n…`;
}

export async function listRecentTelegramLlmTurnsForAdvisor(
  userId: number,
  advisor: AdvisorSlug,
  maxMessages: number,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const db = await getDb();
  if (!db) return [];
  const cap = Math.min(Math.max(1, maxMessages), MAX_TELEGRAM_LLM_TURNS);
  try {
    const rows = await db
      .select({
        role: telegramLlmTurns.role,
        content: telegramLlmTurns.content,
      })
      .from(telegramLlmTurns)
      .where(and(eq(telegramLlmTurns.userId, userId), eq(telegramLlmTurns.advisor, advisor)))
      .orderBy(desc(telegramLlmTurns.createdAt))
      .limit(cap);

    return rows
      .reverse()
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        role: r.role as "user" | "assistant",
        content: r.content,
      }));
  } catch (err) {
    console.error("[db] listRecentTelegramLlmTurnsForAdvisor (telegram_llm_turns) failed:", err);
    return [];
  }
}

export async function appendTelegramLlmTurnPair(
  userId: number,
  advisor: AdvisorSlug,
  userContent: string,
  assistantContent: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const now = new Date();
    await db.insert(telegramLlmTurns).values([
      {
        userId,
        advisor,
        role: "user",
        content: clipTelegramTurnContent(userContent),
        createdAt: now,
      },
      {
        userId,
        advisor,
        role: "assistant",
        content: clipTelegramTurnContent(assistantContent),
        createdAt: now,
      },
    ]);

    const ids = await db
      .select({ id: telegramLlmTurns.id })
      .from(telegramLlmTurns)
      .where(and(eq(telegramLlmTurns.userId, userId), eq(telegramLlmTurns.advisor, advisor)))
      .orderBy(desc(telegramLlmTurns.createdAt));

    const toDrop = ids.slice(MAX_TELEGRAM_LLM_TURNS);
    if (toDrop.length === 0) return;
    await db.delete(telegramLlmTurns).where(
      inArray(
        telegramLlmTurns.id,
        toDrop.map((r) => r.id),
      ),
    );
  } catch (err) {
    console.error("[db] appendTelegramLlmTurnPair (telegram_llm_turns) failed:", err);
  }
}

export type TelegramAdminUserRow = {
  id: number;
  email: string | null;
  name: string | null;
  telegramChatId: string | null;
  bizMessageLimit: number;
  founderMessageLimit: number;
  planTypeBiz: string;
  planTypeFounder: string;
  planExpiryDate: string | null;
  hasUsedBizStarter: boolean;
  hasUsedFounderStarter: boolean;
};

export async function listTelegramBotUsers(): Promise<TelegramAdminUserRow[]> {
  const { ensureTelegramSchema } = await import("./db/ensureTelegramSchema");
  await ensureTelegramSchema();

  const all = await listAllUsers();
  return all
    .map((u) => mapUserToTelegramRow(u))
    .sort((a, b) => b.id - a.id);
}

/** Fallback mapper when selective telegram columns are unavailable. */
export function mapUserToTelegramRow(user: {
  id: number;
  email?: string | null;
  name?: string | null;
  telegramChatId?: string | null;
  bizMessageLimit?: number | null;
  founderMessageLimit?: number | null;
  planTypeBiz?: string | null;
  planTypeFounder?: string | null;
  planExpiryDate?: Date | string | number | null;
  hasUsedBizStarter?: string | null;
  hasUsedFounderStarter?: string | null;
}): TelegramAdminUserRow {
  let planExpiryDate: string | null = null;
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
    hasUsedFounderStarter: hasUsedTelegramStarter(user.hasUsedFounderStarter),
  };
}

function assertCanAssignTelegramStarter(
  user: {
    hasUsedBizStarter?: string | null;
    hasUsedFounderStarter?: string | null;
  },
  advisor: AdvisorSlug,
): void {
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

/**
 * Apply Starter (20 msgs, one-time) or Unlimited (999999, +1 month expiry) for one advisor.
 */
export async function applyTelegramAdvisorPlan(
  userId: number,
  advisor: AdvisorSlug,
  tier: TelegramPlanTier,
  planExpiryDate?: Date | null,
): Promise<void> {
  const { ensureTelegramSchema } = await import("./db/ensureTelegramSchema");
  await ensureTelegramSchema();
  const db = await assertDatabase();
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  if (tier === "starter") {
    assertCanAssignTelegramStarter(user, advisor);
  }

  const expiry =
    tier === "unlimited"
      ? planExpiryDate ?? addTelegramPlanMonths()
      : planExpiryDate ?? user.planExpiryDate ?? addTelegramPlanMonths();

  const updateSet: Record<string, unknown> = {
    updatedAt: new Date(),
    planExpiryDate: expiry,
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

  await db.update(users).set(updateSet as Record<string, unknown>).where(eq(users.id, userId));
}

export async function updateTelegramUserPlan(input: {
  userId: number;
  bizPlanTier?: TelegramPlanTier;
  founderPlanTier?: TelegramPlanTier;
  bizMessageLimit?: number;
  founderMessageLimit?: number;
  addBizMessages?: number;
  addFounderMessages?: number;
  planExpiryDate?: Date | null;
}) {
  const { ensureTelegramSchema } = await import("./db/ensureTelegramSchema");
  await ensureTelegramSchema();
  const db = await assertDatabase();
  const user = await getUserById(input.userId);
  if (!user) throw new Error("User not found");

  if (input.bizPlanTier) {
    await applyTelegramAdvisorPlan(
      input.userId,
      "bizpilot",
      input.bizPlanTier,
      input.planExpiryDate,
    );
  }

  if (input.founderPlanTier) {
    await applyTelegramAdvisorPlan(
      input.userId,
      "founderpilot",
      input.founderPlanTier,
      input.planExpiryDate,
    );
  }

  const hasManualLimits =
    input.bizMessageLimit !== undefined ||
    input.addBizMessages !== undefined ||
    input.founderMessageLimit !== undefined ||
    input.addFounderMessages !== undefined;

  if ((input.bizPlanTier || input.founderPlanTier) && !hasManualLimits) {
    return;
  }

  let workingUser = await getUserById(input.userId);
  if (!workingUser) throw new Error("User not found");

  const updateSet: Record<string, unknown> = { updatedAt: new Date() };

  if (input.planExpiryDate !== undefined) {
    updateSet.planExpiryDate = input.planExpiryDate;
  }

  let bizLimit = workingUser.bizMessageLimit ?? 0;
  if (input.bizMessageLimit !== undefined) {
    if (isStarterTelegramLimit(input.bizMessageLimit)) {
      assertCanAssignTelegramStarter(workingUser, "bizpilot");
      updateSet.hasUsedBizStarter = "true";
      updateSet.planTypeBiz = "starter";
    } else if (isUnlimitedTelegramLimit(input.bizMessageLimit)) {
      updateSet.planTypeBiz = "pro";
    }
    bizLimit = input.bizMessageLimit;
  } else if (input.addBizMessages !== undefined) {
    bizLimit = bizLimit + input.addBizMessages;
  }
  if (input.bizMessageLimit !== undefined || input.addBizMessages !== undefined) {
    updateSet.bizMessageLimit = Math.max(0, bizLimit);
    if (
      bizLimit > 0 &&
      (workingUser.planTypeBiz ?? "free") === "free" &&
      !isUnlimitedTelegramLimit(bizLimit)
    ) {
      updateSet.planTypeBiz = "starter";
    }
  }

  let founderLimit = workingUser.founderMessageLimit ?? 0;
  if (input.founderMessageLimit !== undefined) {
    if (isStarterTelegramLimit(input.founderMessageLimit)) {
      assertCanAssignTelegramStarter(workingUser, "founderpilot");
      updateSet.hasUsedFounderStarter = "true";
      updateSet.planTypeFounder = "starter";
    } else if (isUnlimitedTelegramLimit(input.founderMessageLimit)) {
      updateSet.planTypeFounder = "pro";
    }
    founderLimit = input.founderMessageLimit;
  } else if (input.addFounderMessages !== undefined) {
    founderLimit = founderLimit + input.addFounderMessages;
  }
  if (input.founderMessageLimit !== undefined || input.addFounderMessages !== undefined) {
    updateSet.founderMessageLimit = Math.max(0, founderLimit);
    if (
      founderLimit > 0 &&
      (workingUser.planTypeFounder ?? "free") === "free" &&
      !isUnlimitedTelegramLimit(founderLimit)
    ) {
      updateSet.planTypeFounder = "starter";
    }
  }

  if (Object.keys(updateSet).length > 1) {
    await db.update(users).set(updateSet as Record<string, unknown>).where(eq(users.id, input.userId));
  }
}

/**
 * Atomically decrement Telegram remaining messages and increment used counter.
 * Uses SQL expressions to avoid read-modify-write races under concurrent webhooks.
 */
export async function decrementTelegramMessageLimit(
  userId: number,
  isBiz: boolean,
): Promise<void> {
  const db = await assertDatabase();

  if (isBiz) {
    await db
      .update(users)
      .set({
        bizMessageLimit: sql`max(0, ${users.bizMessageLimit} - 1)`,
        bizMessagesUsed: sql`${users.bizMessagesUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } else {
    await db
      .update(users)
      .set({
        founderMessageLimit: sql`max(0, ${users.founderMessageLimit} - 1)`,
        founderMessagesUsed: sql`${users.founderMessagesUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
