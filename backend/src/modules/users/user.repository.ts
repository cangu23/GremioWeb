import { Prisma } from '@prisma/client';
import { prisma } from '../../database';
import { CreateUserPayload } from './user.types';
import { UpdateUserPayload } from '@gremio-estelar/shared';

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

export const findById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
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

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { username: insensitiveContains(query) },
          { vtuberProfile: { displayName: insensitiveContains(query) } },
        ],
      }
    : {};

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true, isApproved: true } },
    },
    take: 15,
    orderBy: { username: 'asc' },
  });
};

export const searchByUsername = async (query: string) => {
  // Build the VTuber filter (must be VTUBER role or approved)
  // Build search filter (match username or displayName, case-insensitive)
  const vtuberFilter: Prisma.UserWhereInput = {
    OR: [
      { role: 'VTUBER' },
      { vtuberProfile: { isApproved: true } },
    ],
  };

  // SQLite LIKE is case-insensitive by default, so `mode` is optional.
  // Explicit cast avoids TS error when Prisma is generated from SQLite schema.
  const insensitiveContains = (value: string) => ({
    contains: value,
    mode: 'insensitive' as any,
  });

  let where: Prisma.UserWhereInput;
  if (!query) {
    where = vtuberFilter;
  } else {
    where = {
      AND: [
        vtuberFilter,
        {
          OR: [
            { username: insensitiveContains(query) },
            { vtuberProfile: { displayName: insensitiveContains(query) } },
          ],
        },
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
      note: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true, isApproved: true } },
    },
    take: 50,
    orderBy: { username: 'asc' },
  });
};

export const findByRole = async (role: string) => {
  return prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      note: true,
      vtuberProfile: {
        select: {
          displayName: true,
          avatarUrl: true,
          description: true,
          isVerified: true,
          isApproved: true,
        },
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
  return prisma.user.findUnique({
    where: { id },
    include: {
      vtuberProfile: true,
    },
  });
};

export const updateUserProfile = async (userId: string, data: UpdateUserPayload) => {
  return prisma.$transaction(async (tx) => {
    // Fields that go directly on the User model
    const userFields = ['displayName', 'avatarUrl', 'bio', 'bannerColor'];
    // Fields that go on the VTuberProfile model
    const vtuberProfileFields = [
      'displayName', 'avatarUrl', 'bannerUrl', 'description', 'lore',
      'twitchUrl', 'youtubeUrl', 'kickUrl', 'tiktokUrl', 'twitterUrl',
      'discordUrl', 'websiteUrl', 'streamSchedule', 'contentType',
      'live2dModel', 'model3d', 'fanName', 'oshiMark', 'themeColor', 'isLive',
    ];
    
    const dataRecord = data as unknown as Record<string, unknown>;
    const existingProfile = await tx.vTuberProfile.findUnique({
      where: { userId },
    });

    const hasVtuberFields = existingProfile !== null ||
      vtuberProfileFields.some(f => dataRecord[f] !== undefined) ||
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

    return tx.user.findUnique({
      where: { id: userId },
      include: { vtuberProfile: true },
    });
  });
};