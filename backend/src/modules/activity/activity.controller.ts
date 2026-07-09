import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database';

export const getRecentActivity = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [recentPosts, upcomingEvents, recentVtubers] = await Promise.all([
      // Latest 5 posts
      prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              vtuberProfile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          _count: { select: { comments: true, likes: true } },
        },
      }),

      // Upcoming events (next 5)
      prisma.event.findMany({
        where: { status: { in: ['UPCOMING', 'ONGOING'] } },
        orderBy: { date: 'asc' },
        take: 5,
        include: {
          creator: { select: { id: true, username: true } },
          _count: { select: { attendees: true } },
        },
      }),

      // Latest 5 VTubers who created a profile
      prisma.vTuberProfile.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
      }),
    ]);

    res.json({
      posts: recentPosts.map((p) => ({
        id: p.id,
        content: p.content.length > 120 ? p.content.slice(0, 120) + '...' : p.content,
        createdAt: p.createdAt.toISOString(),
        user: p.user,
        _count: p._count,
      })),
      events: upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        status: e.status,
        creator: e.creator,
        _count: e._count,
      })),
      vtubers: recentVtubers.map((v) => ({
        id: v.id,
        userId: v.userId,
        displayName: v.displayName,
        avatarUrl: v.avatarUrl,
        createdAt: v.createdAt.toISOString(),
        user: v.user,
      })),
    });
  } catch (err) {
    next(err);
  }
};
