import { sql } from "drizzle-orm";
import { getDb, getDatabaseProvider } from "./connection";

let _ready = false;

function isBenignMigrationError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("duplicate column") ||
    msg.includes("already exists") ||
    msg.includes("duplicate key name")
  );
}

async function runStatement(db: AppDatabase, statement: string) {
  const query = sql.raw(statement);
  try {
    if (typeof (db as { execute?: (q: typeof query) => Promise<unknown> }).execute === "function") {
      await (db as { execute: (q: typeof query) => Promise<unknown> }).execute(query);
    } else if (typeof (db as { run?: (q: typeof query) => Promise<unknown> }).run === "function") {
      await (db as { run: (q: typeof query) => Promise<unknown> }).run(query);
    } else {
      throw new Error("Database driver does not support raw SQL execution");
    }
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}

type AppDatabase = {
  execute?: (query: ReturnType<typeof sql.raw>) => Promise<unknown>;
  run?: (query: ReturnType<typeof sql.raw>) => Promise<unknown>;
};

/** Ensures Telegram columns/tables exist (safe to call repeatedly). */
export async function ensureTelegramSchema(): Promise<void> {
  if (_ready) return;
  const db = await getDb();
  if (!db) return;

  const provider = getDatabaseProvider();

  if (provider === "mysql") {
    await runStatement(db, "ALTER TABLE `users` ADD COLUMN `telegramChatId` varchar(64)");
    await runStatement(db, "ALTER TABLE `users` ADD COLUMN `planExpiryDate` timestamp NULL");
    await runStatement(
      db,
      `CREATE TABLE IF NOT EXISTS \`bot_activation_tokens\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`token\` varchar(64) NOT NULL UNIQUE,
        \`userId\` int NOT NULL,
        \`isUsed\` enum('true','false') NOT NULL DEFAULT 'false',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
  } else {
    await runStatement(db, "ALTER TABLE `users` ADD `telegramChatId` text");
    await runStatement(db, "ALTER TABLE `users` ADD `planExpiryDate` integer");
    await runStatement(
      db,
      `CREATE TABLE IF NOT EXISTS \`bot_activation_tokens\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        \`token\` text(64) NOT NULL,
        \`userId\` integer NOT NULL,
        \`isUsed\` text DEFAULT 'false' NOT NULL,
        \`createdAt\` integer NOT NULL
      )`,
    );
    await runStatement(
      db,
      "CREATE UNIQUE INDEX IF NOT EXISTS `bot_activation_tokens_token_unique` ON `bot_activation_tokens` (`token`)",
    );
  }

  _ready = true;
  console.info("[Database] Telegram schema ready");
}
