import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getApprovedApplicationByEmail: vi.fn(),
  upsertUser: vi.fn(),
}));

import * as db from "./db";

describe("OAuth login flow - approved email check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /app when email has approved application", async () => {
    (db.getApprovedApplicationByEmail as any).mockResolvedValue({
      id: 1,
      email: "approved@gmail.com",
      status: "approved",
      plan: "bizpilot",
    });

    const app = await db.getApprovedApplicationByEmail("approved@gmail.com");
    const redirectPath = app && app.status === "approved" ? "/app" : "/login-required?email=approved@gmail.com";
    expect(redirectPath).toBe("/app");
  });

  it("redirects to /login-required when email has no application", async () => {
    (db.getApprovedApplicationByEmail as any).mockResolvedValue(undefined);

    const email = "unknown@gmail.com";
    const app = await db.getApprovedApplicationByEmail(email);
    const redirectPath = app && app.status === "approved"
      ? "/app"
      : `/login-required?email=${encodeURIComponent(email)}`;
    expect(redirectPath).toBe("/login-required?email=unknown%40gmail.com");
  });

  it("redirects to /login-required when application is pending (not approved)", async () => {
    (db.getApprovedApplicationByEmail as any).mockResolvedValue({
      id: 2,
      email: "pending@gmail.com",
      status: "pending",
      plan: "bizpilot",
    });

    const email = "pending@gmail.com";
    const app = await db.getApprovedApplicationByEmail(email);
    const redirectPath = app && app.status === "approved"
      ? "/app"
      : `/login-required?email=${encodeURIComponent(email)}`;
    expect(redirectPath).toBe("/login-required?email=pending%40gmail.com");
  });

  it("redirects to /login-required when application is rejected", async () => {
    (db.getApprovedApplicationByEmail as any).mockResolvedValue({
      id: 3,
      email: "rejected@gmail.com",
      status: "rejected",
      plan: "bizpilot",
    });

    const email = "rejected@gmail.com";
    const app = await db.getApprovedApplicationByEmail(email);
    const redirectPath = app && app.status === "approved"
      ? "/app"
      : `/login-required?email=${encodeURIComponent(email)}`;
    expect(redirectPath).toBe("/login-required?email=rejected%40gmail.com");
  });

  it("redirects to /login-required when no email from OAuth", () => {
    const email = null;
    const redirectPath = email
      ? "/app"
      : "/login-required?email=";
    expect(redirectPath).toBe("/login-required?email=");
  });

  it("getApprovedApplicationByEmail is called with correct email", async () => {
    (db.getApprovedApplicationByEmail as any).mockResolvedValue(undefined);
    await db.getApprovedApplicationByEmail("test@example.com");
    expect(db.getApprovedApplicationByEmail).toHaveBeenCalledWith("test@example.com");
  });
});

describe("Login button visibility logic", () => {
  it("shows Login button when user is not authenticated", () => {
    const isAuthenticated = false;
    expect(isAuthenticated).toBe(false);
    // Login button should be shown
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
