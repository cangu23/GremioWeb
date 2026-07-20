import { prisma } from '../../database';
import { Prisma } from '@prisma/client';

// ========== USERS ==========

export const findUsers = (params: {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  role?: string;
}) => {
  const where: Prisma.UserWhereInput = {};

  if (params.search) {
    where.OR = [
      { username: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }
  if (params.status) where.status = params.status;
  if (params.role) where.role = params.role;

  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortField]: sortOrder } as Prisma.UserOrderByWithRelationInput;

  return prisma.user.findMany({
    where,
    orderBy,
    skip: params.skip,
    take: params.take,
    include: {
      vtuberProfile: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
          isApproved: true,
          isFeatured: true,
          isHidden: true,
        },
      },
      _count: {
        select: {
          posts: true,
          comments: true,
          likes: true,
          followers: true,
          following: true,
          notifications: true,
        },
      },
    },
  });
};

export const countUsers = (params: { search?: string; status?: string; role?: string }) => {
  const where: Prisma.UserWhereInput = {};
  if (params.search) {
    where.OR = [
      { username: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }
  if (params.status) where.status = params.status;
  if (params.role) where.role = params.role;
  return prisma.user.count({ where });
};

export const findUserById = (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      vtuberProfile: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          likes: true,
          followers: true,
          following: true,
          eventsCreated: true,
          guildMembers: true,
        },
      },
    },
  });
};

export const updateUser = (id: string, data: Prisma.UserUpdateInput) => {
  return prisma.user.update({
    where: { id },
    data,
    include: { vtuberProfile: true },
  });
};

export const deleteUser = (id: string) => {
  return prisma.user.delete({ where: { id } });
};

// ========== VTUBER PROFILES ==========

export const findVtuberProfiles = (params: {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isVerified?: boolean;
  isApproved?: boolean;
  isHidden?: boolean;
  isFeatured?: boolean;
}) => {
  const where: Prisma.VTuberProfileWhereInput = {};

  if (params.search) {
    where.OR = [
      { displayName: { contains: params.search } },
      { user: { username: { contains: params.search } } },
    ];
  }
  if (params.isVerified !== undefined) where.isVerified = params.isVerified;
  if (params.isApproved !== undefined) where.isApproved = params.isApproved;
  if (params.isHidden !== undefined) where.isHidden = params.isHidden;
  if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;

  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortField]: sortOrder } as Prisma.VTuberProfileOrderByWithRelationInput;

  return prisma.vTuberProfile.findMany({
    where,
    orderBy,
    skip: params.skip,
    take: params.take,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          xp: true,
          level: true,
        },
      },
    },
  });
};

export const countVtuberProfiles = (params: {
  search?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  isHidden?: boolean;
  isFeatured?: boolean;
}) => {
  const where: Prisma.VTuberProfileWhereInput = {};
  if (params.search) {
    where.OR = [
      { displayName: { contains: params.search } },
      { user: { username: { contains: params.search } } },
    ];
  }
  if (params.isVerified !== undefined) where.isVerified = params.isVerified;
  if (params.isApproved !== undefined) where.isApproved = params.isApproved;
  if (params.isHidden !== undefined) where.isHidden = params.isHidden;
  if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;
  return prisma.vTuberProfile.count({ where });
};

export const findVtuberProfileById = (id: string) => {
  return prisma.vTuberProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          xp: true,
          level: true,
          _count: {
            select: { followers: true, following: true },
          },
        },
      },
    },
  });
};

export const updateVtuberProfile = (id: string, data: Prisma.VTuberProfileUpdateInput) => {
  return prisma.vTuberProfile.update({
    where: { id },
    data,
    include: { user: { select: { id: true, username: true } } },
  });
};

// ========== EVENTS ==========

export const findEvents = (params: {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}) => {
  const where: Prisma.EventWhereInput = {};
  if (params.search) {
    where.OR = [
      { title: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }
  if (params.status) where.status = params.status;

  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortField]: sortOrder } as Prisma.EventOrderByWithRelationInput;

  return prisma.event.findMany({
    where,
    orderBy,
    skip: params.skip,
    take: params.take,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { attendees: true } },
    },
  });
};

export const countEvents = (params: { search?: string; status?: string }) => {
  const where: Prisma.EventWhereInput = {};
  if (params.search) {
    where.OR = [
      { title: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }
  if (params.status) where.status = params.status;
  return prisma.event.count({ where });
};

export const findEventById = (id: string) => {
  return prisma.event.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      attendees: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              vtuberProfile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
      _count: { select: { attendees: true } },
    },
  });
};

export const updateEvent = (id: string, data: Prisma.EventUpdateInput) => {
  return prisma.event.update({ where: { id }, data });
};

export const deleteEvent = (id: string) => {
  return prisma.event.delete({ where: { id } });
};

// ========== GUILDS ==========

export const findGuilds = (params: {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const where: Prisma.GuildWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortField]: sortOrder } as Prisma.GuildOrderByWithRelationInput;

  return prisma.guild.findMany({
    where,
    orderBy,
    skip: params.skip,
    take: params.take,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { members: true } },
    },
  });
};

export const countGuilds = (params: { search?: string }) => {
  const where: Prisma.GuildWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }
  return prisma.guild.count({ where });
};

export const findGuildById = (id: string) => {
  return prisma.guild.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              vtuberProfile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
      _count: { select: { members: true } },
    },
  });
};

export const updateGuild = (id: string, data: Prisma.GuildUpdateInput) => {
  return prisma.guild.update({ where: { id }, data });
};

export const deleteGuild = (id: string) => {
  return prisma.guild.delete({ where: { id } });
};

// ========== POSTS ==========

