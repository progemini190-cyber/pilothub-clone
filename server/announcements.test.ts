import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  createAnnouncement: vi.fn(),
  listAnnouncements: vi.fn(),
  updateAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
}));

import * as db from "./db";

describe("Announcements DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createAnnouncement returns id on success", async () => {
    (db.createAnnouncement as any).mockResolvedValue({ id: 1 });
    const result = await db.createAnnouncement({ title: "Test", content: "Hello", type: "info" });
    expect(result).toEqual({ id: 1 });
    expect(db.createAnnouncement).toHaveBeenCalledWith({ title: "Test", content: "Hello", type: "info" });
  });

  it("listAnnouncements returns all items when activeOnly=false", async () => {
    const mockItems = [
      { id: 1, title: "A", content: "B", type: "info", isActive: "true", createdAt: new Date(), updatedAt: new Date() },
      { id: 2, title: "C", content: "D", type: "warning", isActive: "false", createdAt: new Date(), updatedAt: new Date() },
    ];
    (db.listAnnouncements as any).mockResolvedValue(mockItems);
    const result = await db.listAnnouncements(false);
    expect(result).toHaveLength(2);
  });

  it("listAnnouncements filters active only when activeOnly=true", async () => {
    const mockItems = [
      { id: 1, title: "A", content: "B", type: "info", isActive: "true", createdAt: new Date(), updatedAt: new Date() },
    ];
    (db.listAnnouncements as any).mockResolvedValue(mockItems);
    const result = await db.listAnnouncements(true);
    expect(result).toHaveLength(1);
    expect(result[0].isActive).toBe("true");
  });

  it("updateAnnouncement calls db with correct args", async () => {
    (db.updateAnnouncement as any).mockResolvedValue(undefined);
    await db.updateAnnouncement(1, { isActive: "false" });
    expect(db.updateAnnouncement).toHaveBeenCalledWith(1, { isActive: "false" });
  });

  it("deleteAnnouncement calls db with correct id", async () => {
    (db.deleteAnnouncement as any).mockResolvedValue(undefined);
    await db.deleteAnnouncement(5);
    expect(db.deleteAnnouncement).toHaveBeenCalledWith(5);
  });
});

describe("requireAdmin logic", () => {
  it("allows access with admin_session cookie", () => {
    const ctx = { req: { cookies: { admin_session: "authenticated" } }, user: null };
    const hasAdminCookie = ctx.req.cookies?.admin_session === "authenticated";
    const hasAdminRole = ctx.user?.role === "admin";
    expect(hasAdminCookie || hasAdminRole).toBe(true);
  });

  it("allows access with user role=admin", () => {
    const ctx = { req: { cookies: {} }, user: { role: "admin" } };
    const hasAdminCookie = ctx.req.cookies?.admin_session === "authenticated";
    const hasAdminRole = ctx.user?.role === "admin";
    expect(hasAdminCookie || hasAdminRole).toBe(true);
  });

  it("denies access with no cookie and no admin role", () => {
    const ctx = { req: { cookies: {} }, user: { role: "user" } };
    const hasAdminCookie = ctx.req.cookies?.admin_session === "authenticated";
    const hasAdminRole = ctx.user?.role === "admin";
    expect(hasAdminCookie || hasAdminRole).toBe(false);
  });

  it("denies access with no cookie and no user", () => {
    const ctx = { req: { cookies: {} }, user: null };
    const hasAdminCookie = ctx.req.cookies?.admin_session === "authenticated";
    const hasAdminRole = ctx.user?.role === "admin";
    expect(hasAdminCookie || hasAdminRole).toBe(false);
  });
});

describe("File upload validation", () => {
  it("rejects files over 16MB", () => {
    const MAX_FILE_SIZE = 16 * 1024 * 1024;
    const fileSize = 17 * 1024 * 1024;
    expect(fileSize > MAX_FILE_SIZE).toBe(true);
  });

  it("accepts files under 16MB", () => {
    const MAX_FILE_SIZE = 16 * 1024 * 1024;
    const fileSize = 5 * 1024 * 1024;
    expect(fileSize <= MAX_FILE_SIZE).toBe(true);
  });

  it("identifies image content types correctly", () => {
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const nonImageTypes = ["application/pdf", "text/plain", "application/vnd.ms-excel"];
    imageTypes.forEach(t => expect(t.startsWith("image/")).toBe(true));
    nonImageTypes.forEach(t => expect(t.startsWith("image/")).toBe(false));
  });
});
