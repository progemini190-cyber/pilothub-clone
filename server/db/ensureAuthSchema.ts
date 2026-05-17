import { eq, sql } from "drizzle-orm";
import {
  getDb,
  getDatabaseProvider,
  getMysqlPool,
  resolveTursoConfig,
  users,
} from "./connection";
import { isApprovedUserStatus, isPendingUserStatus } from "../_core/userStatus";

let _columnsReady = false;
let _migrationDone = false;

function isBenignMigrationError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("duplicate column") ||
    msg.includes("already exists") ||
    msg.includes("duplicate key name")
  );
}

async function runTurso(statement: string): Promise<void> {
  const { createClient } = await import("@libsql/client");
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
  const query = sql.raw(statement);
  const d = db as {
    execute?: (q: typeof query) => Promise<unknown>;
    run?: (q: typeof query) => Promise<unknown>;
  };
  try {
    if (typeof d.execute === "function") await d.execute(query);
    else if (typeof d.run === "function") await d.run(query);
  } catch (err) {
    if (!isBenignMigrationError(err)) throw err;
  }
}

async function runStatement(statement: string): Promise<void> {
  const provider = getDatabaseProvider();
  if (provider === "mysql") await runMysql(statement);
  else if (resolveTursoConfig()) await runTurso(statement);
  else await runDrizzle(statement);
}

async function ensureAuthColumns(): Promise<void> {
  if (_columnsReady) return;
  const provider = getDatabaseProvider();

  if (provider === "mysql") {
    await runStatement("ALTER TABLE `users` ADD COLUMN `passwordHash` text");
    await runStatement("ALTER TABLE `users` ADD COLUMN `onboardingCompletedAt` timestamp NULL");
  } else {
    await runStatement("ALTER TABLE `users` ADD COLUMN `passwordHash` text");
    await runStatement("ALTER TABLE `users` ADD COLUMN `onboardingCompletedAt` integer");
  }

  _columnsReady = true;
  console.info("[Database] Auth columns synced", { provider: provider ?? "turso" });
}

/** Auto-approve legacy users and mark profiles with name+purpose as onboarded. */
async function migrateLegacyUsersToActive(): Promise<void> {
  if (_migrationDone) return;
  const db = await getDb();
  if (!db) return;

  const allUsers = await db.select().from(users);
  const now = new Date();
  let updated = 0;

  for (const user of allUsers) {
    const patch: Record<string, unknown> = {};
    const status = user.status ?? "";

    if (isPendingUserStatus(status) || !isApprovedUserStatus(status)) {
      patch.status = "active";
    }

    const hasName = Boolean((user.name ?? "").trim());
    const hasPurpose = Boolean((user.useCase ?? "").trim());
    const completedAt = (user as { onboardingCompletedAt?: Date | number | null })
      .onboardingCompletedAt;

    if (hasName && hasPurpose && !completedAt) {
      patch.onboardingCompletedAt = now;
    }

    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch as never).where(eq(users.id, user.id));
      updated++;
    }
  }

  _migrationDone = true;
  if (updated > 0) {
    console.info("[Database] Legacy user migration", { usersPatched: updated });
  }
}

export async function ensureAuthSchema(): Promise<void> {
  await ensureAuthColumns();
  await migrateLegacyUsersToActive();
}

export function resetAuthSchemaCache(): void {
  _columnsReady = false;
  _migrationDone = false;
}
