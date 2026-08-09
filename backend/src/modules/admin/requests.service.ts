import * as RequestsRepository from './requests.repository';
import * as AdminRepository from './admin.repository';
import { prisma } from '../../database';
import AppError from '../../errors/AppError';
import { generateCode } from './codes.service';
import * as NotificationsService from '../notifications/notifications.service';
import { parseUserRoles } from '@gremio-estelar/shared';

export type RequestType = 'VTUBER' | 'STREAMER';

const ROLE_BY_TYPE: Record<RequestType, string> = {
  VTUBER: 'VTUBER',
  STREAMER: 'STREAMER',
};

/**
 * Submit a creator request (VTuber or Streamer)
 */
export const submitRequest = async (data: {
  userId: string;
  type?: RequestType;
  displayName: string;
  description?: string;
  avatarUrl?: string;
  lore?: string;
  surveyAnswers?: Record<string, string>;
}) => {
  const type: RequestType = data.type === 'STREAMER' ? 'STREAMER' : 'VTUBER';

  // Check if user already has a pending request of the same type
  const existing = await RequestsRepository.findUserRequestPending(data.userId, type);
  if (existing) {
    throw new AppError('Ya tienes una solicitud pendiente. Espera a que sea revisada.', 409);
  }

  // Check if user already has an approved profile of this type
  const user = await AdminRepository.findUserById(data.userId);
  const approvedProfile =
    type === 'STREAMER' ? (user as any)?.streamerProfile?.isApproved : user?.vtuberProfile?.isApproved;
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
  notify(user!.username, data.displayName, request.id).catch(() => {});

  return request;
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
 * Approve a creator request - generates a code for the user
 */
export const approveRequest = async (id: string, adminId: string) => {
  const request = await RequestsRepository.findRequestById(id);
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.status !== 'PENDING') throw new AppError('La solicitud ya fue procesada', 400);

  const type: RequestType = request.type === 'STREAMER' ? 'STREAMER' : 'VTUBER';
  const role = ROLE_BY_TYPE[type];
  const label = type === 'STREAMER' ? 'Streamer' : 'VTuber';

  // Mark request as approved (scalar field name)
  await prisma.vtuberRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });

  // Generate secure code for the creator role
  const codeName = `${label}-${request.displayName}`;
  const codeResult = await generateCode({
    name: codeName,
    role,
    generatedById: adminId,
  });

  // Append role to existing roles (never overwrite: the role field
  // can hold multiple comma-separated roles like "USER,MAID").
  const roleList = parseUserRoles(request.user?.role);
  if (!roleList.includes(role)) {
    roleList.push(role);
  }
  await prisma.user.update({
    where: { id: request.userId },
    data: { role: roleList.join(',') },
  });

  // Create or Update the creator profile with isApproved: true and isVerified: true
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

  // Log admin action
  await AdminRepository.createAdminLog({
    userId: adminId,
    action: type === 'STREAMER' ? 'APPROVE_STREAMER_REQUEST' : 'APPROVE_VTUBER_REQUEST',
    detail: JSON.stringify({
      requestId: id,
      userName: request.user.username,
      displayName: request.displayName,
      codeName,
    }),
  });

  // Create notification for the user
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: type === 'STREAMER' ? 'streamer_approved' : 'vtuber_approved',
      title: `✨ ¡Tu solicitud de ${label} ha sido APROBADA!`,
      message: `¡Felicidades, ${request.displayName}! Tu solicitud para ser ${label} oficial ha sido aprobada por la administración. Ya tienes el rol de ${label} y tu insignia de verificación activada.`,
      referenceId: request.id,
    },
  });

  return {
    message: 'Solicitud aprobada. Se ha generado un código único para el usuario.',
    rawCode: codeResult.rawCode,
    codeName: codeResult.name,
    request,
  };
};

/**
 * Reject a creator request
 */
export const rejectRequest = async (id: string, adminId: string, notes?: string) => {
  const request = await RequestsRepository.findRequestById(id);
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.status !== 'PENDING') throw new AppError('La solicitud ya fue procesada', 400);

  const type: RequestType = request.type === 'STREAMER' ? 'STREAMER' : 'VTUBER';
  const label = type === 'STREAMER' ? 'Streamer' : 'VTuber';

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
    action: type === 'STREAMER' ? 'REJECT_STREAMER_REQUEST' : 'REJECT_VTUBER_REQUEST',
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
      type: type === 'STREAMER' ? 'streamer_rejected' : 'vtuber_rejected',
      title: `Solicitud de ${label}`,
      message: `Tu solicitud para ser ${label} no fue aprobada en esta ocasión.${notes ? ` Motivo: ${notes}` : ' Puedes intentarlo de nuevo más tarde.'}`,
      referenceId: request.id,
    },
  });

  return { message: 'Solicitud rechazada' };
};
