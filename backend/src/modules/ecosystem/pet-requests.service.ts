import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';

/**
 * User submits a new pet request
 */
export const createPetRequest = async (
  userId: string,
  data: { petName: string; description?: string; referenceUrl?: string }
) => {
  if (!data.petName || data.petName.trim().length === 0) {
    throw new AppError('El nombre de la mascota es requerido', 400);
  }

  // Check if user has a PENDING request already
  const existingPending = await prisma.petRequest.findFirst({
    where: { userId, status: 'PENDING' },
  });

  if (existingPending) {
    throw new AppError('Ya tienes una solicitud de mascota pendiente. Espera a que el administrador la revise.', 400);
  }

  const petRequest = await prisma.petRequest.create({
    data: {
      userId,
      petName: data.petName.trim(),
      description: data.description?.trim() || null,
      referenceUrl: data.referenceUrl?.trim() || null,
      status: 'PENDING',
    },
  });

  return petRequest;
};

/**
 * Get user's own pet requests
 */
export const getUserPetRequests = async (userId: string) => {
  return prisma.petRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Admin: List all pet requests
 */
export const listPetRequestsAdmin = async (query: { status?: string; page?: number; limit?: number }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  const [requests, total, pendingCount] = await Promise.all([
    prisma.petRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.petRequest.count({ where }),
    prisma.petRequest.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    pendingCount,
  };
};

/**
 * Admin: Approve a pet request
 */
export const approvePetRequestAdmin = async (
  requestId: string,
  reviewerId: string,
  data: { image1Url: string; image2Url?: string; adminNote?: string }
) => {
  if (!data.image1Url || data.image1Url.trim().length === 0) {
    throw new AppError('Debes ingresar al menos una imagen/GIF para la mascota', 400);
  }

  const request = await prisma.petRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!request) {
    throw new AppError('Solicitud de mascota no encontrada', 404);
  }

  const updatedRequest = await prisma.petRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      image1Url: data.image1Url.trim(),
      image2Url: data.image2Url?.trim() || null,
      adminNote: data.adminNote?.trim() || null,
      reviewerId,
    },
  });

  // Equip pet on user profile automatically
  await prisma.user.update({
    where: { id: request.userId },
    data: {
      profilePet: data.image1Url.trim(),
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'pet_approved',
      title: '🐾 ¡Tu Mascota ha sido Creada y Aprobada!',
      message: `¡Felicidades! La mascota "${request.petName}" solicitada ha sido procesada por la administración y ya está equipada en tu perfil.`,
      referenceId: request.id,
    },
  }).catch(() => {});

  return updatedRequest;
};

/**
 * Admin: Reject a pet request
 */
export const rejectPetRequestAdmin = async (
  requestId: string,
  reviewerId: string,
  data: { adminNote?: string }
) => {
  const request = await prisma.petRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!request) {
    throw new AppError('Solicitud de mascota no encontrada', 404);
  }

  const updatedRequest = await prisma.petRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      adminNote: data.adminNote?.trim() || null,
      reviewerId,
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'pet_rejected',
      title: '🐾 Solicitud de Mascota Rechazada',
      message: `Tu solicitud para la mascota "${request.petName}" fue revisada. Razón: ${data.adminNote || 'No cumple con las pautas actuales.'}`,
      referenceId: request.id,
    },
  }).catch(() => {});

  return updatedRequest;
};
