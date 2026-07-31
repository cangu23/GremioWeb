import { describe, it, expect } from 'vitest';
import { sanitizeString } from '../middleware/sanitize';

describe('Sanitization & Security Unit Tests', () => {
  it('should strip script tags from input strings', () => {
    const malicious = '<script>alert("xss")</script>Hello <b>World</b>';
    const clean = sanitizeString(malicious);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('Hello <b>World</b>');
  });

  it('should neutralize javascript: URLs in anchor tags', () => {
    const malicious = '<a href="javascript:alert(1)">Click me</a>';
    const clean = sanitizeString(malicious);
    expect(clean).not.toContain('javascript:');
  });

  it('should preserve safe text formatting tags', () => {
    const safeText = 'Hey <i>everyone</i>! Check out <a href="https://example.com">this link</a>.';
    const clean = sanitizeString(safeText);
    expect(clean).toBe('Hey <i>everyone</i>! Check out <a href="https://example.com" rel="noopener noreferrer">this link</a>.');
  });
});
