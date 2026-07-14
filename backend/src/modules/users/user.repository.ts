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

export const searchByUsername = async (query: string) => {
  // Build the VTuber filter (must be VTUBER role or approved)
  const vtuberFilter = {
    OR: [
      { role: 'VTUBER' as const },
      { vtuberProfile: { isApproved: true } },
    ],
  };

  // If query is empty, just return all VTubers
  const where = !query
    ? { where: { AND: [vtuberFilter] } }
    : {
        where: {
          AND: [
            vtuberFilter,
            {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                {
                  vtuberProfile: {
                    displayName: { contains: query, mode: 'insensitive' },
                  },
                },
              ],
            },
          ],
        },
      };

  return prisma.user.findMany({
    ...where,
    select: {
      id: true,
      username: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true } },
    },
    take: 50,
    orderBy: { username: 'asc' },
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
    const profileFields = [
      'displayName', 'avatarUrl', 'bannerUrl', 'description', 'lore',
      'twitchUrl', 'youtubeUrl', 'kickUrl', 'tiktokUrl', 'twitterUrl',
      'discordUrl', 'websiteUrl', 'streamSchedule', 'contentType',
      'live2dModel', 'model3d', 'fanName', 'oshiMark', 'isLive',
    ];
    
    const dataRecord = data as unknown as Record<string, unknown>;
    const hasProfileFields = profileFields.some(f => dataRecord[f] !== undefined) ||
      data.socialLinks !== undefined || data.languages !== undefined || data.hashtags !== undefined;
    
    const { username, socialLinks, ...rest } = data;
    const languages = dataRecord.languages;
    const hashtags = dataRecord.hashtags;
    
    // 1. Update user if username provided
    if (username !== undefined) {
      await tx.user.update({
        where: { id: userId },
        data: { username },
      });
    }

    // 2. Update or create VTuberProfile
    if (hasProfileFields) {
      const existingProfile = await tx.vTuberProfile.findUnique({
        where: { userId },
      });

      const profileData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined && profileFields.includes(key)) {
          profileData[key] = value;
        }
      }
      if (socialLinks !== undefined) profileData.socialLinks = JSON.stringify(socialLinks);
      if (languages !== undefined) profileData.languages = JSON.stringify(languages);
      if (hashtags !== undefined) profileData.hashtags = JSON.stringify(hashtags);

      if (existingProfile) {
        await tx.vTuberProfile.update({
          where: { userId },
          data: profileData as Prisma.VTuberProfileUpdateInput,
        });
      } else {
        const user = await tx.user.findUnique({ where: { id: userId } });
        await tx.vTuberProfile.create({
          data: {
            userId,
            displayName: (profileData.displayName as string) || user?.username || 'VTuber',
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