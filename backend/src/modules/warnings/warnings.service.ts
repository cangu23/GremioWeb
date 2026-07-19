import AppError from '../../errors/AppError';
import prisma from '../../database/prisma';
import * as AdminRepository from '../admin/admin.repository';
import * as NotificationsService from '../notifications/notifications.service';

export const issueWarning = async (userId: string, warnedById: string, reason: string, ip?: string) => {
  if (!reason?.trim()) throw new AppError('Debes proporcionar una razón para la advertencia', 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuario no encontrado', 404);

  // Count existing warnings
  const existingWarnings = await prisma.warning.count({ where: { userId } });
  const strike = existingWarnings + 1;

  let autoBanned = false;

  // Create the warning
  const warning = await prisma.warning.create({
    data: {
      userId,
      warnedById,
      reason: reason.trim(),
      strike,
    },
  });

  // Auto-ban on 3rd strike
  if (strike >= 3) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
    });
    autoBanned = true;

      // Notify via real-time notification
    NotificationsService.notifyWarning({
      userId,
      strike,
      reason: reason.trim(),
      warnedByUsername: 'Sistema',
      remainingWarnings: 0,
      autoBanned: true,
    }).catch(() => {});

    // Log admin action
    await AdminRepository.createAdminLog({
      userId: warnedById,
      action: 'AUTO_BAN_3_STRIKES',
      detail: JSON.stringify({
        targetUserId: userId,
        targetUsername: user.username,
        reason: reason.trim(),
        totalWarnings: strike,
      }),
      ip,
    });
  }

  // Log the warning
  await AdminRepository.createAdminLog({
    userId: warnedById,
    action: 'ISSUE_WARNING',
    detail: JSON.stringify({
      targetUserId: userId,
      targetUsername: user.username,
      reason: reason.trim(),
      strike,
      autoBanned,
    }),
    ip,
  });

  // Notify the user about the warning via real-time notification
  const warnerUser = await prisma.user.findUnique({ where: { id: warnedById } });
  NotificationsService.notifyWarning({
    userId,
    strike,
    reason: reason.trim(),
    warnedByUsername: warnerUser?.username || 'Staff',
    remainingWarnings: Math.max(0, 3 - strike),
    autoBanned,
  }).catch(() => {});

  return {
    warning: {
      id: warning.id,
      strike,
      reason: reason.trim(),
      createdAt: warning.createdAt.toISOString(),
    },
    autoBanned,
    totalWarnings: strike,
    remainingWarnings: Math.max(0, 3 - strike),
  };
};

export const getUserWarnings = async (userId: string) => {
  const warnings = await prisma.warning.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      warner: { select: { id: true, username: true } },
    },
  });

  return warnings.map(w => ({
    id: w.id,
    reason: w.reason,
    strike: w.strike,
    autoBanned: w.autoBanned,
    issuedBy: w.warner.username,
    createdAt: w.createdAt.toISOString(),
  }));
};

export const listWarnings = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.warning.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        warnedUser: { select: { id: true, username: true } },
        warner: { select: { id: true, username: true } },
      },
    }),
    prisma.warning.count(),
  ]);

  return {
    data: data.map(w => ({
      id: w.id,
      reason: w.reason,
      strike: w.strike,
      autoBanned: w.autoBanned,
      user: w.warnedUser.username,
      issuedBy: w.warner.username,
      createdAt: w.createdAt.toISOString(),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Delete a chat message (admin or owner)
export const deleteChatMessage = async (messageId: string, type: string, adminId: string) => {
  let message;

  switch (type) {
    case 'global':
      message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
      if (!message) throw new AppError('Mensaje no encontrado', 404);
      // Check if user is admin or the message owner
      const globalAdmin = await prisma.user.findUnique({ where: { id: adminId } });
      if (message.userId !== adminId && globalAdmin?.role !== 'ADMIN') {
        throw new AppError('No tienes permiso para eliminar este mensaje', 403);
      }
      await prisma.chatMessage.delete({ where: { id: messageId } });
      break;

    case 'dm':
      message = await prisma.directMessage.findUnique({ where: { id: messageId } });
      if (!message) throw new AppError('Mensaje no encontrado', 404);
      const dmAdmin = await prisma.user.findUnique({ where: { id: adminId } });
      if (message.senderId !== adminId && message.receiverId !== adminId && dmAdmin?.role !== 'ADMIN') {
        throw new AppError('No tienes permiso para eliminar este mensaje', 403);
      }
      await prisma.directMessage.delete({ where: { id: messageId } });
      break;

    default:
      throw new AppError('Tipo de mensaje inválido', 400);
  }

  return { message: 'Mensaje eliminado' };
};

// Delete a feed post (admin only)
export const deleteFeedPost = async (postId: string, adminId: string) => {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (admin?.role !== 'ADMIN') throw new AppError('No tienes permiso para eliminar esta publicación', 403);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Publicación no encontrada', 404);

  await prisma.post.delete({ where: { id: postId } });

  await AdminRepository.createAdminLog({
    userId: adminId,
    action: 'DELETE_POST_ADMIN',
    detail: JSON.stringify({ targetPostId: postId, postOwnerId: post.userId }),
  });

  return { message: 'Publicación eliminada por administrador' };
};
