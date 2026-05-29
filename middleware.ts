/**
 * Vercel Edge Middleware.
 *
 * Telegram webhooks POST without a user session. Any auth redirect here (or in
 * downstream middleware) returns 307 and Telegram drops the payload.
 */
export const TELEGRAM_WEBHOOK_PATH = "/api/telegram/webhook";

export const config = {
  matcher: [TELEGRAM_WEBHOOK_PATH, `${TELEGRAM_WEBHOOK_PATH}/`],
};

export default function middleware(request: Request): Response | undefined {
  const url = new URL(request.url);

  // Rewrite trailing-slash variant internally — never 307-redirect POST bodies.
  if (url.pathname === `${TELEGRAM_WEBHOOK_PATH}/`) {
    url.pathname = TELEGRAM_WEBHOOK_PATH;
    return Response.rewrite(url);
  }

  // Explicit pass-through for the webhook — no auth checks, no login redirects.
  return undefined;
}
