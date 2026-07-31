import AppError from '../../errors/AppError';
import * as SocialRepository from './social.repository';
import * as UserRepository from '../users/user.repository';
import * as NotificationsService from '../notifications/notifications.service';

export const follow = async (followerId: string, followingId: string) => {
  if (followerId === followingId) {
    throw new AppError('No puedes seguirte a ti mismo.', 400);
  }

  const userToFollow = await UserRepository.findById(followingId);
  if (!userToFollow) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  const existingFollow = await SocialRepository.isFollowing(followerId, followingId);
  if (existingFollow) {
    throw new AppError('Ya sigues a este usuario.', 409);
  }

  const follower = await UserRepository.findById(followerId);
  await SocialRepository.followUser(followerId, followingId);

  // Send notification
  if (follower) {
    await NotificationsService.notifyFollow(follower.username, followingId, followerId).catch(() => {});
  }

  return {
    message: `Ahora sigues a @${userToFollow.username}`,
    followingId,
  };
};

export const unfollow = async (followerId: string, followingId: string) => {
  const existingFollow = await SocialRepository.isFollowing(followerId, followingId);
  if (!existingFollow) {
    throw new AppError('No sigues a este usuario.', 404);
  }

  await SocialRepository.unfollowUser(followerId, followingId);

  return {
    message: 'Has dejado de seguir a este usuario.',
    followingId,
  };
};

import { trackMissionProgress } from '../ecosystem/missions.service';

export const getSocialProfile = async (userId: string, currentUserId?: string) => {
  const userProfile = await UserRepository.getUserProfileById(userId);
  if (!userProfile) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  if (currentUserId && currentUserId !== userId) {
    if (userProfile.role === 'VTUBER' || userProfile.vtuberProfile) {
      trackMissionProgress(currentUserId, 'VTUBER_VISIT').catch(() => {});
    }
  }

  const [followersCount, followingCount] = await Promise.all([
    SocialRepository.getFollowersCount(userId),
    SocialRepository.getFollowingCount(userId),
  ]);

  let isFollowedByMe = false;
  if (currentUserId && currentUserId !== userId) {
    const follow = await SocialRepository.isFollowing(currentUserId, userId);
    isFollowedByMe = !!follow;
  }

  const { password, ...safeProfile } = userProfile;

  return {
    ...safeProfile,
    _count: {
      followers: followersCount,
      following: followingCount,
    },
    isFollowedByMe,
  };
};

export const getFollowers = async (userId: string) => {
  const follows = await SocialRepository.getFollowers(userId);
  const now = new Date();
  return follows.map(f => {
    const follower = f.follower as any;
    const isExpired = follower.noteExpiresAt && new Date(follower.noteExpiresAt) < now;
    return {
      ...follower,
      note: isExpired ? null : follower.note,
      noteColor: isExpired ? null : follower.noteColor,
      noteUpdatedAt: isExpired ? null : follower.noteUpdatedAt,
      vtuberProfile: follower.vtuberProfile ? {
        ...follower.vtuberProfile,
        isVerified: follower.vtuberProfile.isVerified ?? false,
      } : null,
    };
  });
};

export const getFollowing = async (userId: string) => {
  const follows = await SocialRepository.getFollowing(userId);
  const now = new Date();
  return follows.map(f => {
    const following = f.following as any;
    const isExpired = following.noteExpiresAt && new Date(following.noteExpiresAt) < now;
    return {
      ...following,
      note: isExpired ? null : following.note,
      noteColor: isExpired ? null : following.noteColor,
      noteUpdatedAt: isExpired ? null : following.noteUpdatedAt,
      vtuberProfile: following.vtuberProfile ? {
        ...following.vtuberProfile,
        isVerified: following.vtuberProfile.isVerified ?? false,
      } : null,
    };
  });
};
