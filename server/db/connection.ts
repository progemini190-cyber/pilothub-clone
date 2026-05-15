import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as sqliteSchema from "../../drizzle/schema";
import * as mysqlSchema from "../../drizzle/schema.mysql";
import { ENV } from "../_core/env";

export type DatabaseProvider = "turso" | "mysql";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppDatabase = any;

let _db: AppDatabase | null = null;
let _provider: DatabaseProvider | null = null;
let _mysqlPool: mysql.Pool | null = null;
let _initLogged = false;

/** Active table handles (sqlite or mysql schema). */
export let users = sqliteSchema.users;
export let payments = sqliteSchema.payments;
export let apiKeys = sqliteSchema.apiKeys;
export let systemPrompts = sqliteSchema.systemPrompts;
export let applications = sqliteSchema.applications;
export let aiModels = sqliteSchema.aiModels;
export let systemSettings = sqliteSchema.systemSettings;
export let conversations = sqliteSchema.conversations;
export let messages = sqliteSchema.messages;
export let externalApiTokens = sqliteSchema.externalApiTokens;
export let announcements = sqliteSchema.announcements;
export let botActivationTokens = sqliteSchema.botActivationTokens;

function applySchema(provider: DatabaseProvider) {
  if (provider === "mysql") {
    users = mysqlSchema.users;
    payments = mysqlSchema.payments;
    apiKeys = mysqlSchema.apiKeys;
    systemPrompts = mysqlSchema.systemPrompts;
    applications = mysqlSchema.applications;
    aiModels = mysqlSchema.aiModels;
    systemSettings = mysqlSchema.systemSettings;
    conversations = mysqlSchema.conversations;
    messages = mysqlSchema.messages;
    externalApiTokens = mysqlSchema.externalApiTokens;
    announcements = mysqlSchema.announcements;
    botActivationTokens = mysqlSchema.botActivationTokens;
  } else {
    users = sqliteSchema.users;
    payments = sqliteSchema.payments;
    apiKeys = sqliteSchema.apiKeys;
    systemPrompts = sqliteSchema.systemPrompts;
    applications = sqliteSchema.applications;
    aiModels = sqliteSchema.aiModels;
    systemSettings = sqliteSchema.systemSettings;
    conversations = sqliteSchema.conversations;
    messages = sqliteSchema.messages;
    externalApiTokens = sqliteSchema.externalApiTokens;
    announcements = sqliteSchema.announcements;
    botActivationTokens = sqliteSchema.botActivationTokens;
  }
}

export type TursoConfig = {
  url: string;
  authToken: string | undefined;
};

