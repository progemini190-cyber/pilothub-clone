/**
 * Quick-create shadow users for Telegram sales flow (no Google login required).
 */

import { nanoid } from "nanoid";
import * as db from "./db";
import { ensureTelegramSchema } from "./db/ensureTelegramSchema";
import { generateTelegramActivationToken } from "./telegram";
import {
  addTelegramPlanMonths,
  type TelegramPlanTier,
} from "@shared/telegramPlans";

export type PlanTypeInput = "bizpilot" | "founderpilot";

export type QuickCreateUserInput = {
  email: string;
  name: string;
  planType: PlanTypeInput;
  planTier: TelegramPlanTier;
  planExpiryDate?: Date | null;
  botUsername?: string;
};

export type QuickCreateUserResult = {
  userId: number;
  openId: string;
  email: string;
  name: string;
  planType: PlanTypeInput;
  planTier: TelegramPlanTier;
  created: boolean;
  token: string;
  activationLink: string;
};

/** Auto-generated openId for users who never sign in with Google. */
export function generateShadowOpenId(): string {
  return `shadow_${nanoid(24)}`;
}

/**
 * Find user by email or create a shadow account, apply Telegram plan tier, issue activation token.
 */
export async function quickCreateTelegramUser(
  input: QuickCreateUserInput,
): Promise<QuickCreateUserResult> {
  await ensureTelegramSchema();

  const email = db.normalizeEmail(input.email);
  const name = input.name.trim();
  if (!email || !name) {
    throw new Error("email and name are required");
  }

  let user = await db.getUserByEmail(email);
  let created = false;

  if (!user) {
    const openId = generateShadowOpenId();
    await db.upsertUser({
      openId,
      name,
      email,
      loginMethod: "telegram_shadow",
      status: "active",
      lastSignedIn: new Date(),
    });
    user = await db.getUserByOpenId(openId);
    if (!user) throw new Error("Failed to create user");
    created = true;
  } else {
    await db.updateUserProfile(user.id, { name });
  }

  const expiry =
    input.planTier === "unlimited"
      ? input.planExpiryDate ?? addTelegramPlanMonths()
      : input.planExpiryDate ?? addTelegramPlanMonths();

  await db.applyTelegramAdvisorPlan(user.id, input.planType, input.planTier, expiry);

  await db.updateUserSubscription(user.id, input.planType, "active");

  const tokenResult = await generateTelegramActivationToken(
    user.id,
    input.botUsername,
    input.planType,
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
    activationLink: tokenResult.activationLink,
  };
}

export function parsePlanType(value: string | undefined): PlanTypeInput {
  const v = (value ?? "").toLowerCase().trim();
  if (v === "founderpilot" || v === "founder" || v === "founder_pilot") {
    return "founderpilot";
  }
  return "bizpilot";
}
