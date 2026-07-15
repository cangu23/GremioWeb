import { prisma } from '../../database';
import { checkLiveChannels, extractChannelName, isChannelLive } from '../../lib/twitch.service';
import env from '../../config/env';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Check all VTubers that have a Twitch URL and update their isLive status.
 * Returns the count of VTubers now marked as live.
 */
/**
 * Check all VTubers and update their isLive status via the Twitch API.
 * Returns the count of VTubers now marked as live.
 * 
 * IMPORTANT: On API failure, only updates profiles to LIVE (confirmed),
 * never marks profiles OFFLINE to avoid wiping live status on transient errors.
 */
async function checkAllVTubers(): Promise<number> {
  try {
    // Step 1: Clean up orphaned live statuses (profiles that removed their Twitch URL)
    await prisma.vTuberProfile.updateMany({
      where: {
        twitchUrl: null,
        isLive: true,
      },
      data: { isLive: false },
    });

    // Step 2: Get all approved VTuber profiles WITH a Twitch URL
    const profiles = await prisma.vTuberProfile.findMany({
      where: {
        twitchUrl: { not: null },
        isApproved: true,
      },
      select: {
        id: true,
        twitchUrl: true,
      },
    });

    if (profiles.length === 0) {
      return 0;
    }

    // Extract channel names from Twitch URLs
    const channelMap = new Map<string, string>(); // channelName -> profileId
    for (const profile of profiles) {
      const channel = extractChannelName(profile.twitchUrl);
      if (channel) {
        channelMap.set(channel, profile.id);
      }
    }

    const channelNames = [...channelMap.keys()];
    if (channelNames.length === 0) return 0;

    // Check which channels are live via Twitch API
    const liveChannels = await checkLiveChannels(channelNames);

    // If the API returned nothing at all, don't touch offline statuses
    // (could be a transient API error). Only set LIVE profiles confirmed by the API.
    if (liveChannels.length === 0) {
      console.log('[StreamMonitor] API returned 0 live channels — skipping offline updates to avoid wiping live statuses on transient error.');
      return 0;
    }

    // Channels confirmed live by the API: set isLive = true
    const liveProfileIds = liveChannels
      .map((channel) => channelMap.get(channel))
      .filter(Boolean) as string[];

    if (liveProfileIds.length > 0) {
      await prisma.vTuberProfile.updateMany({
        where: { id: { in: liveProfileIds } },
        data: { isLive: true },
      });
    }

    // Channels NOT live (confirmed by API response): set isLive = false
    const offlineChannels = channelNames.filter(
      (name) => !liveChannels.includes(name)
    );
    const offlineProfileIds = offlineChannels
      .map((channel) => channelMap.get(channel))
      .filter(Boolean) as string[];

    if (offlineProfileIds.length > 0) {
      await prisma.vTuberProfile.updateMany({
        where: {
          id: { in: offlineProfileIds },
          isLive: true,
        },
        data: { isLive: false },
      });
    }

    if (liveProfileIds.length > 0 || offlineProfileIds.length > 0) {
      console.log(
        `[StreamMonitor] Checked ${profiles.length} VTubers: ${liveProfileIds.length} live, ${offlineProfileIds.length} offline`
      );
    }

    return liveProfileIds.length;
  } catch (error) {
    console.error('[StreamMonitor] Error checking VTubers:', error);
    return 0;
  }
}

/**
 * Start the stream monitor. It checks all VTubers' stream status periodically.
 * If Twitch credentials are not configured, it skips starting.
 */
export function startStreamMonitor(): void {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    console.log('[StreamMonitor] Twitch credentials not configured — automatic live detection disabled.');
    return;
  }

  if (intervalHandle) {
    console.log('[StreamMonitor] Already running.');
    return;
  }

  console.log(`[StreamMonitor] Starting — will check every ${CHECK_INTERVAL_MS / 60000} minutes...`);

  // Run immediately on start
  checkAllVTubers();

  // Then run periodically
  intervalHandle = setInterval(checkAllVTubers, CHECK_INTERVAL_MS);

  console.log('[StreamMonitor] Started successfully.');
}

/**
 * Stop the stream monitor.
 */
export function stopStreamMonitor(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[StreamMonitor] Stopped.');
  }
}

/**
 * Manually trigger a check for a single VTuber profile.
 * Useful when a VTuber updates their Twitch URL.
 */
export async function checkSingleVTuber(profileId: string): Promise<boolean> {
  try {
    const profile = await prisma.vTuberProfile.findUnique({
      where: { id: profileId },
      select: { twitchUrl: true },
    });

    if (!profile?.twitchUrl) {
      await prisma.vTuberProfile.update({
        where: { id: profileId },
        data: { isLive: false },
      });
      return false;
    }

    const channel = extractChannelName(profile.twitchUrl);
    if (!channel) {
      await prisma.vTuberProfile.update({
        where: { id: profileId },
        data: { isLive: false },
      });
      return false;
    }

    const isLive = await isChannelLive(channel);

    await prisma.vTuberProfile.update({
      where: { id: profileId },
      data: { isLive },
    });

    return isLive;
  } catch (error) {
    console.error(`[StreamMonitor] Error checking single VTuber ${profileId}:`, error);
    return false;
  }
}
