export type OnboardingUserFields = {
  name?: string | null;
  useCase?: string | null;
  onboardingCompletedAt?: Date | number | null;
  role?: string | null;
};

/** True when the user must complete /onboarding (missing name or purpose). */
export function userNeedsOnboarding(
  user: OnboardingUserFields | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return false;
  if (user.onboardingCompletedAt) return false;
  const name = (user.name ?? "").trim();
  const purpose = (user.useCase ?? "").trim();
  return !name || !purpose;
}
