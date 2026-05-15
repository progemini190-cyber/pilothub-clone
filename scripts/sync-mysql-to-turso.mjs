/**
 * One-time copy: legacy Manus/TiDB (MySQL) → Turso (SQLite).
 *
 * Usage:
 *   MYSQL_URL="mysql://user:pass@host:4000/dbname?ssl=..." \
 *   TURSO_DATABASE_URL="libsql://..." \
 *   TURSO_AUTH_TOKEN="..." \
 *   node scripts/sync-mysql-to-turso.mjs
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import mysql from "mysql2/promise";

const TABLES = [
  "users",
  "payments",
  "apiKeys",
  "systemPrompts",
  "applications",
  "aiModels",
  "systemSettings",
  "conversations",
  "messages",
  "externalApiTokens",
  "announcements",
];

function toMs(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function rowToTursoValues(row) {
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (out[key] instanceof Date) {
      out[key] = toMs(out[key]);
    }
  }
  return out;
}

async function main() {
  const mysqlUrl = process.env.MYSQL_URL ?? process.env.LEGACY_MYSQL_URL;
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!mysqlUrl?.startsWith("mysql")) {
    console.error("Set MYSQL_URL to your TiDB/MySQL connection string.");
    process.exit(1);
  }
  if (!tursoUrl) {
    console.error("Set TURSO_DATABASE_URL.");
    process.exit(1);
  }

  const pool = mysql.createPool({ uri: mysqlUrl, connectionLimit: 3 });
  const turso = createClient({ url: tursoUrl, authToken: tursoToken });

  console.info("[sync] MySQL → Turso");
  console.info("[sync] Turso target:", tursoUrl.replace(/\/\/[^@]+@/, "//***@"));

  for (const table of TABLES) {
    try {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
      const list = rows;
      if (!list.length) {
        console.info(`[sync] ${table}: 0 rows (skip)`);
        continue;
      }

      await turso.execute(`DELETE FROM \`${table}\``);

      let inserted = 0;
      for (const row of list) {
        const normalized = rowToTursoValues(row);
        const cols = Object.keys(normalized);
        const placeholders = cols.map(() => "?").join(", ");
        const values = cols.map((c) => normalized[c]);
        await turso.execute({
          sql: `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${placeholders})`,
          args: values,
        });
        inserted++;
      }
      console.info(`[sync] ${table}: ${inserted} rows copied`);
    } catch (err) {
      console.warn(`[sync] ${table}: failed —`, err.message);
    }
  }

  await pool.end();
  console.info("[sync] Done. Redeploy or restart app; Turso should now show legacy data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
