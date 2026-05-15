/**
 * Full one-way migration: legacy MySQL (TiDB) → Turso (SQLite).
 *
 * Preserves original `id`, `createdAt`, and `updatedAt` (and other timestamps).
 *
 * Usage:
 *   MYSQL_URL="mysql://..." TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." \
 *     npx tsx scripts/migrate-all-to-turso.ts
 *
 * Flags:
 *   --dry-run   Log counts only; no writes
 *   --fresh     DELETE each Turso table before insert (full replace; still preserves ids)
 *   --yes       Skip confirmation prompt
 */
import "dotenv/config";
import { createClient, type Client, type InArgs } from "@libsql/client";
import * as mysql from "mysql2/promise";
import type { Pool, RowDataPacket } from "mysql2/promise";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/** Insert order: parents before children (FK-safe). */
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

const BATCH_SIZE = 100;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FRESH = args.has("--fresh");
const SKIP_CONFIRM = args.has("--yes");

function resolveMysqlUrl(): string | undefined {
  const direct = [
    process.env.MYSQL_URL,
    process.env.LEGACY_MYSQL_URL,
    process.env.TIDB_DATABASE_URL,
  ]
    .map((v) => v?.trim())
    .find((v) => v && (v.startsWith("mysql://") || v.startsWith("mysql2://")));

  if (direct) return direct;

  const host = process.env.TIDB_HOST ?? process.env.MYSQL_HOST;
  const user = process.env.TIDB_USER ?? process.env.MYSQL_USER;
  const password = process.env.TIDB_PASSWORD ?? process.env.MYSQL_PASSWORD;
  const database = process.env.TIDB_DATABASE ?? process.env.MYSQL_DATABASE;
  const port = process.env.TIDB_PORT ?? process.env.MYSQL_PORT ?? "4000";

  if (host && user && password && database) {
    const encUser = encodeURIComponent(user);
    const encPass = encodeURIComponent(password);
    return `mysql://${encUser}:${encPass}@${host}:${port}/${database}?ssl={"rejectUnauthorized":true}`;
  }

  return undefined;
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url.replace(/^mysql2:/, "mysql:").replace(/^libsql:/, "https:"));
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url.slice(0, 40);
  }
}

/** TiDB Cloud requires ssl as an object; mysql2 rejects `?ssl=true` from URI strings. */
function createMysqlPool(mysqlUrl: string): Pool {
  const normalized = mysqlUrl.replace(/^mysql2:/, "mysql:");
  const parsed = new URL(normalized);

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const port = parsed.port ? Number(parsed.port) : 4000;

  return mysql.createPool({
    host: parsed.hostname,
    port,
    user,
    password,
    database,
    connectionLimit: 5,
    waitForConnections: true,
    // Always use object form for TiDB Cloud — ignore ?ssl= in MYSQL_URL
    ssl: { rejectUnauthorized: true },
  });
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
  if (value === undefined) return null;
  if (value === null) return null;
  if (TIMESTAMP_COLUMNS.has(column)) return toTimestampMs(value);
  if (value instanceof Date) return value.getTime();
  if (typeof value === "bigint") return Number(value);
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return value;
}

async function getTursoColumns(turso: Client, table: string): Promise<string[]> {
  const result = await turso.execute({ sql: `PRAGMA table_info(\`${table}\`)`, args: [] });
  return result.rows
    .map((row) => String(row.name ?? row[1]))
    .filter((name) => name && name !== "undefined");
}

async function listMysqlTables(pool: Pool): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SHOW TABLES");
  const key = Object.keys(rows[0] ?? {})[0] ?? "Tables_in_db";
  return rows.map((r) => String(r[key]));
}

async function fetchMysqlRows(pool: Pool, table: string): Promise<Record<string, unknown>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM \`${table}\` ORDER BY \`id\` ASC`,
  );
  return rows as Record<string, unknown>[];
}

