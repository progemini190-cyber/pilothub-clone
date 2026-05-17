export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Primary sign-in page (email/password + Google). */
export function getLoginUrl(): string {
  return "/sign-in";
}

export function getSignUpUrl(): string {
  return "/sign-up";
}

/** Google OAuth on the same origin. */
export function getGoogleAuthUrl(): string {
  return `${window.location.origin}/api/auth/google`;
}
