import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hasTelegramCredits, isTelegramPlanActive } from "./db";
import {
  buildTelegramStartLink,
  resolveTelegramBizBotUsername,
  TELEGRAM_BOT_USERNAME_PLACEHOLDER,
} from "@shared/telegramConfig";
import { buildTelegramActivationLink, getTelegramBizBotUsername } from "./telegram";

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

  it("treats null plan expiry as active", () => {
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 20, planTypeBiz: "starter", planExpiryDate: null },
        "bizpilot",
      ),
    ).toBe(true);
  });

  it("denies when plan expiry date has passed", () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(isTelegramPlanActive(yesterday)).toBe(false);
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 20, planTypeBiz: "starter", planExpiryDate: yesterday },
        "bizpilot",
      ),
    ).toBe(false);
  });

  it("allows when plan expiry is in the future", () => {
    const nextMonth = new Date(Date.now() + 30 * 86400000);
    expect(isTelegramPlanActive(nextMonth)).toBe(true);
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 20, planTypeBiz: "starter", planExpiryDate: nextMonth },
        "bizpilot",
      ),
    ).toBe(true);
  });
});

describe("telegram bot username env", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    delete process.env.VITE_TELEGRAM_BOT_USERNAME;
    delete process.env.TELEGRAM_BIZPILOT_BOT_USERNAME;
    delete process.env.TELEGRAM_BIZ_BOT_USERNAME;
    delete process.env.TELEGRAM_BOT_USERNAME;
  });

  it("uses NEXT_PUBLIC_TELEGRAM_BOT_USERNAME for activation links", () => {
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = "@MyBizPilotBot";
    expect(resolveTelegramBizBotUsername(process.env)).toBe("MyBizPilotBot");
    expect(getTelegramBizBotUsername()).toBe("MyBizPilotBot");
    expect(buildTelegramActivationLink("tok123")).toBe(
      "https://t.me/MyBizPilotBot?start=tok123",
    );
    expect(buildTelegramStartLink("tok123", "MyBizPilotBot")).toBe(
      buildTelegramActivationLink("tok123"),
    );
  });

  it("falls back to placeholder when unset", () => {
    expect(getTelegramBizBotUsername()).toBe(TELEGRAM_BOT_USERNAME_PLACEHOLDER);
  });
});
