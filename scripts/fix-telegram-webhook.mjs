/**
 * Re-register BizPilot Telegram webhook to production (pilothub.vip).
 * Preview *.vercel.app URLs return 401 (Vercel Deployment Protection).
 */
import { readFileSync } from "fs";

const PRODUCTION_ORIGIN = process.argv[2]?.trim() || "https://pilothub.vip";
const advisor = "bizpilot";

const env = readFileSync(".env", "utf8");
const m = env.match(/TELEGRAM_BIZPILOT_TOKEN=(.+)/);
const token = m?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!token) {
  console.error("TELEGRAM_BIZPILOT_TOKEN not found in .env");
  process.exit(1);
}

const webhookUrl = `${PRODUCTION_ORIGIN.replace(/\/$/, "")}/api/telegram/webhook?advisor=${advisor}`;
const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true }),
});
const data = await res.json();
console.log(JSON.stringify({ webhookUrl, ...data }, null, 2));

if (data.ok) {
  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json());
  console.log("Verified:", info.result?.url, info.result?.last_error_message || "no errors");
}
