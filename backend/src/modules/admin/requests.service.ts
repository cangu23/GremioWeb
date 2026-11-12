import * as RequestsRepository from './requests.repository';
import * as AdminRepository from './admin.repository';
import { prisma } from '../../database';
import AppError from '../../errors/AppError';
import { generateCode } from './codes.service';
import * as NotificationsService from '../notifications/notifications.service';
import { parseUserRoles } from '@gremio-estelar/shared';

export type RequestType =
  | 'VTUBER'
  | 'STREAMER'
  | 'ADMIN'
  | 'MODERATOR'
  | 'ARTIST'
  | 'CLIPPER'
  | 'HELPER';

const ROLE_BY_TYPE: Record<RequestType, string> = {
  VTUBER: 'VTUBER',
  STREAMER: 'STREAMER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  ARTIST: 'ARTIST',
  CLIPPER: 'CLIPPER',
  HELPER: 'HELPER',
};

const LABEL_BY_TYPE: Record<RequestType, string> = {
  VTUBER: 'VTuber Oficial',
  STREAMER: 'Streamer Oficial',
  ADMIN: 'Alto Mando Estelar',
  MODERATOR: 'Centinela del Santuario',
  ARTIST: 'Artista Cósmico',
  CLIPPER: 'Clipper & Editor',
  HELPER: 'Guía Estelar',
};

/**
 * Submit an application request
 */
export const submitRequest = async (data: {
  userId: string;
  type?: RequestType;
  displayName: string;
  description?: string;
  avatarUrl?: string;
  lore?: string;
  surveyAnswers?: Record<string, any>;
}) => {
  const type: RequestType = (data.type?.toUpperCase() as RequestType) || 'VTUBER';
  const role = ROLE_BY_TYPE[type] || 'VTUBER';
  const label = LABEL_BY_TYPE[type] || 'VTuber';

  // Check if user already has a pending request of the same type
  const existing = await RequestsRepository.findUserRequestPending(data.userId, type);
  if (existing) {
    throw new AppError('Ya tienes una postulación pendiente para este rol. Espera a que sea revisada.', 409);
  }

  // Check if user already has this role or profile
  const user = await AdminRepository.findUserById(data.userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const userRoles = parseUserRoles(user.role);
  if (userRoles.includes(role)) {
    throw new AppError(`Ya cuentas con el rol de ${label} en tu cuenta`, 400);
  }

  const approvedProfile =
    type === 'STREAMER' ? (user as any)?.streamerProfile?.isApproved : type === 'VTUBER' ? user?.vtuberProfile?.isApproved : false;
  if (approvedProfile) {
    throw new AppError(type === 'STREAMER' ? 'Ya eres un Streamer aprobado' : 'Ya eres un VTuber aprobado', 400);
  }

  const request = await RequestsRepository.createRequest({
    ...data,
    type,
    surveyAnswers: data.surveyAnswers ? JSON.stringify(data.surveyAnswers) : undefined,
  });

  // Notify all admins about the new request (fire & forget)
  const notify = type === 'STREAMER'
    ? NotificationsService.notifyNewStreamerRequest
    : NotificationsService.notifyNewVtuberRequest;
  notify(user.username, data.displayName, request.id).catch(() => {});

  return request;
};

/**
 * Get all requests submitted by a specific user
 */
export const getMyRequests = async (userId: string) => {
  return prisma.vtuberRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      status: true,
      displayName: true,
      notes: true,
      createdAt: true,
      reviewedAt: true,
    },
  });
};

/**
 * List all creator requests (optionally filtered by type)
 */
