import { describe, it, expect } from 'vitest';
import {
  PRICING_TIERS,
  getPlan,
  checkPromptQuota,
  checkAnswersQuota,
  checkBrandQuota,
  checkSeatQuota,
  getQuotaSummary,
  ANNUAL_DISCOUNT_RATE,
} from '@/lib/billing/plan-limits';

describe('plan-limits (Beacon 3-tier architecture)', () => {
  describe('tier catalog', () => {
    it('exposes exactly basic, starter, and pro — no free tier', () => {
      expect(PRICING_TIERS.map((t) => t.id)).toEqual(['basic', 'starter', 'pro']);
      expect(getPlan('free')).toBeUndefined();
    });

    it('matches the published Beacon price points', () => {
      expect(getPlan('basic')!.priceMonthly).toBe(49);
      expect(getPlan('starter')!.priceMonthly).toBe(149);
      expect(getPlan('pro')!.priceMonthly).toBe(349);
    });

    it('matches the published account limits', () => {
      expect(getPlan('basic')!.limits).toMatchObject({ brands: 1, seats: 1 });
      expect(getPlan('starter')!.limits).toMatchObject({ brands: 5, seats: 3 });
      expect(getPlan('pro')!.limits).toMatchObject({ brands: null, seats: null });
    });

    it('matches the published usage quotas (strict hard caps)', () => {
      expect(getPlan('basic')!.limits.customPrompts).toBe(100);
      expect(getPlan('basic')!.limits.answersAnalyzed).toBe(3000);
      expect(getPlan('starter')!.limits.customPrompts).toBe(450);
      expect(getPlan('starter')!.limits.answersAnalyzed).toBe(13500);
      expect(getPlan('pro')!.limits.customPrompts).toBe(1050);
      expect(getPlan('pro')!.limits.answersAnalyzed).toBe(31500);
    });

    it('computes annual prices at 20% off the yearly total', () => {
      for (const tier of PRICING_TIERS) {
        const expected = Math.round(tier.priceMonthly * 12 * (1 - ANNUAL_DISCOUNT_RATE));
        expect(tier.priceAnnual).toBe(expected);
      }
      expect(getPlan('basic')!.priceAnnual).toBe(470);
      expect(getPlan('starter')!.priceAnnual).toBe(1430);
      expect(getPlan('pro')!.priceAnnual).toBe(3350);
    });

    it('marks only Starter as the recommended tier', () => {
      expect(PRICING_TIERS.filter((t) => t.highlight).map((t) => t.id)).toEqual(['starter']);
    });
  });

  describe('checkPromptQuota — strict hard cap', () => {
    it('allows the 100th prompt on Basic but physically blocks the 101st', () => {
      expect(checkPromptQuota('basic', 99)).toEqual({ allowed: true, remaining: 1 });
      const blocked = checkPromptQuota('basic', 100);
      expect(blocked.allowed).toBe(false);
      if (!blocked.allowed) {
        expect(blocked.used).toBe(100);
        expect(blocked.limit).toBe(100);
        expect(blocked.reason).toMatch(/\(100\/100 on the Basic plan\)/i);
      }
    });

    it('enforces Starter (450) and Pro (1,050) prompt caps', () => {
      expect(checkPromptQuota('starter', 449).allowed).toBe(true);
      expect(checkPromptQuota('starter', 450).allowed).toBe(false);
      expect(checkPromptQuota('pro', 1049).allowed).toBe(true);
      expect(checkPromptQuota('pro', 1050).allowed).toBe(false);
    });
  });

  describe('checkAnswersQuota — strict hard cap', () => {
    it('allows the 3,000th answer on Basic but physically blocks the 3,001st', () => {
      expect(checkAnswersQuota('basic', 2999)).toEqual({ allowed: true, remaining: 1 });
      const blocked = checkAnswersQuota('basic', 3000);
      expect(blocked.allowed).toBe(false);
      if (!blocked.allowed) {
        expect(blocked.used).toBe(3000);
        expect(blocked.limit).toBe(3000);
        expect(blocked.reason).toMatch(/3,000|3000/);
      }
    });

    it('enforces Starter (13,500) and Pro (31,500) answer caps', () => {
      expect(checkAnswersQuota('starter', 13499).allowed).toBe(true);
      expect(checkAnswersQuota('starter', 13500).allowed).toBe(false);
      expect(checkAnswersQuota('pro', 31499).allowed).toBe(true);
      expect(checkAnswersQuota('pro', 31500).allowed).toBe(false);
    });
  });

  describe('brand & seat quotas', () => {
    it('blocks a 2nd brand on Basic, allows a 5th on Starter, unlimited on Pro', () => {
      expect(checkBrandQuota('basic', 1).allowed).toBe(false);
      expect(checkBrandQuota('starter', 4).allowed).toBe(true);
      expect(checkBrandQuota('starter', 5).allowed).toBe(false);
      const pro = checkBrandQuota('pro', 100000);
      expect(pro.allowed).toBe(true);
      if (pro.allowed) expect(pro.remaining).toBe(Infinity);
    });

    it('blocks a 4th seat on Starter but allows it on Pro', () => {
      expect(checkSeatQuota('starter', 3).allowed).toBe(false);
      expect(checkSeatQuota('pro', 5000).allowed).toBe(true);
    });
  });

  describe('getQuotaSummary', () => {
    it('returns meter percentages for upgrade UX', () => {
      const summary = getQuotaSummary('basic', 100, 1500);
      expect(summary).not.toBeNull();
      expect(summary!.prompts.percent).toBe(100);
      expect(summary!.answers.percent).toBe(50);
      expect(summary!.planName).toBe('Basic');
    });
  });
});
