import { describe, it, expect } from "vitest";
import { sendEmail } from "./emailHelper";

describe("emailHelper", () => {
  it("should return false gracefully when GMAIL credentials are not set", async () => {
    // Save and clear env vars
    const origUser = process.env.GMAIL_USER;
    const origPass = process.env.GMAIL_APP_PASSWORD;
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      text: "Test email",
    });

    // Restore env vars
    if (origUser) process.env.GMAIL_USER = origUser;
    if (origPass) process.env.GMAIL_APP_PASSWORD = origPass;

    expect(result).toBe(false);
  });

  it("should have sendEmail function exported", () => {
    expect(typeof sendEmail).toBe("function");
  });
});
