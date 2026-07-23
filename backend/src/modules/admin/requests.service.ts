import * as RequestsRepository from './requests.repository';
import * as AdminRepository from './admin.repository';
import { prisma } from '../../database';
import AppError from '../../errors/AppError';
import { generateCode } from './codes.service';
import * as NotificationsService from '../notifications/notifications.service';

/**
 * Submit a VTuber request
 */
export const submitRequest = async (data: {
  userId: string;
  displayName: string;
  description?: string;
  avatarUrl?: string;
  lore?: string;
  surveyAnswers?: Record<string, string>;
}) => {
  // Check if user already has a pending request
  const existing = await RequestsRepository.findUserRequestPending(data.userId);
  if (existing) {
    throw new AppError('Ya tienes una solicitud pendiente. Espera a que sea revisada.', 409);
  }

  // Check if user already has a VTuber profile
  const user = await AdminRepository.findUserById(data.userId);
  if (user?.vtuberProfile?.isApproved) {
    throw new AppError('Ya eres un VTuber aprobado', 400);
  }

  const request = await RequestsRepository.createRequest({
    ...data,
    surveyAnswers: data.surveyAnswers ? JSON.stringify(data.surveyAnswers) : undefined,
  });

  // Notify all admins about the new request (fire & forget)
  NotificationsService.notifyNewVtuberRequest(
    user!.username,
    data.displayName,
    request.id
  ).catch(() => {});

  return request;
};

/**
 * List all VTuber requests
 */
export const listRequests = async (query: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}) => {
  const { page, limit, skip } = { page: query.page, limit: query.limit, skip: (query.page - 1) * query.limit };

  const [data, total] = await Promise.all([
    RequestsRepository.findRequests({ skip, take: limit, status: query.status, search: query.search }),
    RequestsRepository.countRequests({ status: query.status, search: query.search }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Approve a VTuber request - generates a code for the user
 */
export const approveRequest = async (id: string, adminId: string) => {
  const request = await RequestsRepository.findRequestById(id);
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.status !== 'PENDING') throw new AppError('La solicitud ya fue procesada', 400);

  // Mark request as approved (scalar field name)
  await prisma.vtuberRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });

  // Generate secure code for the VTuber role
  const codeName = `VTuber-${request.displayName}`;
  const codeResult = await generateCode({
    name: codeName,
    role: 'VTUBER',
    generatedById: adminId,
  });

  // Update User role directly to VTUBER
  await prisma.user.update({
    where: { id: request.userId },
    data: { role: 'VTUBER' },
  });

  // Create or Update VTuber profile with isApproved: true and isVerified: true
  await prisma.vTuberProfile.upsert({
    where: { userId: request.userId },
    create: {
      userId: request.userId,
      displayName: request.displayName,
      description: request.description || null,
      avatarUrl: request.avatarUrl || null,
      lore: request.lore || null,
      isApproved: true,
      isHidden: false,
      isVerified: true,
    },
    update: {
      displayName: request.displayName,
      description: request.description ?? undefined,
      avatarUrl: request.avatarUrl ?? undefined,
      lore: request.lore ?? undefined,
      isApproved: true,
      isHidden: false,
      isVerified: true,
    },
  });

  // Log admin action
  await AdminRepository.createAdminLog({
    userId: adminId,
    action: 'APPROVE_VTUBER_REQUEST',
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
      type: 'vtuber_approved',
      title: '✨ ¡Tu solicitud de VTuber ha sido APROBADA!',
      message: `¡Felicidades, ${request.displayName}! Tu solicitud para ser VTuber oficial ha sido aprobada por la administración. Ya tienes el rol de VTuber y tu insignia de verificación activada.`,
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
 * Reject a VTuber request
 */
export const rejectRequest = async (id: string, adminId: string, notes?: string) => {
  const request = await RequestsRepository.findRequestById(id);
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.status !== 'PENDING') throw new AppError('La solicitud ya fue procesada', 400);

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
    action: 'REJECT_VTUBER_REQUEST',
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
      type: 'vtuber_rejected',
      title: 'Solicitud de VTuber',
      message: `Tu solicitud para ser VTuber no fue aprobada en esta ocasión.${notes ? ` Motivo: ${notes}` : ' Puedes intentarlo de nuevo más tarde.'}`,
      referenceId: request.id,
    },
  });

  return { message: 'Solicitud rechazada' };
};

/**
 * Get a single request detail
 */
export const getRequestDetail = async (id: string) => {
  const request = await RequestsRepository.findRequestById(id);
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  return request;
};
