import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { optimizeImage } from '../../lib/media-engine';
import { ioContext } from '../../websocket/socket.server';
import prisma from '../../database/prisma';
import { PLATFORM_PLANS, getEffectivePlan, planMeetsOrExceeds } from '../subscriptions/platform-subscriptions.service';

// Allowed MIME types
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Usa JPEG, PNG, WebP o GIF.'));
  }
};

// Use memory storage so we can send the buffer directly to the Media Engine
const memoryStorage = multer.memoryStorage();

export const uploadImage = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

// ─── Non-blocking optimization helpers ────────────────

interface PendingUpload {
  id: string;
  userId: string;
  status: 'processing' | 'ready' | 'error';
  url?: string;
  error?: string;
}

// In-memory store for pending uploads (could be moved to Redis later)
const pendingUploads = new Map<string, PendingUpload>();
const PENDING_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const PENDING_MAX_SIZE = 1000;

// Auto-cleanup stale entries every 5 minutes to prevent memory leaks
const cleanupInterval = setInterval(() => {
  const cutoff = Date.now() - PENDING_MAX_AGE_MS;
  for (const [id, _upload] of pendingUploads) {
    // Upload IDs start with a timestamp: "1690000000000-abc123"
    const ts = parseInt(id.split('-')[0], 10);
    if (!isNaN(ts) && ts < cutoff) {
      pendingUploads.delete(id);
    }
  }
}, PENDING_MAX_AGE_MS);
if (cleanupInterval.unref) cleanupInterval.unref();

/**
 * Process an image through the Media Engine, then emit Socket.IO event
 * when ready. This runs asynchronously so the HTTP response returns fast.
 */
async function processAndNotify(
  uploadId: string,
  buffer: Buffer,
  userId: string,
  folder: string,
  options: { maxWidth?: number; quality?: number; keepAnimation?: boolean } = {}
): Promise<void> {
  try {
    const result = await optimizeImage(buffer, { folder, ...options });

    if (result.status === 'ok' && result.url) {
      pendingUploads.set(uploadId, {
        id: uploadId,
        userId,
        status: 'ready',
        url: result.url,
      });

      // Emit Socket.IO event so the frontend can update instantly
      ioContext.instance?.to(`user:${userId}`).emit('media:ready', {
        id: uploadId,
        url: result.url,
        format: result.format,
        size_bytes: result.size_bytes,
        original_size_bytes: result.original_size_bytes,
        animated: result.animated,
      });
    } else {
      throw new Error(result.error || 'Optimization failed');
    }
  } catch (err: any) {
    pendingUploads.set(uploadId, {
      id: uploadId,
      userId,
      status: 'error',
      error: err.message,
    });

    ioContext.instance?.to(`user:${userId}`).emit('media:error', {
      id: uploadId,
      error: err.message,
    });
  }
}

// ─── Upload handlers ──────────────────────────────────

