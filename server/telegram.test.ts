import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hasTelegramCredits, isTelegramPlanActive } from "./db";
import {
  buildTelegramStartLink,
  resolveTelegramBizBotUsername,
  TELEGRAM_BOT_USERNAME_PLACEHOLDER,
} from "@shared/telegramConfig";
import {
  buildTelegramActivationLink,
  getTelegramBizBotUsername,
  getTelegramBotToken,
  isFounderAdvisorQuery,
} from "./telegram";
import {
  resolveTelegramActivationBotUsername,
  resolveTelegramFounderBotUsername,
} from "@shared/telegramConfig";

describe("hasTelegramCredits", () => {
  it("allows when limit > 0 regardless of website planType", () => {
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 20, planExpiryDate: null },
        "bizpilot",
      ),
    ).toBe(true);
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 5, planExpiryDate: null },
        "bizpilot",
      ),
    ).toBe(true);
    expect(
      hasTelegramCredits(
        { founderMessageLimit: 999999, planExpiryDate: null },
        "founderpilot",
      ),
    ).toBe(true);
  });

  it("denies when limit is zero", () => {
    expect(
      hasTelegramCredits({ bizMessageLimit: 0, planExpiryDate: null }, "bizpilot"),
    ).toBe(false);
  });

  it("coerces string limits from the database", () => {
    expect(
      hasTelegramCredits(
        { bizMessageLimit: "15" as unknown as number, planExpiryDate: null },
        "bizpilot",
      ),
    ).toBe(true);
  });

  it("treats null plan expiry as active", () => {
    expect(
      hasTelegramCredits({ bizMessageLimit: 20, planExpiryDate: null }, "bizpilot"),
    ).toBe(true);
    expect(isTelegramPlanActive(null)).toBe(true);
  });

  it("denies when plan expiry date has passed", () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(isTelegramPlanActive(yesterday)).toBe(false);
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 20, planExpiryDate: yesterday },
        "bizpilot",
      ),
    ).toBe(false);
  });

  it("treats unix seconds timestamps as ms when value is small enough", () => {
    const futureSec = Math.floor(Date.now() / 1000) + 86400 * 365;
    expect(isTelegramPlanActive(futureSec)).toBe(true);
    const pastSec = Math.floor(Date.now() / 1000) - 86400;
    expect(isTelegramPlanActive(pastSec)).toBe(false);
  });

  it("allows when plan expiry is in the future", () => {
    const nextMonth = new Date(Date.now() + 30 * 86400000);
    expect(isTelegramPlanActive(nextMonth)).toBe(true);
    expect(
      hasTelegramCredits(
        { bizMessageLimit: 20, planExpiryDate: nextMonth },
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

  it("uses NEXT_PUBLIC_TELEGRAM_FOUNDERPILOT_USERNAME for founder activation links", () => {
    process.env.NEXT_PUBLIC_TELEGRAM_FOUNDERPILOT_USERNAME = "@FounderPilotBot";
    expect(resolveTelegramFounderBotUsername(process.env)).toBe("FounderPilotBot");
    expect(
      buildTelegramActivationLink("tok456", undefined, "founderpilot"),
    ).toBe("https://t.me/FounderPilotBot?start=tok456");
    expect(
      resolveTelegramActivationBotUsername(process.env, "founderpilot"),
    ).toBe("FounderPilotBot");
  });
});

describe("telegram webhook token routing", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  beforeEach(() => {
    process.env.TELEGRAM_BIZPILOT_TOKEN = "biz-token";
    process.env.TELEGRAM_FOUNDERPILOT_TOKEN = "founder-token";
    delete process.env.TELEGRAM_BIZ_BOT_TOKEN;
    delete process.env.TELEGRAM_FOUNDER_BOT_TOKEN;
  });

  it("routes founder advisor query to TELEGRAM_FOUNDERPILOT_TOKEN", () => {
    expect(isFounderAdvisorQuery("founderpilot")).toBe(true);
    expect(isFounderAdvisorQuery("founder")).toBe(true);
    expect(getTelegramBotToken("founderpilot")).toBe("founder-token");
    expect(getTelegramBotToken("bizpilot")).toBe("biz-token");
    expect(getTelegramBotToken(undefined)).toBe("biz-token");
  });
});
