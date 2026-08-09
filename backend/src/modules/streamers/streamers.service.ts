import { prisma } from '../../database';
import { isVerifiedEffective } from '@gremio-estelar/shared';
import AppError from '../../errors/AppError';
import { checkSingleStreamer } from './stream-monitor.service';

const featuredProfileIncludes = {
  user: {
    select: {
      id: true,
      username: true,
      role: true,
      plan: true,
      profileFrame: true,
      verifiedUntil: true,
      _count: { select: { followers: true, following: true } },
    },
  },
};

const postIncludes = {
  user: {
    select: {
      id: true,
      username: true,
      streamerProfile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  _count: { select: { comments: true, likes: true } },
  hashtags: {
    include: { hashtag: { select: { id: true, name: true } } },
  },
};

const directoryIncludes = {
  user: {
    select: {
      id: true,
      username: true,
      role: true,
      plan: true,
      profileFrame: true,
      verifiedUntil: true,
      _count: { select: { followers: true, following: true, posts: true } },
    },
  },
};

const serializeProfile = (profile: any) => ({
  id: profile.id,
  userId: profile.userId,
  displayName: profile.displayName,
  avatarUrl: profile.avatarUrl,
  bannerUrl: profile.bannerUrl,
  description: profile.description,
  lore: profile.lore,
  isLive: profile.isLive,
  lastLiveAt: profile.lastLiveAt?.toISOString() || null,
  isVerified: profile.isVerified || isVerifiedEffective({ verifiedUntil: profile.user?.verifiedUntil, role: profile.user?.role }),
  isFeatured: profile.isFeatured,
  twitchUrl: profile.twitchUrl,
  youtubeUrl: profile.youtubeUrl,
  kickUrl: profile.kickUrl,
  tiktokUrl: profile.tiktokUrl,
  twitterUrl: profile.twitterUrl,
  discordUrl: profile.discordUrl,
  websiteUrl: profile.websiteUrl,
  streamSchedule: profile.streamSchedule,
  languages: profile.languages,
  contentType: profile.contentType,
  fanName: profile.fanName,
  oshiMark: profile.oshiMark,
  themeColor: profile.themeColor,
  user: profile.user,
});

export const getStreamersDirectory = async (params: {
  search?: string;
  contentType?: string;
  language?: string;
  page: number;
  limit: number;
}) => {
  const { search, contentType, language, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isHidden: false,
    isApproved: true,
    user: {
      role: { contains: 'STREAMER' },
    },
  };

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (contentType) where.contentType = contentType;
  if (language) where.languages = { contains: language, mode: 'insensitive' };

  const [profiles, total] = await Promise.all([
    prisma.streamerProfile.findMany({
      where,
      orderBy: [{ isLive: 'desc' }, { isFeatured: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: limit,
      include: directoryIncludes,
    }),
    prisma.streamerProfile.count({ where }),
  ]);

  return {
    data: profiles.map(serializeProfile),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getLiveStreamers = async () => {
  // Auto-expire stale live statuses older than 6 hours
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  await prisma.streamerProfile.updateMany({
    where: { isLive: true, lastLiveAt: { lt: sixHoursAgo } },
    data: { isLive: false },
  });

  const profiles = await prisma.streamerProfile.findMany({
    where: {
      isLive: true,
      user: { role: { contains: 'STREAMER' } },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          plan: true,
          profileFrame: true,
          verifiedUntil: true,
        },
      },
    },
  });

  return profiles.map(serializeProfile);
};

export const getFeaturedStreamers = async () => {
  const profiles = await prisma.streamerProfile.findMany({
    where: {
      isFeatured: true,
      isApproved: true,
      isHidden: false,
      user: { role: { contains: 'STREAMER' } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    include: featuredProfileIncludes,
  });

  const featuredWithPosts = await Promise.all(
    profiles.map(async (profile) => {
      const posts = await prisma.post.findMany({
        where: { userId: profile.userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: postIncludes,
      });

      return {
        ...serializeProfile(profile),
        posts: posts.map((p) => ({
          id: p.id,
          content: p.content,
          mediaUrl: p.mediaUrl,
          createdAt: p.createdAt.toISOString(),
          user: p.user,
          _count: p._count,
          hashtags: p.hashtags.map((h) => h.hashtag.name),
        })),
      };
    })
  );

  return featuredWithPosts;
};

// ========== MI PERFIL (editor del streamer) ==========

export const getMyStreamerProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { streamerProfile: true },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    streamerProfile: user.streamerProfile,
  };
};

export const updateMyStreamerProfile = async (userId: string, data: Record<string, unknown>) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const profileFields = [
    'displayName', 'avatarUrl', 'bannerUrl', 'description', 'lore',
    'twitchUrl', 'youtubeUrl', 'kickUrl', 'tiktokUrl', 'twitterUrl',
    'discordUrl', 'websiteUrl', 'kofiUrl', 'streamSchedule', 'contentType',
    'live2dModel', 'model3d', 'fanName', 'oshiMark', 'themeColor', 'isLive',
  ];

  const profileData: Record<string, unknown> = {};
  for (const key of profileFields) {
    const value = data[key];
    if (value !== undefined) profileData[key] = value;
  }
  if (data.socialLinks !== undefined) profileData.socialLinks = JSON.stringify(data.socialLinks);
  if (data.languages !== undefined) profileData.languages = JSON.stringify(data.languages);
  if (data.hashtags !== undefined) profileData.hashtags = JSON.stringify(data.hashtags);
  if (data.isLive === true) profileData.lastLiveAt = new Date();

  const existing = await prisma.streamerProfile.findUnique({ where: { userId } });

  let profile;
  if (existing) {
    profile = await prisma.streamerProfile.update({
      where: { userId },
      data: profileData as any,
    });
  } else {
    profile = await prisma.streamerProfile.create({
      data: {
        userId,
        displayName: (profileData.displayName as string) || user.displayName || user.username || 'Streamer',
        avatarUrl: (profileData.avatarUrl as string) || user.avatarUrl || null,
        ...profileData,
      } as any,
    });
  }

  // Trigger a live check when the Twitch URL changed
  if (profile.twitchUrl) {
    checkSingleStreamer(profile.id).catch(() => {});
  }

  return profile;
};