// Helper: common upload flow
async function handleUpload(
  req: Request,
  res: Response,
  next: NextFunction,
  folder: string,
  options: { maxWidth?: number; quality?: number; keepAnimation?: boolean } = {}
) {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se seleccionó ninguna imagen.' });
      return;
    }

    const user = (req as any).user;
    const isGif = req.file.mimetype === 'image/gif';
    const effectivePlan = user ? getEffectivePlan(user.plan, user.role) : 'FREE';
    const isPrivileged = effectivePlan !== 'FREE';

    // Restringir GIFs según el beneficio prometido de cada plan:
    //  - Posts/general: GIF con cualquier plan premium (ASTRO+) ✓
    //  - Banners: GIF solo a partir de NOVA (el plan promete "Banner GIF animado")
    const isBanner = folder === 'banners' || folder === 'banner';
    const bannerGifAllowed = isBanner ? planMeetsOrExceeds(effectivePlan, 'NOVA') : isPrivileged;

    if (isGif && !bannerGifAllowed && folder !== 'pets' && folder !== 'stickers') {
      if (isBanner) {
        res.status(403).json({ status: 'error', message: 'Los banners animados (GIF) son exclusivos de los Planes Nova Pro y Stellar Elite.' });
        return;
      }
      res.status(403).json({ status: 'error', message: 'Usar GIFs es una función exclusiva para miembros Premium.' });
      return;
    }

    // ── Límite diario de imágenes en publicaciones (beneficio del plan) ──
    // maxImagesPerDay: FREE=20, ASTRO/NOVA=100, STELLAR=500.
    // Se cuentan las publicaciones con imagen creadas hoy (UTC) por el usuario.
    const isPostImage = folder === 'posts' || folder === 'general';
    if (isPostImage && user?.id) {
      const planLimit = PLATFORM_PLANS[getEffectivePlan(user.plan, user.role)]?.maxImagesPerDay ?? 20;
      const startOfUtcDay = new Date();
      startOfUtcDay.setUTCHours(0, 0, 0, 0);
      const usedToday = await prisma.post.count({
        where: {
          userId: user.id,
          mediaUrl: { not: null },
          createdAt: { gte: startOfUtcDay },
        },
      });
      if (usedToday >= planLimit) {
        res.status(403).json({
          status: 'error',
          message: `Alcanzaste el límite diario de ${planLimit} imágenes en publicaciones. Vuelve mañana o mejora tu plan en /premium.`,
        });
        return;
      }
    }

    // Generate a unique upload ID for tracking
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const result = await optimizeImage(req.file.buffer, {
      folder,
      keepAnimation: isGif && options.keepAnimation !== false,
      maxWidth: options.maxWidth,
      quality: options.quality,
    });

    if (result.status === 'ok' && result.url) {
      pendingUploads.set(uploadId, {
        id: uploadId,
        userId: user?.id,
        status: 'ready',
        url: result.url,
      });

      if (user?.id) {
        ioContext.instance?.to(`user:${user.id}`).emit('media:ready', {
          id: uploadId,
          url: result.url,
          format: result.format,
          size_bytes: result.size_bytes,
          animated: result.animated,
        });
      }

      res.json({
        status: 'ok',
        id: uploadId,
        url: result.url,
        filename: req.file.originalname,
      });
    } else {
      res.status(500).json({ status: 'error', message: result.error || 'Error al procesar la imagen.' });
    }
  } catch (err) {
    next(err);
  }
}

// Upload avatar handler
export const handleUploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  await handleUpload(req, res, next, 'avatars', { maxWidth: 512, quality: 85 });
};

// Upload banner handler
export const handleUploadBanner = async (req: Request, res: Response, next: NextFunction) => {
  await handleUpload(req, res, next, 'banners', { maxWidth: 1920, quality: 82 });
};

// Upload guild chat image handler
export const handleUploadGuildImage = async (req: Request, res: Response, next: NextFunction) => {
  await handleUpload(req, res, next, 'guild', { maxWidth: 1200, quality: 80 });
};

// Upload post image handler
export const handleUploadPostImage = async (req: Request, res: Response, next: NextFunction) => {
  await handleUpload(req, res, next, 'posts', { maxWidth: 1200, quality: 80 });
};

// Upload sticker/emoji image handler
export const handleUploadSticker = async (req: Request, res: Response, next: NextFunction) => {
  await handleUpload(req, res, next, 'stickers', { maxWidth: 512, quality: 85 });
};

// Upload cafe image (logo / banner) handler
export const handleUploadCafeImage = async (req: Request, res: Response, next: NextFunction) => {
  const type = (req.query.type as string) || 'logo';
  const folder = type === 'banner' ? 'cafe-banners' : 'cafe-logos';
  const maxWidth = type === 'banner' ? 1920 : 512;
  await handleUpload(req, res, next, folder, { maxWidth, quality: 80 });
};

// Upload pet image/GIF handler
export const handleUploadPetImage = async (req: Request, res: Response, next: NextFunction) => {
  await handleUpload(req, res, next, 'pets', { maxWidth: 1024, quality: 90 });
};

// Upload general image handler
export const handleUploadGeneralImage = async (req: Request, res: Response, next: NextFunction) => {
  await handleUpload(req, res, next, 'general', { maxWidth: 1200, quality: 85 });
};


// ─── Poll endpoint for upload status (backup if no WebSocket) ───

export const handleUploadStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const upload = pendingUploads.get(id);
    if (!upload) {
      res.status(404).json({ status: 'error', message: 'Upload no encontrado.' });
      return;
    }
    res.json(upload);
    // Clean up after polling
    if (upload.status === 'ready' || upload.status === 'error') {
      pendingUploads.delete(id);
    }
  } catch (err) {
    next(err);
  }
};
