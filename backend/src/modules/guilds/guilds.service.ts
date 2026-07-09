import AppError from '../../errors/AppError';
import * as GuildsRepository from './guilds.repository';
import * as UserRepository from '../users/user.repository';
import * as NotificationsService from '../notifications/notifications.service';
import { CreateGuildPayload } from '@gremio-estelar/shared';

export const create = async (payload: CreateGuildPayload, creatorId: string) => {
  // Check by name using findMany since findGuildById searches by id, not name
  const guilds = await GuildsRepository.findAllGuilds();
  const nameTaken = guilds.find(g => g.name.toLowerCase() === payload.name.toLowerCase());
  if (nameTaken) {
    throw new AppError('Ya existe un gremio con este nombre.', 409);
  }

  const guild = await GuildsRepository.createGuild({
    name: payload.name,
    description: payload.description,
    logoUrl: payload.logoUrl,
    coverUrl: payload.coverUrl,
    tags: payload.tags,
    creatorId,
  });

  // Auto-add creator as LEADER
  await GuildsRepository.addMember(guild.id, creatorId, 'LEADER');

  return { ...guild, isMember: true, myRole: 'LEADER' };
};

export const getAll = async (currentUserId?: string) => {
  const guilds = await GuildsRepository.findAllGuilds();

  if (currentUserId) {
    const myMemberships = await GuildsRepository.findGuildsByUser(currentUserId);
    const myGuildIds = new Map(myMemberships.map(m => [m.guildId, m.role]));

    return guilds.map(g => ({
      ...g,
      isMember: myGuildIds.has(g.id),
      myRole: myGuildIds.get(g.id) || null,
    }));
  }

  return guilds.map(g => ({ ...g, isMember: false, myRole: null }));
};

export const getById = async (id: string, currentUserId?: string) => {
  const guild = await GuildsRepository.findGuildById(id);
  if (!guild) {
    throw new AppError('Gremio no encontrado.', 404);
  }

  let isMember = false;
  let myRole: string | null = null;

  if (currentUserId) {
    const member = await GuildsRepository.findMember(id, currentUserId);
    if (member) {
      isMember = true;
      myRole = member.role;
    }
  }

  return { ...guild, isMember, myRole };
};

export const update = async (id: string, payload: Partial<CreateGuildPayload>, userId: string) => {
  const guild = await GuildsRepository.findGuildById(id);
  if (!guild) {
    throw new AppError('Gremio no encontrado.', 404);
  }

  const member = await GuildsRepository.findMember(id, userId);
  if (!member || (member.role !== 'LEADER' && member.role !== 'OFFICER')) {
    throw new AppError('No tienes permiso para editar este gremio.', 403);
  }

  return GuildsRepository.updateGuild(id, payload);
};

export const remove = async (id: string, userId: string) => {
  const guild = await GuildsRepository.findGuildById(id);
  if (!guild) {
    throw new AppError('Gremio no encontrado.', 404);
  }

  const member = await GuildsRepository.findMember(id, userId);
  if (!member || member.role !== 'LEADER') {
    throw new AppError('Solo el líder puede eliminar el gremio.', 403);
  }

  await GuildsRepository.deleteGuild(id);
  return { message: 'Gremio eliminado correctamente.' };
};

export const join = async (guildId: string, userId: string) => {
  const guild = await GuildsRepository.findGuildById(guildId);
  if (!guild) {
    throw new AppError('Gremio no encontrado.', 404);
  }

  const existing = await GuildsRepository.findMember(guildId, userId);
  if (existing) {
    throw new AppError('Ya eres miembro de este gremio.', 409);
  }

  await GuildsRepository.addMember(guildId, userId);

  // Send notification to guild leader
  const member = await UserRepository.findById(userId);
  if (member && guild.creatorId !== userId) {
    await NotificationsService.notifyGuildJoined(member.username, guild.name, guildId, guild.creatorId).catch(() => {});
  }

  return { message: 'Te has unido al gremio.', guildId };
};

export const leave = async (guildId: string, userId: string) => {
  const member = await GuildsRepository.findMember(guildId, userId);
  if (!member) {
    throw new AppError('No eres miembro de este gremio.', 404);
  }

  if (member.role === 'LEADER') {
    throw new AppError('El líder no puede abandonar el gremio. Transfiere el liderazgo primero.', 400);
  }

  await GuildsRepository.removeMember(guildId, userId);
  return { message: 'Has abandonado el gremio.', guildId };
};

export const kickMember = async (guildId: string, targetUserId: string, requesterId: string) => {
  const requester = await GuildsRepository.findMember(guildId, requesterId);
  if (!requester || (requester.role !== 'LEADER' && requester.role !== 'OFFICER')) {
    throw new AppError('No tienes permiso para expulsar miembros.', 403);
  }

  const target = await GuildsRepository.findMember(guildId, targetUserId);
  if (!target) {
    throw new AppError('El usuario no es miembro de este gremio.', 404);
  }

  if (target.role === 'LEADER') {
    throw new AppError('No puedes expulsar al líder.', 400);
  }

  await GuildsRepository.removeMember(guildId, targetUserId);
  return { message: 'Miembro expulsado del gremio.' };
};

export const getMyGuilds = async (userId: string) => {
  return GuildsRepository.findGuildsByUser(userId);
};
