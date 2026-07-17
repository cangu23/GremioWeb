import AppError from '../../errors/AppError';
import * as FriendRepository from './friends.repository';
import * as UserRepository from '../users/user.repository';
import * as NotificationsRepository from '../notifications/notifications.repository';
import { NOTIFICATION_TYPES } from '@gremio-estelar/shared';

export const sendRequest = async (senderId: string, receiverId: string) => {
  if (senderId === receiverId) {
    throw new AppError('No puedes enviarte una solicitud a ti mismo.', 400);
  }

  const receiver = await UserRepository.findById(receiverId);
  if (!receiver) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  // Check if there's already a friendship or pending request
  const existing = await FriendRepository.findFriendship(senderId, receiverId);
  if (existing) {
    if (existing.status === 'ACCEPTED') {
      throw new AppError('Ya son amigos.', 409);
    }
    if (existing.status === 'PENDING') {
      if (existing.senderId === senderId) {
        throw new AppError('Ya enviaste una solicitud a este usuario.', 409);
      } else {
        // The other user already sent us a request — auto-accept
        await FriendRepository.updateFriendRequest(existing.id, { status: 'ACCEPTED' });
        return { message: '¡Ahora son amigos!', status: 'ACCEPTED' };
      }
    }
    if (existing.status === 'REJECTED') {
      // Re-send
      await FriendRepository.updateFriendRequest(existing.id, { status: 'PENDING' });
      return { message: 'Solicitud de amistad enviada.', status: 'PENDING' };
    }
    throw new AppError('No se puede enviar la solicitud.', 400);
  }

  const request = await FriendRepository.sendFriendRequest(senderId, receiverId);

  // Send notification
  const sender = await UserRepository.findById(senderId);
  if (sender) {
    await NotificationsRepository.createNotification({
      userId: receiverId,
      type: NOTIFICATION_TYPES.FRIEND_REQUEST,
      title: 'Solicitud de amistad',
      message: `@${sender.username} te ha enviado una solicitud de amistad.`,
      referenceId: senderId,
    }).catch(() => {});
  }

  return { message: 'Solicitud de amistad enviada.', status: 'PENDING' };
};

export const acceptRequest = async (userId: string, requesterId: string) => {
  const friendship = await FriendRepository.findFriendship(userId, requesterId);
  if (!friendship) {
    throw new AppError('Solicitud de amistad no encontrada.', 404);
  }
  if (friendship.receiverId !== userId) {
    throw new AppError('No puedes aceptar esta solicitud.', 403);
  }
  if (friendship.status !== 'PENDING') {
    throw new AppError('Esta solicitud ya fue procesada.', 400);
  }

  await FriendRepository.updateFriendRequest(friendship.id, { status: 'ACCEPTED' });

  const accepter = await UserRepository.findById(userId);
  if (accepter) {
    await NotificationsRepository.createNotification({
      userId: requesterId,
      type: NOTIFICATION_TYPES.FRIEND_ACCEPT,
      title: 'Solicitud aceptada',
      message: `@${accepter.username} aceptó tu solicitud de amistad.`,
      referenceId: userId,
    }).catch(() => {});
  }

  return { message: '¡Ahora son amigos!', status: 'ACCEPTED' };
};

export const rejectRequest = async (userId: string, requesterId: string) => {
  const friendship = await FriendRepository.findFriendship(userId, requesterId);
  if (!friendship) {
    throw new AppError('Solicitud de amistad no encontrada.', 404);
  }
  if (friendship.receiverId !== userId) {
    throw new AppError('No puedes rechazar esta solicitud.', 403);
  }
  if (friendship.status !== 'PENDING') {
    throw new AppError('Esta solicitud ya fue procesada.', 400);
  }

  await FriendRepository.updateFriendRequest(friendship.id, { status: 'REJECTED' });
  return { message: 'Solicitud de amistad rechazada.', status: 'REJECTED' };
};

export const removeFriend = async (userId: string, friendId: string) => {
  const friendship = await FriendRepository.findFriendship(userId, friendId);
  if (!friendship) {
    throw new AppError('No son amigos.', 404);
  }

  await FriendRepository.deleteFriendRequest(friendship.id);
  return { message: 'Amigo eliminado.' };
};

export const getFriendsList = async (userId: string) => {
  const friends = await FriendRepository.getFriends(userId);
  return friends.map(f => {
    const friend = f.senderId === userId ? f.receiver : f.sender;
    return {
      id: f.id,
      friendId: friend!.id,
      username: friend!.username,
      vtuberProfile: friend!.vtuberProfile,
      since: f.updatedAt,
    };
  });
};

export const getPendingRequestsList = async (userId: string) => {
  const requests = await FriendRepository.getPendingRequests(userId);
  return requests.map(r => ({
    id: r.id,
    senderId: r.senderId,
    username: r.sender.username,
    vtuberProfile: r.sender.vtuberProfile,
    createdAt: r.createdAt,
  }));
};

export const getSentRequestsList = async (userId: string) => {
  const requests = await FriendRepository.getSentRequests(userId);
  return requests.map(r => ({
    id: r.id,
    receiverId: r.receiverId,
    username: r.receiver.username,
    vtuberProfile: r.receiver.vtuberProfile,
    createdAt: r.createdAt,
  }));
};

export const getPendingCount = async (userId: string) => {
  return FriendRepository.getPendingRequestsCount(userId);
};
