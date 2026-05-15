/**
 * Final import: Manus export files in `migration-data/` → Turso (SQLite).
 *
 * Preserves original `id` and timestamp columns. Supports CSV and JSON exports.
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/final-import.ts [--yes] [--dry-run]
 */
import "dotenv/config";
import { createClient, type Client, type InArgs } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const MIGRATION_DIR = join(process.cwd(), "migration-data");

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

const BOOL_AS_TEXT_COLUMNS = new Set(["isActive", "hasUsedBizStarter", "hasUsedFounderStarter"]);

const BATCH_SIZE = 75;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const SKIP_CONFIRM = args.has("--yes");

type Row = Record<string, unknown>;

/** RFC 4180-style CSV parser (handles quoted multiline fields). */
function parseCsv(content: string): { headers: string[]; rows: Row[] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || (c === "\r" && next === "\n")) {
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      if (c === "\r") i++;
    } else if (c !== "\r") {
      field += c;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map((h) => h.trim());
  const out: Row[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.every((c) => c.trim() === "")) continue;
    const obj: Row = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      obj[key] = cells[c] ?? "";
    }
    if (obj.id != null && String(obj.id).trim() !== "") out.push(obj);
  }
  return { headers, rows: out };
}

function parseJsonExport(content: string): Row[] {
  const parsed = JSON.parse(content) as unknown;
  if (Array.isArray(parsed)) {
    return parsed.filter((r) => r && typeof r === "object") as Row[];
  }
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown }).rows)) {
    return (parsed as { rows: Row[] }).rows;
  }
  return [];
}

function inferTableFromFilename(filename: string): TableName | null {
  const base = filename.toLowerCase();
  for (const table of TABLES_IN_ORDER) {
    if (base.startsWith(`${table.toLowerCase()}_`) || base === `${table.toLowerCase()}.csv` || base === `${table.toLowerCase()}.json`) {
      return table;
    }
  }
  return null;
}

async function loadMigrationFiles(): Promise<Map<TableName, Row[]>> {
  const byTable = new Map<TableName, Row[]>();
  for (const t of TABLES_IN_ORDER) byTable.set(t, []);

  let entries: string[];
  try {
    entries = await readdir(MIGRATION_DIR);
  } catch {
    throw new Error(`Missing folder: ${MIGRATION_DIR}`);
  }

  for (const file of entries.sort()) {
    const table = inferTableFromFilename(file);
    if (!table) continue;

    const path = join(MIGRATION_DIR, file);
    const raw = await readFile(path, "utf8");
    let rows: Row[] = [];

    if (file.endsWith(".csv")) {
      rows = parseCsv(raw).rows;
    } else if (file.endsWith(".json")) {
      rows = parseJsonExport(raw);
    } else {
      continue;
    }

    const bucket = byTable.get(table)!;
    bucket.push(...rows);
    console.info(`[final-import] ${file} → ${table} (${rows.length} rows)`);
  }

  return byTable;
}

function toTimestampMs(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const iso = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  return null;
}

function normalizeValue(column: string, value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;

  if (TIMESTAMP_COLUMNS.has(column)) return toTimestampMs(value);

  if (BOOL_AS_TEXT_COLUMNS.has(column)) {
    if (value === true || value === "true" || value === "1") return "true";
    if (value === false || value === "false" || value === "0") return "false";
    return String(value);
  }

  if (typeof value === "string") {
    if (
      column === "id" ||
      column.endsWith("Id") ||
      column.endsWith("Count") ||
      column.endsWith("Limit") ||
      column === "amount" ||
      column === "version" ||
      column === "tokenCount"
    ) {
      const n = Number(value);
      if (!Number.isNaN(n)) return n;
    }
    return value;
  }

  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return value;
  return value;
}