async function countTursoRows(turso: Client, table: string): Promise<number> {
  const result = await turso.execute(`SELECT COUNT(*) AS c FROM \`${table}\``);
  const row = result.rows[0];
  if (!row) return 0;
  return Number(row.c ?? row[0] ?? 0);
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
  mysqlRow: Record<string, unknown>,
  tursoColumns: string[],
): Record<string, unknown> | null {
  if (mysqlRow.id == null) return null;

  const out: Record<string, unknown> = {};
  for (const col of tursoColumns) {
    if (!(col in mysqlRow)) continue;
    out[col] = normalizeCell(col, mysqlRow[col]);
  }

  // Required timestamps on Turso when MySQL omitted them
  const now = Date.now();
  if (tursoColumns.includes("createdAt") && out.createdAt == null) {
    out.createdAt = now;
  }
  if (tursoColumns.includes("updatedAt") && out.updatedAt == null) {
    out.updatedAt = out.createdAt ?? now;
  }
  if (tursoColumns.includes("lastSignedIn") && out.lastSignedIn == null) {
    out.lastSignedIn = out.createdAt ?? now;
  }

  out.id = Number(mysqlRow.id);
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

async function migrateTable(
  pool: Pool,
  turso: Client,
  table: TableName,
): Promise<{ source: number; written: number; skipped: number }> {
  const tursoColumns = await getTursoColumns(turso, table);
  if (!tursoColumns.length) {
    throw new Error(`Turso table "${table}" not found — run drizzle migrations first`);
  }

  const mysqlRows = await fetchMysqlRows(pool, table);
  const source = mysqlRows.length;

  if (DRY_RUN) {
    console.info(`  [dry-run] ${table}: ${source} rows in MySQL`);
    return { source, written: 0, skipped: 0 };
  }

  if (FRESH) {
    await turso.execute(`DELETE FROM \`${table}\``);
  }

  const upsertSql = buildUpsertSql(table, tursoColumns);
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < mysqlRows.length; i += BATCH_SIZE) {
    const chunk = mysqlRows.slice(i, i + BATCH_SIZE);
    const batch: { sql: string; args: InArgs }[] = [];

    for (const mysqlRow of chunk) {
      const prepared = prepareRow(mysqlRow, tursoColumns);
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
  return { source, written, skipped };
}

async function confirmMigration(mysqlTarget: string, tursoTarget: string): Promise<void> {
  if (SKIP_CONFIRM || DRY_RUN) return;

  console.info("\n⚠  This will write legacy MySQL data into Turso.");
  console.info(`   Source: ${mysqlTarget}`);
  console.info(`   Target: ${tursoTarget}`);
  if (FRESH) console.info("   Mode:   --fresh (delete Turso rows per table before insert)");
  else console.info("   Mode:   upsert (ON CONFLICT id DO UPDATE)");

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question("\nType YES to continue: ");
  rl.close();
  if (answer.trim().toUpperCase() !== "YES") {
    console.info("Aborted.");
    process.exit(0);
  }
}

async function main(): Promise<void> {
  const mysqlUrl = resolveMysqlUrl();
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!mysqlUrl) {
    console.error("Missing MYSQL_URL (or TIDB_HOST/USER/PASSWORD/DATABASE).");
    process.exit(1);
  }
  if (!tursoUrl) {
    console.error("Missing TURSO_DATABASE_URL.");
    process.exit(1);
  }
  if (tursoUrl.includes("turso.io") && !tursoToken) {
    console.error("Missing TURSO_AUTH_TOKEN for remote Turso.");
    process.exit(1);
  }

  await confirmMigration(maskUrl(mysqlUrl), maskUrl(tursoUrl));

  const pool = createMysqlPool(mysqlUrl);
  const turso = createClient({ url: tursoUrl, authToken: tursoToken });

  console.info("\n[migrate] MySQL → Turso");
  console.info(`[migrate] Source: ${maskUrl(mysqlUrl)}`);
  console.info(`[migrate] Target: ${maskUrl(tursoUrl)}`);
  if (DRY_RUN) console.info("[migrate] DRY RUN — no writes\n");
  else if (FRESH) console.info("[migrate] FRESH mode — tables cleared before insert\n");
  else console.info("[migrate] Upsert mode — preserving ids and timestamps\n");

  try {
    const mysqlTables = await listMysqlTables(pool);
    const known = new Set<string>(TABLES_IN_ORDER);
    const extra = mysqlTables.filter((t) => !known.has(t));
    if (extra.length) {
      console.warn("[migrate] Extra MySQL tables (not migrated):", extra.join(", "));
    }

    if (!DRY_RUN) {
      await turso.execute("PRAGMA foreign_keys = OFF");
    }

    const summary: Record<string, { source: number; turso: number; written: number; skipped: number }> =
      {};

    for (const table of TABLES_IN_ORDER) {
      if (!mysqlTables.includes(table)) {
        console.warn(`[migrate] ${table}: not in MySQL — skip`);
        continue;
      }

      process.stdout.write(`[migrate] ${table}… `);
      try {
        const result = await migrateTable(pool, turso, table);
        const tursoCount = DRY_RUN ? 0 : await countTursoRows(turso, table);
        summary[table] = { ...result, turso: tursoCount };
        console.info(
          `MySQL ${result.source} → written ${result.written}` +
            (result.skipped ? ` (${result.skipped} skipped)` : "") +
            (DRY_RUN ? "" : ` | Turso now ${tursoCount}`),
        );
      } catch (err) {
        console.error("FAILED");
        throw err;
      }
    }

    if (!DRY_RUN) {
      await turso.execute("PRAGMA foreign_keys = ON");
    }

    console.info("\n[migrate] Summary");
    console.table(
      Object.entries(summary).map(([table, s]) => ({
        table,
        mysql: s.source,
        written: s.written,
        turso: s.turso,
        match: DRY_RUN ? "—" : FRESH ? (s.source === s.turso ? "✓" : "✗") : s.turso >= s.source ? "✓" : "✗",
      })),
    );

    const mismatches = Object.entries(summary).filter(([, s]) => {
      if (DRY_RUN) return false;
      if (FRESH) return s.source !== s.turso;
      return s.turso < s.source;
    });
    if (mismatches.length) {
      console.warn(
        "[migrate] Row count issue:",
        mismatches.map(([t]) => t).join(", "),
        FRESH ? "(expected exact match with --fresh)" : "(Turso has fewer rows than MySQL — re-run with --fresh?)",
      );
      process.exit(1);
    }

    console.info("\n[migrate] Done. Set Turso as primary and remove MYSQL_URL fallback on Vercel when verified.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] Fatal:", err);
  process.exit(1);
});
