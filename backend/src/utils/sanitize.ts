/**
 * Security utilities for Gremio Estelar
 * - Message sanitization (XSS prevention)
 * - CUID validation
 * - Socket.IO rate limiting
 */

// ─── XSS Sanitization ────────────────────────────────────────────

/**
 * Dangerous HTML patterns that could be used for XSS attacks.
 * We strip tags and event handlers but preserve normal text,
 * emojis, sticker syntax (:name:), and markdown-like formatting.
 */
const DANGEROUS_PATTERNS: [RegExp, string][] = [
  // Script tags and their content
  [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''],
  // Iframe, object, embed, form tags
  [/<\/?(?:iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[^>]*>/gi, ''],
  // Event handlers (onclick, onerror, onload, etc.)
  [/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, ''],
  // javascript: protocol in href/src/action
  [/(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, ''],
  // data: protocol (can execute JS in some contexts)
  [/(?:href|src)\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi, ''],
  // Style expressions (IE legacy, but still worth blocking)
  [/style\s*=\s*"[^"]*expression\s*\([^)]*\)[^"]*"/gi, ''],
  // HTML comments (can be used to bypass filters)
  [/<!--[\s\S]*?-->/g, ''],
];

/**
 * Escapes remaining HTML entities after pattern removal.
 * Preserves emojis, sticker syntax, and common punctuation.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitizes a user-submitted chat message for safe storage and display.
 *
 * Strategy:
 * 1. Remove known dangerous patterns (scripts, iframes, event handlers)
 * 2. Escape remaining HTML entities
 * 3. Trim and limit length
 *
 * Preserves: plain text, emojis (🌟), sticker references (:pepe_dance:),
 * URLs (as plain text), and unicode characters.
 */
export function sanitizeMessage(content: string, maxLength: number = 2000): string {
  if (!content || typeof content !== 'string') return '';

  let sanitized = content;

  // Step 1: Remove dangerous patterns
  for (const [pattern, replacement] of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  // Step 2: Escape remaining HTML
  sanitized = escapeHtml(sanitized);

  // Step 3: Trim whitespace and enforce max length
  sanitized = sanitized.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}


// ─── CUID Validation ──────────────────────────────────────────────

/**
 * Validates that a string is a valid CUID (used by Prisma @default(cuid())).
 * CUIDs are 25 characters starting with 'c', containing only lowercase
 * alphanumeric characters.
 *
 * Examples:
 *   "cl1234567890abcdefghijklm" → true
 *   "not-a-cuid"               → false
 *   ""                         → false
 */
const CUID_REGEX = /^c[a-z0-9]{24}$/;

export function isValidCuid(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return CUID_REGEX.test(id);
}


// ─── Socket.IO Rate Limiter ───────────────────────────────────────

interface RateLimiterOptions {
  /** Maximum number of events allowed within the window. Default: 10 */
  maxEvents: number;
  /** Time window in milliseconds. Default: 5000 (5 seconds) */
  windowMs: number;
}

interface RateLimiterEntry {
  timestamps: number[];
}

/**
 * Creates a per-socket rate limiter for Socket.IO events.
 *
 * Usage:
 *   const limiter = createSocketRateLimiter({ maxEvents: 10, windowMs: 5000 });
 *
 *   socket.on('dm:message', (data) => {
 *     if (!limiter.allow(socket.userId)) {
 *       socket.emit('dm:error', { message: 'Enviando mensajes muy rápido.' });
 *       return;
 *     }
 *     // ... process message
 *   });
 */
export function createSocketRateLimiter(options: Partial<RateLimiterOptions> = {}) {
  const { maxEvents = 10, windowMs = 5000 } = options;
  const entries = new Map<string, RateLimiterEntry>();

  // Cleanup stale entries every 60 seconds
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of entries) {
      // Remove entries with no recent activity
      if (entry.timestamps.length === 0 || now - entry.timestamps[entry.timestamps.length - 1] > windowMs * 2) {
        entries.delete(key);
      }
    }
  }, 60_000);

  // Allow the process to exit cleanly
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return {
    /**
     * Checks if a user is allowed to perform an action.
     * Returns `true` if within rate limit, `false` if exceeded.
     */
    allow(userId: string): boolean {
      const now = Date.now();
      let entry = entries.get(userId);

      if (!entry) {
        entry = { timestamps: [] };
        entries.set(userId, entry);
      }

      // Remove timestamps outside the current window
      entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

      if (entry.timestamps.length >= maxEvents) {
        return false;
      }

      entry.timestamps.push(now);
      return true;
    },

    /**
     * Removes a user from the rate limiter (e.g., on disconnect).
     */
    remove(userId: string): void {
      entries.delete(userId);
    },

    /**
     * Returns the current number of tracked users (for monitoring).
     */
    get size(): number {
      return entries.size;
    },
  };
}
