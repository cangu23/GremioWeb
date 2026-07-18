import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'La publicación no puede estar vacía').max(2000, 'La publicación es demasiado larga (máx 2000 caracteres)'),
    mediaUrl: z.string().url().optional().or(z.literal('')),
    isPinned: z.boolean().optional(),
    pollData: z.string().optional(),
    mentions: z.array(z.string()).optional(),
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'El comentario no puede estar vacío').max(500, 'El comentario es demasiado largo (máx 500 caracteres)'),
    mediaUrl: z.string().url().optional().or(z.literal('')),
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
