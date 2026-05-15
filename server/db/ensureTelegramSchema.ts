import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import {
  getDb,
  getDatabaseProvider,
  getMysqlPool,
  resolveTursoConfig,
} from "./connection";

let _ready = false;

export function resetTelegramSchemaCache(): void {
  _ready = false;
}

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
  const client = createClient({
    url: config.url,
    authToken: config.authToken,
  });
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
  const query = sql.raw(statement);
  const d = db as {
    execute?: (q: typeof query) => Promise<unknown>;
    run?: (q: typeof query) => Promise<unknown>;
  };
  try {
    if (typeof d.execute === "function") {
      await d.execute(query);
    } else if (typeof d.run === "function") {
      await d.run(query);
    }
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}

async function runStatement(statement: string): Promise<void> {
  const provider = getDatabaseProvider();
  if (provider === "mysql") {
    await runMysql(statement);
  } else if (resolveTursoConfig()) {
    await runTurso(statement);
  } else {
    await runDrizzle(statement);
  }
}

async function ensureTelegramLlmTurnsTable(): Promise<void> {
  const provider = getDatabaseProvider();

  if (provider === "mysql") {
    await runStatement(
      `CREATE TABLE IF NOT EXISTS \`telegram_llm_turns\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`userId\` int NOT NULL,
        \`advisor\` varchar(32) NOT NULL,
        \`role\` varchar(16) NOT NULL,
        \`content\` text NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY \`telegram_llm_turns_user_advisor_created\` (\`userId\`, \`advisor\`, \`createdAt\`)
      )`,
    );
    return;
  }

  await runStatement(
    `CREATE TABLE IF NOT EXISTS \`telegram_llm_turns\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` integer NOT NULL,
      \`advisor\` text NOT NULL,
      \`role\` text NOT NULL,
      \`content\` text NOT NULL,
      \`createdAt\` integer NOT NULL
    )`,
  );
  await runStatement(
    "CREATE INDEX IF NOT EXISTS `telegram_llm_turns_user_advisor_created_idx` ON `telegram_llm_turns` (`userId`, `advisor`, `createdAt`)",
  );
}

/** Ensures Telegram columns/tables exist on Turso/MySQL (idempotent). */
export async function ensureTelegramSchema(): Promise<void> {
  if (!_ready) {
    const provider = getDatabaseProvider();

    if (provider === "mysql") {
      await runStatement("ALTER TABLE `users` ADD COLUMN `telegramChatId` varchar(64)");
      await runStatement("ALTER TABLE `users` ADD COLUMN `planExpiryDate` timestamp NULL");
      await runStatement(
        `CREATE TABLE IF NOT EXISTS \`bot_activation_tokens\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`token\` varchar(64) NOT NULL UNIQUE,
        \`userId\` int NOT NULL,
        \`isUsed\` enum('true','false') NOT NULL DEFAULT 'false',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      );
    } else {
      await runStatement("ALTER TABLE `users` ADD COLUMN `telegramChatId` text");
      await runStatement("ALTER TABLE `users` ADD COLUMN `planExpiryDate` integer");
      await runStatement(
        `CREATE TABLE IF NOT EXISTS \`bot_activation_tokens\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        \`token\` text NOT NULL,
        \`userId\` integer NOT NULL,
        \`isUsed\` text DEFAULT 'false' NOT NULL,
        \`createdAt\` integer NOT NULL
      )`,
      );
      await runStatement(
        "CREATE UNIQUE INDEX IF NOT EXISTS `bot_activation_tokens_token_unique` ON `bot_activation_tokens` (`token`)",
      );
    }

    _ready = true;
    console.info("[Database] Telegram schema synced", { provider: provider ?? "turso" });
  }

  await ensureTelegramLlmTurnsTable();
}
