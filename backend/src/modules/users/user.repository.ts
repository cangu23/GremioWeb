import { Prisma } from '@prisma/client';
import { prisma } from '../../database';
import { CreateUserPayload } from './user.types';
import { UpdateUserPayload } from '@gremio-estelar/shared';
import { checkSingleVTuber } from '../vtubers/stream-monitor.service';
import { checkSingleStreamer } from '../streamers/stream-monitor.service';

export const findByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const findByUsernameInsensitive = async (username: string) => {
  return prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });
};

// ── Guard fail-open para StreamerProfile ───────────────────────────────────
// En DBs de producción legacy que aún no han corrido la migración
// 20260809_add_streamer_role, la tabla "StreamerProfile" no existe y CUALQUIER
// query con include: { streamerProfile } lanza P2021 (500) — rompiendo login,
// registro, /users/me y los perfiles públicos. Este helper reintenta la
// consulta sin ese include para que la autenticación y los perfiles sigan
// funcionando mientras la DB se pone al día.
export const queryUserWithProfiles = async (
  db: any,
  id: string,
  extraInclude: Prisma.UserInclude = {},
) => {
  const include: Prisma.UserInclude = { vtuberProfile: true, streamerProfile: true, ...extraInclude };
  try {
    return await db.user.findUnique({ where: { id }, include });
  } catch (err: any) {
    if (err?.code === 'P2021' && String(err?.meta?.table ?? '').includes('StreamerProfile')) {
      return await db.user.findUnique({
        where: { id },
        include: { vtuberProfile: true, ...extraInclude },
      });
    }
    throw err;
  }
};

export const findById = async (id: string) => {
  return queryUserWithProfiles(prisma, id);
};

export const createUser = async (data: CreateUserPayload) => {
  return prisma.user.create({
    data,
  });
};

export const searchByUsernameForMention = async (query: string) => {
  const insensitiveContains = (value: string) => ({
    contains: value,
    mode: 'insensitive' as any,
  });

  // Fail-open igual que queryUserWithProfiles: sin la tabla StreamerProfile el
  // WHERE/select de menciones lanzaría P2021 y el @autocomplete moriría.
  const buildWhere = (includeStreamer: boolean): Prisma.UserWhereInput => {
    const or: Prisma.UserWhereInput[] = [
      { username: insensitiveContains(query) },
      { displayName: insensitiveContains(query) },
      { vtuberProfile: { displayName: insensitiveContains(query) } },
    ];
    if (includeStreamer) or.push({ streamerProfile: { displayName: insensitiveContains(query) } });
    return query ? { OR: or } : {};
  };

  const buildSelect = (includeStreamer: boolean): Prisma.UserSelect => ({
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    role: true,
    vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true, isApproved: true } },
    ...(includeStreamer
      ? { streamerProfile: { select: { displayName: true, avatarUrl: true, isVerified: true, isApproved: true } } }
      : {}),
    purchases: {
      where: { equipped: true },
      include: { item: true },
    },
  });

  const run = (includeStreamer: boolean) =>
    prisma.user.findMany({
      where: buildWhere(includeStreamer),
      select: buildSelect(includeStreamer),
      take: 15,
      orderBy: { username: 'asc' },
    });

  try {
    return await run(true);
  } catch (err: any) {
    if (err?.code === 'P2021' && String(err?.meta?.table ?? '').includes('StreamerProfile')) {
      return run(false);
    }
    throw err;
  }
};

export const searchByUsername = async (query: string) => {
  const insensitiveContains = (value: string) => ({
    contains: value,
    mode: 'insensitive' as any,
  });

  const cleanQuery = query.trim().replace(/^@/, '');

  let where: Prisma.UserWhereInput;
  if (!cleanQuery) {
    where = {};
  } else {
    where = {
      OR: [
        { username: insensitiveContains(cleanQuery) },
        { displayName: insensitiveContains(cleanQuery) },
        { vtuberProfile: { displayName: insensitiveContains(cleanQuery) } },
        { streamerProfile: { displayName: insensitiveContains(cleanQuery) } },
      ],
    };
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      plan: true,
      profileFrame: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true, isApproved: true } },
      streamerProfile: { select: { displayName: true, avatarUrl: true, isVerified: true, isApproved: true } },
      purchases: {
        where: { equipped: true },
        include: { item: true },
      },
    },
    take: 20,
    orderBy: [
      { role: 'desc' },
      { username: 'asc' },
    ],
  });
};

export const findByRole = async (role: string) => {
  const roleUpper = role.toUpperCase();
  const roleLower = role.toLowerCase();
  return prisma.user.findMany({
    where: {
      OR: [
        { role: { contains: roleUpper } },
        { role: { contains: roleLower } },
        { displayedRole: { contains: roleUpper } },
        { displayedRole: { contains: roleLower } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      displayedRole: true,
      status: true,
      note: true,
      vtuberProfile: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          description: true,
          isVerified: true,
          isApproved: true,
          isFeatured: true,
          isHidden: true,
          streamSchedule: true,
          twitchUrl: true,
          youtubeUrl: true,
        },
      },
      streamerProfile: {
        select: {
          displayName: true,
          avatarUrl: true,
          description: true,
          isVerified: true,
          isApproved: true,
        },
      },
      _count: {
        select: { followers: true, following: true, posts: true },
      },
    },
    orderBy: { username: 'asc' },
  });
};

