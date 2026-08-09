import { prisma } from '../../database';
import { checkLiveChannels, extractChannelName, isChannelLive } from '../../lib/twitch.service';
import env from '../../config/env';

const CHECK_INTERVAL_MS = 1 * 60 * 1000; // 1 minute
let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Check all streamers and update their isLive status via the Twitch API.
 * Returns the count of streamers now marked as live.
 *
 * IMPORTANT: On API failure, only updates profiles to LIVE (confirmed),
 * never marks profiles OFFLINE to avoid wiping live status on transient errors.
 */
async function checkAllStreamers(): Promise<number> {
  try {
    // Step 1: Clean up orphaned live statuses (profiles that removed their Twitch URL)
    await prisma.streamerProfile.updateMany({
      where: {
        twitchUrl: null,
        isLive: true,
      },
      data: { isLive: false },
    });

    // Step 2: Get all approved streamer profiles WITH a Twitch URL
    const profiles = await prisma.streamerProfile.findMany({
      where: {
        twitchUrl: { not: null },
        isApproved: true,
      },
      select: {
        id: true,
        twitchUrl: true,
      },
    });

    if (profiles.length === 0) return 0;

    // Extract channel names from Twitch URLs
    const channelMap = new Map<string, string>(); // channelName -> profileId
    for (const profile of profiles) {
      const channel = extractChannelName(profile.twitchUrl);
      if (channel) channelMap.set(channel, profile.id);
    }

    const channelNames = [...channelMap.keys()];
    if (channelNames.length === 0) return 0;

    let liveChannels: string[];
    try {
      liveChannels = await checkLiveChannels(channelNames);
    } catch (err) {
      console.error('[StreamMonitor:Streamers] Error consultando Twitch — no se aplicaron cambios offline:', err);
      return 0;
    }
    const liveLowerSet = new Set(liveChannels.map((c) => c.toLowerCase()));

    const liveProfileIds: string[] = [];
    const offlineProfileIds: string[] = [];

    for (const [channel, profileId] of channelMap.entries()) {
      if (liveLowerSet.has(channel.toLowerCase())) {
        liveProfileIds.push(profileId);
      } else {
        offlineProfileIds.push(profileId);
      }
    }

    if (liveProfileIds.length > 0) {
      await prisma.streamerProfile.updateMany({
        where: { id: { in: liveProfileIds } },
        data: { isLive: true, lastLiveAt: new Date() },
      });
    }

    if (offlineProfileIds.length > 0) {
      await prisma.streamerProfile.updateMany({
        where: {
          id: { in: offlineProfileIds },
          isLive: true,
        },
        data: { isLive: false },
      });
    }

    if (liveProfileIds.length > 0 || offlineProfileIds.length > 0) {
      console.log(
        `[StreamMonitor:Streamers] Checked ${profiles.length} streamers: ${liveProfileIds.length} live, ${offlineProfileIds.length} offline`
      );
    }

    return liveProfileIds.length;
  } catch (error) {
    console.error('[StreamMonitor:Streamers] Error checking streamers:', error);
    return 0;
  }
}

/**
 * Start the stream monitor for streamer profiles.
 */
export function startStreamMonitor(): void {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    console.log('[StreamMonitor:Streamers] Twitch credentials not configured — automatic live detection disabled.');
    return;
  }

  if (intervalHandle) {
    console.log('[StreamMonitor:Streamers] Already running.');
    return;
  }

  console.log(`[StreamMonitor:Streamers] Starting — will check every ${CHECK_INTERVAL_MS / 60000} minutes...`);

  checkAllStreamers();
  intervalHandle = setInterval(checkAllStreamers, CHECK_INTERVAL_MS);

  console.log('[StreamMonitor:Streamers] Started successfully.');
}

/**
 * Stop the stream monitor.
 */
export function stopStreamMonitor(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[StreamMonitor:Streamers] Stopped.');
  }
}

/**
 * Manually trigger a check for a single streamer profile.
 * Useful when a streamer updates their Twitch URL.
 */
export async function checkSingleStreamer(profileId: string): Promise<boolean> {
  try {
    const profile = await prisma.streamerProfile.findUnique({
      where: { id: profileId },
      select: { twitchUrl: true },
    });

    if (!profile?.twitchUrl) {
      await prisma.streamerProfile.update({
        where: { id: profileId },
        data: { isLive: false },
      });
      return false;
    }

    const channel = extractChannelName(profile.twitchUrl);
    if (!channel) {
      await prisma.streamerProfile.update({
        where: { id: profileId },
        data: { isLive: false },
      });
      return false;
    }

    const isLive = await isChannelLive(channel);

    await prisma.streamerProfile.update({
      where: { id: profileId },
      data: { isLive, ...(isLive ? { lastLiveAt: new Date() } : {}) },
    });

    return isLive;
  } catch (error) {
    console.error(`[StreamMonitor:Streamers] Error checking single streamer ${profileId}:`, error);
    return false;
  }
}
