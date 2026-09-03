/**
 * Pure evaluation helper for checking tier eligibility.
 * 'pro', 'growth', and 'enterprise' are granted access. 'starter' is blocked.
 * Safe to import in both Client Components and Server Components.
 */
export function isTierEligibleForGoogleAi(tier?: string | null): boolean {
  if (!tier) return false;
  const normalized = tier.toLowerCase().trim();
  return normalized === 'pro' || normalized === 'growth' || normalized === 'enterprise';
}
