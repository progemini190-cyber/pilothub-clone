export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Starts Google OAuth on the same origin (works with Vite dev server and production). */
export function getLoginUrl(): string {
  return `${window.location.origin}/api/auth/google`;
}
