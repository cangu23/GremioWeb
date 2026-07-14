import { prisma } from '../../database';

const channelIncludes = {
  _count: { select: { messages: true } },
} as const;

export const createChannel = (data: {
  guildId: string;
  name: string;
  type?: string;
  position?: number;
}) => {
  return prisma.guildChannel.create({ data, include: channelIncludes });
};

export const findChannelsByGuild = (guildId: string) => {
  return prisma.guildChannel.findMany({
    where: { guildId },
    orderBy: { position: 'asc' },
    include: {
      _count: { select: { messages: true } },
    },
  });
};

export const findChannelById = (id: string) => {
  return prisma.guildChannel.findUnique({ where: { id } });
};

export const updateChannel = (id: string, data: { name?: string; position?: number }) => {
  return prisma.guildChannel.update({ where: { id }, data });
};

export const deleteChannel = (id: string) => {
  return prisma.guildChannel.delete({ where: { id } });
};

// ===== MESSAGES =====

const messageIncludes = {
  user: {
    select: {
      id: true,
      username: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true } },
    },
  },
} as const;

export const createMessage = (data: {
  channelId: string;
  guildId: string;
  userId: string;
  content: string;
}) => {
  return prisma.guildChannelMessage.create({
    data,
    include: messageIncludes,
  });
};

export const findMessagesByChannel = (channelId: string, limit = 50, before?: string) => {
  const where: Record<string, unknown> = { channelId };
  if (before) {
    where.createdAt = { lt: new Date(before) };
  }
  return prisma.guildChannelMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: messageIncludes,
  });
};

export const findMessageById = (id: string) => {
  return prisma.guildChannelMessage.findUnique({
    where: { id },
    include: messageIncludes,
  });
};

export const updateMessage = (id: string, data: { content: string }) => {
  return prisma.guildChannelMessage.update({
    where: { id },
    data: { content: data.content },
    include: messageIncludes,
  });
};

export const deleteMessage = (id: string) => {
  return prisma.guildChannelMessage.delete({ where: { id } });
};
