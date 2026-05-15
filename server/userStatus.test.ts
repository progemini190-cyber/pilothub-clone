import { describe, it, expect } from "vitest";
import {
  isApprovedUserStatus,
  isUserApproved,
  pickCanonicalUser,
} from "./_core/userStatus";
import type { User } from "../drizzle/schema";

const baseUser = (overrides: Partial<User>): User =>
  ({
    id: 1,
    openId: "app_test",
    role: "user",
    status: "active",
    email: "a@test.com",
    ...overrides,
  }) as User;

describe("userStatus", () => {
  it("treats legacy APPROVED and approved as approved", () => {
    expect(isApprovedUserStatus("APPROVED")).toBe(true);
    expect(isApprovedUserStatus("approved")).toBe(true);
    expect(isApprovedUserStatus("active")).toBe(true);
    expect(isApprovedUserStatus("pending")).toBe(false);
  });

  it("prefers active app_ user over pending google duplicate", () => {
    const pendingGoogle = baseUser({
      id: 99,
      openId: "google-sub",
      status: "pending",
      loginMethod: "google",
    });
    const activeApp = baseUser({
      id: 2,
      openId: "app_abc",
      status: "active",
      loginMethod: "application",
    });
    const picked = pickCanonicalUser([pendingGoogle, activeApp], "google-sub");
    expect(picked?.id).toBe(2);
    expect(isUserApproved(picked)).toBe(true);
  });
});
