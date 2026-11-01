import AppError from '../../errors/AppError';
import prisma from '../../database/prisma';
import { getEffectivePlan, planMeetsOrExceeds } from '../subscriptions/platform-subscriptions.service';

/**
 * Registra una visita a un perfil público (para las estadísticas avanzadas de
 * visualización — beneficio del Plan Nova Pro). No cuenta las vistas propias.
 */
export const recordProfileView = async (viewedUserId: string, viewerId?: string) => {
  if (!viewerId || viewerId === viewedUserId) return;

  try {
    // Throttle: una vista por viewer al día (evita spam de refrescos).
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const already = await prisma.profileView.findFirst({
      where: { viewedUserId, viewerId, createdAt: { gte: startOfDay } },
    });
    if (already) return;

    await prisma.profileView.create({
      data: { viewedUserId, viewerId },
    });
  } catch {
    // No romper la carga del perfil si falla el registro
  }
};

/**
 * Estadísticas avanzadas de perfil: exclusivas de NOVA+ (el beneficio prometido).
 * Cualquier usuario con NOVA+ puede consultar las stats de un perfil.
 */
export const getProfileStats = async (viewerId: string, targetUserId: string) => {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { plan: true, role: true },
  });
  const effective = getEffectivePlan(viewer?.plan, viewer?.role);
  if (!planMeetsOrExceeds(effective, 'NOVA')) {
    throw new AppError('Las estadísticas avanzadas de perfil son exclusivas de los Planes Nova Pro y Stellar Elite.', 403);
  }

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfWeek = new Date(now); startOfWeek.setDate(startOfWeek.getDate() - 7);

  // Consulta optimizada: consolida conteos de usuario (posts, comments, followers, following)
  // en una única sub-query con _count en lugar de lanzar múltiples count() independientes.
  const [userCounts, viewsTotal, viewsToday, viewsWeek, uniqueViewers, likes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        _count: {
          select: {
            posts: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
    }),
    prisma.profileView.count({ where: { viewedUserId: targetUserId } }),
    prisma.profileView.count({ where: { viewedUserId: targetUserId, createdAt: { gte: startOfToday } } }),
    prisma.profileView.count({ where: { viewedUserId: targetUserId, createdAt: { gte: startOfWeek } } }),
    prisma.profileView.groupBy({ by: ['viewerId'], where: { viewedUserId: targetUserId, viewerId: { not: null } } }),
    prisma.like.count({ where: { post: { userId: targetUserId } } }),
  ]);

  const posts = userCounts?._count?.posts ?? 0;
  const comments = userCounts?._count?.comments ?? 0;
  const followers = userCounts?._count?.followers ?? 0;
  const following = userCounts?._count?.following ?? 0;

  return {
    views: { total: viewsTotal, today: viewsToday, last7Days: viewsWeek, uniqueViewers: uniqueViewers.length },
    content: { posts, comments, likesReceived: likes },
    social: { followers, following },
  };
};
