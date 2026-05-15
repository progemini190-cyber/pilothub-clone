import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveTursoConfig, resolveMysqlUrl, maskDatabaseUrl } from "./db/connection";

describe("database connection config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.DATABASE_URL;
    delete process.env.VERCEL;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = env;
  });

  it("uses only TURSO_DATABASE_URL on Vercel", () => {
    process.env.VERCEL = "1";
    process.env.TURSO_DATABASE_URL = "libsql://prod-db.turso.io";
    process.env.DATABASE_URL = "file:./empty.db";
    process.env.TURSO_AUTH_TOKEN = "secret-token";

    const config = resolveTursoConfig();
    expect(config?.url).toBe("libsql://prod-db.turso.io");
    expect(resolveMysqlUrl()).toBeUndefined();
  });

  it("resolves MYSQL_URL for legacy TiDB", () => {
    process.env.MYSQL_URL = "mysql://u:p@tidb.example.com:4000/mydb";
    expect(resolveMysqlUrl()).toContain("tidb.example.com");
  });

  it("masks turso host without exposing token", () => {
    expect(maskDatabaseUrl("libsql://my-db-name-org.turso.io")).toContain("turso.io");
  });
});
