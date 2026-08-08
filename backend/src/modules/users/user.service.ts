import AppError from '../../errors/AppError';
import * as UserRepository from './user.repository';
import prisma from '../../database/prisma';
import { UpdateUserPayload, PublicUser, UserProfile, canUseProfileMusic, isSpotifyUrl, attachVerified, isVerifiedEffective, isStaffRole } from '@gremio-estelar/shared';
import * as DailyRewardsService from '../daily-rewards/daily-rewards.service';
import { sanitizeString } from '../../middleware/sanitize';
import { trackMissionProgress } from '../ecosystem/missions.service';
import { getMyPlatformPlan, getEffectivePlan } from '../subscriptions/platform-subscriptions.service';

// Plan efectivo (rol VIP puede tener plan gratis pero ser tratado como premium)
const getEffectivePlanFromUser = (user: { plan?: string | null; role?: string | null }): string =>
  getEffectivePlan(user.plan || 'FREE', user.role || 'USER');

const planCheckCache = new Map<string, number>();
const PLAN_CHECK_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getMe = async (userId: string): Promise<UserProfile & { dailyRewardClaimed?: any }> => {
  // Automatically check subscription expiration (cached for 5 minutes)
  const lastCheck = planCheckCache.get(userId) || 0;
  if (Date.now() - lastCheck > PLAN_CHECK_TTL_MS) {
    planCheckCache.set(userId, Date.now());
    getMyPlatformPlan(userId).catch(() => {});
  }

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

  // Insignia azul efectiva: la compra de verificación se refleja en isVerified
  // (y en el perfil VTuber si existe) para que el frontend la pinte.
  const profile = attachVerified(safeProfile as unknown as Record<string, unknown>);
  if (isVerifiedEffective(userProfile as any) && (profile as any).vtuberProfile) {
    (profile as any).vtuberProfile.isVerified = true;
  }

  return {
    ...profile,
    ...(dailyRewardClaimed ? { dailyRewardClaimed } : {}),
  } as unknown as UserProfile;
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

/**
 * Borrado duro de una cuenta dentro de una transacción. Varias FKs hacia User
 * no tienen onDelete: Cascade (VTuberProfile, Event.creator, Guild.creator,
 * Warning.warner, RoleCode, VtuberRequest.reviewedBy, Report.moderator,
 * Sticker.addedBy), así que se limpian manualmente y la DB se encarga del resto
 * vía cascade (posts, likes, follows, DMs, donaciones, suscripciones, etc.).
 * Compartido entre el panel admin (DELETE /admin/users/:id) y el borrado
 * propio del usuario (DELETE /users/me).
 */
export const hardDeleteUser = async (id: string) => {
  await prisma.$transaction(async (tx) => {
    // FKs opcionales → se ponen a null
    await tx.vtuberRequest.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } });
    await tx.report.updateMany({ where: { moderatorId: id }, data: { moderatorId: null } });
    await tx.roleCode.updateMany({ where: { usedById: id }, data: { usedById: null } });

    // Contenido creado / moderado por el usuario → se elimina (sus hijos cascadean)
    await tx.warning.deleteMany({ where: { warnedById: id } });
    await tx.roleCode.deleteMany({ where: { generatedById: id } });
    await tx.sticker.deleteMany({ where: { addedById: id } });
    await tx.guild.deleteMany({ where: { creatorId: id } }); // members/channels/joinRequests cascadean
    await tx.event.deleteMany({ where: { creatorId: id } }); // attendees cascadean
    await tx.vTuberProfile.deleteMany({ where: { userId: id } });

    await tx.user.delete({ where: { id } });
  }, { timeout: 15000 });
};

/**
 * El propio usuario elimina su cuenta desde Ajustes. Los miembros del staff
 * no pueden auto-eliminarse (deben contactar a otro administrador).
 */
export const deleteMyAccount = async (userId: string) => {
  const me = await UserRepository.findById(userId);
  if (!me) throw new AppError('Usuario no encontrado', 404);

  if (isStaffRole(me.role)) {
    throw new AppError('No puedes eliminar tu cuenta siendo miembro del staff. Contacta a otro administrador.', 400);
  }

  await hardDeleteUser(userId);

  return { message: 'Tu cuenta ha sido eliminada permanentemente. ¡Hasta pronto!' };
};

export const getPublicUser = async (userId: string): Promise<PublicUser> => {
  const userProfile = await UserRepository.getUserProfileById(userId);
  if (!userProfile) {
    throw new AppError('User not found', 404);
  }

  const verified = isVerifiedEffective(userProfile as any);
  const vtuberProfile = userProfile.vtuberProfile
    ? ({ ...userProfile.vtuberProfile, isVerified: verified || !!userProfile.vtuberProfile.isVerified } as unknown as PublicUser['vtuberProfile'])
    : null;

  return {
    id: userProfile.id,
    username: userProfile.username,
    role: userProfile.role as unknown as PublicUser['role'],
    displayName: userProfile.displayName,
    avatarUrl: userProfile.avatarUrl,
    bio: userProfile.bio,
    isVerified: verified,
    vtuberProfile,
  };
};