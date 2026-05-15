/**
 * Recover legacy data from Manus `.manus/db/*.json` query caches into Turso.
 *
 * Usage:
 *   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." \
 *     npx tsx scripts/recover-from-json.ts
 *
 * Flags:
 *   --dry-run   Log discovered rows only; no writes
 *   --yes       Skip confirmation prompt
 */
import "dotenv/config";
import { createClient, type Client, type InArgs } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const MANUS_DB_DIR = join(process.cwd(), ".manus", "db");

const TABLES_IN_ORDER = [
  "users",
  "aiModels",
  "systemSettings",
  "systemPrompts",
  "apiKeys",
  "externalApiTokens",
  "announcements",
  "applications",
  "payments",
  "conversations",
  "messages",
] as const;

type TableName = (typeof TABLES_IN_ORDER)[number];

const TIMESTAMP_COLUMNS = new Set([
  "createdAt",
  "updatedAt",
  "lastSignedIn",
  "subscriptionStart",
  "subscriptionEnd",
]);

const TABLE_SIGNATURES: Record<TableName, readonly string[]> = {
  users: [
    "openId",
    "planTypeBiz",
    "planTypeFounder",
    "bizMessageLimit",
    "founderMessageLimit",
    "hasUsedBizStarter",
    "hasUsedFounderStarter",
    "freeBizCount",
    "loginMethod",
    "lastSignedIn",
  ],
  applications: ["fullName"],
  payments: ["amount", "currency", "paymentMethod", "transactionRef", "screenshotUrl"],
  systemPrompts: ["modelSlug", "content", "version"],
  messages: ["conversationId", "content", "tokenCount"],
  conversations: ["modelSlug", "summary"],
  apiKeys: ["provider", "keyValue"],
  aiModels: ["targetRole", "modelString"],
  systemSettings: ["key", "value"],
  externalApiTokens: ["token"],
  announcements: ["title", "type"],
};

const BATCH_SIZE = 50;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const SKIP_CONFIRM = args.has("--yes");

type Row = Record<string, unknown>;

interface ManusQueryFile {
  query?: string;
  rows?: Row[];
}

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMetadataRow(row: Row): boolean {
  if ("Field" in row && ("Type" in row || row.Field === "Type")) return true;
  if (row.Field === "Field" && row.Type === "Type") return true;
  return false;
}

function hasId(row: Row): boolean {
  const id = row.id;
  if (id == null || id === "") return false;
  const n = Number(id);
  return Number.isFinite(n) && n > 0;
}

function inferTableFromQuery(query: string | undefined): TableName | null {
  if (!query) return null;
  const q = query.toLowerCase();
  const fromMatch = q.match(/\bfrom\s+`?(\w+)`?/);
  if (fromMatch) {
    const name = fromMatch[1];
    if (TABLES_IN_ORDER.includes(name as TableName)) return name as TableName;
  }
  const intoMatch = q.match(/\binto\s+`?(\w+)`?/);
  if (intoMatch) {
    const name = intoMatch[1];
    if (TABLES_IN_ORDER.includes(name as TableName)) return name as TableName;
  }
  const updateMatch = q.match(/\bupdate\s+`?(\w+)`?/);
  if (updateMatch) {
    const name = updateMatch[1];
    if (TABLES_IN_ORDER.includes(name as TableName)) return name as TableName;
  }
  return null;
}

function scoreTable(row: Row, table: TableName): number {
  const keys = new Set(Object.keys(row));
  let score = 0;
  for (const sig of TABLE_SIGNATURES[table]) {
    if (keys.has(sig)) score += 3;
  }
  return score;
}

function inferTableFromKeys(row: Row): TableName | null {
  if ("fullName" in row && "email" in row && !("amount" in row)) return "applications";
  if ("amount" in row && ("userId" in row || "status" in row)) return "payments";
  if ("conversationId" in row && "content" in row) return "messages";
  if ("conversationId" in row && "role" in row) return "messages";
  if ("modelSlug" in row && "content" in row && "name" in row) return "systemPrompts";
  if ("userId" in row && "modelSlug" in row && !("content" in row)) return "conversations";
  if ("provider" in row && "keyValue" in row) return "apiKeys";
  if ("targetRole" in row && "modelString" in row) return "aiModels";
  if ("key" in row && "value" in row && !("email" in row)) return "systemSettings";
  if ("token" in row && "name" in row && !("email" in row)) return "externalApiTokens";
  if ("title" in row && "content" in row && "type" in row) return "announcements";
  if (
    "email" in row ||
    "planTypeBiz" in row ||
    "planTypeFounder" in row ||
    "bizMessageLimit" in row ||
    "openId" in row
  ) {
    return "users";
  }

  let best: TableName | null = null;
  let bestScore = 0;
  for (const table of TABLES_IN_ORDER) {
    const s = scoreTable(row, table);
    if (s > bestScore) {
      bestScore = s;
      best = table;
    }
  }
  return bestScore >= 3 ? best : null;
}

