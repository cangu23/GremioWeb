import { NOTIFICATION_TYPES } from '@gremio-estelar/shared';
import * as NotificationsRepository from './notifications.repository';
import prisma from '../../database/prisma';

export const getMyNotifications = async (userId: string, limit = 50, skip = 0) => {
  return NotificationsRepository.findNotificationsByUser(userId, limit, skip);
};

export const getUnreadCount = async (userId: string) => {
  return NotificationsRepository.countUnreadNotifications(userId);
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notif = await NotificationsRepository.findNotificationById(notificationId);
  if (!notif || notif.userId !== userId) {
    return null;
  }
  return NotificationsRepository.markAsRead(notificationId);
};

export const markAllAsRead = async (userId: string) => {
  return NotificationsRepository.markAllAsRead(userId);
};

export const notifyFollow = async (followerUsername: string, followedUserId: string, followerId: string) => {
  return NotificationsRepository.createNotification({
    userId: followedUserId,
    type: NOTIFICATION_TYPES.FOLLOW,
    title: 'Nuevo seguidor',
    message: `@${followerUsername} ha comenzado a seguirte`,
    referenceId: followerId,
  });
};

export const notifyEventAttend = async (attendeeUsername: string, eventTitle: string, eventId: string, creatorId: string) => {
  return NotificationsRepository.createNotification({
    userId: creatorId,
    type: NOTIFICATION_TYPES.EVENT_ATTEND,
    title: 'Nuevo asistente',
    message: `@${attendeeUsername} se ha inscrito a tu evento "${eventTitle}"`,
    referenceId: eventId,
  });
};

export const notifyGuildJoined = async (memberUsername: string, guildName: string, guildId: string, leaderId: string) => {
  return NotificationsRepository.createNotification({
    userId: leaderId,
    type: NOTIFICATION_TYPES.GUILD_JOINED,
    title: 'Nuevo miembro en el gremio',
    message: `@${memberUsername} se ha unido a "${guildName}"`,
    referenceId: guildId,
  });
};

export const notifyAchievement = async (achievementName: string, userId: string, achievementId: string) => {
  return NotificationsRepository.createNotification({
    userId,
    type: NOTIFICATION_TYPES.ACHIEVEMENT,
    title: '¡Logro desbloqueado!',
    message: `Has desbloqueado el logro "${achievementName}"`,
    referenceId: achievementId,
  });
};

export const notifyLevelUp = async (level: number, userId: string) => {
  return NotificationsRepository.createNotification({
    userId,
    type: NOTIFICATION_TYPES.LEVEL_UP,
    title: '¡Has subido de nivel!',
    message: `Has alcanzado el nivel ${level}. ¡Sigue así!`,
  });
};

export const notifyLike = async (likerUsername: string, postId: string, postOwnerId: string) => {
  return NotificationsRepository.createNotification({
    userId: postOwnerId,
    type: NOTIFICATION_TYPES.LIKE,
    title: 'Nuevo like',
    message: `@${likerUsername} le gusta tu publicación`,
    referenceId: postId,
  });
};

export const notifyComment = async (commenterUsername: string, postId: string, postOwnerId: string) => {
  return NotificationsRepository.createNotification({
    userId: postOwnerId,
    type: NOTIFICATION_TYPES.COMMENT,
    title: 'Nuevo comentario',
    message: `@${commenterUsername} comentó en tu publicación`,
    referenceId: postId,
  });
};

export const notifyMention = async (mentionerUsername: string, postId: string, mentionedUserId: string) => {
  return NotificationsRepository.createNotification({
    userId: mentionedUserId,
    type: NOTIFICATION_TYPES.MENTION,
    title: 'Te mencionaron',
    message: `@${mentionerUsername} te mencionó en una publicación`,
    referenceId: postId,
  });
};

export const notifyNewVtuberRequest = async (requesterUsername: string, requesterDisplayName: string, requestId: string) => {
  // Find all admin users
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  // Notify each admin
  const notifications = admins.map((admin) =>
    NotificationsRepository.createNotification({
      userId: admin.id,
      type: NOTIFICATION_TYPES.VTUBER_REQUEST,
      title: 'Nueva solicitud VTuber',
      message: `${requesterDisplayName} (@${requesterUsername}) quiere ser VTuber oficial. Revisa sus respuestas en el panel admin.`,
      referenceId: requestId,
    })
  );

  await Promise.all(notifications);
};

export const notifyDM = async (senderUsername: string, senderId: string, receiverId: string) => {
  return NotificationsRepository.createNotification({
    userId: receiverId,
    type: NOTIFICATION_TYPES.DM,
    title: 'Nuevo mensaje',
    message: `@${senderUsername} te ha enviado un mensaje`,
    referenceId: senderId,
  });
};

export const notifyWarning = async (data: {
  userId: string;
  strike: number;
  reason: string;
  warnedByUsername: string;
  remainingWarnings: number;
  autoBanned?: boolean;
}) => {
  const title = data.autoBanned
    ? '🚫 Cuenta suspendida'
    : `⚠️ Advertencia #${data.strike}`;

  const message = data.autoBanned
    ? `Has recibido 3 advertencias y tu cuenta ha sido suspendida automáticamente. Motivo: ${data.reason}. Contacta a un administrador para más información.`
    : `Has recibido una advertencia del staff. Motivo: ${data.reason}. Te quedan ${data.remainingWarnings} advertencia(s) antes de suspensión automática. Moderador: @${data.warnedByUsername}.`;

  return NotificationsRepository.createNotification({
    userId: data.userId,
    type: NOTIFICATION_TYPES.WARNING,
    title,
    message,
  });
};

export const notifyPostDeleted = async (staffUsername: string, postId: string, authorId: string, moderationNote?: string) => {
  const message = moderationNote
    ? `Tu publicación fue eliminada por moderación. Moderador: @${staffUsername}. Motivo: ${moderationNote}`
    : `Tu publicación fue eliminada por violar las normas de la comunidad. Moderador: @${staffUsername}.`;

  return NotificationsRepository.createNotification({
    userId: authorId,
    type: NOTIFICATION_TYPES.POST_DELETED,
    title: 'Publicación eliminada',
    message,
    referenceId: postId,
  });
};

export const notifyCommentDeleted = async (staffUsername: string, commentId: string, authorId: string, moderationNote?: string) => {
  const message = moderationNote
    ? `Tu comentario fue eliminado por moderación. Moderador: @${staffUsername}. Motivo: ${moderationNote}`
    : `Tu comentario fue eliminado por violar las normas de la comunidad. Moderador: @${staffUsername}.`;

  return NotificationsRepository.createNotification({
    userId: authorId,
    type: NOTIFICATION_TYPES.COMMENT_DELETED,
    title: 'Comentario eliminado',
    message,
    referenceId: commentId,
  });
};
