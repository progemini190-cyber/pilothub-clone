import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAdminEmails, isAdminEmail, shouldGrantAdminRole } from "./_core/adminAccess";

describe("adminAccess", () => {
  const originalAdminEmail = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    process.env.ADMIN_EMAIL = "";
  });

  afterEach(() => {
    if (originalAdminEmail === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = originalAdminEmail;
    }
  });

  it("includes default admin email", () => {
    expect(getAdminEmails()).toContain("progemini190@gmail.com");
    expect(isAdminEmail("ProGemini190@Gmail.com")).toBe(true);
  });

  it("includes emails from ADMIN_EMAIL env", () => {
    process.env.ADMIN_EMAIL = "ops@example.com, other@test.com";
    expect(isAdminEmail("ops@example.com")).toBe(true);
    expect(isAdminEmail("other@test.com")).toBe(true);
  });

  it("grants admin for owner google sub", () => {
    expect(
      shouldGrantAdminRole({
        googleSub: "owner-sub",
        ownerGoogleSub: "owner-sub",
      }),
    ).toBe(true);
  });
});