function classifyRow(row: Row, query?: string): TableName | null {
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
  if (value instanceof Date) return value.getTime();
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (column === "id" || column.endsWith("Id") || column.endsWith("Count") || column.endsWith("Limit") || column === "amount" || column === "version" || column === "tokenCount") {
      const n = Number(value);
      if (!Number.isNaN(n) && value.trim() !== "") return n;
    }
    return value;
  }
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
  if (row.bizMessageLimit == null) row.bizMessageLimit = 5;
  if (row.founderMessageLimit == null) row.founderMessageLimit = 5;
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

function applyTableDefaults(table: TableName, row: Row): Row {
  if (table === "users") return applyUserDefaults(row);
  if (table === "applications") return applyApplicationDefaults(row);
  if (table === "payments") return applyPaymentDefaults(row);
  const now = Date.now();
  if (!row.createdAt && table !== "systemSettings") row.createdAt = now;
  if (!row.updatedAt && "updatedAt" in row === false) {
    /* optional */
  } else if (!row.updatedAt) {
    row.updatedAt = now;
  }
  return row;
}

async function loadManusRows(): Promise<Map<TableName, Map<number, Row>>> {
  const byTable = new Map<TableName, Map<number, Row>>();
  for (const table of TABLES_IN_ORDER) {
    byTable.set(table, new Map());
  }

  let files: string[];
  try {
    files = (await readdir(MANUS_DB_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    throw new Error(`Cannot read ${MANUS_DB_DIR}`);
  }

  for (const file of files.sort()) {
    const raw = await readFile(join(MANUS_DB_DIR, file), "utf8");
    let parsed: ManusQueryFile;
    try {
      parsed = JSON.parse(raw) as ManusQueryFile;
    } catch {
      console.warn(`[recover] Skip invalid JSON: ${file}`);
      continue;
    }

    const rows = parsed.rows;
    if (!Array.isArray(rows) || rows.length === 0) continue;

    for (const item of rows) {
      if (!isRecord(item)) continue;
      const table = classifyRow(item, parsed.query);
      if (!table) continue;

      const id = Number(item.id);
      const bucket = byTable.get(table)!;
      const prev = bucket.get(id);
      bucket.set(id, prev ? mergeRows(prev, item) : { ...item });
    }
  }

  return byTable;
}

async function getTursoColumns(turso: Client, table: string): Promise<string[]> {
  const result = await turso.execute({ sql: `PRAGMA table_info(\`${table}\`)`, args: [] });
  return result.rows
    .map((row) => String(row.name ?? row[1]))
    .filter((name) => name && name !== "undefined");
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

function prepareRow(
  source: Row,
  tursoColumns: string[],
  table: TableName,
): Record<string, unknown> | null {
  const withDefaults = applyTableDefaults(table, { ...source });
  if (withDefaults.id == null) return null;

  const out: Record<string, unknown> = {};
  for (const col of tursoColumns) {
    if (!(col in withDefaults)) continue;
    out[col] = normalizeCell(col, withDefaults[col]);
  }

  const now = Date.now();
  if (tursoColumns.includes("createdAt") && out.createdAt == null) out.createdAt = now;
  if (tursoColumns.includes("updatedAt") && out.updatedAt == null) out.updatedAt = out.createdAt ?? now;
  if (tursoColumns.includes("lastSignedIn") && out.lastSignedIn == null) {
    out.lastSignedIn = out.createdAt ?? now;
  }

  out.id = Number(withDefaults.id);
  return out;
}

async function resetSqliteSequence(turso: Client, table: string): Promise<void> {
  const maxResult = await turso.execute(`SELECT MAX(\`id\`) AS maxId FROM \`${table}\``);
  const row = maxResult.rows[0];
  const maxId = Number(row?.maxId ?? row?.[0] ?? 0);
  if (maxId > 0) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES (?, ?)`,
      args: [table, maxId],
    });
  }
}

async function upsertTable(
  turso: Client,
  table: TableName,
  rows: Map<number, Row>,
): Promise<{ discovered: number; written: number; skipped: number }> {
  const discovered = rows.size;
  if (discovered === 0) return { discovered: 0, written: 0, skipped: 0 };

  const tursoColumns = await getTursoColumns(turso, table);
  if (!tursoColumns.length) {
    throw new Error(`Turso table "${table}" not found — run drizzle migrations first`);
  }

  if (DRY_RUN) {
    console.info(`  [dry-run] ${table}: ${discovered} merged row(s)`);
    for (const row of rows.values()) {
      console.info(`    id=${row.id} keys=${Object.keys(row).join(",")}`);
    }
    return { discovered, written: 0, skipped: 0 };
  }

  const upsertSql = buildUpsertSql(table, tursoColumns);
  let written = 0;
  let skipped = 0;
  const sorted = [...rows.values()].sort((a, b) => Number(a.id) - Number(b.id));

  for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
    const chunk = sorted.slice(i, i + BATCH_SIZE);
    const batch: { sql: string; args: InArgs }[] = [];

    for (const source of chunk) {
      const prepared = prepareRow(source, tursoColumns, table);
      if (!prepared) {
        skipped++;
        continue;
      }
      const values = tursoColumns.map((c) => prepared[c] ?? null) as InArgs;
      batch.push({ sql: upsertSql, args: values });
    }

    if (batch.length > 0) {
      await turso.batch(batch, "write");
      written += batch.length;
    }
  }

  await resetSqliteSequence(turso, table);
  return { discovered, written, skipped };
}

async function confirm(target: string): Promise<void> {
  if (SKIP_CONFIRM || DRY_RUN) return;
  console.info("\n⚠  This will upsert recovered Manus JSON data into Turso.");
  console.info(`   Target: ${target}`);
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question("\nType YES to continue: ");
  rl.close();
  if (answer.trim().toUpperCase() !== "YES") {
    console.info("Aborted.");
    process.exit(0);
  }
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url.replace(/^libsql:/, "https:"));
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url.slice(0, 40);
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
    console.error("Missing TURSO_AUTH_TOKEN for remote Turso.");
    process.exit(1);
  }

  console.info("[recover] Scanning .manus/db/*.json …");
  const byTable = await loadManusRows();

  let totalDiscovered = 0;
  for (const table of TABLES_IN_ORDER) {
    const n = byTable.get(table)?.size ?? 0;
    if (n > 0) console.info(`[recover] Found ${n} row(s) for ${table}`);
    totalDiscovered += n;
  }

  if (totalDiscovered === 0) {
    console.warn("[recover] No recoverable rows found in JSON caches.");
    process.exit(0);
  }

  await confirm(maskUrl(tursoUrl));

  const turso = createClient({ url: tursoUrl, authToken: tursoToken });
  console.info(`\n[recover] Target: ${maskUrl(tursoUrl)}`);
  if (DRY_RUN) console.info("[recover] DRY RUN — no writes\n");

  if (!DRY_RUN) {
    await turso.execute("PRAGMA foreign_keys = OFF");
  }

  const summary: Record<string, { discovered: number; written: number; skipped: number }> = {};

  for (const table of TABLES_IN_ORDER) {
    const rows = byTable.get(table)!;
    if (rows.size === 0) continue;

    process.stdout.write(`[recover] ${table}… `);
    try {
      const result = await upsertTable(turso, table, rows);
      summary[table] = result;
      console.info(
        `discovered ${result.discovered} → written ${result.written}` +
          (result.skipped ? ` (${result.skipped} skipped)` : ""),
      );
    } catch (err) {
      console.error("FAILED");
      throw err;
    }
  }

  if (!DRY_RUN) {
    await turso.execute("PRAGMA foreign_keys = ON");
  }

  console.info("\n[recover] Summary");
  console.table(
    Object.entries(summary).map(([table, s]) => ({
      table,
      discovered: s.discovered,
      written: s.written,
      skipped: s.skipped,
    })),
  );

  console.info(
    "\n[recover] Done. Note: only data present in JSON caches was restored (partial snapshots; prompts/chats may be missing).",
  );
}

main().catch((err) => {
  console.error("[recover] Fatal:", err);
  process.exit(1);
});
