import { prisma } from '../../database';
import { Prisma } from '@prisma/client';

export const createRequest = (data: {
  userId: string;
  type?: string;
  displayName: string;
  description?: string;
  avatarUrl?: string;
  lore?: string;
  surveyAnswers?: string; // JSON string
}) => {
  return prisma.vtuberRequest.create({ data: { ...data, type: data.type || 'VTUBER' } });
};

export const findRequests = (params: {
  skip: number;
  take: number;
  type?: string;
  status?: string;
  search?: string;
}) => {
  const where: Prisma.VtuberRequestWhereInput = {};
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;
  if (params.search) {
    where.displayName = { contains: params.search };
  }

  return prisma.vtuberRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          vtuberProfile: {
            select: { id: true, displayName: true, avatarUrl: true, isApproved: true, isVerified: true },
          },
          streamerProfile: {
            select: { id: true, displayName: true, avatarUrl: true, isApproved: true, isVerified: true },
          },
        },
      },
      reviewedBy: { select: { id: true, username: true } },
    },
  });
};

export const countRequests = (params: { type?: string; status?: string; search?: string }) => {
  const where: Prisma.VtuberRequestWhereInput = {};
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;
  return prisma.vtuberRequest.count({ where });
};

export const findRequestById = (id: string) => {
  return prisma.vtuberRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          vtuberProfile: {
            select: { id: true, displayName: true, avatarUrl: true, description: true, lore: true },
          },
          streamerProfile: {
            select: { id: true, displayName: true, avatarUrl: true, description: true, lore: true },
          },
        },
      },
      reviewedBy: { select: { id: true, username: true } },
    },
  });
};

export const updateRequest = (id: string, data: Prisma.VtuberRequestUpdateInput) => {
  return prisma.vtuberRequest.update({ where: { id }, data });
};

export const findUserRequestPending = (userId: string, type = 'VTUBER') => {
  return prisma.vtuberRequest.findFirst({
    where: { userId, type, status: 'PENDING' },
  });
};
