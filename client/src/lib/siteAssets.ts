/**
 * Build a URL for files served from `client/public/` (copied to dist root).
 * Honors Vite `base` when the app is hosted under a subpath.
 */
export function publicUrl(path: string): string {
  const normalized = path.replace(/^\/+/, "");
  const rawBase = (import.meta.env.BASE_URL as string | undefined) || "/";
  if (rawBase === "/" || rawBase === "./") {
    return `/${normalized}`;
  }
  const prefix = rawBase.replace(/\/+$/, "");
  return `${prefix}/${normalized}`;
}

export const PILOTHUB_LOGO_URL = publicUrl("pilothub-logo.svg");
