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
