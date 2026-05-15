import { readFileSync } from "fs";

const env = readFileSync(".env", "utf8");
const m = env.match(/TELEGRAM_BIZPILOT_TOKEN=(.+)/);
const token = m?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!token) {
  console.error("TELEGRAM_BIZPILOT_TOKEN not found in .env");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