export function resolveMysqlUrl(): string | undefined {
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

export function resolveTursoConfig(): TursoConfig | null {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (!tursoUrl) return null;
  return {
    url: tursoUrl,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
  };
}

export function maskDatabaseUrl(url: string): string {
  try {
    if (url.startsWith("mysql://") || url.startsWith("mysql2://")) {
      const parsed = new URL(url);
      const dbName = parsed.pathname.replace(/^\//, "") || "(default)";
      return `mysql://${parsed.hostname}:${parsed.port || "3306"}/${dbName}`;
    }
    const normalized = url.replace(/^libsql:/, "https:");
    const parsed = new URL(normalized);
    const dbName = parsed.pathname.replace(/^\//, "") || "(default)";
    return `${parsed.hostname}/${dbName}`;
  } catch {
    if (url.startsWith("file:")) return "file:***";
    return url.slice(0, 48);
  }
}

function tokenFingerprint(token: string | undefined): string {
  if (!token) return "missing";
  if (token.length < 12) return "set-short";
  return `set:${token.slice(0, 4)}…${token.slice(-4)}`;
}

async function countUsers(database: AppDatabase): Promise<number> {
  try {
    const [row] = await database.select({ count: sql<number>`count(*)` }).from(users);
    return Number(row?.count ?? 0);
  } catch {
    return -1;
  }
}

async function logHealth(database: AppDatabase, provider: DatabaseProvider): Promise<number> {
  try {
    const [userRow] = await database.select({ count: sql<number>`count(*)` }).from(users);
    const [payRow] = await database.select({ count: sql<number>`count(*)` }).from(payments);
    const [keyRow] = await database.select({ count: sql<number>`count(*)` }).from(apiKeys);
    const userCount = Number(userRow?.count ?? 0);
    console.info("[Database] Health check", {
      provider,
      users: userCount,
      payments: Number(payRow?.count ?? 0),
      apiKeys: Number(keyRow?.count ?? 0),
    });
    return userCount;
  } catch (err) {
    console.warn("[Database] Health check failed:", err);
    return -1;
  }
}

async function connectTurso(config: TursoConfig): Promise<AppDatabase | null> {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    ENV.isProduction;

  if (config.url.startsWith("file:") && isProd) {
    console.error("[Database] Refusing file: SQLite on Vercel/production");
    return null;
  }

  const isRemote = config.url.includes("turso.io") || config.url.startsWith("libsql://");
  if (isRemote && !config.authToken && !config.url.startsWith("file:")) {
    console.error("[Database] TURSO_AUTH_TOKEN is required", {
      target: maskDatabaseUrl(config.url),
    });
    return null;
  }

  const client = createClient({
    url: config.url,
    authToken: config.authToken,
  });
  applySchema("turso");
  return drizzleLibsql(client);
}

async function connectMysql(url: string): Promise<AppDatabase | null> {
  try {
    _mysqlPool = mysql.createPool({
      uri: url,
      connectionLimit: 5,
      waitForConnections: true,
    });
    applySchema("mysql");
    return drizzleMysql(_mysqlPool, { schema: mysqlSchema, mode: "default" });
  } catch (err) {
    console.error("[Database] MySQL connect failed:", err);
    return null;
  }
}

export function getDatabaseProvider(): DatabaseProvider | null {
  return _provider;
}

export async function initializeDatabase(): Promise<AppDatabase | null> {
  if (_db) return _db;

  const forceMysql = process.env.DATABASE_PROVIDER?.toLowerCase() === "mysql";
  const mysqlUrl = resolveMysqlUrl();
  const tursoConfig = resolveTursoConfig();
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    ENV.isProduction;

  if (forceMysql && mysqlUrl) {
    const mysqlDb = await connectMysql(mysqlUrl);
    if (mysqlDb) {
      _db = mysqlDb;
      _provider = "mysql";
      if (!_initLogged) {
        console.info("[Database] Connected (forced MySQL legacy)", {
          target: maskDatabaseUrl(mysqlUrl),
        });
        await logHealth(_db, "mysql");
        _initLogged = true;
      }
      const { ensureTelegramSchema } = await import("./ensureTelegramSchema");
      await ensureTelegramSchema().catch((err) =>
        console.warn("[Database] Telegram schema migration skipped:", err),
      );
      return _db;
    }
  }

  if (tursoConfig && !(isProd && tursoConfig.url.startsWith("file:"))) {
    try {
      const tursoDb = await connectTurso(tursoConfig);
      if (tursoDb) {
        const userCount = await countUsers(tursoDb);
        const shouldFallback = userCount === 0 && Boolean(mysqlUrl);

        if (shouldFallback) {
          console.warn(
            "[Database] Turso has 0 users — falling back to legacy MySQL (Manus/TiDB).",
            { tursoTarget: maskDatabaseUrl(tursoConfig.url) },
          );
        } else {
          _db = tursoDb;
          _provider = "turso";
          if (!_initLogged) {
            console.info("[Database] Connected", {
              provider: "turso",
              target: maskDatabaseUrl(tursoConfig.url),
              token: tokenFingerprint(tursoConfig.authToken),
            });
            await logHealth(_db, "turso");
            _initLogged = true;
          }
          const { ensureTelegramSchema } = await import("./ensureTelegramSchema");
          await ensureTelegramSchema().catch((err) =>
            console.warn("[Database] Telegram schema migration skipped:", err),
          );
          return _db;
        }
      }
    } catch (err) {
      console.error("[Database] Turso connect failed:", err);
    }
  }

  if (mysqlUrl) {
    const mysqlDb = await connectMysql(mysqlUrl);
    if (mysqlDb) {
      _db = mysqlDb;
      _provider = "mysql";
      if (!_initLogged) {
        console.info("[Database] Connected (legacy MySQL)", {
          target: maskDatabaseUrl(mysqlUrl),
        });
        await logHealth(_db, "mysql");
        _initLogged = true;
      }
      const { ensureTelegramSchema } = await import("./ensureTelegramSchema");
      await ensureTelegramSchema().catch((err) =>
        console.warn("[Database] Telegram schema migration skipped:", err),
      );
      return _db;
    }
  }

  if (tursoConfig) {
    try {
      const tursoDb = await connectTurso(tursoConfig);
      if (tursoDb) {
        _db = tursoDb;
        _provider = "turso";
        if (!_initLogged) {
          console.info("[Database] Connected (Turso, may be empty)", {
            target: maskDatabaseUrl(tursoConfig.url),
          });
          await logHealth(_db, "turso");
          _initLogged = true;
        }
        const { ensureTelegramSchema } = await import("./ensureTelegramSchema");
        await ensureTelegramSchema().catch((err) =>
          console.warn("[Database] Telegram schema migration skipped:", err),
        );
        return _db;
      }
    } catch {
      /* fall through */
    }
  }

  if (!_initLogged) {
    console.error(
      "[Database] No database available. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, or MYSQL_URL for legacy TiDB.",
    );
    _initLogged = true;
  }
  return null;
}

export async function getDb(): Promise<AppDatabase | null> {
  return initializeDatabase();
}

export function getMysqlPool(): mysql.Pool | null {
  return _mysqlPool;
}