export const findPosts = (params: {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isHidden?: boolean;
}) => {
  const where: Prisma.PostWhereInput = {};
  if (params.search) {
    where.content = { contains: params.search };
  }
  if (params.isHidden !== undefined) where.isHidden = params.isHidden;

  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortField]: sortOrder } as Prisma.PostOrderByWithRelationInput;

  return prisma.post.findMany({
    where,
    orderBy,
    skip: params.skip,
    take: params.take,
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
  });
};

export const countPosts = (params: { search?: string; isHidden?: boolean }) => {
  const where: Prisma.PostWhereInput = {};
  if (params.search) where.content = { contains: params.search };
  if (params.isHidden !== undefined) where.isHidden = params.isHidden;
  return prisma.post.count({ where });
};

export const findPostById = (id: string) => {
  return prisma.post.findUnique({
    where: { id },
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
  });
};

export const updatePost = (id: string, data: Prisma.PostUpdateInput) => {
  return prisma.post.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });
};

export const deletePost = (id: string) => {
  return prisma.post.delete({ where: { id } });
};

// ========== COMMENTS ==========

export const findComments = (params: {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isHidden?: boolean;
}) => {
  const where: Prisma.CommentWhereInput = {};
  if (params.search) {
    where.content = { contains: params.search };
  }
  if (params.isHidden !== undefined) where.isHidden = params.isHidden;

  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortField]: sortOrder } as Prisma.CommentOrderByWithRelationInput;

  return prisma.comment.findMany({
    where,
    orderBy,
    skip: params.skip,
    take: params.take,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      post: { select: { id: true, content: true } },
    },
  });
};

export const countComments = (params: { search?: string; isHidden?: boolean }) => {
  const where: Prisma.CommentWhereInput = {};
  if (params.search) where.content = { contains: params.search };
  if (params.isHidden !== undefined) where.isHidden = params.isHidden;
  return prisma.comment.count({ where });
};

export const findCommentById = (id: string) => {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      post: { select: { id: true, content: true } },
    },
  });
};

export const updateComment = (id: string, data: Prisma.CommentUpdateInput) => {
  return prisma.comment.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });
};

export const deleteComment = (id: string) => {
  return prisma.comment.delete({ where: { id } });
};

// ========== REPORTS ==========

export const createReport = (data: {
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
}) => {
  return prisma.report.create({ data });
};

export const findReports = (params: {
  skip: number;
  take: number;
  status?: string;
  targetType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const where: Prisma.ReportWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.targetType) where.targetType = params.targetType;

  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortField]: sortOrder } as Prisma.ReportOrderByWithRelationInput;

  return prisma.report.findMany({
    where,
    orderBy,
    skip: params.skip,
    take: params.take,
    include: {
      reporter: { select: { id: true, username: true } },
      moderator: { select: { id: true, username: true } },
    },
  });
};

export const countReports = (params: { status?: string; targetType?: string }) => {
  const where: Prisma.ReportWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.targetType) where.targetType = params.targetType;
  return prisma.report.count({ where });
};

export const findReportById = (id: string) => {
  return prisma.report.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, username: true } },
      moderator: { select: { id: true, username: true } },
    },
  });
};

export const updateReport = (id: string, data: Prisma.ReportUpdateInput) => {
  return prisma.report.update({
    where: { id },
    data,
    include: {
      reporter: { select: { id: true, username: true } },
      moderator: { select: { id: true, username: true } },
    },
  });
};

// ========== ADMIN LOGS ==========

export const createAdminLog = (data: {
  userId: string;
  action: string;
  detail?: string;
  ip?: string;
}) => {
  return prisma.adminLog.create({ data });
};

export const findAdminLogs = (params: {
  skip: number;
  take: number;
  action?: string;
  userId?: string;
}) => {
  const where: Prisma.AdminLogWhereInput = {};
  if (params.action) where.action = params.action;
  if (params.userId) where.userId = params.userId;

  return prisma.adminLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
    include: {
      user: { select: { id: true, username: true } },
    },
  });
};

export const countAdminLogs = (params: { action?: string; userId?: string }) => {
  const where: Prisma.AdminLogWhereInput = {};
  if (params.action) where.action = params.action;
  if (params.userId) where.userId = params.userId;
  return prisma.adminLog.count({ where });
};

// ========== STATISTICS ==========

export const getDashboardStats = async () => {
  const [
    totalUsers,
    activeUsers,
    totalVtubers,
    totalMaids,
    totalVtubersLive,
    totalGuilds,
    totalEvents,
    totalPosts,
    totalComments,
    totalLikes,
    totalMessages,
    pendingReports,
    pendingVtuberRequests,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    pendingVerifications,
    usersByRole,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.vTuberProfile.count(),
    prisma.user.count({ where: { role: 'MAID' } }),
    prisma.vTuberProfile.count({ where: { isLive: true } }),
    prisma.guild.count(),
    prisma.event.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.like.count(),
    prisma.chatMessage.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.vtuberRequest.count({ where: { status: 'PENDING' } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.vTuberProfile.count({ where: { isApproved: true, isVerified: false } }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
  ]);

  const userCountByRole: Record<string, number> = {};
  for (const entry of usersByRole) {
    userCountByRole[entry.role] = entry._count;
  }

  return {
    totalUsers,
    activeUsers,
    totalVtubers,
    totalMaids,
    totalVtubersLive,
    totalGuilds,
    totalEvents,
    totalPosts,
    totalComments,
    totalLikes,
    totalMessages,
    pendingReports,
    pendingVtuberRequests,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    pendingVerifications,
    userCountByRole,
  };
};

// ========== ACTIVITY LOGS ==========

export const getRecentActivity = async (limit = 20) => {
  return prisma.adminLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, username: true } },
    },
  });
};
