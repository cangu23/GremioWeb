import { describe, it, expect } from 'vitest';
import { isWhitelistedUser, isDisposableEmail, hashIp } from './referral.service';

describe('Referral Service & Anti-Multi-Account Protections', () => {
  describe('Whitelist for Testers & Admins', () => {
    it('whitelists the requested tester accounts: hoshi, gremioestelar, ryu, guren', () => {
      expect(isWhitelistedUser({ username: 'hoshi' })).toBe(true);
      expect(isWhitelistedUser({ username: 'hoshi hoshi' })).toBe(true);
      expect(isWhitelistedUser({ username: 'HoshiHoshi' })).toBe(true);
      expect(isWhitelistedUser({ username: 'gremioestelar' })).toBe(true);
      expect(isWhitelistedUser({ displayName: 'Gremio Estelar' })).toBe(true);
      expect(isWhitelistedUser({ username: 'ryu' })).toBe(true);
      expect(isWhitelistedUser({ displayName: 'Ryu' })).toBe(true);
      expect(isWhitelistedUser({ username: 'guren' })).toBe(true);
      expect(isWhitelistedUser({ displayName: 'Guren' })).toBe(true);
    });

    it('whitelists users with role ADMIN or OWNER', () => {
      expect(isWhitelistedUser({ username: 'anyadmin', role: 'ADMIN' })).toBe(true);
      expect(isWhitelistedUser({ username: 'theowner', role: 'OWNER' })).toBe(true);
    });

    it('does NOT whitelist normal users', () => {
      expect(isWhitelistedUser({ username: 'random_user', role: 'USER' })).toBe(false);
      expect(isWhitelistedUser({ username: 'smurf_123', role: 'USER' })).toBe(false);
    });
  });

  describe('Disposable Email Check', () => {
    it('identifies common disposable email domains', () => {
      expect(isDisposableEmail('test@tempmail.com')).toBe(true);
      expect(isDisposableEmail('bot@10minutemail.com')).toBe(true);
      expect(isDisposableEmail('smurf@mailinator.com')).toBe(true);
      expect(isDisposableEmail('fake@guerrillamail.com')).toBe(true);
    });

    it('allows legitimate email domains', () => {
      expect(isDisposableEmail('user@gmail.com')).toBe(false);
      expect(isDisposableEmail('streamer@outlook.com')).toBe(false);
      expect(isDisposableEmail('vtuber@yahoo.es')).toBe(false);
      expect(isDisposableEmail('admin@gremioestelar.com')).toBe(false);
    });
  });

  describe('IP Hashing', () => {
    it('produces consistent SHA-256 hashes for the same IP and never returns raw IP', () => {
      const ip = '192.168.1.100';
      const hash1 = hashIp(ip);
      const hash2 = hashIp(ip);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toContain(ip);
      expect(hash1).toHaveLength(64);
    });

    it('returns null for empty IP', () => {
      expect(hashIp('')).toBeNull();
      expect(hashIp(undefined)).toBeNull();
    });
  });
});
