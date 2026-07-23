import { z } from 'zod';

// ========== QUERY / PAGINATION ==========

export const adminQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    status: z.string().optional(),
    role: z.string().optional(),
    isVerified: z.string().optional(),
    isApproved: z.string().optional(),
    isHidden: z.string().optional(),
    isFeatured: z.string().optional(),
    isSuspended: z.string().optional(),
  }),
});

// ========== USER MANAGEMENT ==========

export const updateUserAdminSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30).optional(),
    email: z.string().email().optional(),
    role: z.enum(['USER', 'VTUBER', 'MAID', 'MODERATOR', 'ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING']).optional(),
    xp: z.number().int().min(0).optional(),
    isVerified: z.boolean().optional(),
    level: z.number().int().min(1).optional(),
  }),
});

// ========== VTUBER MANAGEMENT ==========

export const updateVtuberAdminSchema = z.object({
  body: z.object({
    displayName: z.string().max(50).optional(),
    description: z.string().max(2000).optional(),
    lore: z.string().max(5000).optional(),
    avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
    bannerUrl: z.string().url().optional().nullable().or(z.literal('')),
    isVerified: z.boolean().optional(),
    isApproved: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isHidden: z.boolean().optional(),
    contentType: z.string().max(100).optional(),
    themeColor: z.string().max(20).optional(),
    fanName: z.string().max(100).optional(),
    oshiMark: z.string().max(20).optional(),
    streamSchedule: z.string().max(500).optional(),
    languages: z.string().max(200).optional(),
    twitchUrl: z.string().url().optional().nullable().or(z.literal('')),
    youtubeUrl: z.string().url().optional().nullable().or(z.literal('')),
    kickUrl: z.string().url().optional().nullable().or(z.literal('')),
    tiktokUrl: z.string().url().optional().nullable().or(z.literal('')),
    twitterUrl: z.string().url().optional().nullable().or(z.literal('')),
    discordUrl: z.string().url().optional().nullable().or(z.literal('')),
    websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
  }),
});

// ========== EVENT MANAGEMENT ==========

export const updateEventAdminSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().max(2000).optional(),
    date: z.string().datetime().optional(),
    location: z.string().max(200).optional(),
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
    isFeatured: z.boolean().optional(),
    maxAttendees: z.number().int().positive().optional(),
    coverUrl: z.string().url().optional().nullable().or(z.literal('')),
  }),
});

// ========== GUILD MANAGEMENT ==========

export const updateGuildAdminSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50).optional(),
    description: z.string().max(2000).optional(),
    isSuspended: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    logoUrl: z.string().url().optional().nullable().or(z.literal('')),
    coverUrl: z.string().url().optional().nullable().or(z.literal('')),
    tags: z.string().optional(),
  }),
});

// ========== POST MANAGEMENT ==========

export const updatePostAdminSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000).optional(),
    isHidden: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

// ========== COMMENT MANAGEMENT ==========

export const updateCommentAdminSchema = z.object({
  body: z.object({
    isHidden: z.boolean().optional(),
    content: z.string().min(1).max(500).optional(),
  }),
});

// ========== REPORT MANAGEMENT ==========

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(['USER', 'POST', 'COMMENT', 'EVENT', 'GUILD']),
    targetId: z.string().min(1),
    reason: z.string().min(10).max(500),
    description: z.string().max(2000).optional(),
  }),
});

export const resolveReportSchema = z.object({
  body: z.object({
    status: z.enum(['IN_REVIEW', 'RESOLVED', 'DISMISSED']),
    resolution: z.string().max(1000).optional(),
  }),
});
