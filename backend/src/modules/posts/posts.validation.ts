import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    content: z.string().max(2000, 'La publicación es demasiado larga (máx 2000 caracteres)').optional().or(z.literal('')),
    mediaUrl: z.string().optional().or(z.literal('')),
    isPinned: z.boolean().optional(),
    pollData: z.string().optional(),
    mentions: z.array(z.string()).optional(),
  }).refine((data) => (data.content && data.content.trim().length > 0) || (data.mediaUrl && data.mediaUrl.trim().length > 0) || (data.pollData && data.pollData.trim().length > 0), {
    message: 'La publicación debe contener texto, imagen o una encuesta.',
    path: ['content'],
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().max(500, 'El comentario es demasiado largo (máx 500 caracteres)').optional().or(z.literal('')),
    mediaUrl: z.string().optional().or(z.literal('')),
    mentions: z.array(z.string()).optional(),
  }).refine((data) => (data.content && data.content.trim().length > 0) || (data.mediaUrl && data.mediaUrl.trim().length > 0), {
    message: 'El comentario debe contener texto o una imagen.',
    path: ['content'],
  }),
});

export const reportPostSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'La razón debe tener al menos 5 caracteres').max(100, 'La razón es demasiado larga'),
    description: z.string().max(500, 'La descripción es demasiado larga').optional(),
  }),
});

export const reportCommentSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'La razón debe tener al menos 5 caracteres').max(100, 'La razón es demasiado larga'),
    description: z.string().max(500, 'La descripción es demasiado larga').optional(),
  }),
});
