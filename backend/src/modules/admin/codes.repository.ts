import { prisma } from '../../database';
import { Prisma } from '@prisma/client';

export const createCode = (data: {
  code: string;
  name: string;
  role: string;
  generatedById: string;
  expiresAt?: Date | null;
}) => {
  return prisma.roleCode.create({ data });
};

export const findCodes = (params: {
  skip: number;
  take: number;
  status?: string;
  role?: string;
  search?: string;
}) => {
  const where: Prisma.RoleCodeWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.role) where.role = params.role;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
    ];
  }

  return prisma.roleCode.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
    include: {
      generatedBy: { select: { id: true, username: true } },
      usedBy: { select: { id: true, username: true } },
    },
  });
};

export const countCodes = (params: { status?: string; role?: string; search?: string }) => {
  const where: Prisma.RoleCodeWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.role) where.role = params.role;
  return prisma.roleCode.count({ where });
};

export const updateCode = (id: string, data: Prisma.RoleCodeUpdateInput) => {
  return prisma.roleCode.update({ where: { id }, data });
};

export const findCodeById = (id: string) => {
  return prisma.roleCode.findUnique({ where: { id } });
};
