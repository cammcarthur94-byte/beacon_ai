'use client';

import { useState } from 'react';
import {
  Bot,
  Building2,
  Check,
  Crown,
  Gauge,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICING_TIERS, ANNUAL_DISCOUNT_RATE, type PricingTier } from '@/lib/billing/plan-limits';

/**
 * BEACON PRICING TABLE (3 tiers — Basic / Starter / Pro)
 * ------------------------------------------------------
 * Client component with a Monthly ↔ Annual toggle (annual = 20% off).
 * The tier catalog lives in `@/lib/billing/plan-limits` so the marketing
 * surface and the server-side hard-cap enforcement can never drift apart.
 * Every CTA routes through /api/billing/checkout with the selected planId.
 */

const STANDARD_FEATURES = [
  '6 monitored LLMs (ChatGPT, Claude, Gemini, Copilot, Perplexity, Google AI Overviews)',
  'Free AI answer dataset',
  'Unlimited countries',
] as const;

type BillingCycle = 'monthly' | 'annual';

function formatLimit(value: number | null): string {
  return value === null ? 'Unlimited' : value.toLocaleString('en-US');
}

function monthlyEquivalentPrice(annualPrice: number): number {
  return Math.round(annualPrice / 12);
}

export { PRICING_TIERS, ANNUAL_DISCOUNT_RATE, type PricingTier } from '@/lib/billing/plan-limits';

export interface PricingTableProps {
  /** Optional custom handler for plan selection (e.g. auth modal, analytics, or custom checkout). */
  onSelectPlan?: (planId: PricingTier['id'], billingCycle: BillingCycle) => void | Promise<void>;
  className?: string;
}

export function PricingTable({ onSelectPlan, className }: PricingTableProps = {}) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  const isAnnual = billingCycle === 'annual';

  /**
   * Dispatches the selected planId and billingCycle to the provided handler
   * or defaults to Beacon's /api/billing/checkout Stripe subscription flow.
   */
  const handleSelectPlan = (planId: PricingTier['id']) => async () => {
    if (onSelectPlan) {
      await onSelectPlan(planId, billingCycle);
      return;
    }
    setPendingPlanId(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle }),
      });
      if (res.ok) {
        const { url } = (await res.json()) as { url?: string };
        if (url) {
          window.location.href = url; // Redirect to Stripe Checkout
          return;
        }
      }
      console.error('Checkout session could not be created.');
    } catch (err) {
      console.error('Checkout request failed:', err);
    } finally {
      setPendingPlanId(null);
    }
  };

  return (
    <section className={cn('w-full bg-white py-16 sm:py-20', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Beacon Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Choose the plan that matches your brand&apos;s growth
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            No free tier, no hidden limits on geography — pick a plan and start
            tracking your AI search visibility today.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="mt-10 flex items-center justify-center">
          <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 p-1">
            <button
              id="billing-cycle-monthly"
              type="button"
              onClick={() => setBillingCycle('monthly')}
              aria-pressed={!isAnnual}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer',
                !isAnnual
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              Monthly
            </button>
            <button
              id="billing-cycle-annual"
              type="button"
              onClick={() => setBillingCycle('annual')}
              aria-pressed={isAnnual}
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer',
                isAnnual
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              Annual
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Tier grid — stacks on mobile, 3 columns from md up */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {PRICING_TIERS.map((tier) => {
            const isRecommended = Boolean(tier.highlight);
            const price = isAnnual ? monthlyEquivalentPrice(tier.priceAnnual) : tier.priceMonthly;

            return (
              <div
                key={tier.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-white p-6 transition-shadow',
                  isRecommended
                    ? 'border-emerald-500 shadow-xl ring-1 ring-emerald-500/30 md:scale-[1.03]'
                    : 'border-zinc-200 shadow-sm hover:shadow-md'
                )}
              >
                {/* Recommended badge */}
                {isRecommended && (
                  <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                      <Crown className="h-3.5 w-3.5" />
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan name + audience */}
                <h3 className="text-lg font-bold text-zinc-950">{tier.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{tier.targetAudience}</p>

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-zinc-950">
                    ${price}
                  </span>
                  <span className="text-sm font-medium text-zinc-500">/ month</span>
                </div>
                {isAnnual ? (
                  <p className="mt-1 text-xs text-emerald-700">
                    ${tier.priceAnnual.toLocaleString('en-US')} billed annually —
                    save {Math.round(ANNUAL_DISCOUNT_RATE * 100)}%
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-zinc-400">Billed monthly, cancel anytime</p>
                )}

                {/* Account limits */}
                <div className="mt-6 space-y-2 rounded-xl bg-zinc-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-zinc-600">
                      <Building2 className="h-4 w-4 text-zinc-400" /> Brands
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {formatLimit(tier.limits.brands)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-zinc-600">
                      <Users className="h-4 w-4 text-zinc-400" /> User seats
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {formatLimit(tier.limits.seats)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-zinc-600">
                      <Gauge className="h-4 w-4 text-zinc-400" /> Custom prompts
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {formatLimit(tier.limits.customPrompts)}
                      <span className="text-xs font-normal text-zinc-400"> /mo</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-zinc-600">
                      <Bot className="h-4 w-4 text-zinc-400" /> Answers analyzed
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {formatLimit(tier.limits.answersAnalyzed)}
                      <span className="text-xs font-normal text-zinc-400"> /mo</span>
                    </span>
                  </div>
                </div>

                {/* Premium features */}
                {tier.premiumFeatures.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {tier.premiumFeatures.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check className="h-3 w-3 text-emerald-700" strokeWidth={3} />
                        </span>
                        <span className="font-medium text-zinc-900">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Standard features */}
                <ul className="mt-6 flex-1 space-y-2.5 border-t border-zinc-100 pt-5">
                  {STANDARD_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-zinc-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  id={`cta-plan-${tier.id}`}
                  type="button"
                  onClick={handleSelectPlan(tier.id)}
                  disabled={pendingPlanId === tier.id}
                  className={cn(
                    'mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70',
                    isRecommended
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                      : 'bg-zinc-950 text-white hover:bg-zinc-800'
                  )}
                >
                  {pendingPlanId === tier.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    tier.ctaLabel
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footnote */}
        <p className="mt-10 text-center text-xs text-zinc-500">
          All plans include the full 6-engine monitoring stack. Usage quotas
          reset at the start of each billing cycle and are enforced as strict
          hard caps.
        </p>
      </div>
    </section>
  );
}

export default PricingTable;
