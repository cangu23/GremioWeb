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

  // Auto-heal: Ensure all VTuberProfile records are marked isApproved: true and isHidden: false if they have valid displayNames
  try {
    const orphanVtubers = await prisma.user.findMany({
      where: {
        role: { contains: 'VTUBER' },
        vtuberProfile: null,
      },
    });

    for (const orphan of orphanVtubers) {
      await prisma.vTuberProfile.create({
        data: {
          userId: orphan.id,
          displayName: orphan.displayName || orphan.username,
          avatarUrl: orphan.avatarUrl || null,
          isApproved: true,
          isHidden: false,
          isVerified: true,
        },
      }).catch(() => {});
    }

    // Ensure Guren VT and users with VTuber profiles have VTUBER role
    const vtubersToEnsure = await prisma.user.findMany({
      where: {
        OR: [
          { username: 'canguvt' },
          { username: 'aleshaW' },
          { username: 'yusuki_yukihira' },
          { username: 'hoshi' },
        ],
      },
    });

    for (const u of vtubersToEnsure) {
      if (!u.role.includes('VTUBER')) {
        await prisma.user.update({
          where: { id: u.id },
          data: { role: `${u.role},VTUBER` },
        });
      }
    }

    // Auto-approve profiles for valid VTubers
    await prisma.vTuberProfile.updateMany({
      where: {
        displayName: { not: '' },
        user: { role: { contains: 'VTUBER' } },
      },
      data: {
        isApproved: true,
        isHidden: false,
      },
    });
  } catch (err) {
    console.error('[VTuber AutoHeal] Error healing VTuber profiles:', err);
  }

  const where: any = {
    isHidden: false,
    isApproved: true,
    user: {
      role: { contains: 'VTUBER' },
    },
  };

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
  // Auto-expire stale live statuses older than 6 hours
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  await prisma.vTuberProfile.updateMany({
    where: {
      isLive: true,
      lastLiveAt: { lt: sixHoursAgo },
    },
    data: { isLive: false },
  });

  const profiles = await prisma.vTuberProfile.findMany({
    where: {
      isLive: true,
      isApproved: true,
      isHidden: false,
      user: {
        role: { contains: 'VTUBER' },
      },
    },
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
    where: {
      isFeatured: true,
      isApproved: true,
      isHidden: false,
      user: {
        role: { contains: 'VTUBER' },
      },
    },
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
