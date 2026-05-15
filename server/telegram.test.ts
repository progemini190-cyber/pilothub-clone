import { describe, it, expect } from "vitest";
import { hasTelegramCredits } from "./db";

describe("hasTelegramCredits", () => {
  it("denies free-tier users even with default website limits", () => {
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 5, planTypeBiz: "free" },
        "bizpilot",
      ),
    ).toBe(false);
    expect(
      hasTelegramCredits(
        { founderMessageLimit: 5, planTypeFounder: "free" },
        "founderpilot",
      ),
    ).toBe(false);
  });

  it("allows paid users with remaining limit", () => {
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 20, planTypeBiz: "starter" },
        "bizpilot",
      ),
    ).toBe(true);
    expect(
      hasTelegramCredits(
        { founderMessageLimit: 999999, planTypeFounder: "pro" },
        "founderpilot",
      ),
    ).toBe(true);
  });

  it("denies when limit is zero", () => {
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 0, planTypeBiz: "pro" },
        "bizpilot",
      ),
    ).toBe(false);
  });
});
