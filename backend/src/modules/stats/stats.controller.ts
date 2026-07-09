import { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from '../admin/admin.service';

export const getPublicStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getDashboardStats();
    // Only expose a subset of stats for the public landing page
    res.json({
      totalVtubers: stats.totalVtubers,
      totalEvents: stats.totalEvents,
      totalGuilds: stats.totalGuilds,
      totalMessages: stats.totalMessages,
      totalPosts: stats.totalPosts,
      totalUsers: stats.totalUsers,
    });
  } catch (err) {
    next(err);
  }
};