export const updateUser = async (id: string, data: Record<string, unknown>) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const getUserProfileById = async (id: string) => {
  const user = await queryUserWithProfiles(prisma, id, {
    purchases: {
      where: { equipped: true },
      include: { item: true },
    },
  });

  if (user && user.noteExpiresAt && user.noteExpiresAt < new Date()) {
    return {
      ...user,
      note: null,
      noteUpdatedAt: null,
      noteExpiresAt: null,
    };
  }

  return user;
};

export const updateUserProfile = async (userId: string, data: UpdateUserPayload) => {
  return prisma.$transaction(async (tx) => {
    // Fields that go directly on the User model
    const userFields = [
      'displayName', 'avatarUrl', 'bio', 'bannerColor', 'displayedRole',
      'profileFrame', 'profileBg', 'profileMusic', 'profilePet', 'profileParticles', 'profileTheme', 'activeTitle'
    ];
    // Fields that specifically belong to VTuberProfile (excluding shared userFields)
    const vtuberSpecificFields = [
      'bannerUrl', 'description', 'lore',
      'twitchUrl', 'youtubeUrl', 'kickUrl', 'tiktokUrl', 'twitterUrl',
      'discordUrl', 'websiteUrl', 'kofiUrl', 'streamSchedule', 'contentType',
      'live2dModel', 'model3d', 'fanName', 'oshiMark', 'themeColor', 'isLive',
    ];
    const vtuberProfileFields = ['displayName', 'avatarUrl', ...vtuberSpecificFields];
    
    const dataRecord = data as unknown as Record<string, unknown>;
    const existingProfile = await tx.vTuberProfile.findUnique({
      where: { userId },
    });

    // Campos vacíos (null/'') NO deben crear un VTuberProfile de la nada:
    // solo campos con valor real lo activan (o un perfil ya existente).
    const hasRealVtuberValue = (v: unknown) => v !== undefined && v !== null && v !== '';
    const hasVtuberFields = existingProfile !== null ||
      vtuberSpecificFields.some(f => hasRealVtuberValue(dataRecord[f])) ||
      data.socialLinks !== undefined || data.languages !== undefined || data.hashtags !== undefined;
    
    const { username, socialLinks, ...rest } = data;
    const languages = dataRecord.languages;
    const hashtags = dataRecord.hashtags;
    
    // 1. Build user update data (username + basic profile fields)
    const userUpdateData: Record<string, unknown> = {};
    if (username !== undefined) userUpdateData.username = username;
    for (const key of userFields) {
      if (dataRecord[key] !== undefined) {
        userUpdateData[key] = dataRecord[key];
      }
    }
    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // 2. Update or create VTuberProfile (if existing or if VTuber fields are present)
    if (hasVtuberFields) {
      const profileData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined && vtuberProfileFields.includes(key)) {
          profileData[key] = value;
        }
      }
      if (dataRecord.displayName !== undefined) profileData.displayName = dataRecord.displayName;
      if (dataRecord.avatarUrl !== undefined) profileData.avatarUrl = dataRecord.avatarUrl;
      if (dataRecord.isLive === true) profileData.lastLiveAt = new Date();
      if (socialLinks !== undefined) profileData.socialLinks = JSON.stringify(socialLinks);
      if (languages !== undefined) profileData.languages = JSON.stringify(languages);
      if (hashtags !== undefined) profileData.hashtags = JSON.stringify(hashtags);

      if (existingProfile) {
        if (Object.keys(profileData).length > 0) {
          await tx.vTuberProfile.update({
            where: { userId },
            data: profileData as Prisma.VTuberProfileUpdateInput,
          });
        }
      } else {
        const user = await tx.user.findUnique({ where: { id: userId } });
        await tx.vTuberProfile.create({
          data: {
            userId,
            displayName: (profileData.displayName as string) || (userUpdateData.displayName as string) || user?.username || 'VTuber',
            avatarUrl: (profileData.avatarUrl as string) || (userUpdateData.avatarUrl as string) || user?.avatarUrl || null,
            ...profileData,
          } as Prisma.VTuberProfileUncheckedCreateInput,
        });
      }
    }

    const result = await queryUserWithProfiles(tx, userId, {
      purchases: {
        where: { equipped: true },
        include: { item: true },
      },
    });

    if (result?.vtuberProfile?.id && result.vtuberProfile.twitchUrl) {
      checkSingleVTuber(result.vtuberProfile.id).catch(() => {});
    }
    if (result?.streamerProfile?.id && result.streamerProfile.twitchUrl) {
      checkSingleStreamer(result.streamerProfile.id).catch(() => {});
    }

    return result;
  });
};