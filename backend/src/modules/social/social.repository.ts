import { prisma } from '../../database';

export const followUser = (followerId: string, followingId: string) => {
  return prisma.follow.create({
    data: {
      followerId,
      followingId,
    },
  });
};

export const unfollowUser = (followerId: string, followingId: string) => {
  return prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
};

export const isFollowing = (followerId: string, followingId: string) => {
  return prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
};

export const getFollowers = (userId: string) => {
  return prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          note: true,
          noteUpdatedAt: true,
          noteExpiresAt: true,
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

export const getFollowing = (userId: string) => {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          note: true,
          noteUpdatedAt: true,
          noteExpiresAt: true,
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

export const getFollowersCount = (userId: string) => {
  return prisma.follow.count({
    where: { followingId: userId },
  });
};

export const getFollowingCount = (userId: string) => {
  return prisma.follow.count({
    where: { followerId: userId },
  });
};
