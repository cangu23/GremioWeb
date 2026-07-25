import { prisma } from '../../database';

const guildIncludes = {
  creator: {
    select: {
      id: true,
      username: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  _count: { select: { members: true, channels: true } },
};

export const createGuild = (data: {
  name: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  tags?: string;
  creatorId: string;
}) => {
  return prisma.guild.create({
    data,
    include: guildIncludes,
  });
};

export const findGuildById = (id: string) => {
  return prisma.guild.findUnique({
    where: { id },
    include: {
      ...guildIncludes,
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
        orderBy: { joinedAt: 'asc' },
      },
    },
  });
};

export const findAllGuilds = () => {
  return prisma.guild.findMany({
    include: guildIncludes,
    orderBy: { createdAt: 'desc' },
  });
};

export const updateGuild = (id: string, data: Record<string, unknown>) => {
  return prisma.guild.update({
    where: { id },
    data,
    include: guildIncludes,
  });
};

export const deleteGuild = (id: string) => {
  return prisma.guild.delete({ where: { id } });
};

export const addMember = (guildId: string, userId: string, role: string = 'MEMBER') => {
  return prisma.guildMember.create({
    data: { guildId, userId, role },
  });
};

export const removeMember = (guildId: string, userId: string) => {
  return prisma.guildMember.delete({
    where: { guildId_userId: { guildId, userId } },
  });
};

export const findMember = (guildId: string, userId: string) => {
  return prisma.guildMember.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
};

export const updateMemberRole = (guildId: string, userId: string, role: string) => {
  return prisma.guildMember.update({
    where: { guildId_userId: { guildId, userId } },
    data: { role },
  });
};

export const findGuildsByUser = (userId: string) => {
  return prisma.guildMember.findMany({
    where: { userId },
    include: {
      guild: {
        include: guildIncludes,
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
};

export const findPendingJoinRequests = (guildId: string) => {
  return prisma.guildJoinRequest.findMany({
    where: { guildId, status: 'PENDING' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const findJoinRequestByUser = (guildId: string, userId: string) => {
  return prisma.guildJoinRequest.findFirst({
    where: { guildId, userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const createJoinRequest = (guildId: string, userId: string, message?: string) => {
  return prisma.guildJoinRequest.create({
    data: {
      guildId,
      userId,
      message: message || null,
      status: 'PENDING',
    },
  });
};

export const updateJoinRequestStatus = (requestId: string, status: 'APPROVED' | 'REJECTED') => {
  return prisma.guildJoinRequest.update({
    where: { id: requestId },
    data: { status },
    include: {
      guild: true,
      user: true,
    },
  });
};

export const findJoinRequestById = (requestId: string) => {
  return prisma.guildJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      guild: true,
      user: true,
    },
  });
};
