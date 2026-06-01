import { createClient } from "@libsql/client";
import {
  getDb,
  getDatabaseProvider,
  getMysqlPool,
  resolveTursoConfig,
} from "./connection";

let _ready = false;

function isBenignMigrationError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("duplicate column") ||
    msg.includes("already exists") ||
    msg.includes("duplicate key name")
  );
}

async function runTurso(statement: string): Promise<void> {
  const config = resolveTursoConfig();
  if (!config) return;
  const client = createClient({ url: config.url, authToken: config.authToken });
  try {
    await client.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}

async function runMysql(statement: string): Promise<void> {
  const pool = getMysqlPool();
  if (!pool) return;
  try {
    await pool.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}

async function runDrizzle(statement: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const d = db as { run?: (q: string) => Promise<unknown>; execute?: (q: string) => Promise<unknown> };
    if (typeof d.run === "function") await d.run(statement);
    else if (typeof d.execute === "function") await d.execute(statement);
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}

async function runStatement(statement: string): Promise<void> {
  const provider = getDatabaseProvider();
  if (provider === "turso") await runTurso(statement);
  else if (provider === "mysql") await runMysql(statement);
  else await runDrizzle(statement);
}

export async function ensureChatSchema(): Promise<void> {
  if (_ready) return;
  const provider = getDatabaseProvider();
  if (provider === "mysql") {
    await runStatement("ALTER TABLE `messages` ADD COLUMN `imageData` text NULL");
    await runStatement("ALTER TABLE `conversations` ADD COLUMN `messagesJson` text NULL");
  } else {
    await runStatement("ALTER TABLE `messages` ADD COLUMN `imageData` text");
    await runStatement("ALTER TABLE `conversations` ADD COLUMN `messagesJson` text");
  }
  _ready = true;
}
