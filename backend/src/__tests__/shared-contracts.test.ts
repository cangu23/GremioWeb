import { describe, it, expect } from 'vitest';
import {
  hasAnyRole,
  parseUserRoles,
  getPrimaryRole,
  isStaffRole,
  Role,
} from '@gremio-estelar/shared';
import {
  getEffectivePlan,
  planMeetsOrExceeds,
  getXpMultiplier,
  getPlanLabel,
} from '@gremio-estelar/shared/plans';

describe('Shared Security & Role Contracts', () => {
  describe('parseUserRoles', () => {
    it('should default to USER when role is null, undefined, or empty', () => {
      expect(parseUserRoles(null)).toEqual(['USER']);
      expect(parseUserRoles(undefined)).toEqual(['USER']);
      expect(parseUserRoles('')).toEqual(['USER']);
      expect(parseUserRoles('   ')).toEqual(['USER']);
    });

    it('should parse single and comma-separated roles with trimming and uppercase', () => {
      expect(parseUserRoles('vtuber')).toEqual(['VTUBER']);
      expect(parseUserRoles('user, vtuber , artist')).toEqual(['USER', 'VTUBER', 'ARTIST']);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user possesses a target role', () => {
      expect(hasAnyRole('VTUBER', ['VTUBER'])).toBe(true);
      expect(hasAnyRole('USER,STREAMER', ['STREAMER', 'ARTIST'])).toBe(true);
    });

    it('should return false when user lacks the required target roles', () => {
      expect(hasAnyRole('USER', ['VTUBER', 'STREAMER'])).toBe(false);
      expect(hasAnyRole(null, ['ADMIN'])).toBe(false);
    });

    it('should grant God-Mode bypass to ADMIN, OWNER, and SYSADMIN', () => {
      expect(hasAnyRole('ADMIN', ['VTUBER'])).toBe(true);
      expect(hasAnyRole('OWNER', ['STREAMER', 'ARTIST'])).toBe(true);
      expect(hasAnyRole('SYSADMIN', ['MAID'])).toBe(true);
      expect(hasAnyRole('USER,ADMIN', ['ANY_SPECIAL_PERMISSION'])).toBe(true);
    });
  });

  describe('getPrimaryRole', () => {
    it('should prioritize highest ranking role in hierarchy', () => {
      expect(getPrimaryRole('USER,VTUBER,ADMIN')).toBe('ADMIN');
      expect(getPrimaryRole('USER,OWNER,SYSADMIN')).toBe('OWNER');
      expect(getPrimaryRole('USER,VTUBER')).toBe('VTUBER');
      expect(getPrimaryRole('USER')).toBe('USER');
    });

    it('should honor displayedRole if the user actually holds it', () => {
      expect(getPrimaryRole('USER,VTUBER', 'VTUBER')).toBe('VTUBER');
      // If user does not hold displayedRole, it falls back to hierarchy
      expect(getPrimaryRole('USER,VTUBER', 'OWNER')).toBe('VTUBER');
    });
  });

  describe('isStaffRole', () => {
    it('should return true for all staff and admin positions', () => {
      const staffList = ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'HELPER', 'OWNER', 'SYSADMIN'];
      for (const role of staffList) {
        expect(isStaffRole(role)).toBe(true);
      }
      expect(isStaffRole('USER,MODERATOR')).toBe(true);
    });

    it('should return false for non-staff roles', () => {
      expect(isStaffRole('USER')).toBe(false);
      expect(isStaffRole('VTUBER')).toBe(false);
      expect(isStaffRole('STREAMER,ARTIST')).toBe(false);
      expect(isStaffRole(null)).toBe(false);
    });
  });
});

describe('Shared Plan & Economy Contracts', () => {
  describe('getEffectivePlan', () => {
    it('should grant STELLAR to staff members regardless of base plan', () => {
      expect(getEffectivePlan('FREE', 'ADMIN')).toBe('STELLAR');
      expect(getEffectivePlan('FREE', 'MODERATOR')).toBe('STELLAR');
      expect(getEffectivePlan(null, 'OWNER')).toBe('STELLAR');
    });

    it('should elevate plan for legacy or assigned VIP roles', () => {
      expect(getEffectivePlan('FREE', 'VIP_STELLAR')).toBe('STELLAR');
      expect(getEffectivePlan('FREE', 'VIP_NOVA')).toBe('NOVA');
      expect(getEffectivePlan('FREE', 'VIP_ASTRO')).toBe('ASTRO');
    });

    it('should retain purchased plan for regular creators and users', () => {
      expect(getEffectivePlan('NOVA', 'USER')).toBe('NOVA');
      expect(getEffectivePlan('ASTRO', 'VTUBER')).toBe('ASTRO');
      expect(getEffectivePlan(null, 'USER')).toBe('FREE');
    });
  });

  describe('planMeetsOrExceeds', () => {
    it('should correctly validate tier hierarchy (FREE < ASTRO < NOVA < STELLAR)', () => {
      expect(planMeetsOrExceeds('STELLAR', 'USER', 'NOVA')).toBe(true);
      expect(planMeetsOrExceeds('NOVA', 'USER', 'NOVA')).toBe(true);
      expect(planMeetsOrExceeds('ASTRO', 'USER', 'NOVA')).toBe(false);
      expect(planMeetsOrExceeds('FREE', 'ADMIN', 'STELLAR')).toBe(true);
    });
  });

  describe('getXpMultiplier', () => {
    it('should return the correct multiplier according to effective plan', () => {
      expect(getXpMultiplier('STELLAR', 'USER')).toBe(3);
      expect(getXpMultiplier('NOVA', 'USER')).toBe(2);
      expect(getXpMultiplier('ASTRO', 'USER')).toBe(1.5);
      expect(getXpMultiplier('FREE', 'USER')).toBe(1);
      // Staff gets STELLAR 3x bonus
      expect(getXpMultiplier('FREE', 'STAFF')).toBe(3);
    });
  });

  describe('getPlanLabel', () => {
    it('should return readable badge label', () => {
      expect(getPlanLabel('STELLAR')).toBe('Stellar Elite');
      expect(getPlanLabel('NOVA')).toBe('Nova Pro');
      expect(getPlanLabel('ASTRO')).toBe('Astro');
      expect(getPlanLabel('FREE')).toBe('Explorer (Gratis)');
    });
  });
});

