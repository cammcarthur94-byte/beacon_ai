import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isTierEligibleForGoogleAi } from './tier-utils';

describe('isTierEligibleForGoogleAi', () => {
  describe('eligible tiers', () => {
    it('returns true for exact eligible tier names in lowercase', () => {
      assert.strictEqual(isTierEligibleForGoogleAi('pro'), true);
      assert.strictEqual(isTierEligibleForGoogleAi('growth'), true);
      assert.strictEqual(isTierEligibleForGoogleAi('enterprise'), true);
    });

    it('returns true for uppercase or mixed-case eligible tier names', () => {
      assert.strictEqual(isTierEligibleForGoogleAi('PRO'), true);
      assert.strictEqual(isTierEligibleForGoogleAi('Growth'), true);
      assert.strictEqual(isTierEligibleForGoogleAi('ENTERPRISE'), true);
    });

    it('returns true for eligible tier names with leading/trailing whitespace', () => {
      assert.strictEqual(isTierEligibleForGoogleAi('  pro  '), true);
      assert.strictEqual(isTierEligibleForGoogleAi('\tgrowth\n'), true);
      assert.strictEqual(isTierEligibleForGoogleAi(' enterprise '), true);
    });
  });

  describe('ineligible or invalid tiers', () => {
    it('returns false for null or undefined inputs', () => {
      assert.strictEqual(isTierEligibleForGoogleAi(null), false);
      assert.strictEqual(isTierEligibleForGoogleAi(undefined), false);
      assert.strictEqual(isTierEligibleForGoogleAi(), false);
    });

    it('returns false for empty or whitespace-only strings', () => {
      assert.strictEqual(isTierEligibleForGoogleAi(''), false);
      assert.strictEqual(isTierEligibleForGoogleAi('   '), false);
    });

    it('returns false for non-eligible tier names', () => {
      assert.strictEqual(isTierEligibleForGoogleAi('starter'), false);
      assert.strictEqual(isTierEligibleForGoogleAi('free'), false);
      assert.strictEqual(isTierEligibleForGoogleAi('basic'), false);
      assert.strictEqual(isTierEligibleForGoogleAi('random_tier'), false);
    });
  });
});
