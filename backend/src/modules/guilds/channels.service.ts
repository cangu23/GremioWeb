import AppError from '../../errors/AppError';
import * as ChannelsRepository from './channels.repository';
import * as GuildsRepository from './guilds.repository';
import { ioContext } from '../../websocket/socket.server';

export const createChannel = async (data: {
  guildId: string;
  name: string;
  type?: string;
}, userId: string) => {
  const guild = await GuildsRepository.findGuildById(data.guildId);
  if (!guild) throw new AppError('Gremio no encontrado.', 404);

  // Check permissions (LEADER or OFFICER)
  const member = await GuildsRepository.findMember(data.guildId, userId);
  if (!member || (member.role !== 'LEADER' && member.role !== 'OFFICER')) {
    throw new AppError('No tienes permiso para crear canales.', 403);
  }

  // Get next position
  const channels = await ChannelsRepository.findChannelsByGuild(data.guildId);
  const position = channels.length;

  return ChannelsRepository.createChannel({
    guildId: data.guildId,
    name: data.name.toLowerCase().replace(/\s+/g, '-'),
    type: data.type || 'TEXT',
    position,
  });
};

export const getChannels = async (guildId: string, userId: string) => {
  const member = await GuildsRepository.findMember(guildId, userId);
  if (!member) throw new AppError('No eres miembro de este gremio.', 403);
  return ChannelsRepository.findChannelsByGuild(guildId);
};

export const updateChannel = async (channelId: string, data: { name?: string }, userId: string) => {
  const channel = await ChannelsRepository.findChannelById(channelId);
  if (!channel) throw new AppError('Canal no encontrado.', 404);

  const member = await GuildsRepository.findMember(channel.guildId, userId);
  if (!member || (member.role !== 'LEADER' && member.role !== 'OFFICER')) {
    throw new AppError('No tienes permiso para editar canales.', 403);
  }

  if (data.name) {
    data.name = data.name.toLowerCase().replace(/\s+/g, '-');
  }

  return ChannelsRepository.updateChannel(channelId, data);
};

export const deleteChannel = async (channelId: string, userId: string) => {
  const channel = await ChannelsRepository.findChannelById(channelId);
  if (!channel) throw new AppError('Canal no encontrado.', 404);

  const member = await GuildsRepository.findMember(channel.guildId, userId);
  if (!member || (member.role !== 'LEADER' && member.role !== 'OFFICER')) {
    throw new AppError('No tienes permiso para eliminar canales.', 403);
  }

  await ChannelsRepository.deleteChannel(channelId);
  return { message: 'Canal eliminado.' };
};

// ===== MESSAGES =====

export const sendMessage = async (data: {
  channelId: string;
  userId: string;
  content?: string;
  imageUrl?: string;
}) => {
  const channel = await ChannelsRepository.findChannelById(data.channelId);
  if (!channel) throw new AppError('Canal no encontrado.', 404);

  const member = await GuildsRepository.findMember(channel.guildId, data.userId);
  if (!member) throw new AppError('No eres miembro de este gremio.', 403);

  if (!data.content?.trim() && !data.imageUrl) throw new AppError('El mensaje no puede estar vacío.', 400);
  if (data.content && data.content.length > 2000) throw new AppError('El mensaje es demasiado largo.', 400);

  return ChannelsRepository.createMessage({
    channelId: data.channelId,
    guildId: channel.guildId,
    userId: data.userId,
    content: data.content?.trim() || '',
    imageUrl: data.imageUrl,
  });
};

export const getMessages = async (channelId: string, userId: string, limit = 50, before?: string) => {
  const channel = await ChannelsRepository.findChannelById(channelId);
  if (!channel) throw new AppError('Canal no encontrado.', 404);

  const member = await GuildsRepository.findMember(channel.guildId, userId);
  if (!member) throw new AppError('No eres miembro de este gremio.', 403);

  const messages = await ChannelsRepository.findMessagesByChannel(channelId, limit, before);
  // Flatten vtuberProfile data for consistency with socket messages
  return messages.reverse().map(msg => ({
    ...msg,
    user: {
      id: msg.user.id,
      username: msg.user.username,
      displayName: msg.user.vtuberProfile?.displayName ?? null,
      avatarUrl: msg.user.vtuberProfile?.avatarUrl ?? null,
      isVerified: msg.user.vtuberProfile?.isVerified ?? false,
    },
  }));
};

export const updateMessage = async (messageId: string, userId: string, content: string) => {
  const message = await ChannelsRepository.findMessageById(messageId);
  if (!message) throw new AppError('Mensaje no encontrado.', 404);

  const member = await GuildsRepository.findMember(message.guildId, userId);
  if (!member) throw new AppError('No eres miembro de este gremio.', 403);

  // Only the author or a Leader/Officer can edit
  if (message.userId !== userId && member.role !== 'LEADER' && member.role !== 'OFFICER') {
    throw new AppError('No tienes permiso para editar este mensaje.', 403);
  }

  if (!content?.trim()) throw new AppError('El mensaje no puede estar vacío.', 400);
  if (content.length > 2000) throw new AppError('El mensaje es demasiado largo.', 400);

  const updated = await ChannelsRepository.updateMessage(messageId, { content: content.trim() });

  // Emit real-time update to all guild members
  if (ioContext.instance) {
    ioContext.instance.to(`guild:${message.guildId}`).emit('guild:message:updated', {
      id: updated.id,
      channelId: updated.channelId,
      guildId: updated.guildId,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      user: {
        id: updated.user.id,
        username: updated.user.username,
        displayName: updated.user.vtuberProfile?.displayName ?? null,
        avatarUrl: updated.user.vtuberProfile?.avatarUrl ?? null,
        isVerified: updated.user.vtuberProfile?.isVerified ?? false,
      },
    });
  }

  return updated;
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await ChannelsRepository.findMessageById(messageId);
  if (!message) throw new AppError('Mensaje no encontrado.', 404);

  const member = await GuildsRepository.findMember(message.guildId, userId);
  if (!member) throw new AppError('No eres miembro de este gremio.', 403);

  // Only the author or a Leader/Officer can delete
  if (message.userId !== userId && member.role !== 'LEADER' && member.role !== 'OFFICER') {
    throw new AppError('No tienes permiso para eliminar este mensaje.', 403);
  }

  await ChannelsRepository.deleteMessage(messageId);

  // Emit real-time deletion to all guild members
  if (ioContext.instance) {
    ioContext.instance.to(`guild:${message.guildId}`).emit('guild:message:deleted', {
      messageId,
    });
  }

  return { message: 'Mensaje eliminado.' };
};
