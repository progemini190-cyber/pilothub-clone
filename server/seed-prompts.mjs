/**
 * Seed script: Insert new optimized BizPilot and FounderPilot system prompts
 * Run: node server/seed-prompts.mjs
 */
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { BIZ_PROMPT, FOUNDER_PROMPT } from "./seed-prompts-data.mjs";

dotenv.config();

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL (or DATABASE_URL) not set");
  process.exit(1);
}

const client = createClient({ url, authToken: authToken ?? undefined });

async function run() {
  console.log("Connected to DB");

  await client.execute(`UPDATE systemPrompts SET isActive = 'false' WHERE modelSlug IN ('bizpilot', 'founderpilot')`);
  console.log("Deactivated old prompts");

  const bizRows = await client.execute(`SELECT MAX(version) as maxV FROM systemPrompts WHERE modelSlug = 'bizpilot'`);
  const bizVersion = Number(bizRows.rows[0]?.maxV ?? 0) + 1;

  const founderRows = await client.execute(`SELECT MAX(version) as maxV FROM systemPrompts WHERE modelSlug = 'founderpilot'`);
  const founderVersion = Number(founderRows.rows[0]?.maxV ?? 0) + 1;

  const now = Date.now();
  await client.execute({
    sql: `INSERT INTO systemPrompts (name, modelSlug, content, version, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ["BizPilot v" + bizVersion + " - Dynamic Burmese", "bizpilot", BIZ_PROMPT, bizVersion, "true", now, now],
  });
  console.log(`Inserted BizPilot prompt v${bizVersion} (active)`);

  await client.execute({
    sql: `INSERT INTO systemPrompts (name, modelSlug, content, version, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "FounderPilot v" + founderVersion + " - Dynamic Burmese",
      "founderpilot",
      FOUNDER_PROMPT,
      founderVersion,
      "true",
      now,
      now,
    ],
  });
  console.log(`Inserted FounderPilot prompt v${founderVersion} (active)`);

  console.log("Done! New prompts are now active.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
