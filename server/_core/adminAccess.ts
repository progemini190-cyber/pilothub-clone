import { normalizeEmail } from "../db";

/** Built-in admin inboxes (also add via ADMIN_EMAIL env, comma-separated). */
const DEFAULT_ADMIN_EMAILS = ["progemini190@gmail.com"];

export function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv])];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(normalizeEmail(email));
}

export function shouldGrantAdminRole(input: {
  email?: string | null;
  googleSub?: string;
  ownerGoogleSub?: string;
}): boolean {
  if (input.email && isAdminEmail(input.email)) return true;
  if (
    input.ownerGoogleSub &&
    input.googleSub &&
    input.googleSub === input.ownerGoogleSub
  ) {
    return true;
  }
  return false;
}
