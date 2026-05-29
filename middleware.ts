/**
 * Vercel Edge Middleware.
 *
 * Telegram webhooks POST without a user session. Any auth redirect here (or in
 * downstream middleware) returns 307 and Telegram drops the payload.
 */
export const config = {
  matcher: ["/api/telegram/webhook", "/api/telegram/webhook/"],
};

export default function middleware(request: Request): Response | undefined {
  const url = new URL(request.url);

  // Rewrite trailing-slash variant internally — never 307-redirect POST bodies.
  if (url.pathname === "/api/telegram/webhook/") {
    url.pathname = "/api/telegram/webhook";
    return Response.rewrite(url);
  }

  // Explicit pass-through for the webhook — no auth checks, no login redirects.
  return undefined;
}
