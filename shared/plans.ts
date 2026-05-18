/** Canonical admin / billing plan keys stored on `users.plan`. */
export const ADMIN_PLAN_OPTIONS = [
  { value: "", label: "No Plan" },
  { value: "bizpilot-starter", label: "BizPilot Starter" },
  { value: "bizpilot-pro", label: "BizPilot Pro" },
  { value: "founderpilot-starter", label: "FounderPilot Starter" },
  { value: "founderpilot-pro", label: "FounderPilot Pro" },
] as const;

export type AdminPlanKey = (typeof ADMIN_PLAN_OPTIONS)[number]["value"];

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  "": "No Plan",
  free: "Free Trial",
  bizpilot: "BizPilot Pro",
  "bizpilot-starter": "BizPilot Starter",
  "bizpilot-pro": "BizPilot Pro",
  founderpilot: "FounderPilot Pro",
  "founderpilot-starter": "FounderPilot Starter",
  "founderpilot-pro": "FounderPilot Pro",
};

export function getPlanDisplayName(planKey: string | null | undefined): string {
  if (!planKey) return "No Plan";
  const key = planKey.toLowerCase().trim();
  return PLAN_DISPLAY_NAMES[key] ?? planKey;
}

export function parsePlanKey(planKey: string | null | undefined): {
  advisor: "bizpilot" | "founderpilot" | null;
  tier: "free" | "starter" | "pro";
} {
  const p = (planKey ?? "").toLowerCase().trim();
  if (!p || p === "free") return { advisor: null, tier: "free" };

  if (p.includes("founder")) {
    if (p.includes("starter")) return { advisor: "founderpilot", tier: "starter" };
    return { advisor: "founderpilot", tier: "pro" };
  }
  if (p.includes("biz")) {
    if (p.includes("starter")) return { advisor: "bizpilot", tier: "starter" };
    return { advisor: "bizpilot", tier: "pro" };
  }
  return { advisor: null, tier: "free" };
}

/** Any active paid subscription (not free trial). */
export function hasAnyActivePaidPlan(
  plan: string | null | undefined,
  status: string | null | undefined,
): boolean {
  const st = (status ?? "active").toLowerCase().trim();
  if (st !== "active") return false;
  return parsePlanKey(plan).tier !== "free";
}

export function isProTierPlan(planKey: string | null | undefined): boolean {
  return parsePlanKey(planKey).tier === "pro";
}
