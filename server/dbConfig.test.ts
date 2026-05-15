import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveDatabaseConfig, maskDatabaseUrl } from "./db";

describe("resolveDatabaseConfig", () => {
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

    const config = resolveDatabaseConfig();
    expect(config?.url).toBe("libsql://prod-db.turso.io");
    expect(config?.source).toBe("TURSO_DATABASE_URL");
  });

  it("rejects file URLs in production", () => {
    process.env.NODE_ENV = "production";
    process.env.TURSO_DATABASE_URL = "file:./local.db";

    expect(resolveDatabaseConfig()).toBeNull();
  });

  it("masks turso host without exposing token", () => {
    expect(maskDatabaseUrl("libsql://my-db-name-org.turso.io")).toContain("turso.io");
  });
});
