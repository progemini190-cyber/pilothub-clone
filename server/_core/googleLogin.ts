import type { InsertUser } from "../../drizzle/schema";
import * as db from "../db";
import { shouldGrantAdminRole } from "./adminAccess";
import { ENV } from "./env";
import { isUserApproved } from "./userStatus";
import { userNeedsOnboarding } from "@shared/onboarding";

export type GoogleUserInfo = {
  sub: string;
  email?: string | null;
  name?: string | null;
  email_verified?: boolean | null;
};

export type GoogleLoginResolution = {
  sessionOpenId: string;
  redirectPath: string;
  userStatus: string;
  userEmail: string | null;
  isApproved: boolean;
  upsert: InsertUser;
};

/**
 * Resolves redirect + upsert for Google OAuth callback.
 * All users are active; incomplete profiles go to /onboarding.
 */
export async function resolveGoogleLogin(userInfo: GoogleUserInfo): Promise<GoogleLoginResolution> {
  const googleSub = userInfo.sub;
  const userEmail = userInfo.email ? db.normalizeEmail(userInfo.email) : null;

  const { user: existingUser } = await db.resolveUserForGoogleLogin(userEmail, googleSub);

  const grantAdmin = shouldGrantAdminRole({
    email: userEmail,
    googleSub,
    ownerGoogleSub: ENV.ownerGoogleSub,
  });

  const upsert: InsertUser = {
    openId: googleSub,
    name: userInfo.name || existingUser?.name || null,
    email: userEmail ?? userInfo.email ?? existingUser?.email ?? null,
    loginMethod: "google",
    lastSignedIn: new Date(),
    status: "active",
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
    onboardingCompletedAt: (existingUser as { onboardingCompletedAt?: Date | null } | undefined)
      ?.onboardingCompletedAt,
  };

  const redirectPath = userNeedsOnboarding(mergedProfile) ? "/onboarding" : "/app";

  console.info("User Login Attempt:", userEmail, "redirect:", redirectPath, {
    existingUserId: existingUser?.id,
    needsOnboarding: userNeedsOnboarding(mergedProfile),
  });

  return {
    sessionOpenId: googleSub,
    redirectPath,
    userStatus: "active",
    userEmail,
    isApproved: true,
    upsert,
  };
}
