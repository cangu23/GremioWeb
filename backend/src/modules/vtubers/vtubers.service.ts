import { prisma } from '../../database';

const featuredProfileIncludes = {
  user: {
    select: {
      id: true,
      username: true,
      role: true,
      _count: { select: { followers: true, following: true } },
    },
  },
};

const postIncludes = {
  user: {
    select: {
      id: true,
      username: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true } },
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
      _count: { select: { followers: true, following: true, posts: true } },
    },
  },
};

export const getVtubersDirectory = async (params: {
  search?: string;
  contentType?: string;
  language?: string;
  page: number;
  limit: number;
}) => {
  const { search, contentType, language, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: any = { isApproved: true, isHidden: false };

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (contentType) {
    where.contentType = contentType;
  }

  if (language) {
    where.languages = { contains: language, mode: 'insensitive' };
  }

  const [profiles, total] = await Promise.all([
    prisma.vTuberProfile.findMany({
      where,
      orderBy: [{ isLive: 'desc' }, { isFeatured: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: limit,
      include: directoryIncludes,
    }),
    prisma.vTuberProfile.count({ where }),
  ]);

  return {
    data: profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
      description: profile.description,
      lore: profile.lore,
      isLive: profile.isLive,
      lastLiveAt: profile.lastLiveAt?.toISOString() || null,
      isVerified: profile.isVerified,
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
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getLiveVtubers = async () => {
  const profiles = await prisma.vTuberProfile.findMany({
    where: { isLive: true },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    bannerUrl: profile.bannerUrl,
    description: profile.description,
    isLive: profile.isLive,
    lastLiveAt: profile.lastLiveAt?.toISOString() || null,
    isVerified: profile.isVerified,
    twitchUrl: profile.twitchUrl,
    youtubeUrl: profile.youtubeUrl,
    kickUrl: profile.kickUrl,
    tiktokUrl: profile.tiktokUrl,
    twitterUrl: profile.twitterUrl,
    discordUrl: profile.discordUrl,
    websiteUrl: profile.websiteUrl,
    user: profile.user,
  }));
};

export const getFeaturedVtubers = async () => {
  // Get up to 6 featured VTubers
  const profiles = await prisma.vTuberProfile.findMany({
    where: { isFeatured: true },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    include: featuredProfileIncludes,
  });

  // For each featured VTuber, get their latest 3 posts
  const featuredWithPosts = await Promise.all(
    profiles.map(async (profile) => {
      const posts = await prisma.post.findMany({
        where: { userId: profile.userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: postIncludes,
      });

      return {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bannerUrl: profile.bannerUrl,
        description: profile.description,
        isLive: profile.isLive,
        lastLiveAt: profile.lastLiveAt?.toISOString() || null,
        isVerified: profile.isVerified,
        twitchUrl: profile.twitchUrl,
        youtubeUrl: profile.youtubeUrl,
        twitterUrl: profile.twitterUrl,
        user: profile.user,
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
