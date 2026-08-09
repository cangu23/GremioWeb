import { Prisma } from '@prisma/client';
import prisma from '../../database/prisma';
import * as AdminRepository from './admin.repository';
import AppError from '../../errors/AppError';
import { AdminQueryInput, PaginatedResponse } from './admin.types';
import { UpdateUserAdminInput, UpdateVtuberAdminInput, UpdateStreamerAdminInput, UpdateEventAdminInput, UpdateGuildAdminInput, UpdatePostAdminInput, UpdateCommentAdminInput } from './admin.types';
import { NOTIFICATION_TYPES, isStaffRole, hasAnyRole } from '@gremio-estelar/shared';
import { activatePlatformPlan, PLATFORM_PLANS } from '../subscriptions/platform-subscriptions.service';
import { hardDeleteUser } from '../users/user.service';

// ========== HELPERS ==========

function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

function extractPagination(query: AdminQueryInput) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

async function logAdminAction(userId: string, action: string, detail?: Record<string, unknown>, ip?: string) {
  try {
    await AdminRepository.createAdminLog({
      userId,
      action,
      detail: detail ? JSON.stringify(detail) : undefined,
      ip,
    });
  } catch (err) {
    console.error('[AdminLog] Error logging action:', err);
  }
}

// ========== DASHBOARD STATISTICS ==========

export const getDashboardStats = async () => {
  return AdminRepository.getDashboardStats();
};

export const getRecentActivity = async (limit = 20) => {
  return AdminRepository.getRecentActivity(limit);
};

// ========== USERS ==========

export const listUsers = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);
  const [data, total] = await Promise.all([
    AdminRepository.findUsers({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
      role: query.role,
    }),
    AdminRepository.countUsers({
      search: query.search,
      status: query.status,
      role: query.role,
    }),
  ]);
  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const updateUser = async (id: string, data: UpdateUserAdminInput, adminId: string, ip?: string) => {
  const user = await AdminRepository.findUserById(id);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  // Safety check: prevent an admin from demoting or banning themselves.
  // hasAnyRole tolera roles múltiples: solo bloquea si el nuevo rol pierde ADMIN.
  if (id === adminId) {
    if (data.role && !hasAnyRole(data.role, ['ADMIN'])) {
      throw new AppError('No puedes degradar tu propio rango de Administrador', 400);
    }
    if (data.status === 'BANNED' || data.status === 'SUSPENDED') {
      throw new AppError('No puedes suspender o banear tu propia cuenta de Administrador', 400);
    }
  }

  // Safety check: prevent banning or suspending staff members
  if (id !== adminId && isStaffRole(user.role)) {
    if (data.status === 'BANNED' || data.status === 'SUSPENDED') {
      throw new AppError('No se puede banear ni suspender a otros miembros del staff', 400);
    }
  }

  const changes: string[] = [];
  if (data.role && data.role !== user.role) {
    changes.push(`rol: ${user.role} → ${data.role}`);
  }
  if (data.status && data.status !== user.status) {
    changes.push(`estado: ${user.status} → ${data.status}`);
  }
  if (data.username && data.username !== user.username) {
    changes.push(`username: ${user.username} → ${data.username}`);
  }

  // isVerified NO es columna de User (es del VTuberProfile). Si se pasa en el
  // update directo, Prisma lanza "Unknown argument isVerified" → 500. Se extrae
  // aquí y se aplica abajo vía el upsert del VTuberProfile.
  const userUpdateData = { ...data } as Record<string, unknown>;
  delete userUpdateData.isVerified;
  const updated = await AdminRepository.updateUser(id, userUpdateData as Prisma.UserUpdateInput);

  // Sync VTuber profile automatically (creates profile if missing)
  const targetRole = data.role || user.role;
  if (hasAnyRole(targetRole, ['VTUBER']) || data.isVerified !== undefined) {
    const isVer = data.isVerified !== undefined ? data.isVerified : true;
    await prisma.vTuberProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        displayName: user.displayName || user.username,
        avatarUrl: user.avatarUrl || null,
        isApproved: true,
        isHidden: false,
        isVerified: isVer,
      },
      update: {
        isApproved: true,
        isHidden: false,
        isVerified: isVer,
      },
    });
  } else if (data.role && !hasAnyRole(data.role, ['VTUBER']) && user.vtuberProfile) {
    await prisma.vTuberProfile.update({
      where: { userId: id },
      data: { isApproved: false, isHidden: true },
    });
  }

  // Sync Streamer profile automatically (mirror of the VTuber sync)
  if (hasAnyRole(targetRole, ['STREAMER']) || data.isVerified !== undefined) {
    const isVer = data.isVerified !== undefined ? data.isVerified : true;
    await prisma.streamerProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        displayName: user.displayName || user.username,
        avatarUrl: user.avatarUrl || null,
        isApproved: true,
        isHidden: false,
        isVerified: isVer,
      },
      update: {
        isApproved: true,
        isHidden: false,
        isVerified: isVer,
      },
    });
  } else if (data.role && !hasAnyRole(data.role, ['STREAMER']) && (user as any).streamerProfile) {
    await prisma.streamerProfile.update({
      where: { userId: id },
      data: { isApproved: false, isHidden: true },
    });
  }

  if (changes.length > 0) {
    await logAdminAction(adminId, data.status === 'BANNED' ? 'BAN_USER' : data.status === 'SUSPENDED' ? 'SUSPEND_USER' : 'UPDATE_USER', {
      targetUserId: id,
      targetUsername: user.username,
      changes,
    }, ip);
  }

  return updated;
};

