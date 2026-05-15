import type { InsertUser, User } from "../../drizzle/schema";
import * as db from "../db";
import { isAdminEmail, shouldGrantAdminRole } from "./adminAccess";
import { ENV } from "./env";
import { isApprovedUserStatus, isPendingUserStatus, isUserApproved } from "./userStatus";

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
 * Looks up users by Google `sub` and email (handles duplicate legacy rows).
 */
export async function resolveGoogleLogin(userInfo: GoogleUserInfo): Promise<GoogleLoginResolution> {
  const googleSub = userInfo.sub;
  const userEmail = userInfo.email ? db.normalizeEmail(userInfo.email) : null;

  const { user: existingUser, byOpenId, byEmail } = await db.resolveUserForGoogleLogin(
    userEmail,
    googleSub,
  );

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
  const isAdmin = Boolean(userEmail && isAdminEmail(userEmail));
  const isApproved =
    isOwner ||
    isAdmin ||
    isUserApproved(existingUser) ||
    Boolean(approvedApplication) ||
    latestApplication?.status === "approved";

  const userStatus =
    existingUser?.status ??
    (isApproved ? "active" : latestApplication?.status === "approved" ? "active" : "pending");

  const grantAdmin = shouldGrantAdminRole({
    email: userEmail,
    googleSub,
    ownerGoogleSub: ENV.ownerGoogleSub,
  });

  console.log("User Login Attempt:", userEmail, "Status:", userStatus, "Role:", grantAdmin ? "admin" : existingUser?.role ?? "user", {
    matchedByOpenId: Boolean(byOpenId),
    matchedByEmail: byEmail.length,
    existingUserId: existingUser?.id,
    isApproved,
  });

  const upsert: InsertUser = {
    openId: googleSub,
    name: userInfo.name || existingUser?.name || null,
    email: userEmail ?? userInfo.email ?? existingUser?.email ?? null,
    loginMethod: "google",
    lastSignedIn: new Date(),
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
    upsert,
  };
}