function mergeHint(base: Row, patch: Row): Row {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

/** Build users when no users_*.csv/json export exists. */
function synthesizeUsersFromForeignKeys(data: Map<TableName, Row[]>): Row[] {
  const hints = new Map<number, Row>();

  const add = (id: unknown, patch: Row) => {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return;
    hints.set(n, mergeHint(hints.get(n) ?? { id: n }, patch));
  };

  for (const row of data.get("applications") ?? []) {
    add(row.userId, {
      email: row.email,
      name: row.fullName,
      businessName: row.businessName,
      businessType: row.businessType,
      useCase: row.useCase,
      phone: row.phone,
      plan: row.plan,
      status: row.status === "approved" ? "active" : row.status,
    });
  }

  for (const row of data.get("payments") ?? []) {
    add(row.userId, { email: row.userEmail, name: row.userName });
  }

  for (const row of data.get("conversations") ?? []) {
    add(row.userId, {});
  }

  const now = Date.now();
  const users: Row[] = [];
  for (const [id, hint] of hints) {
    const createdAt = toTimestampMs(hint.createdAt) ?? now;
    users.push({
      id,
      openId: hint.openId ?? `migration:${id}`,
      name: hint.name ?? null,
      email: hint.email ?? null,
      businessName: hint.businessName ?? null,
      businessType: hint.businessType ?? null,
      useCase: hint.useCase ?? null,
      phone: hint.phone ?? null,
      loginMethod: hint.loginMethod ?? "manus_import",
      role: hint.role ?? "user",
      plan: hint.plan ?? "free",
      status: hint.status ?? "active",
      freeBizCount: hint.freeBizCount ?? 5,
      freeFounderCount: hint.freeFounderCount ?? 5,
      planTypeBiz: hint.planTypeBiz ?? "free",
      planTypeFounder: hint.planTypeFounder ?? "free",
      bizMessageLimit: hint.bizMessageLimit ?? 5,
      founderMessageLimit: hint.founderMessageLimit ?? 5,
      bizMessagesUsed: hint.bizMessagesUsed ?? 0,
      founderMessagesUsed: hint.founderMessagesUsed ?? 0,
      hasUsedBizStarter: hint.hasUsedBizStarter ?? "false",
      hasUsedFounderStarter: hint.hasUsedFounderStarter ?? "false",
      createdAt,
      updatedAt: toTimestampMs(hint.updatedAt) ?? createdAt,
      lastSignedIn: toTimestampMs(hint.lastSignedIn) ?? createdAt,
    });
  }

  return users.sort((a, b) => Number(a.id) - Number(b.id));
}

function dedupeById(rows: Row[]): Row[] {
  const map = new Map<number, Row>();
  for (const row of rows) {
    const id = Number(row.id);
    if (!Number.isFinite(id)) continue;
    map.set(id, map.has(id) ? mergeHint(map.get(id)!, row) : row);
  }
  return [...map.values()].sort((a, b) => Number(a.id) - Number(b.id));
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

function prepareRow(raw: Row, tursoColumns: string[], table: TableName): Record<string, unknown> | null {
  if (raw.id == null) return null;

  const out: Record<string, unknown> = {};
  for (const col of tursoColumns) {
    if (!(col in raw)) continue;
    out[col] = normalizeValue(col, raw[col]);
  }

  const now = Date.now();
  if (tursoColumns.includes("createdAt") && out.createdAt == null) out.createdAt = now;
  if (tursoColumns.includes("updatedAt") && out.updatedAt == null) out.updatedAt = out.createdAt ?? now;
  if (tursoColumns.includes("lastSignedIn") && out.lastSignedIn == null) {
    out.lastSignedIn = out.createdAt ?? now;
  }

  if (table === "applications" && tursoColumns.includes("fullName") && out.fullName == null) {
    return null;
  }
  if (table === "messages" && tursoColumns.includes("content") && (out.content == null || out.content === "")) {
    return null;
  }

  out.id = Number(raw.id);
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

async function importTable(turso: Client, table: TableName, rows: Row[]): Promise<number> {
  if (rows.length === 0) return 0;

  const tursoColumns = await getTursoColumns(turso, table);
  if (!tursoColumns.length) throw new Error(`Turso table "${table}" not found`);

  if (DRY_RUN) {
    console.info(`  [dry-run] ${table}: ${rows.length} row(s)`);
    return rows.length;
  }

  const upsertSql = buildUpsertSql(table, tursoColumns);
  let written = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const batch: { sql: string; args: InArgs }[] = [];

    for (const raw of chunk) {
      const prepared = prepareRow(raw, tursoColumns, table);
      if (!prepared) continue;
      batch.push({
        sql: upsertSql,
        args: tursoColumns.map((c) => prepared[c] ?? null) as InArgs,
      });
    }

    if (batch.length > 0) {
      await turso.batch(batch, "write");
      written += batch.length;
    }
  }

  await resetSqliteSequence(turso, table);
  return written;
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
  const answer = await rl.question(`\n⚠  Import into Turso: ${target}\nType YES to continue: `);
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

  console.info(`[final-import] Reading ${MIGRATION_DIR} …\n`);
  const data = await loadMigrationFiles();

  const exportedUsers = dedupeById(data.get("users") ?? []);
  if (exportedUsers.length === 0) {
    const synthesized = synthesizeUsersFromForeignKeys(data);
    data.set("users", synthesized);
    console.warn(
      `[final-import] No users_*.csv/json found — synthesized ${synthesized.length} user row(s) from FK references (partial profiles).`,
    );
  } else {
    data.set("users", exportedUsers);
  }

  for (const table of TABLES_IN_ORDER) {
    if (table === "users") continue;
    data.set(table, dedupeById(data.get(table) ?? []));
  }

  console.info(`\n[final-import] Turso target: ${maskTursoTarget(tursoUrl)}`);
  if (DRY_RUN) console.info("[final-import] DRY RUN\n");

  await confirm(maskTursoTarget(tursoUrl));

  const turso = createClient({ url: tursoUrl, authToken: tursoToken });

  if (!DRY_RUN) await turso.execute("PRAGMA foreign_keys = OFF");

  const summary: { table: string; rows: number; written: number }[] = [];

  for (const table of TABLES_IN_ORDER) {
    const rows = data.get(table) ?? [];
    if (rows.length === 0) {
      console.info(`[final-import] ${table}: (no export file)`);
      continue;
    }
    process.stdout.write(`[final-import] ${table}… `);
    const written = await importTable(turso, table, rows);
    summary.push({ table, rows: rows.length, written });
    console.info(written === rows.length ? `${written} upserted` : `${written}/${rows.length} upserted`);
  }

  if (!DRY_RUN) await turso.execute("PRAGMA foreign_keys = ON");

  console.info("\n[final-import] Summary");
  console.table(summary);
  console.info("[final-import] Done.");
}

main().catch((err) => {
  console.error("[final-import] Fatal:", err);
  process.exit(1);
});
