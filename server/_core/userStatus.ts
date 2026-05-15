import type { User } from "../../drizzle/schema";

/** Legacy + current values that mean the user may access the app. */
const APPROVED_USER_STATUSES = new Set([
  "active",
  "approved",
  "APPROVED",
  "Active",
  "Approved",
]);

export function normalizeUserStatus(status: string | null | undefined): string {
  return (status ?? "").trim();
}

export function isApprovedUserStatus(status: string | null | undefined): boolean {
  const s = normalizeUserStatus(status);
  if (!s) return false;
  if (APPROVED_USER_STATUSES.has(s)) return true;
  return s.toLowerCase() === "approved" || s.toLowerCase() === "active";
}

export function isPendingUserStatus(status: string | null | undefined): boolean {
  const s = normalizeUserStatus(status).toLowerCase();
  return s === "pending" || s === "PENDING".toLowerCase();
}

export function isUserApproved(user: User | undefined | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isApprovedUserStatus(user.status);
}

/** Prefer the production account when duplicate rows share an email. */
export function pickCanonicalUser(
  candidates: User[],
  googleSub: string,
): User | undefined {
  if (candidates.length === 0) return undefined;

  const unique = [...new Map(candidates.map((u) => [u.id, u])).values()];

  const approved = unique.filter((u) => isUserApproved(u));
  const pool = approved.length > 0 ? approved : unique;

  const score = (u: User): number => {
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
