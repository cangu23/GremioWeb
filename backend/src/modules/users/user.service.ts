import AppError from '../../errors/AppError';
import * as UserRepository from './user.repository';
import { UpdateUserPayload, PublicUser, UserProfile, canUseProfileMusic, isSpotifyUrl } from '@gremio-estelar/shared';
import * as DailyRewardsService from '../daily-rewards/daily-rewards.service';
import { sanitizeString } from '../../middleware/sanitize';
import { trackMissionProgress } from '../ecosystem/missions.service';
import { getMyPlatformPlan } from '../subscriptions/platform-subscriptions.service';

export const getMe = async (userId: string): Promise<UserProfile & { dailyRewardClaimed?: any }> => {
  // Automatically check subscription expiration and update user plan status
  await getMyPlatformPlan(userId).catch(() => {});

  let userProfile = await UserRepository.getUserProfileById(userId);
  if (!userProfile) {
    throw new AppError('User not found', 404);
  }

  // Automatic daily reward streak claim on login / first load of the day
  let dailyRewardClaimed: any = null;
  try {
    const status = await DailyRewardsService.getStatus(userId);
    if (status.canClaim) {
      dailyRewardClaimed = await DailyRewardsService.claim(userId);
      const refreshed = await UserRepository.getUserProfileById(userId);
      if (refreshed) userProfile = refreshed;
    }
  } catch {
    // Non-blocking
  }
  
  const { password, ...safeProfile } = userProfile;
  return {
    ...safeProfile,
    ...(dailyRewardClaimed ? { dailyRewardClaimed } : {}),
  } as UserProfile;
};

export const updateMe = async (userId: string, payload: UpdateUserPayload): Promise<UserProfile> => {
  if (payload.bio) payload.bio = sanitizeString(payload.bio);
  if (payload.displayName) payload.displayName = sanitizeString(payload.displayName);
  if ((payload as any).note) (payload as any).note = sanitizeString((payload as any).note);

  // Profile music: Spotify-only + premium enforcement (server-side).
  // Unchanged values (whether legacy MP3/stream OR Spotify saved while the user
  // had a plan) are always kept, so a user who lost their plan can still save
  // the rest of their profile. Only NEW values are validated against format
  // (Spotify-only) and eligibility (NOVA/STELLAR).
  if (payload.profileMusic !== undefined && payload.profileMusic) {
    const me = await UserRepository.findById(userId);
    const value = payload.profileMusic;
    const isSpotify = isSpotifyUrl(value);
    const isKeep = !!me && me.profileMusic === value;
    if (!isSpotify && !isKeep) {
      throw new AppError('Solo se permiten enlaces de Spotify (canción, álbum o playlist).', 400);
    }
    if (!isKeep && (!me || !canUseProfileMusic(me.plan, me.role))) {
      throw new AppError('La música en el perfil es exclusiva de los Planes Premium NOVA y STELLAR.', 403);
    }
  }

  if (payload.username) {
    const existingUser = await UserRepository.findByUsername(payload.username);
    if (existingUser && existingUser.id !== userId) {
      throw new AppError('Username is already taken', 409);
    }
  }

  const updatedProfile = await UserRepository.updateUserProfile(userId, payload);
  if (!updatedProfile) {
    throw new AppError('Failed to update user profile', 500);
  }

  trackMissionProgress(userId, 'NOTE_UPDATE').catch(() => {});

  const { password, ...safeProfile } = updatedProfile;
  return safeProfile as UserProfile;
};

export const getUsersByRole = async (role: string) => {
  return UserRepository.findByRole(role);
};

export const searchUsersForMention = async (query: string) => {
  if (!query || query.length < 2) {
    return UserRepository.searchByUsernameForMention('');
  }
  return UserRepository.searchByUsernameForMention(query);
};

export const searchUsers = async (query: string) => {
  // If no query or too short, return all VTubers (for directory browsing)
  if (!query || query.length < 2) {
    return UserRepository.searchByUsername('');
  }
  return UserRepository.searchByUsername(query);
};

export const updateNote = async (
  userId: string,
  note: string | null,
  durationHours?: number | null,
  noteColor?: string | null
) => {
  const trimmed = note?.trim() || null;
  const color = noteColor?.trim() || null;
  if (trimmed && trimmed.length > 100) {
    throw new AppError('La nota no puede tener más de 100 caracteres', 400);
  }

  let noteExpiresAt: Date | null = null;
  if (trimmed) {
    // If durationHours === 0, explicit no-expiry. Otherwise default to 24h or specified hours.
    if (durationHours === 0) {
      noteExpiresAt = null;
    } else {
      const hours = durationHours && durationHours > 0 ? durationHours : 24;
      noteExpiresAt = new Date(Date.now() + hours * 3600 * 1000);
    }
  }

  const updated = await UserRepository.updateUser(userId, {
    note: trimmed,
    noteColor: trimmed ? color : null,
    noteUpdatedAt: trimmed ? new Date() : null,
    noteExpiresAt,
  });
  return {
    note: updated.note,
    noteColor: updated.noteColor,
    noteUpdatedAt: updated.noteUpdatedAt,
    noteExpiresAt: updated.noteExpiresAt,
  };
};

export const getPublicUser = async (userId: string): Promise<PublicUser> => {
  const userProfile = await UserRepository.getUserProfileById(userId);
  if (!userProfile) {
    throw new AppError('User not found', 404);
  }

  return {
    id: userProfile.id,
    username: userProfile.username,
    role: userProfile.role as unknown as PublicUser['role'],
    displayName: userProfile.displayName,
    avatarUrl: userProfile.avatarUrl,
    bio: userProfile.bio,
    vtuberProfile: userProfile.vtuberProfile as unknown as PublicUser['vtuberProfile'],
  };
};