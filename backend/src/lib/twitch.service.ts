import env from '../config/env';

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  is_mature: boolean;
}

interface TwitchStreamsResponse {
  data: TwitchStream[];
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get an OAuth access token from Twitch using the Client Credentials flow.
 * Tokens are cached and auto-refreshed when expired.
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[TwitchAPI] Failed to get access token:', response.status, errorText);
    throw new Error(`Twitch auth failed: ${response.status}`);
  }

  const data: TwitchTokenResponse = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Extract the Twitch channel name from a twitch URL.
 * Supports formats like:
 * - https://twitch.tv/channelname
 * - https://www.twitch.tv/channelname
 * - twitch.tv/channelname
 */
export function extractChannelName(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const clean = url.trim().replace(/^@/, '');
  const match = clean.match(/(?:twitch\.tv\/)?([a-zA-Z0-9_]{2,25})/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Check which of the given Twitch channel names are currently live.
 * Returns an array of live channel names.
 */
export async function checkLiveChannels(channelNames: string[]): Promise<string[]> {
  if (channelNames.length === 0) return [];

  const uniqueNames = [...new Set(channelNames)];

  try {
    const token = await getAccessToken();

    // Twitch API allows up to 100 channels per request
    const queryParams = uniqueNames.map((name) => `user_login=${encodeURIComponent(name)}`).join('&');
    const url = `https://api.twitch.tv/helix/streams?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        'Client-ID': env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TwitchAPI] Failed to check streams:', response.status, errorText);
      throw new Error(`Twitch API error: ${response.status} - ${errorText}`);
    }

    const data: TwitchStreamsResponse = await response.json();
    return data.data
      .filter((stream) => stream.type === 'live')
      .map((stream) => stream.user_login);
  } catch (error) {
    console.error('[TwitchAPI] Error checking live channels:', error);
    return [];
  }
}

/**
 * Quick check: is a single Twitch channel live?
 */
export async function isChannelLive(channelName: string): Promise<boolean> {
  const liveChannels = await checkLiveChannels([channelName]);
  return liveChannels.includes(channelName.toLowerCase());
}
