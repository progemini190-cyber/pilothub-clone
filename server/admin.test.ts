import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(adminCookie?: string): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: adminCookie ? { admin_session: adminCookie } : {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("admin.login", () => {
  it("rejects invalid credentials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.login({ username: "wrong", password: "wrong" })
    ).rejects.toThrow();
  });

  it("accepts valid credentials (default admin/pilothub2026)", async () => {
    // Override env for test
    const originalUser = process.env.ADMIN_USERNAME;
    const originalPass = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "pilothub2026";

    const cookiesSaved: Array<{ name: string; value: string }> = [];
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
        cookies: {},
      } as TrpcContext["req"],
      res: {
        cookie: (name: string, value: string) => {
          cookiesSaved.push({ name, value });
        },
        clearCookie: () => {},
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.login({ username: "admin", password: "pilothub2026" });

    expect(result.success).toBe(true);
    expect(cookiesSaved.some(c => c.name === "admin_session")).toBe(true);

    // Restore env
    if (originalUser !== undefined) process.env.ADMIN_USERNAME = originalUser;
    else delete process.env.ADMIN_USERNAME;
    if (originalPass !== undefined) process.env.ADMIN_PASSWORD = originalPass;
    else delete process.env.ADMIN_PASSWORD;
  });
});

describe("admin.isAuthenticated", () => {
  it("returns false without admin cookie", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.isAuthenticated();
    expect(result.authenticated).toBe(false);
  });

  it("returns true with valid admin cookie", async () => {
    const ctx = createPublicContext("authenticated");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.isAuthenticated();
    expect(result.authenticated).toBe(true);
  });
});

describe("admin.logout", () => {
  it("clears admin_session cookie", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
        cookies: { admin_session: "authenticated" },
      } as TrpcContext["req"],
      res: {
        cookie: () => {},
        clearCookie: (name: string) => {
          clearedCookies.push(name);
        },
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.logout();

    expect(result.success).toBe(true);
    expect(clearedCookies).toContain("admin_session");
  });
});
