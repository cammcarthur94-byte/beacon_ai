import { describe, it, expect } from 'vitest';
import {
  isTierEligibleForGoogleAi,
  getTierAuditLimit,
  getTierTeamSeatLimit,
  canInviteTeamMember,
  normalizeTier,
} from './tier-utils';

describe('tier-utils', () => {
  describe('normalizeTier', () => {
    it('normalizes various tier names and aliases', () => {
      expect(normalizeTier('pro')).toBe('pro');
      expect(normalizeTier('growth')).toBe('pro');
      expect(normalizeTier('PRO')).toBe('pro');
      expect(normalizeTier('enterprise')).toBe('enterprise');
      expect(normalizeTier('ENTERPRISE')).toBe('enterprise');
      expect(normalizeTier('starter')).toBe('starter');
      expect(normalizeTier('free')).toBe('starter');
      expect(normalizeTier(null)).toBe('starter');
      expect(normalizeTier(undefined)).toBe('starter');
    });
  });

  describe('isTierEligibleForGoogleAi', () => {
    it('returns true for pro, growth, and enterprise', () => {
      expect(isTierEligibleForGoogleAi('pro')).toBe(true);
      expect(isTierEligibleForGoogleAi('growth')).toBe(true);
      expect(isTierEligibleForGoogleAi('enterprise')).toBe(true);
      expect(isTierEligibleForGoogleAi('PRO')).toBe(true);
      expect(isTierEligibleForGoogleAi(' enterprise ')).toBe(true);
    });

    it('returns false for starter, null, or empty', () => {
      expect(isTierEligibleForGoogleAi('starter')).toBe(false);
      expect(isTierEligibleForGoogleAi(null)).toBe(false);
      expect(isTierEligibleForGoogleAi(undefined)).toBe(false);
      expect(isTierEligibleForGoogleAi('')).toBe(false);
    });
  });

  describe('getTierAuditLimit', () => {
    it('returns 20 for starter, 100 for pro, 500 for enterprise', () => {
      expect(getTierAuditLimit('starter')).toBe(20);
      expect(getTierAuditLimit(null)).toBe(20);
      expect(getTierAuditLimit('pro')).toBe(100);
      expect(getTierAuditLimit('growth')).toBe(100);
      expect(getTierAuditLimit('enterprise')).toBe(500);
    });
  });

  describe('getTierTeamSeatLimit & canInviteTeamMember', () => {
    it('returns 1 seat for starter', () => {
      expect(getTierTeamSeatLimit('starter')).toBe(1);
      expect(canInviteTeamMember('starter', 1)).toBe(false);
      expect(canInviteTeamMember('starter', 0)).toBe(true);
    });

    it('returns 3 seats for pro', () => {
      expect(getTierTeamSeatLimit('pro')).toBe(3);
      expect(canInviteTeamMember('pro', 1)).toBe(true);
      expect(canInviteTeamMember('pro', 2)).toBe(true);
      expect(canInviteTeamMember('pro', 3)).toBe(false);
    });

    it('returns unlimited seats for enterprise', () => {
      expect(getTierTeamSeatLimit('enterprise')).toBeGreaterThan(100);
      expect(canInviteTeamMember('enterprise', 50)).toBe(true);
    });
  });
});
