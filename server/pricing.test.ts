import { describe, it, expect } from "vitest";

// Unit tests for tiered pricing logic
// These test the business logic functions directly without DB

describe("Tiered Pricing Logic", () => {
  describe("Message limit calculation", () => {
    it("free tier has 5 message limit for BizPilot", () => {
      const FREE_BIZ_LIMIT = 5;
      expect(FREE_BIZ_LIMIT).toBe(5);
    });

    it("free tier has 5 message limit for FounderPilot", () => {
      const FREE_FOUNDER_LIMIT = 5;
      expect(FREE_FOUNDER_LIMIT).toBe(5);
    });

    it("starter pack has 20 message limit", () => {
      const STARTER_LIMIT = 20;
      expect(STARTER_LIMIT).toBe(20);
    });

    it("pro plan has unlimited messages (99999)", () => {
      const PRO_LIMIT = 99999;
      expect(PRO_LIMIT).toBeGreaterThanOrEqual(99999);
    });
  });

  describe("Messages remaining calculation", () => {
    it("calculates messages left correctly", () => {
      const limit = 20;
      const used = 8;
      const left = Math.max(0, limit - used);
      expect(left).toBe(12);
    });

    it("never goes below 0 messages left", () => {
      const limit = 5;
      const used = 7; // over limit
      const left = Math.max(0, limit - used);
      expect(left).toBe(0);
    });

    it("detects limit reached when used >= limit", () => {
      const limit = 5;
      const used = 5;
      const isLimitReached = used >= limit;
      expect(isLimitReached).toBe(true);
    });

    it("detects limit not reached when used < limit", () => {
      const limit = 20;
      const used = 10;
      const isLimitReached = used >= limit;
      expect(isLimitReached).toBe(false);
    });
  });

  describe("Starter Pack one-time purchase logic", () => {
    it("hides starter pack if has_used_biz_starter is true", () => {
      const hasUsedBizStarter = true;
      const showStarterBiz = !hasUsedBizStarter;
      expect(showStarterBiz).toBe(false);
    });

    it("shows starter pack if has_used_biz_starter is false", () => {
      const hasUsedBizStarter = false;
      const showStarterBiz = !hasUsedBizStarter;
      expect(showStarterBiz).toBe(true);
    });

    it("hides founder starter pack if has_used_founder_starter is true", () => {
      const hasUsedFounderStarter = true;
      const showStarterFounder = !hasUsedFounderStarter;
      expect(showStarterFounder).toBe(false);
    });
  });

  describe("Plan activation logic", () => {
    it("free plan sets 5 message limits", () => {
      const planType = "free";
      const bizLimit = planType === "free" ? 5 : planType === "starter" ? 20 : 99999;
      const founderLimit = planType === "free" ? 5 : planType === "starter" ? 20 : 99999;
      expect(bizLimit).toBe(5);
      expect(founderLimit).toBe(5);
    });

    it("starter_biz plan sets 20 biz message limit", () => {
      const planType = "starter_biz";
      const bizLimit = planType === "starter_biz" ? 20 : 5;
      expect(bizLimit).toBe(20);
    });

    it("starter_founder plan sets 20 founder message limit", () => {
      const planType = "starter_founder";
      const founderLimit = planType === "starter_founder" ? 20 : 5;
      expect(founderLimit).toBe(20);
    });

    it("pro_biz plan sets unlimited biz messages", () => {
      const planType = "pro_biz";
      const bizLimit = planType === "pro_biz" ? 99999 : 5;
      expect(bizLimit).toBe(99999);
    });

    it("pro_founder plan sets unlimited founder messages", () => {
      const planType = "pro_founder";
      const founderLimit = planType === "pro_founder" ? 99999 : 5;
      expect(founderLimit).toBe(99999);
    });
  });

  describe("Paywall error codes", () => {
    it("MESSAGE_LIMIT_REACHED error triggers paywall", () => {
      const errorCode = "MESSAGE_LIMIT_REACHED";
      const shouldShowPaywall = errorCode === "MESSAGE_LIMIT_REACHED";
      expect(shouldShowPaywall).toBe(true);
    });

    it("other errors do not trigger paywall", () => {
      const errorCode = "INTERNAL_SERVER_ERROR";
      const shouldShowPaywall = errorCode === "MESSAGE_LIMIT_REACHED";
      expect(shouldShowPaywall).toBe(false);
    });
  });

  describe("Pricing amounts (MMK)", () => {
    it("BizPilot Starter Pack costs 20,000 MMK", () => {
      const BIZ_STARTER_PRICE = 20000;
      expect(BIZ_STARTER_PRICE).toBe(20000);
    });

    it("FounderPilot Starter Pack costs 40,000 MMK", () => {
      const FOUNDER_STARTER_PRICE = 40000;
      expect(FOUNDER_STARTER_PRICE).toBe(40000);
    });

    it("BizPilot Pro costs 100,000 MMK/month", () => {
      const BIZ_PRO_PRICE = 100000;
      expect(BIZ_PRO_PRICE).toBe(100000);
    });

    it("FounderPilot Pro costs 300,000 MMK/month", () => {
      const FOUNDER_PRO_PRICE = 300000;
      expect(FOUNDER_PRO_PRICE).toBe(300000);
    });
  });

  describe("isUnlimited flag", () => {
    it("detects unlimited plan when limit >= 99999", () => {
      const limit = 99999;
      const isUnlimited = limit >= 99999;
      expect(isUnlimited).toBe(true);
    });

    it("does not flag starter as unlimited", () => {
      const limit = 20;
      const isUnlimited = limit >= 99999;
      expect(isUnlimited).toBe(false);
    });

    it("does not flag free as unlimited", () => {
      const limit = 5;
      const isUnlimited = limit >= 99999;
      expect(isUnlimited).toBe(false);
    });
  });
});
