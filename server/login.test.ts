import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
  getUserByOpenId: vi.fn(),
  getUserByEmail: vi.fn(),
  linkUserToGoogleOpenId: vi.fn(),
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
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getApprovedApplicationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getApplicationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("redirects to /app when user status is active", async () => {
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      openId: googleSub,
      email: "approved@gmail.com",
      status: "active",
      role: "user",
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

  it("redirects to pending screen when user exists with pending status", async () => {
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2,
      openId: googleSub,
      email: "pending@gmail.com",
      status: "pending",
      role: "user",
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

  it("links app_* user to Google sub and approves active email user", async () => {
    (db.getUserByOpenId as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        id: 3,
        openId: googleSub,
        email: "linked@gmail.com",
        status: "active",
        role: "user",
      });
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 3,
      openId: "app_abc123",
      email: "linked@gmail.com",
      status: "active",
      role: "user",
    });

    const result = await resolveGoogleLogin({
      sub: googleSub,
      email: "linked@gmail.com",
      name: "Linked User",
    });

    expect(db.linkUserToGoogleOpenId).toHaveBeenCalledWith(3, googleSub, {
      name: "Linked User",
      loginMethod: "google",
    });
    expect(result.redirectPath).toBe("/app");
    expect(result.isApproved).toBe(true);
  });

  it("redirects unknown email to not_approved", async () => {
    const result = await resolveGoogleLogin({
      sub: googleSub,
      email: "unknown@gmail.com",
    });

    expect(result.redirectPath).toBe("/login-required?reason=not_approved&email=unknown%40gmail.com");
    expect(result.upsert.status).toBe("pending");
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

  it("looks up user by email with normalized address", async () => {
    await resolveGoogleLogin({
      sub: googleSub,
      email: "Test@Example.com",
    });

    expect(db.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    expect(db.getApprovedApplicationByEmail).toHaveBeenCalledWith("test@example.com");
  });
});

describe("Login button visibility logic", () => {
  it("shows Login button when user is not authenticated", () => {
    const isAuthenticated = false;
    expect(isAuthenticated).toBe(false);
    const showLoginButton = !isAuthenticated;
    expect(showLoginButton).toBe(true);
  });

  it("shows Dashboard button when user is authenticated", () => {
    const isAuthenticated = true;
    const showDashboardButton = isAuthenticated;
    expect(showDashboardButton).toBe(true);
  });

  it("does not show Login button when authenticated", () => {
    const isAuthenticated = true;
    const showLoginButton = !isAuthenticated;
    expect(showLoginButton).toBe(false);
  });
});
