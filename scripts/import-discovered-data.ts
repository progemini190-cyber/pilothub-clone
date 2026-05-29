/**
 * Import all database-like data discoverable in the local workspace (no live MySQL).
 *
 * Sources:
 *   1. `.manus/db/*.json` row caches (via recover-from-json logic)
 *   2. `server/seed-prompts.mjs` — production BizPilot / FounderPilot system prompts
 *   3. Codebase defaults — `aiModels` rows (gemini model strings from llmWithApiKey fallback)
 *
 * Usage (local terminal → remote Turso, including production):
 *   # 1) Point at production (PowerShell one-liner or .env.production)
 *   $env:TURSO_DATABASE_URL="libsql://YOUR-PROD-db.turso.io"
 *   $env:TURSO_AUTH_TOKEN="your-prod-token"
 *   # 2) Dry-run first, then import
 *   npm run db:import-local -- --dry-run
 *   npm run db:import-local -- --yes
 *
 * Flags:
 *   --yes         Skip confirmation prompt
 *   --dry-run     Log actions only; no writes
 *   --skip-json   Skip .manus/db upserts (prompts + aiModels only)
 *   --skip-seeds  Skip prompts + aiModels (JSON caches only)
 */
import "dotenv/config";
import { createClient, type Client, type InArgs } from "@libsql/client";
import { BIZ_PROMPT, FOUNDER_PROMPT } from "../server/seed-prompts-data.mjs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const MANUS_DB_DIR = join(process.cwd(), ".manus", "db");

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const SKIP_CONFIRM = args.has("--yes");
const SKIP_JSON = args.has("--skip-json");
const SKIP_SEEDS = args.has("--skip-seeds");

/** Default model strings used when `aiModels` table is empty (see server/llmWithApiKey.ts). */
const DEFAULT_AI_MODELS = [
  { targetRole: "bizpilot", modelString: "gemini-2.5-pro" },
  { targetRole: "founderpilot", modelString: "gemini-2.5-pro" },
] as const;

const TABLES_FROM_JSON = [
  "users",
  "applications",
  "payments",
] as const;

type JsonTable = (typeof TABLES_FROM_JSON)[number];

const TIMESTAMP_COLUMNS = new Set([
  "createdAt",
  "updatedAt",
  "lastSignedIn",
  "subscriptionStart",
  "subscriptionEnd",
]);

// --- shared helpers (aligned with recover-from-json.ts) ---

type Row = Record<string, unknown>;

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMetadataRow(row: Row): boolean {
  if ("Field" in row && ("Type" in row || row.Field === "Type")) return true;
  return false;
}

function hasId(row: Row): boolean {
  const id = row.id;
  if (id == null || id === "") return false;
  return Number.isFinite(Number(id)) && Number(id) > 0;
}

function inferTableFromQuery(query: string | undefined): JsonTable | null {
  if (!query) return null;
  const q = query.toLowerCase();
  for (const table of TABLES_FROM_JSON) {
    if (new RegExp(`\\bfrom\\s+\`?${table}\`?`).test(q)) return table;
    if (new RegExp(`\\bupdate\\s+\`?${table}\`?`).test(q)) return table;
  }
  return null;
}

function inferTableFromKeys(row: Row): JsonTable | null {
  if ("fullName" in row && "email" in row && !("amount" in row)) return "applications";
  if ("amount" in row && ("userId" in row || "status" in row)) return "payments";
  if (
    "email" in row ||
    "planTypeBiz" in row ||
    "planTypeFounder" in row ||
    "bizMessageLimit" in row ||
    "openId" in row
  ) {
    return "users";
  }
  return null;
}

function classifyRow(row: Row, query?: string): JsonTable | null {
  if (isMetadataRow(row) || !hasId(row)) return null;
  return inferTableFromQuery(query) ?? inferTableFromKeys(row);
}

function mergeRows(existing: Row, incoming: Row): Row {
  const out = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }
  return out;
}

function toTimestampMs(value: unknown): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  return null;
}

function normalizeCell(column: string, value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (TIMESTAMP_COLUMNS.has(column)) return toTimestampMs(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    if (
      column === "id" ||
      column.endsWith("Id") ||
      column.endsWith("Count") ||
      column.endsWith("Limit") ||
      column === "amount"
    ) {
      const n = Number(value);
      if (!Number.isNaN(n) && value.trim() !== "") return n;
    }
    return value;
  }
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return value;
}

