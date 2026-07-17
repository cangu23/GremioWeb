import { prisma } from '../../database';

export const sendFriendRequest = (senderId: string, receiverId: string) => {
  return prisma.friend.create({
    data: { senderId, receiverId },
  });
};

export const findFriendRequest = (senderId: string, receiverId: string) => {
  return prisma.friend.findUnique({
    where: {
      senderId_receiverId: { senderId, receiverId },
    },
  });
};

export const findFriendship = (userId1: string, userId2: string) => {
  return prisma.friend.findFirst({
    where: {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    },
  });
};

export const updateFriendRequest = (id: string, data: { status: string }) => {
  return prisma.friend.update({
    where: { id },
    data,
  });
};

export const deleteFriendRequest = (id: string) => {
  return prisma.friend.delete({ where: { id } });
};

export const getPendingRequests = (userId: string) => {
  return prisma.friend.findMany({
    where: { receiverId: userId, status: 'PENDING' },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          vtuberProfile: {
            select: {
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getPendingRequestsCount = (userId: string) => {
  return prisma.friend.count({
    where: { receiverId: userId, status: 'PENDING' },
  });
};

export const getFriends = (userId: string) => {
  return prisma.friend.findMany({
    where: {
      OR: [
        { senderId: userId, status: 'ACCEPTED' },
        { receiverId: userId, status: 'ACCEPTED' },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          vtuberProfile: {
            select: {
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          vtuberProfile: {
            select: {
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

export const getSentRequests = (userId: string) => {
  return prisma.friend.findMany({
    where: { senderId: userId, status: 'PENDING' },
    include: {
      receiver: {
        select: {
          id: true,
          username: true,
          vtuberProfile: {
            select: {
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};
