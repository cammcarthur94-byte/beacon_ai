import { describe, it, expect } from 'vitest';
import { isTierEligibleForGoogleAi } from './tier-utils';

describe('isTierEligibleForGoogleAi', () => {
  describe('eligible tiers', () => {
    it('returns true for exact eligible tier names in lowercase', () => {
      expect(isTierEligibleForGoogleAi('pro')).toBe(true);
      expect(isTierEligibleForGoogleAi('growth')).toBe(true);
      expect(isTierEligibleForGoogleAi('enterprise')).toBe(true);
    });

    it('returns true for uppercase or mixed-case eligible tier names', () => {
      expect(isTierEligibleForGoogleAi('PRO')).toBe(true);
      expect(isTierEligibleForGoogleAi('Growth')).toBe(true);
      expect(isTierEligibleForGoogleAi('ENTERPRISE')).toBe(true);
    });

    it('returns true for eligible tier names with leading/trailing whitespace', () => {
      expect(isTierEligibleForGoogleAi('  pro  ')).toBe(true);
      expect(isTierEligibleForGoogleAi('\tgrowth\n')).toBe(true);
      expect(isTierEligibleForGoogleAi(' enterprise ')).toBe(true);
    });
  });

  describe('ineligible or invalid tiers', () => {
    it('returns false for null or undefined inputs', () => {
      expect(isTierEligibleForGoogleAi(null)).toBe(false);
      expect(isTierEligibleForGoogleAi(undefined)).toBe(false);
      expect(isTierEligibleForGoogleAi()).toBe(false);
    });

    it('returns false for empty or whitespace-only strings', () => {
      expect(isTierEligibleForGoogleAi('')).toBe(false);
      expect(isTierEligibleForGoogleAi('   ')).toBe(false);
    });

    it('returns false for non-eligible tier names', () => {
      expect(isTierEligibleForGoogleAi('starter')).toBe(false);
      expect(isTierEligibleForGoogleAi('free')).toBe(false);
      expect(isTierEligibleForGoogleAi('basic')).toBe(false);
      expect(isTierEligibleForGoogleAi('random_tier')).toBe(false);
    });
  });
});