export const deleteUser = async (id: string, adminId: string, ip?: string) => {
  const user = await AdminRepository.findUserById(id);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  // Safety: an admin can't delete their own account
  if (id === adminId) {
    throw new AppError('No puedes eliminar tu propia cuenta de administrador', 400);
  }

  if (isStaffRole(user.role)) {
    throw new AppError('No se puede eliminar la cuenta de un miembro del staff', 400);
  }

  // Hard delete (shared con el borrado propio del usuario): limpia en una
  // transacción las FKs sin onDelete: Cascade y deja que la DB cascadee el resto.
  await hardDeleteUser(id);

  await logAdminAction(adminId, 'DELETE_USER', {
    targetUserId: id,
    targetUsername: user.username,
  }, ip);

  return { message: 'Usuario eliminado permanentemente' };
};

// ========== PREMIUM PLAN GRANT ==========

/**
 * Otorga un plan premium (ASTRO/NOVA/STELLAR) a un usuario desde el panel de
 * administración: crea/actualiza su PlatformSubscription (con expiración),
 * actualiza user.plan, notifica al usuario y registra la acción en el log.
 */
export const grantPremiumPlan = async (
  data: { targetUser: string; plan: 'ASTRO' | 'NOVA' | 'STELLAR'; durationDays: number },
  adminId: string,
  ip?: string
) => {
  if (!PLATFORM_PLANS[data.plan]) {
    throw new AppError('Plan no válido. Usa ASTRO, NOVA o STELLAR.', 400);
  }

  const cleanTarget = data.targetUser.trim().replace(/^@/, '');
  const target = await prisma.user.findFirst({
    where: {
      OR: [
        { id: cleanTarget },
        { username: { equals: cleanTarget, mode: 'insensitive' as any } },
        { email: { equals: cleanTarget, mode: 'insensitive' as any } },
      ],
    },
    select: { id: true, username: true, email: true },
  });

  if (!target) {
    throw new AppError(`No se encontró ningún usuario con el identificador "${data.targetUser}"`, 404);
  }

  const activation = await activatePlatformPlan(target.id, data.plan, data.durationDays);

  // Notificar al usuario (fire-and-forget, nunca rompe el flujo principal)
  try {
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: NOTIFICATION_TYPES.PLAN_GRANTED,
        title: `💎 ¡Te otorgaron el Plan ${data.plan}!`,
        message: `El equipo de Gremio Estelar te ha activado el Plan ${data.plan} por ${data.durationDays} días (hasta el ${activation.subscription.currentPeriodEnd.toISOString().split('T')[0]}). ¡Disfruta tus beneficios!`,
        referenceId: null,
      },
    });
  } catch (notifErr) {
    console.error('[Admin] Error notifying plan grant:', notifErr);
  }

  await logAdminAction(adminId, 'GRANT_PLAN', {
    targetUserId: target.id,
    targetUsername: target.username,
    plan: data.plan,
    durationDays: data.durationDays,
    expiresAt: activation.subscription.currentPeriodEnd.toISOString(),
  }, ip);

  return {
    message: `Plan ${data.plan} otorgado a @${target.username} por ${data.durationDays} días.`,
    plan: data.plan,
    durationDays: data.durationDays,
    expiresAt: activation.subscription.currentPeriodEnd,
    targetUser: target.username,
  };
};

