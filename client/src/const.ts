export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const LOGIN_FALLBACK_PATH = "/login-required";

/** Same host as the OAuth portal; accepts host-only or full URL from Vite env. */
function resolveOAuthPortalBase(): string | null {
  const raw = (
    import.meta.env.VITE_OAUTH_PORTAL_URL ??
    import.meta.env.VITE_OAUTH_SERVER_URL ??
    ""
  )
    .toString()
    .trim();
  if (!raw) return null;

  const withScheme = /^https?:\/\//i.test(raw)
    ? raw
    : `https://${raw.replace(/^\/+/, "")}`;

  try {
    const u = new URL(withScheme);
    return u.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function loginFallbackUrl(): string {
  return `${window.location.origin}${LOGIN_FALLBACK_PATH}`;
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalBase = resolveOAuthPortalBase();
  const appId = (import.meta.env.VITE_APP_ID ?? "").toString().trim();
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  if (!oauthPortalBase || !appId) {
    if (import.meta.env.DEV) {
      console.warn(
        "[auth] VITE_OAUTH_PORTAL_URL (or VITE_OAUTH_SERVER_URL) and VITE_APP_ID must be set for OAuth. Falling back to /login-required.",
      );
    }
    return loginFallbackUrl();
  }

  const url = new URL(`${oauthPortalBase}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
