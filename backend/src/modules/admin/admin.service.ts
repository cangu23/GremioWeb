import { Prisma } from '@prisma/client';
import * as AdminRepository from './admin.repository';
import AppError from '../../errors/AppError';
import { AdminQueryInput, PaginatedResponse } from './admin.types';
import { UpdateUserAdminInput, UpdateVtuberAdminInput, UpdateEventAdminInput, UpdateGuildAdminInput, UpdatePostAdminInput, UpdateCommentAdminInput } from './admin.types';

// ========== HELPERS ==========

function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

function extractPagination(query: AdminQueryInput) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

async function logAdminAction(userId: string, action: string, detail?: Record<string, unknown>, ip?: string) {
  try {
    await AdminRepository.createAdminLog({
      userId,
      action,
      detail: detail ? JSON.stringify(detail) : undefined,
      ip,
    });
  } catch (err) {
    console.error('[AdminLog] Error logging action:', err);
  }
}

// ========== DASHBOARD STATISTICS ==========

export const getDashboardStats = async () => {
  return AdminRepository.getDashboardStats();
};

export const getRecentActivity = async (limit = 20) => {
  return AdminRepository.getRecentActivity(limit);
};

// ========== USERS ==========

export const listUsers = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);
  const [data, total] = await Promise.all([
    AdminRepository.findUsers({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
      role: query.role,
    }),
    AdminRepository.countUsers({
      search: query.search,
      status: query.status,
      role: query.role,
    }),
  ]);
  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getUserDetail = async (id: string) => {
  const user = await AdminRepository.findUserById(id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return user;
};

export const updateUser = async (id: string, data: UpdateUserAdminInput, adminId: string, ip?: string) => {
  const user = await AdminRepository.findUserById(id);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const changes: string[] = [];
  if (data.role && data.role !== user.role) {
    changes.push(`rol: ${user.role} → ${data.role}`);
  }
  if (data.status && data.status !== user.status) {
    changes.push(`estado: ${user.status} → ${data.status}`);
  }
  if (data.username && data.username !== user.username) {
    changes.push(`username: ${user.username} → ${data.username}`);
  }

  const updated = await AdminRepository.updateUser(id, data);

  if (changes.length > 0) {
    await logAdminAction(adminId, data.status === 'BANNED' ? 'BAN_USER' : data.status === 'SUSPENDED' ? 'SUSPEND_USER' : 'UPDATE_USER', {
      targetUserId: id,
      targetUsername: user.username,
      changes,
    }, ip);
  }

  return updated;
};

export const deleteUser = async (id: string, adminId: string, ip?: string) => {
  const user = await AdminRepository.findUserById(id);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  await AdminRepository.deleteUser(id);

  await logAdminAction(adminId, 'DELETE_USER', {
    targetUserId: id,
    targetUsername: user.username,
  }, ip);

  return { message: 'Usuario eliminado permanentemente' };
};

export const restoreUser = async (id: string, adminId: string, ip?: string) => {
  const user = await AdminRepository.findUserById(id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  if (user.status !== 'BANNED' && user.status !== 'SUSPENDED') {
    throw new AppError('El usuario no está suspendido o baneado', 400);
  }

  const updated = await AdminRepository.updateUser(id, { status: 'ACTIVE' });

  await logAdminAction(adminId, 'RESTORE_USER', {
    targetUserId: id,
    targetUsername: user.username,
    previousStatus: user.status,
  }, ip);

  return updated;
};

// ========== VTUBERS ==========

export const listVtubers = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const filters: Record<string, boolean> = {};
  if (query.isVerified !== undefined) filters.isVerified = query.isVerified === 'true';
  if (query.isApproved !== undefined) filters.isApproved = query.isApproved === 'true';
  if (query.isHidden !== undefined) filters.isHidden = query.isHidden === 'true';
  if (query.isFeatured !== undefined) filters.isFeatured = query.isFeatured === 'true';

  const [data, total] = await Promise.all([
    AdminRepository.findVtuberProfiles({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      ...filters,
    }),
    AdminRepository.countVtuberProfiles(filters),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getVtuberDetail = async (id: string) => {
  const profile = await AdminRepository.findVtuberProfileById(id);
  if (!profile) throw new AppError('Perfil VTuber no encontrado', 404);
  return profile;
};

export const updateVtuber = async (id: string, data: UpdateVtuberAdminInput, adminId: string, ip?: string) => {
  const profile = await AdminRepository.findVtuberProfileById(id);
  if (!profile) throw new AppError('Perfil VTuber no encontrado', 404);

  const updated = await AdminRepository.updateVtuberProfile(id, data);

  const changes: string[] = [];
  if (data.isVerified !== undefined && data.isVerified !== profile.isVerified) {
    changes.push(data.isVerified ? 'verificado' : 'verificación removida');
  }
  if (data.isApproved !== undefined && data.isApproved !== profile.isApproved) {
    changes.push(data.isApproved ? 'aprobado' : 'aprobación removida');
  }
  if (data.isFeatured !== undefined && data.isFeatured !== profile.isFeatured) {
    changes.push(data.isFeatured ? 'destacado' : 'no destacado');
  }
  if (data.isHidden !== undefined && data.isHidden !== profile.isHidden) {
    changes.push(data.isHidden ? 'oculto' : 'visible');
  }

  if (changes.length > 0) {
    await logAdminAction(adminId, 'UPDATE_VTUBER', {
      targetProfileId: id,
      displayName: profile.displayName,
      changes,
    }, ip);
  }

  return updated;
};

// ========== EVENTS ==========

export const listEvents = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const [data, total] = await Promise.all([
    AdminRepository.findEvents({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
    }),
    AdminRepository.countEvents({
      search: query.search,
      status: query.status,
    }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getEventDetail = async (id: string) => {
  const event = await AdminRepository.findEventById(id);
  if (!event) throw new AppError('Evento no encontrado', 404);
  return event;
};

export const updateEvent = async (id: string, data: UpdateEventAdminInput, adminId: string, ip?: string) => {
  const event = await AdminRepository.findEventById(id);
  if (!event) throw new AppError('Evento no encontrado', 404);

  const updateData: Record<string, unknown> = { ...data };
  if (data.date) {
    const eventDate = new Date(data.date);
    if (isNaN(eventDate.getTime())) throw new AppError('Fecha inválida', 400);
    updateData.date = eventDate;
  }

  const updated = await AdminRepository.updateEvent(id, updateData);

  if (data.status === 'CANCELLED' && event.status !== 'CANCELLED') {
    await logAdminAction(adminId, 'CANCEL_EVENT', {
      targetEventId: id,
      eventTitle: event.title,
    }, ip);
  } else if (data.isFeatured !== undefined && data.isFeatured !== event.isFeatured) {
    await logAdminAction(adminId, 'FEATURE_EVENT', {
      targetEventId: id,
      eventTitle: event.title,
      featured: data.isFeatured,
    }, ip);
  }

  return updated;
};

export const deleteEvent = async (id: string, adminId: string, ip?: string) => {
  const event = await AdminRepository.findEventById(id);
  if (!event) throw new AppError('Evento no encontrado', 404);

  await AdminRepository.deleteEvent(id);
  await logAdminAction(adminId, 'DELETE_EVENT', {
    targetEventId: id,
    eventTitle: event.title,
  }, ip);

  return { message: 'Evento eliminado permanentemente' };
};

// ========== GUILDS ==========

export const listGuilds = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const [data, total] = await Promise.all([
    AdminRepository.findGuilds({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    AdminRepository.countGuilds({ search: query.search }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getGuildDetail = async (id: string) => {
  const guild = await AdminRepository.findGuildById(id);
  if (!guild) throw new AppError('Gremio no encontrado', 404);
  return guild;
};

export const updateGuild = async (id: string, data: UpdateGuildAdminInput, adminId: string, ip?: string) => {
  const guild = await AdminRepository.findGuildById(id);
  if (!guild) throw new AppError('Gremio no encontrado', 404);

  const updated = await AdminRepository.updateGuild(id, data);

  if (data.isSuspended !== undefined && data.isSuspended !== guild.isSuspended) {
    await logAdminAction(adminId, data.isSuspended ? 'SUSPEND_GUILD' : 'UNSUSPEND_GUILD', {
      targetGuildId: id,
      guildName: guild.name,
    }, ip);
  }

  return updated;
};

export const deleteGuild = async (id: string, adminId: string, ip?: string) => {
  const guild = await AdminRepository.findGuildById(id);
  if (!guild) throw new AppError('Gremio no encontrado', 404);

  await AdminRepository.deleteGuild(id);
  await logAdminAction(adminId, 'DELETE_GUILD', {
    targetGuildId: id,
    guildName: guild.name,
  }, ip);

  return { message: 'Gremio eliminado permanentemente' };
};

// ========== POSTS ==========

export const listPosts = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const filters: Record<string, boolean> = {};
  if (query.isHidden !== undefined) filters.isHidden = query.isHidden === 'true';

  const [data, total] = await Promise.all([
    AdminRepository.findPosts({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      ...filters,
    }),
    AdminRepository.countPosts({ search: query.search, ...filters }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getPostDetail = async (id: string) => {
  const post = await AdminRepository.findPostById(id);
  if (!post) throw new AppError('Publicación no encontrada', 404);
  return post;
};

export const updatePost = async (id: string, data: UpdatePostAdminInput, adminId: string, ip?: string) => {
  const post = await AdminRepository.findPostById(id);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  const updated = await AdminRepository.updatePost(id, data);

  if (data.isHidden !== undefined && data.isHidden !== post.isHidden) {
    await logAdminAction(adminId, data.isHidden ? 'HIDE_POST' : 'UNHIDE_POST', {
      targetPostId: id,
      postOwnerId: post.userId,
    }, ip);
  }
  if (data.isPinned !== undefined && data.isPinned !== post.isPinned) {
    await logAdminAction(adminId, data.isPinned ? 'PIN_POST' : 'UNPIN_POST', {
      targetPostId: id,
    }, ip);
  }
  if (data.isFeatured !== undefined && data.isFeatured !== post.isFeatured) {
    await logAdminAction(adminId, data.isFeatured ? 'FEATURE_POST' : 'UNFEATURE_POST', {
      targetPostId: id,
    }, ip);
  }

  return updated;
};

export const deletePost = async (id: string, adminId: string, ip?: string) => {
  const post = await AdminRepository.findPostById(id);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  await AdminRepository.deletePost(id);
  await logAdminAction(adminId, 'DELETE_POST', {
    targetPostId: id,
    postOwnerId: post.userId,
  }, ip);

  return { message: 'Publicación eliminada permanentemente' };
};

export const restorePost = async (id: string, adminId: string, ip?: string) => {
  const post = await AdminRepository.findPostById(id);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  const updated = await AdminRepository.updatePost(id, { isHidden: false });
  await logAdminAction(adminId, 'RESTORE_POST', {
    targetPostId: id,
  }, ip);

  return updated;
};

// ========== COMMENTS ==========

export const listComments = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const filters: Record<string, boolean> = {};
  if (query.isHidden !== undefined) filters.isHidden = query.isHidden === 'true';

  const [data, total] = await Promise.all([
    AdminRepository.findComments({
      skip,
      take: limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      ...filters,
    }),
    AdminRepository.countComments({ search: query.search, ...filters }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const updateComment = async (id: string, data: UpdateCommentAdminInput, adminId: string, ip?: string) => {
  const comment = await AdminRepository.findCommentById(id);
  if (!comment) throw new AppError('Comentario no encontrado', 404);

  const updated = await AdminRepository.updateComment(id, data);

  if (data.isHidden !== undefined && data.isHidden !== comment.isHidden) {
    await logAdminAction(adminId, data.isHidden ? 'HIDE_COMMENT' : 'UNHIDE_COMMENT', {
      targetCommentId: id,
    }, ip);
  }

  return updated;
};

export const deleteComment = async (id: string, adminId: string, ip?: string) => {
  const comment = await AdminRepository.findCommentById(id);
  if (!comment) throw new AppError('Comentario no encontrado', 404);

  await AdminRepository.deleteComment(id);
  await logAdminAction(adminId, 'DELETE_COMMENT', {
    targetCommentId: id,
  }, ip);

  return { message: 'Comentario eliminado permanentemente' };
};

// ========== REPORTS ==========

export const createReport = async (data: {
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
}) => {
  return AdminRepository.createReport(data);
};

export const listReports = async (query: AdminQueryInput): Promise<PaginatedResponse<any>> => {
  const { page, limit, skip } = extractPagination(query);

  const [data, total] = await Promise.all([
    AdminRepository.findReports({
      skip,
      take: limit,
      status: query.status,
      targetType: query.search, // Reuse search for targetType filter if needed
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    AdminRepository.countReports({ status: query.status }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const resolveReport = async (id: string, data: { status: string; resolution?: string }, adminId: string, ip?: string) => {
  const report = await AdminRepository.findReportById(id);
  if (!report) throw new AppError('Reporte no encontrado', 404);

  const updated = await AdminRepository.updateReport(id, {
    status: data.status,
    resolution: data.resolution,
    moderatorId: adminId,
  } as Prisma.ReportUpdateInput);

  await logAdminAction(adminId, 'RESOLVE_REPORT', {
    reportId: id,
    status: data.status,
    targetType: report.targetType,
    targetId: report.targetId,
  }, ip);

  return updated;
};

// ========== LOGS ==========

export const listLogs = async (query: AdminQueryInput): Promise<PaginatedResponse<unknown>> => {
  const { page, limit, skip } = extractPagination(query);

  const [data, total] = await Promise.all([
    AdminRepository.findAdminLogs({
      skip,
      take: limit,
    }),
    AdminRepository.countAdminLogs({}),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};
