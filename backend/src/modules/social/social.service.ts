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

export const getSocialProfile = async (userId: string, currentUserId?: string) => {
  const userProfile = await UserRepository.getUserProfileById(userId);
  if (!userProfile) {
    throw new AppError('Usuario no encontrado.', 404);
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
  return follows.map(f => ({
    ...f.follower,
    vtuberProfile: f.follower.vtuberProfile ? {
      ...f.follower.vtuberProfile,
      isVerified: f.follower.vtuberProfile.isVerified ?? false,
    } : null,
  }));
};

export const getFollowing = async (userId: string) => {
  const follows = await SocialRepository.getFollowing(userId);
  return follows.map(f => ({
    ...f.following,
    vtuberProfile: f.following.vtuberProfile ? {
      ...f.following.vtuberProfile,
      isVerified: f.following.vtuberProfile.isVerified ?? false,
    } : null,
  }));
};