/**
 * Revoca el plan premium de un usuario desde el panel: cancela su
 * PlatformSubscription, vuelve user.plan a FREE, notifica y registra la acción.
 */
export const revokePremiumPlan = async (
  data: { targetUser: string },
  adminId: string,
  ip?: string
) => {
  const cleanTarget = data.targetUser.trim().replace(/^@/, '');
  const target = await prisma.user.findFirst({
    where: {
      OR: [
        { id: cleanTarget },
        { username: { equals: cleanTarget, mode: 'insensitive' as any } },
        { email: { equals: cleanTarget, mode: 'insensitive' as any } },
      ],
    },
    select: { id: true, username: true, plan: true },
  });

  if (!target) {
    throw new AppError(`No se encontró ningún usuario con el identificador "${data.targetUser}"`, 404);
  }

  const sub = await prisma.platformSubscription.findUnique({ where: { userId: target.id } });
  const hasPremium = (sub && sub.status === 'ACTIVE') || (!!target.plan && target.plan !== 'FREE');

  if (!hasPremium) {
    return {
      message: `@${target.username} no tiene un plan premium activo.`,
      plan: 'FREE',
      alreadyFree: true,
      targetUser: target.username,
    };
  }

  if (sub && sub.status === 'ACTIVE') {
    await prisma.platformSubscription.update({
      where: { userId: target.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
  await prisma.user.update({
    where: { id: target.id },
    data: { plan: 'FREE' },
  });

  // Notificar al usuario (fire-and-forget)
  try {
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: NOTIFICATION_TYPES.PLAN_REVOKED,
        title: 'Tu plan premium ha finalizado',
        message: 'El equipo de Gremio Estelar ha retirado tu plan premium. Has vuelto al plan Explorer gratuito.',
        referenceId: null,
      },
    });
  } catch (notifErr) {
    console.error('[Admin] Error notifying plan revocation:', notifErr);
  }

  await logAdminAction(adminId, 'REVOKE_PLAN', {
    targetUserId: target.id,
    targetUsername: target.username,
    previousPlan: target.plan,
  }, ip);

  return {
    message: `Plan premium retirado de @${target.username}.`,
    plan: 'FREE',
    targetUser: target.username,
  };
};

// ========== VTUBERS ==========

export const listVtubers = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const filters: Record<string, boolean> = {};
  if (query.isVerified !== undefined) filters.isVerified = query.isVerified === 'true';
  if (query.isApproved !== undefined) filters.isApproved = query.isApproved === 'true';
  if (query.isHidden !== undefined) filters.isHidden = query.isHidden === 'true';
  if (query.isFeatured !== undefined) filters.isFeatured = query.isFeatured === 'true';

  const [data, total] = await Promise.all([
    AdminRepository.findVtuberProfiles({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      ...filters,
    }),
    AdminRepository.countVtuberProfiles({ search: query.search, ...filters }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const updateVtuber = async (id: string, data: UpdateVtuberAdminInput, adminId: string, ip?: string) => {
  const profile = await AdminRepository.findVtuberProfileById(id);
  if (!profile) throw new AppError('Perfil VTuber no encontrado', 404);

  const updated = await AdminRepository.updateVtuberProfile(id, data);

  // Sync user role based on VTuber profile status changes.
  // Only demote to USER if explicitly revoking approval.
  // Hiding the profile temporarily should NOT remove the VTUBER role.
  if (data.isApproved === false) {
    // Explicitly revoked approval → demote to USER
    await prisma.user.update({
      where: { id: profile.userId },
      data: { role: 'USER' },
    });
  } else if (data.isApproved === true) {
    // Re-approving → always restore VTUBER role regardless of isHidden
    await prisma.user.update({
      where: { id: profile.userId },
      data: { role: 'VTUBER' },
    });
  }

  const changes: string[] = [];
  if (data.isVerified !== undefined && data.isVerified !== profile.isVerified) {
    changes.push(data.isVerified ? 'verificado' : 'verificación removida');
  }
  if (data.isApproved !== undefined && data.isApproved !== profile.isApproved) {
    changes.push(data.isApproved ? 'aprobado' : 'aprobación removida');
  }
  if (data.isFeatured !== undefined && data.isFeatured !== profile.isFeatured) {
    changes.push(data.isFeatured ? 'destacado' : 'no destacado');
  }
  if (data.isHidden !== undefined && data.isHidden !== profile.isHidden) {
    changes.push(data.isHidden ? 'oculto' : 'visible');
  }

  if (changes.length > 0) {
    await logAdminAction(adminId, 'UPDATE_VTUBER', {
      targetProfileId: id,
      displayName: profile.displayName,
      changes,
    }, ip);
  }

  // Notify VTuber when approved or verified (fire-and-forget, never crash main flow)
  try {
    const updatedUser = updated.user;
    if (updatedUser) {
      if (data.isApproved === true && profile.isApproved === false) {
        await prisma.notification.create({
          data: {
            userId: updatedUser.id,
            type: NOTIFICATION_TYPES.VTUBER_APPROVED,
            title: '✅ ¡Felicidades, ahora eres VTuber oficial!',
            message: `Tu perfil ha sido aprobado. ¡Bienvenido a la comunidad de VTubers! Ya puedes personalizar tu perfil, crear eventos y unirte a gremios.`,
            referenceId: id,
          },
        });
      }
      if (data.isVerified === true && profile.isVerified === false) {
        await prisma.notification.create({
          data: {
            userId: updatedUser.id,
            type: NOTIFICATION_TYPES.VTUBER_VERIFIED,
            title: '🔵 ¡Has sido verificado!',
            message: `Tu cuenta ha sido verificada. Ahora lucirás la insignia azul de verificación en tu perfil, publicaciones y en toda la plataforma.`,
            referenceId: id,
          },
        });
      }
    }
  } catch (notifErr) {
    console.error('[Notifications] Error sending VTuber notification:', notifErr);
  }

  return updated;
};

// ========== STREAMERS ==========

export const listStreamers = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const filters: Record<string, boolean> = {};
  if (query.isVerified !== undefined) filters.isVerified = query.isVerified === 'true';
  if (query.isApproved !== undefined) filters.isApproved = query.isApproved === 'true';
  if (query.isHidden !== undefined) filters.isHidden = query.isHidden === 'true';
  if (query.isFeatured !== undefined) filters.isFeatured = query.isFeatured === 'true';

  const [data, total] = await Promise.all([
    AdminRepository.findStreamerProfiles({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      ...filters,
    }),
    AdminRepository.countStreamerProfiles({ search: query.search, ...filters }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const updateStreamer = async (id: string, data: UpdateStreamerAdminInput, adminId: string, ip?: string) => {
  const profile = await AdminRepository.findStreamerProfileById(id);
  if (!profile) throw new AppError('Perfil Streamer no encontrado', 404);

  const updated = await AdminRepository.updateStreamerProfile(id, data);

  // Sync user role based on streamer profile status changes.
  // Only demote to USER if explicitly revoking approval.
  // Hiding the profile temporarily should NOT remove the STREAMER role.
  if (data.isApproved === false) {
    await prisma.user.update({
      where: { id: profile.userId },
      data: { role: 'USER' },
    });
  } else if (data.isApproved === true) {
    await prisma.user.update({
      where: { id: profile.userId },
      data: { role: 'STREAMER' },
    });
  }

  const changes: string[] = [];
  if (data.isVerified !== undefined && data.isVerified !== profile.isVerified) {
    changes.push(data.isVerified ? 'verificado' : 'verificación removida');
  }
  if (data.isApproved !== undefined && data.isApproved !== profile.isApproved) {
    changes.push(data.isApproved ? 'aprobado' : 'aprobación removida');
  }
  if (data.isFeatured !== undefined && data.isFeatured !== profile.isFeatured) {
    changes.push(data.isFeatured ? 'destacado' : 'no destacado');
  }
  if (data.isHidden !== undefined && data.isHidden !== profile.isHidden) {
    changes.push(data.isHidden ? 'oculto' : 'visible');
  }

  if (changes.length > 0) {
    await logAdminAction(adminId, 'UPDATE_STREAMER', {
      targetProfileId: id,
      displayName: profile.displayName,
      changes,
    }, ip);
  }

  // Notify streamer when approved or verified (fire-and-forget)
  try {
    const updatedUser = updated.user;
    if (updatedUser) {
      if (data.isApproved === true && profile.isApproved === false) {
        await prisma.notification.create({
          data: {
            userId: updatedUser.id,
            type: NOTIFICATION_TYPES.STREAMER_APPROVED,
            title: '✅ ¡Felicidades, ahora eres Streamer oficial!',
            message: `Tu perfil ha sido aprobado. ¡Bienvenido a la comunidad de Streamers! Ya puedes personalizar tu perfil, crear eventos y unirte a gremios.`,
            referenceId: id,
          },
        });
      }
      if (data.isVerified === true && profile.isVerified === false) {
        await prisma.notification.create({
          data: {
            userId: updatedUser.id,
            type: NOTIFICATION_TYPES.STREAMER_VERIFIED,
            title: '🔵 ¡Has sido verificado!',
            message: `Tu cuenta de streamer ha sido verificada. Ahora lucirás la insignia azul de verificación en tu perfil, publicaciones y en toda la plataforma.`,
            referenceId: id,
          },
        });
      }
    }
  } catch (notifErr) {
    console.error('[Notifications] Error sending Streamer notification:', notifErr);
  }

  return updated;
};

// ========== EVENTS ==========

export const listEvents = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const [data, total] = await Promise.all([
    AdminRepository.findEvents({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
    }),
    AdminRepository.countEvents({
      search: query.search,
      status: query.status,
    }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const updateEvent = async (id: string, data: UpdateEventAdminInput, adminId: string, ip?: string) => {
  const event = await AdminRepository.findEventById(id);
  if (!event) throw new AppError('Evento no encontrado', 404);

  const updateData: Record<string, unknown> = { ...data };
  if (data.date) {
    const eventDate = new Date(data.date);
    if (isNaN(eventDate.getTime())) throw new AppError('Fecha inválida', 400);
    updateData.date = eventDate;
  }

  const updated = await AdminRepository.updateEvent(id, updateData);

  if (data.status === 'CANCELLED' && event.status !== 'CANCELLED') {
    await logAdminAction(adminId, 'CANCEL_EVENT', {
      targetEventId: id,
      eventTitle: event.title,
    }, ip);
  } else if (data.isFeatured !== undefined && data.isFeatured !== event.isFeatured) {
    await logAdminAction(adminId, 'FEATURE_EVENT', {
      targetEventId: id,
      eventTitle: event.title,
      featured: data.isFeatured,
    }, ip);
  }

  return updated;
};

export const deleteEvent = async (id: string, adminId: string, ip?: string) => {
  const event = await AdminRepository.findEventById(id);
  if (!event) throw new AppError('Evento no encontrado', 404);

  await AdminRepository.deleteEvent(id);
  await logAdminAction(adminId, 'DELETE_EVENT', {
    targetEventId: id,
    eventTitle: event.title,
  }, ip);

  return { message: 'Evento eliminado permanentemente' };
};

// ========== GUILDS ==========

export const listGuilds = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const [data, total] = await Promise.all([
    AdminRepository.findGuilds({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    AdminRepository.countGuilds({ search: query.search }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getGuildDetail = async (id: string) => {
  const guild = await AdminRepository.findGuildById(id);
  if (!guild) throw new AppError('Gremio no encontrado', 404);
  return guild;
};

export const updateGuild = async (id: string, data: UpdateGuildAdminInput, adminId: string, ip?: string) => {
  const guild = await AdminRepository.findGuildById(id);
  if (!guild) throw new AppError('Gremio no encontrado', 404);

  const updated = await AdminRepository.updateGuild(id, data);

  if (data.isSuspended !== undefined && data.isSuspended !== guild.isSuspended) {
    await logAdminAction(adminId, data.isSuspended ? 'SUSPEND_GUILD' : 'UNSUSPEND_GUILD', {
      targetGuildId: id,
      guildName: guild.name,
    }, ip);
  }

  return updated;
};

export const deleteGuild = async (id: string, adminId: string, ip?: string) => {
  const guild = await AdminRepository.findGuildById(id);
  if (!guild) throw new AppError('Gremio no encontrado', 404);

  await AdminRepository.deleteGuild(id);
  await logAdminAction(adminId, 'DELETE_GUILD', {
    targetGuildId: id,
    guildName: guild.name,
  }, ip);

  return { message: 'Gremio eliminado permanentemente' };
};

// ========== POSTS ==========

export const listPosts = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const filters: Record<string, boolean> = {};
  if (query.isHidden !== undefined) filters.isHidden = query.isHidden === 'true';

  const [data, total] = await Promise.all([
    AdminRepository.findPosts({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      ...filters,
    }),
    AdminRepository.countPosts({ search: query.search, ...filters }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const updatePost = async (id: string, data: UpdatePostAdminInput, adminId: string, ip?: string) => {
  const post = await AdminRepository.findPostById(id);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  const updated = await AdminRepository.updatePost(id, data);

  if (data.isHidden !== undefined && data.isHidden !== post.isHidden) {
    await logAdminAction(adminId, data.isHidden ? 'HIDE_POST' : 'UNHIDE_POST', {
      targetPostId: id,
      postOwnerId: post.userId,
    }, ip);
  }
  if (data.isPinned !== undefined && data.isPinned !== post.isPinned) {
    await logAdminAction(adminId, data.isPinned ? 'PIN_POST' : 'UNPIN_POST', {
      targetPostId: id,
    }, ip);
  }
  if (data.isFeatured !== undefined && data.isFeatured !== post.isFeatured) {
    await logAdminAction(adminId, data.isFeatured ? 'FEATURE_POST' : 'UNFEATURE_POST', {
      targetPostId: id,
    }, ip);
  }

  return updated;
};

export const deletePost = async (id: string, adminId: string, ip?: string) => {
  const post = await AdminRepository.findPostById(id);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  await AdminRepository.deletePost(id);
  await logAdminAction(adminId, 'DELETE_POST', {
    targetPostId: id,
    postOwnerId: post.userId,
  }, ip);

  return { message: 'Publicación eliminada permanentemente' };
};

export const restorePost = async (id: string, adminId: string, ip?: string) => {
  const post = await AdminRepository.findPostById(id);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  const updated = await AdminRepository.updatePost(id, { isHidden: false });
  await logAdminAction(adminId, 'RESTORE_POST', {
    targetPostId: id,
  }, ip);

  return updated;
};

// ========== COMMENTS ==========

export const listComments = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const filters: Record<string, boolean> = {};
  if (query.isHidden !== undefined) filters.isHidden = query.isHidden === 'true';

  const [data, total] = await Promise.all([
    AdminRepository.findComments({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      ...filters,
    }),
    AdminRepository.countComments({ search: query.search, ...filters }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const updateComment = async (id: string, data: UpdateCommentAdminInput, adminId: string, ip?: string) => {
  const comment = await AdminRepository.findCommentById(id);
  if (!comment) throw new AppError('Comentario no encontrado', 404);

  const updated = await AdminRepository.updateComment(id, data);

  if (data.isHidden !== undefined && data.isHidden !== comment.isHidden) {
    await logAdminAction(adminId, data.isHidden ? 'HIDE_COMMENT' : 'UNHIDE_COMMENT', {
      targetCommentId: id,
    }, ip);
  }

  return updated;
};

export const deleteComment = async (id: string, adminId: string, ip?: string) => {
  const comment = await AdminRepository.findCommentById(id);
  if (!comment) throw new AppError('Comentario no encontrado', 404);

  await AdminRepository.deleteComment(id);
  await logAdminAction(adminId, 'DELETE_COMMENT', {
    targetCommentId: id,
  }, ip);

  return { message: 'Comentario eliminado permanentemente' };
};

// ========== REPORTS ==========

export const listReports = async (query: AdminQueryInput): Promise<PaginatedResponse<any>> => {
  const { page, limit, skip } = extractPagination(query);

  const [data, total] = await Promise.all([
    AdminRepository.findReports({
      skip,
      take: limit,
      status: query.status,
      targetType: query.search, // Reuse search for targetType filter if needed
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    AdminRepository.countReports({ status: query.status }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const resolveReport = async (id: string, data: { status: string; resolution?: string }, adminId: string, ip?: string) => {
  const report = await AdminRepository.findReportById(id);
  if (!report) throw new AppError('Reporte no encontrado', 404);

  const updated = await AdminRepository.updateReport(id, {
    status: data.status,
    resolution: data.resolution,
    moderatorId: adminId,
  } as Prisma.ReportUpdateInput);

  await logAdminAction(adminId, 'RESOLVE_REPORT', {
    reportId: id,
    status: data.status,
    targetType: report.targetType,
    targetId: report.targetId,
  }, ip);

  return updated;
};

// ========== LOGS ==========

// ========== CLEANUP ==========

export const cleanupUserProfiles = async (adminId: string, ip?: string) => {
  // Find users with role USER that have a vtuberProfile
  const usersWithProfile = await prisma.user.findMany({
    where: {
      role: 'USER',
      vtuberProfile: { isNot: null },
    },
    select: {
      id: true,
      username: true,
      email: true,
      provider: true,
      createdAt: true,
      vtuberProfile: {
        select: {
          id: true,
          displayName: true,
          isApproved: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (usersWithProfile.length === 0) {
    return {
      removed: 0,
      affectedUsers: [],
      message: 'No se encontraron usuarios role USER con VTuberProfile.',
    };
  }

  // Prepare report before deleting
  const affectedUsers = usersWithProfile.map(u => ({
    id: u.id,
    username: u.username,
    provider: u.provider,
    displayName: u.vtuberProfile?.displayName ?? null,
  }));

  // Delete profiles
  const profileIds = usersWithProfile
    .map(u => u.vtuberProfile?.id)
    .filter((id): id is string => !!id);

  const result = await prisma.vTuberProfile.deleteMany({
    where: { id: { in: profileIds } },
  });

  // Log the cleanup action
  const summary = affectedUsers.map(u => `${u.username}(${u.provider})`).join(', ');
  await logAdminAction(adminId, 'CLEANUP_USER_PROFILES', {
    removed: result.count,
    users: summary,
  }, ip);

  return {
    removed: result.count,
    affectedUsers,
    message: `${result.count} VTuberProfile(s) eliminado(s) de usuarios role USER.`,
  };
};

export const listLogs = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const [data, total] = await Promise.all([
    AdminRepository.findAdminLogs({
      skip,
      take: limit,
    }),
    AdminRepository.countAdminLogs({}),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};
