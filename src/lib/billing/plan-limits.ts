/**
 * BEACON PRICING ARCHITECTURE — SINGLE SOURCE OF TRUTH
 * ----------------------------------------------------
 * Kept free of React / "use client" so both the pricing UI, server actions,
 * API routes, and DB triggers can consume the exact same limits.
 *
 * There is intentionally NO free tier. Every workspace is a paid plan.
 */

export type BeaconPlanId = 'basic' | 'starter' | 'pro';

export type PlanFeature = {
  label: string;
  included: boolean;
};

export type PricingTier = {
  /** Stable identifier passed to auth + Stripe checkout. */
  id: BeaconPlanId;
  name: string;
  priceMonthly: number;
  /** Default catalog price, used when a billing cycle toggle is absent. */
  priceAnnual: number; // 20% off the monthly price, billed yearly
  targetAudience: string;
  description: string;
  ctaLabel: string;
  highlight?: boolean;
  limits: {
    brands: number | null; // null = unlimited
    seats: number | null; // null = unlimited
    /** Strict hard-cap on tracked custom prompts per month. */
    customPrompts: number;
    /** Strict hard-cap on AI answers analyzed per month. */
    answersAnalyzed: number;
  };
  premiumFeatures: string[];
  standardFeatures: string[];
};

/** Annual discount applied when the billing toggle is switched to yearly. */
export const ANNUAL_DISCOUNT_RATE = 0.2;

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 49,
    priceAnnual: Math.round(49 * 12 * (1 - ANNUAL_DISCOUNT_RATE)),
    targetAudience: 'Solo founders and brands',
    description: 'Everything a solo founder needs to see how AI engines rank their brand.',
    ctaLabel: 'Start Basic',
    limits: {
      brands: 1,
      seats: 1,
      customPrompts: 100,
      answersAnalyzed: 3000,
    },
    premiumFeatures: [],
    standardFeatures: [
      '6 monitored LLMs (ChatGPT, Claude, Gemini, Copilot, Perplexity, Google AI Overviews)',
      'Free AI answer dataset',
      'Unlimited countries',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 149,
    priceAnnual: Math.round(149 * 12 * (1 - ANNUAL_DISCOUNT_RATE)),
    targetAudience: 'Small agencies',
    description: 'Multi-brand tracking with team collaboration and exportable reporting.',
    ctaLabel: 'Upgrade to Starter',
    highlight: true,
    limits: {
      brands: 5,
      seats: 3,
      customPrompts: 450,
      answersAnalyzed: 13500,
    },
    premiumFeatures: ['Exportable reports', 'Team workspaces'],
    standardFeatures: [
      '6 monitored LLMs (ChatGPT, Claude, Gemini, Copilot, Perplexity, Google AI Overviews)',
      'Free AI answer dataset',
      'Unlimited countries',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 349,
    priceAnnual: Math.round(349 * 12 * (1 - ANNUAL_DISCOUNT_RATE)),
    targetAudience: 'Enterprise and large agencies',
    description: 'Full white-label intelligence suite with unlimited scale and priority support.',
    ctaLabel: 'Get Pro',
    limits: {
      brands: null,
      seats: null,
      customPrompts: 1050,
      answersAnalyzed: 31500,
    },
    premiumFeatures: [
      'White-label reporting',
      'E-commerce catalog integrations',
      'Priority support',
    ],
    standardFeatures: [
      '6 monitored LLMs (ChatGPT, Claude, Gemini, Copilot, Perplexity, Google AI Overviews)',
      'Free AI answer dataset',
      'Unlimited countries',
    ],
  },
];

export function getPlan(planId: string): PricingTier | undefined {
  return PRICING_TIERS.find((tier) => tier.id === planId);
}

/**
 * Map the public marketing plan names onto the platform billing tier enum
 * (legacy workspaces still carry 'starter' | 'pro' | 'growth' | 'enterprise').
 * 'basic' is new — it intentionally has NO legacy alias.
 */
export const PLAN_TO_TIER: Record<BeaconPlanId, string> = {
  basic: 'basic',
  starter: 'starter',
  pro: 'pro',
};

export type UsageQuotaCheck =
  | { allowed: true; remaining: number }
  | { allowed: false; used: number; limit: number; reason: string };

/** Pure check — safe on client and server. `used` is the current-cycle count. */
export function checkPromptQuota(planId: string, used: number): UsageQuotaCheck {
  const plan = getPlan(planId);
  if (!plan) {
    return { allowed: false, used, limit: 0, reason: 'Unknown billing plan.' };
  }
  const limit = plan.limits.customPrompts;
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Monthly prompt limit reached (${used}/${limit} on the ${plan.name} plan). Upgrade to track more prompts.`,
    };
  }
  return { allowed: true, remaining: limit - used };
}

/** Pure check — safe on client and server. `used` is the current-cycle count. */
export function checkAnswersQuota(planId: string, used: number): UsageQuotaCheck {
  const plan = getPlan(planId);
  if (!plan) {
    return { allowed: false, used, limit: 0, reason: 'Unknown billing plan.' };
  }
  const limit = plan.limits.answersAnalyzed;
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Monthly answer-analysis limit reached (${used}/${limit} on the ${plan.name} plan). Upgrade to analyze more answers.`,
    };
  }
  return { allowed: true, remaining: limit - used };
}

/** Pure check — enforces brand-count limits when creating a project/brand. */
export function checkBrandQuota(planId: string, used: number): UsageQuotaCheck {
  const plan = getPlan(planId);
  if (!plan) {
    return { allowed: false, used, limit: 0, reason: 'Unknown billing plan.' };
  }
  const limit = plan.limits.brands;
  if (limit !== null && used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Your ${plan.name} plan includes ${limit} brand${limit === 1 ? '' : 's'}. Upgrade to add more brands.`,
    };
  }
  return { allowed: true, remaining: limit === null ? Infinity : limit - used };
}

/** Pure check — enforces seat limits when inviting team members. */
export function checkSeatQuota(planId: string, used: number): UsageQuotaCheck {
  const plan = getPlan(planId);
  if (!plan) {
    return { allowed: false, used, limit: 0, reason: 'Unknown billing plan.' };
  }
  const limit = plan.limits.seats;
  if (limit !== null && used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Your ${plan.name} plan includes ${limit} user seat${limit === 1 ? '' : 's'}. Upgrade to invite more teammates.`,
    };
  }
  return { allowed: true, remaining: limit === null ? Infinity : limit - used };
}

/** Human-readable usage summary for meters and upgrade prompts. */
export function getQuotaSummary(planId: string, promptsUsed: number, answersUsed: number) {
  const plan = getPlan(planId);
  if (!plan) return null;
  return {
    planName: plan.name,
    prompts: {
      used: promptsUsed,
      limit: plan.limits.customPrompts,
      percent: Math.min(100, Math.round((promptsUsed / plan.limits.customPrompts) * 100)),
    },
    answers: {
      used: answersUsed,
      limit: plan.limits.answersAnalyzed,
      percent: Math.min(100, Math.round((answersUsed / plan.limits.answersAnalyzed) * 100)),
    },
  };
}