function applyUserDefaults(row: Row): Row {
  const id = Number(row.id);
  const now = Date.now();
  if (!row.openId) row.openId = `manus-recovery:${id}`;
  if (!row.role) row.role = "user";
  if (!row.plan) row.plan = "free";
  if (!row.status) row.status = "active";
  if (!row.planTypeBiz) row.planTypeBiz = "free";
  if (!row.planTypeFounder) row.planTypeFounder = "free";
  if (row.bizMessageLimit == null) row.bizMessageLimit = 3;
  if (row.founderMessageLimit == null) row.founderMessageLimit = 3;
  if (row.bizMessagesUsed == null) row.bizMessagesUsed = 0;
  if (row.founderMessagesUsed == null) row.founderMessagesUsed = 0;
  if (!row.hasUsedBizStarter) row.hasUsedBizStarter = "false";
  if (!row.hasUsedFounderStarter) row.hasUsedFounderStarter = "false";
  if (row.freeBizCount == null) row.freeBizCount = 5;
  if (row.freeFounderCount == null) row.freeFounderCount = 5;
  if (!row.createdAt) row.createdAt = now;
  if (!row.updatedAt) row.updatedAt = row.createdAt ?? now;
  if (!row.lastSignedIn) row.lastSignedIn = row.updatedAt ?? now;
  return row;
}

function applyApplicationDefaults(row: Row): Row {
  const now = Date.now();
  if (!row.status) row.status = "pending";
  if (!row.plan) row.plan = "free";
  if (!row.source) row.source = "website";
  if (!row.createdAt) row.createdAt = now;
  if (!row.updatedAt) row.updatedAt = now;
  return row;
}

function applyPaymentDefaults(row: Row): Row {
  const now = Date.now();
  if (!row.status) row.status = "pending";
  if (!row.currency) row.currency = "MMK";
  if (!row.source) row.source = "website";
  if (!row.createdAt) row.createdAt = now;
  if (!row.updatedAt) row.updatedAt = now;
  return row;
}

function applyTableDefaults(table: JsonTable, row: Row): Row {
  if (table === "users") return applyUserDefaults(row);
  if (table === "applications") return applyApplicationDefaults(row);
  if (table === "payments") return applyPaymentDefaults(row);
  return row;
}

async function loadManusRows(): Promise<Map<JsonTable, Map<number, Row>>> {
  const byTable = new Map<JsonTable, Map<number, Row>>();
  for (const table of TABLES_FROM_JSON) byTable.set(table, new Map());

  const files = (await readdir(MANUS_DB_DIR)).filter((f) => f.endsWith(".json"));
  for (const file of files.sort()) {
    const parsed = JSON.parse(await readFile(join(MANUS_DB_DIR, file), "utf8")) as {
      query?: string;
      rows?: Row[];
    };
    if (!Array.isArray(parsed.rows)) continue;
    for (const item of parsed.rows) {
      if (!isRecord(item)) continue;
      const table = classifyRow(item, parsed.query);
      if (!table) continue;
      const id = Number(item.id);
      const bucket = byTable.get(table)!;
      bucket.set(id, bucket.has(id) ? mergeRows(bucket.get(id)!, item) : { ...item });
    }
  }
  return byTable;
}

async function getTursoColumns(turso: Client, table: string): Promise<string[]> {
  const result = await turso.execute({ sql: `PRAGMA table_info(\`${table}\`)`, args: [] });
  return result.rows.map((row) => String(row.name ?? row[1])).filter(Boolean);
}

function buildUpsertSql(table: string, columns: string[]): string {
  const quoted = columns.map((c) => `\`${c}\``);
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns
    .filter((c) => c !== "id")
    .map((c) => `\`${c}\` = excluded.\`${c}\``)
    .join(", ");
  return `INSERT INTO \`${table}\` (${quoted.join(", ")}) VALUES (${placeholders}) ON CONFLICT(\`id\`) DO UPDATE SET ${updates}`;
}

function prepareRow(source: Row, tursoColumns: string[], table: JsonTable): Record<string, unknown> | null {
  const withDefaults = applyTableDefaults(table, { ...source });
  const out: Record<string, unknown> = {};
  for (const col of tursoColumns) {
    if (!(col in withDefaults)) continue;
    out[col] = normalizeCell(col, withDefaults[col]);
  }
  const now = Date.now();
  if (tursoColumns.includes("createdAt") && out.createdAt == null) out.createdAt = now;
  if (tursoColumns.includes("updatedAt") && out.updatedAt == null) out.updatedAt = out.createdAt ?? now;
  if (tursoColumns.includes("lastSignedIn") && out.lastSignedIn == null) out.lastSignedIn = out.createdAt ?? now;
  out.id = Number(withDefaults.id);
  return out;
}

async function upsertJsonTables(turso: Client, byTable: Map<JsonTable, Map<number, Row>>): Promise<void> {
  for (const table of TABLES_FROM_JSON) {
    const rows = byTable.get(table)!;
    if (rows.size === 0) continue;

    const tursoColumns = await getTursoColumns(turso, table);
    const upsertSql = buildUpsertSql(table, tursoColumns);
    let written = 0;

    if (DRY_RUN) {
      console.info(`  [dry-run] ${table}: ${rows.size} row(s) from .manus/db`);
      continue;
    }

    for (const source of rows.values()) {
      const prepared = prepareRow(source, tursoColumns, table);
      if (!prepared) continue;
      const values = tursoColumns.map((c) => prepared[c] ?? null) as InArgs;
      await turso.execute({ sql: upsertSql, args: values });
      written++;
    }
    console.info(`  ${table}: upserted ${written} row(s) from .manus/db`);
  }
}

