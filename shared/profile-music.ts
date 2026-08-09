// ============================================================
// Profile Music (Spotify) — shared helpers
// Used by both backend (validation/enforcement) and frontend (UI)
// ============================================================
import { isStaffRole, hasAnyRole } from './role';

const SPOTIFY_TYPE = '(track|album|playlist|artist|show|episode)';
const SPOTIFY_ID = '[0-9A-Za-z]{22}';

// Matches: https://open.spotify.com/track/ID, .../intl-es/track/ID, with optional query string
const WEB_URL_RE = new RegExp(
  `^https?:\\/\\/open\\.spotify\\.com\\/(?:intl-[a-zA-Z-]+\\/)?${SPOTIFY_TYPE}\\/(${SPOTIFY_ID})(\\?[\\s\\S]*)?$`
);
// Matches: spotify:track:ID
const URI_RE = new RegExp(`^spotify:${SPOTIFY_TYPE}:(${SPOTIFY_ID})$`);

export const isSpotifyUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  return WEB_URL_RE.test(trimmed) || URI_RE.test(trimmed);
};

/**
 * Converts any Spotify share URL / URI into an embeddable widget URL:
 *   https://open.spotify.com/track/{id}?si=...  -> https://open.spotify.com/embed/track/{id}
 *   spotify:track:{id}                          -> https://open.spotify.com/embed/track/{id}
 * Returns null when the input is not a valid Spotify link.
 */
export const toSpotifyEmbedUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();

  const webMatch = trimmed.match(WEB_URL_RE);
  if (webMatch) {
    return `https://open.spotify.com/embed/${webMatch[1]}/${webMatch[2]}`;
  }
  const uriMatch = trimmed.match(URI_RE);
  if (uriMatch) {
    return `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}`;
  }
  return null;
};

const SPOTIFY_EMBED_HEIGHTS: Record<string, number> = {
  track: 152,
  episode: 232,
  show: 232,
  album: 352,
  playlist: 352,
  artist: 352,
};

/**
 * Recommended iframe height (px) for a given Spotify embed URL.
 */
export const getSpotifyEmbedHeight = (embedUrl?: string | null): number => {
  if (!embedUrl) return 352;
  const match = embedUrl.match(/\/embed\/(track|album|playlist|artist|show|episode)\//);
  return match ? SPOTIFY_EMBED_HEIGHTS[match[1]] ?? 352 : 352;
};

// ── Premium eligibility ─────────────────────────────────────
// Official plans (premium page): NOVA & STELLAR. Legacy plan
// values (ESTELAR/PREMIUM/VIP) kept for backwards compatibility.
const MUSIC_PLANS = ['NOVA', 'STELLAR', 'ESTELAR', 'PREMIUM', 'VIP'];
const MUSIC_ROLES = ['VTUBER', 'STREAMER', 'MAID', 'ADMIN', 'MODERATOR'];

/**
 * Unified rule for who can set profile music. Mirrors the previous
 * frontend-only check, plus STELLAR which was missing, and now also
 * enforced server-side.
 */
export const canUseProfileMusic = (plan?: string | null, role?: string | null): boolean => {
  if (plan && MUSIC_PLANS.includes(plan)) return true;
  if (isStaffRole(role)) return true;
  return hasAnyRole(role, MUSIC_ROLES);
};
