import prisma from '../../database/prisma';

export const globalSearch = async (query: string, limit = 5) => {
  if (!query || query.trim().length === 0) {
    return { users: [], guilds: [], posts: [], events: [] };
  }

  const q = query.trim();

  const [users, guilds, posts, events] = await Promise.all([
    // Search users
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        vtuberProfile: {
          select: {
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      take: limit,
    }),

    // Search guilds
    prisma.guild.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        _count: { select: { members: true } },
      },
      take: limit,
    }),

    // Search posts
    prisma.post.findMany({
      where: {
        content: { contains: q },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),

    // Search events
    prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        date: true,
        creator: {
          select: { id: true, username: true },
        },
      },
      take: limit,
      orderBy: { date: 'asc' },
    }),
  ]);

  return { users, guilds, posts, events };
};
