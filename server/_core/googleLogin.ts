import type { InsertUser, User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

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

function isUserApproved(user: User | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.status === "active";
}

/**
 * Resolves redirect + upsert for Google OAuth callback.
 * Primary source of truth: `users.status` (active = approved). Applications table is a fallback.
 */
export async function resolveGoogleLogin(userInfo: GoogleUserInfo): Promise<GoogleLoginResolution> {
  const googleSub = userInfo.sub;
  const userEmail = userInfo.email ? db.normalizeEmail(userInfo.email) : null;

  let userByOpenId = await db.getUserByOpenId(googleSub);
  let userByEmail = userEmail ? await db.getUserByEmail(userEmail) : undefined;

  if (userByEmail && userByEmail.openId !== googleSub) {
    await db.linkUserToGoogleOpenId(userByEmail.id, googleSub, {
      name: userInfo.name ?? userByEmail.name,
      loginMethod: "google",
    });
    userByOpenId = await db.getUserByOpenId(googleSub);
    userByEmail = userByOpenId;
  }

  const existingUser = userByOpenId ?? userByEmail;

  let approvedApplication: Awaited<ReturnType<typeof db.getApprovedApplicationByEmail>> | undefined;
  let latestApplication: Awaited<ReturnType<typeof db.getApplicationByEmail>> | undefined;
  if (userEmail) {
    try {
      approvedApplication = await db.getApprovedApplicationByEmail(userEmail);
      latestApplication = await db.getApplicationByEmail(userEmail);
    } catch (dbErr) {
      console.error("[Google OAuth] Application lookup failed (non-fatal):", dbErr);
    }
  }

  const isOwner = Boolean(ENV.ownerGoogleSub && googleSub === ENV.ownerGoogleSub);
  const isApproved =
    isOwner ||
    isUserApproved(existingUser) ||
    Boolean(approvedApplication);

  const userStatus = existingUser?.status
    ?? (isApproved ? "active" : latestApplication?.status === "approved" ? "active" : "pending");

  console.log("User Login Attempt:", userEmail, "Status:", userStatus);

  const upsert: InsertUser = {
    openId: googleSub,
    name: userInfo.name || existingUser?.name || null,
    email: userEmail ?? userInfo.email ?? existingUser?.email ?? null,
    loginMethod: "google",
    lastSignedIn: new Date(),
  };

  if (!existingUser) {
    upsert.status = isApproved ? "active" : "pending";
  } else if (isApproved && existingUser.status !== "active") {
    upsert.status = "active";
  }

  let redirectPath = "/app";
  if (!isApproved) {
    const hasExistingAccount = Boolean(existingUser || latestApplication);
    if (hasExistingAccount && (existingUser?.status === "pending" || latestApplication?.status === "pending")) {
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
    upsert,
  };
}
