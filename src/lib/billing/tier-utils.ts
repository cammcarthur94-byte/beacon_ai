/**
 * Pure evaluation helpers for checking tier eligibility and plan quotas.
 * Safe to import in both Client Components and Server Components.
 */

export type AppBillingTier = 'starter' | 'pro' | 'enterprise';

export function normalizeTier(tier?: string | null): AppBillingTier {
  if (!tier) return 'starter';
  const normalized = tier.toLowerCase().trim();
  if (normalized === 'pro' || normalized === 'growth') return 'pro';
  if (normalized === 'enterprise') return 'enterprise';
  return 'starter';
}

/**
 * 'pro', 'growth', and 'enterprise' are granted Google AI Overviews access. 'starter' is blocked.
 */
export function isTierEligibleForGoogleAi(tier?: string | null): boolean {
  const norm = normalizeTier(tier);
  return norm === 'pro' || norm === 'enterprise';
}

/**
 * Monthly scheduled prompt audit quota limits:
 * - Starter: 20
 * - Pro: 100
 * - Enterprise: 500
 */
export function getTierAuditLimit(tier?: string | null): number {
  const norm = normalizeTier(tier);
  switch (norm) {
    case 'enterprise':
      return 500;
    case 'pro':
      return 100;
    case 'starter':
    default:
      return 20;
  }
}

/**
 * Team member seat limits:
 * - Starter: 1 user (owner only)
 * - Pro: 3 members
 * - Enterprise: 9999 (unlimited)
 */
export function getTierTeamSeatLimit(tier?: string | null): number {
  const norm = normalizeTier(tier);
  switch (norm) {
    case 'enterprise':
      return 9999;
    case 'pro':
      return 3;
    case 'starter':
    default:
      return 1;
  }
}

/**
 * Check if the workspace can invite another member based on its tier limit.
 */
export function canInviteTeamMember(tier?: string | null, currentMemberCount = 1): boolean {
  const limit = getTierTeamSeatLimit(tier);
  return currentMemberCount < limit;
}
