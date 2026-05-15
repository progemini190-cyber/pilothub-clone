import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
  resolveUserForGoogleLogin: vi.fn(),
  getApprovedApplicationByEmail: vi.fn(),
  getApplicationByEmail: vi.fn(),
  upsertUser: vi.fn(),
}));

import * as db from "./db";
import { resolveGoogleLogin } from "./_core/googleLogin";

const googleSub = "google-sub-123";

describe("resolveGoogleLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.resolveUserForGoogleLogin as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: undefined,
      byOpenId: undefined,
      byEmail: [],
    });
    (db.getApprovedApplicationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getApplicationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("redirects to /app when user status is active", async () => {
    (db.resolveUserForGoogleLogin as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: 1,
        openId: googleSub,
        email: "approved@gmail.com",
        status: "active",
        role: "user",
      },
      byOpenId: { id: 1 },
      byEmail: [],
    });

    const result = await resolveGoogleLogin({
      sub: googleSub,
      email: "approved@gmail.com",
      name: "Approved User",
    });

    expect(result.redirectPath).toBe("/app");
    expect(result.isApproved).toBe(true);
    expect(result.upsert.status).toBeUndefined();
  });

  it("redirects to /app for legacy APPROVED status", async () => {
    (db.resolveUserForGoogleLogin as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: 5,
        openId: "app_legacy",
        email: "legacy@gmail.com",
        status: "APPROVED",
        role: "user",
      },
      byOpenId: undefined,
      byEmail: [{ id: 5, status: "APPROVED" }],
    });

    const result = await resolveGoogleLogin({
      sub: googleSub,
      email: "legacy@gmail.com",
    });

    expect(result.redirectPath).toBe("/app");
    expect(result.isApproved).toBe(true);
  });

  it("redirects to pending screen when user exists with pending status", async () => {
    (db.resolveUserForGoogleLogin as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: 2,
        openId: googleSub,
        email: "pending@gmail.com",
        status: "pending",
        role: "user",
      },
      byOpenId: { id: 2 },
      byEmail: [],
    });
    (db.getApplicationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      email: "pending@gmail.com",
      status: "pending",
    });

    const result = await resolveGoogleLogin({
      sub: googleSub,
      email: "pending@gmail.com",
    });

    expect(result.redirectPath).toBe("/login-required?reason=pending&email=pending%40gmail.com");
    expect(result.isApproved).toBe(false);
  });

  it("promotes ADMIN_EMAIL to admin and approves dashboard access", async () => {
    const result = await resolveGoogleLogin({
      sub: googleSub,
      email: "progemini190@gmail.com",
      name: "Admin User",
    });

    expect(result.redirectPath).toBe("/app");
    expect(result.isApproved).toBe(true);
    expect(result.upsert.role).toBe("admin");
    expect(result.upsert.status).toBe("active");
  });

  it("approves via approved application when no user row yet", async () => {
    (db.getApprovedApplicationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 5,
      email: "app@gmail.com",
      status: "approved",
    });

    const result = await resolveGoogleLogin({
      sub: googleSub,
      email: "app@gmail.com",
    });

    expect(result.redirectPath).toBe("/app");
    expect(result.isApproved).toBe(true);
    expect(result.upsert.status).toBe("active");
  });

  it("calls resolveUserForGoogleLogin with normalized email and sub", async () => {
    await resolveGoogleLogin({
      sub: googleSub,
      email: "Test@Example.com",
    });

    expect(db.resolveUserForGoogleLogin).toHaveBeenCalledWith("test@example.com", googleSub);
  });
});