export const listRequests = async (query: {
  page: number;
  limit: number;
  type?: string;
  status?: string;
  search?: string;
}) => {
  const { page, limit, skip } = { page: query.page, limit: query.limit, skip: (query.page - 1) * query.limit };

  const [data, total] = await Promise.all([
    RequestsRepository.findRequests({ skip, take: limit, type: query.type, status: query.status, search: query.search }),
    RequestsRepository.countRequests({ type: query.type, status: query.status, search: query.search }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Approve a role / creator request - grants the role and notifies user
 */
export const approveRequest = async (id: string, adminId: string) => {
  const request = await RequestsRepository.findRequestById(id);
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.status !== 'PENDING') throw new AppError('La solicitud ya fue procesada', 400);

  const type = (request.type?.toUpperCase() as RequestType) || 'VTUBER';
  const role = ROLE_BY_TYPE[type] || request.type;
  const label = LABEL_BY_TYPE[type] || request.type;

  // Mark request as approved
  await prisma.vtuberRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });

  // Generate secure code for the creator/role
  const codeName = `${role}-${request.displayName}`;
  const codeResult = await generateCode({
    name: codeName,
    role,
    generatedById: adminId,
  });

  // Append role to existing roles (never overwrite: role field
  // can hold multiple comma-separated roles like "USER,MAID").
  const roleList = parseUserRoles(request.user?.role);
  if (!roleList.includes(role)) {
    roleList.push(role);
  }
  await prisma.user.update({
    where: { id: request.userId },
    data: { role: roleList.join(',') },
  });

  // Create or Update creator profile if VTuber or Streamer
  if (type === 'VTUBER' || type === 'STREAMER') {
    const profilePayload = {
      displayName: request.displayName,
      description: request.description || null,
      avatarUrl: request.avatarUrl || null,
      lore: request.lore || null,
      isApproved: true,
      isHidden: false,
      isVerified: true,
    };
    if (type === 'STREAMER') {
      await prisma.streamerProfile.upsert({
        where: { userId: request.userId },
        create: { userId: request.userId, ...profilePayload },
        update: profilePayload,
      });
    } else {
      await prisma.vTuberProfile.upsert({
        where: { userId: request.userId },
        create: { userId: request.userId, ...profilePayload },
        update: profilePayload,
      });
    }
  }

  // Log admin action
  await AdminRepository.createAdminLog({
    userId: adminId,
    action: `APPROVE_${type}_REQUEST`,
    detail: JSON.stringify({
      requestId: id,
      userName: request.user.username,
      displayName: request.displayName,
      codeName,
      grantedRole: role,
    }),
  });

  // Create notification for the user
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: `${type.toLowerCase()}_approved`,
      title: `✦ ¡Tu postulación de ${label} ha sido APROBADA!`,
      message: `¡Felicidades, ${request.displayName}! Tu postulación para ${label} ha sido aprobada por la administración. Ya tienes el rol de ${label} activado en tu perfil.`,
      referenceId: request.id,
    },
  });

  return {
    message: 'Postulación aprobada con éxito.',
    rawCode: codeResult.rawCode,
    codeName: codeResult.name,
    request,
  };
};

/**
 * Reject an application request
 */
export const rejectRequest = async (id: string, adminId: string, notes?: string) => {
  const request = await RequestsRepository.findRequestById(id);
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.status !== 'PENDING') throw new AppError('La solicitud ya fue procesada', 400);

  const type = (request.type?.toUpperCase() as RequestType) || 'VTUBER';
  const label = LABEL_BY_TYPE[type] || request.type;

  await prisma.vtuberRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedById: adminId,
      reviewedAt: new Date(),
      notes: notes ?? null,
    },
  });

  // Log admin action
  await AdminRepository.createAdminLog({
    userId: adminId,
    action: `REJECT_${type}_REQUEST`,
    detail: JSON.stringify({
      requestId: id,
      userName: request.user.username,
      displayName: request.displayName,
      notes,
    }),
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: `${type.toLowerCase()}_rejected`,
      title: `Postulación de ${label}`,
      message: `Tu postulación para ${label} no fue aprobada en esta ocasión.${notes ? ` Motivo: ${notes}` : ' Puedes volver a intentarlo más adelante.'}`,
      referenceId: request.id,
    },
  });

  return { message: 'Postulación rechazada' };
};
