import AppError from '../../errors/AppError';
import * as ChannelsRepository from './channels.repository';
import * as GuildsRepository from './guilds.repository';

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
  content: string;
}) => {
  const channel = await ChannelsRepository.findChannelById(data.channelId);
  if (!channel) throw new AppError('Canal no encontrado.', 404);

  const member = await GuildsRepository.findMember(channel.guildId, data.userId);
  if (!member) throw new AppError('No eres miembro de este gremio.', 403);

  if (!data.content?.trim()) throw new AppError('El mensaje no puede estar vacío.', 400);
  if (data.content.length > 2000) throw new AppError('El mensaje es demasiado largo.', 400);

  return ChannelsRepository.createMessage({
    channelId: data.channelId,
    guildId: channel.guildId,
    userId: data.userId,
    content: data.content.trim(),
  });
};

export const getMessages = async (channelId: string, userId: string, limit = 50, before?: string) => {
  const channel = await ChannelsRepository.findChannelById(channelId);
  if (!channel) throw new AppError('Canal no encontrado.', 404);

  const member = await GuildsRepository.findMember(channel.guildId, userId);
  if (!member) throw new AppError('No eres miembro de este gremio.', 403);

  const messages = await ChannelsRepository.findMessagesByChannel(channelId, limit, before);
  return messages.reverse();
};
