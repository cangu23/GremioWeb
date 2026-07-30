import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeMessage, isValidCuid, createSocketRateLimiter } from './sanitize';

describe('sanitizeMessage', () => {
  it('returns empty string for null, undefined or empty input', () => {
    expect(sanitizeMessage('')).toBe('');
    expect(sanitizeMessage(null as any)).toBe('');
    expect(sanitizeMessage(undefined as any)).toBe('');
  });

  it('strips script tags and their content', () => {
    const input = 'Hola <script>alert("XSS")</script> mundo!';
    expect(sanitizeMessage(input)).toBe('Hola  mundo!');
  });

  it('strips iframe and embed tags', () => {
    const input = 'Mira esto <iframe src="http://malicious.com"></iframe>';
    expect(sanitizeMessage(input)).toBe('Mira esto');
  });

  it('removes event handlers like onerror and onclick', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeMessage(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('escapes remaining HTML tags cleanly', () => {
    const input = '<b>Bold text</b> & <something>';
    expect(sanitizeMessage(input)).toBe('&lt;b&gt;Bold text&lt;/b&gt; &amp; &lt;something&gt;');
  });

  it('preserves emojis and sticker syntax', () => {
    const input = '¡Hola! 🌟 :pepe_dance: ¿Cómo estás?';
    expect(sanitizeMessage(input)).toBe('¡Hola! 🌟 :pepe_dance: ¿Cómo estás?');
  });

  it('enforces maximum length', () => {
    const longInput = 'a'.repeat(3000);
    expect(sanitizeMessage(longInput, 100).length).toBe(100);
  });
});

describe('isValidCuid', () => {
  it('validates a standard 25-char CUID starting with c', () => {
    expect(isValidCuid('cl1234567890abcdefghijklm')).toBe(true);
  });

  it('rejects invalid inputs', () => {
    expect(isValidCuid('invalid-id')).toBe(false);
    expect(isValidCuid('1234567890abcdefghijklmno')).toBe(false); // does not start with c
    expect(isValidCuid('cShort')).toBe(false);
    expect(isValidCuid('')).toBe(false);
    expect(isValidCuid(null as any)).toBe(false);
  });
});

describe('createSocketRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows events up to maxEvents limit', () => {
    const limiter = createSocketRateLimiter({ maxEvents: 3, windowMs: 1000 });
    expect(limiter.allow('user1')).toBe(true);
    expect(limiter.allow('user1')).toBe(true);
    expect(limiter.allow('user1')).toBe(true);
    expect(limiter.allow('user1')).toBe(false);
  });

  it('resets allow state after windowMs', () => {
    const limiter = createSocketRateLimiter({ maxEvents: 2, windowMs: 1000 });
    expect(limiter.allow('user1')).toBe(true);
    expect(limiter.allow('user1')).toBe(true);
    expect(limiter.allow('user1')).toBe(false);

    // Fast-forward past window
    vi.advanceTimersByTime(1100);

    expect(limiter.allow('user1')).toBe(true);
  });

  it('tracks users independently', () => {
    const limiter = createSocketRateLimiter({ maxEvents: 1, windowMs: 1000 });
    expect(limiter.allow('user1')).toBe(true);
    expect(limiter.allow('user1')).toBe(false);

    expect(limiter.allow('user2')).toBe(true);
  });

  it('supports explicit remove on disconnect', () => {
    const limiter = createSocketRateLimiter({ maxEvents: 1, windowMs: 1000 });
    limiter.allow('user1');
    limiter.remove('user1');
    expect(limiter.allow('user1')).toBe(true);
  });
});