async function seedAiModels(turso: Client): Promise<void> {
  const now = Date.now();
  if (DRY_RUN) {
    console.info(`  [dry-run] aiModels: would upsert ${DEFAULT_AI_MODELS.length} default row(s)`);
    return;
  }

  for (const { targetRole, modelString } of DEFAULT_AI_MODELS) {
    const existing = await turso.execute({
      sql: `SELECT id FROM aiModels WHERE targetRole = ? LIMIT 1`,
      args: [targetRole],
    });
    if (existing.rows.length > 0) {
      await turso.execute({
        sql: `UPDATE aiModels SET modelString = ?, isActive = 'true', updatedAt = ? WHERE targetRole = ?`,
        args: [modelString, now, targetRole],
      });
      console.info(`  aiModels: updated ${targetRole} → ${modelString}`);
    } else {
      await turso.execute({
        sql: `INSERT INTO aiModels (targetRole, modelString, isActive, createdAt, updatedAt) VALUES (?, ?, 'true', ?, ?)`,
        args: [targetRole, modelString, now, now],
      });
      console.info(`  aiModels: inserted ${targetRole} → ${modelString}`);
    }
  }
}

async function seedSystemPrompts(turso: Client): Promise<void> {
  if (DRY_RUN) {
    console.info("  [dry-run] systemPrompts: would insert bizpilot + founderpilot from seed-prompts-data.mjs");
    return;
  }

  await turso.execute(
    `UPDATE systemPrompts SET isActive = 'false' WHERE modelSlug IN ('bizpilot', 'founderpilot')`,
  );

  const bizMax = await turso.execute(
    `SELECT MAX(version) as maxV FROM systemPrompts WHERE modelSlug = 'bizpilot'`,
  );
  const bizVersion = Number(bizMax.rows[0]?.maxV ?? 0) + 1;

  const founderMax = await turso.execute(
    `SELECT MAX(version) as maxV FROM systemPrompts WHERE modelSlug = 'founderpilot'`,
  );
  const founderVersion = Number(founderMax.rows[0]?.maxV ?? 0) + 1;

  const now = Date.now();
  await turso.execute({
    sql: `INSERT INTO systemPrompts (name, modelSlug, content, version, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [`BizPilot v${bizVersion} - Dynamic Burmese`, "bizpilot", BIZ_PROMPT, bizVersion, "true", now, now],
  });
  console.info(`  systemPrompts: inserted bizpilot v${bizVersion} (active)`);

  await turso.execute({
    sql: `INSERT INTO systemPrompts (name, modelSlug, content, version, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `FounderPilot v${founderVersion} - Dynamic Burmese`,
      "founderpilot",
      FOUNDER_PROMPT,
      founderVersion,
      "true",
      now,
      now,
    ],
  });
  console.info(`  systemPrompts: inserted founderpilot v${founderVersion} (active)`);
}

function maskTursoTarget(url: string): string {
  try {
    const parsed = new URL(url.replace(/^libsql:/, "https:"));
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url.slice(0, 48);
  }
}

async function confirm(target: string): Promise<void> {
  if (SKIP_CONFIRM || DRY_RUN) return;
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    `\n⚠  About to write to Turso: ${target}\nType YES to import all locally discovered data: `,
  );
  rl.close();
  if (answer.trim().toUpperCase() !== "YES") {
    console.info("Aborted.");
    process.exit(0);
  }
}

async function main(): Promise<void> {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!tursoUrl) {
    console.error("Missing TURSO_DATABASE_URL.");
    process.exit(1);
  }
  if (tursoUrl.includes("turso.io") && !tursoToken) {
    console.error("Missing TURSO_AUTH_TOKEN.");
    process.exit(1);
  }

  const target = maskTursoTarget(tursoUrl);
  console.info(`[import] Turso target: ${target}`);
  if (DRY_RUN) console.info("[import] DRY RUN — no writes");
  console.info("");
  console.info("[import] Data sources:");
  console.info("  .manus/db/*.json — users, applications, payments (upsert by id)");
  console.info("  seed-prompts-data.mjs — systemPrompts (new version row per run)");
  console.info("  codebase defaults — aiModels (update or insert)");
  console.info("");

  await confirm(target);

  const turso = createClient({ url: tursoUrl, authToken: tursoToken });

  if (!SKIP_JSON) {
    console.info("[import] Phase 1 — .manus/db JSON caches");
    const byTable = await loadManusRows();
    await upsertJsonTables(turso, byTable);
  }

  if (!SKIP_SEEDS) {
    console.info("\n[import] Phase 2 — system prompts (server/seed-prompts-data.mjs)");
    await seedSystemPrompts(turso);

    console.info("\n[import] Phase 3 — default aiModels (codebase fallback)");
    await seedAiModels(turso);
  }

  console.info("\n[import] Done.");
  console.info(
    "[import] Chat history (conversations/messages) does not exist anywhere in this repo — that data only lived in TiDB Cloud.",
  );
}

main().catch((err) => {
  console.error("[import] Fatal:", err);
  process.exit(1);
});
