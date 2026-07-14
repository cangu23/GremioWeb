import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadsDir = path.resolve(__dirname, '..', '..', '..', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const bannersDir = path.join(uploadsDir, 'banners');
const postsDir = path.join(uploadsDir, 'posts');
[uploadsDir, avatarsDir, bannersDir, postsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

// Multer config for avatars
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

// Multer config for banners
const bannerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, bannersDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `banner-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

// Multer config for post images
const postStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, postsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `post-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

export const uploadBanner = multer({
  storage: bannerStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

export const uploadPostImage = multer({
  storage: postStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

// GET base URL for constructing file URLs
// Uses x-forwarded-proto to detect HTTPS behind Render's proxy
const getBaseUrl = (req: Request) => {
  const host = req.get('host') || 'localhost:4000';
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${protocol}://${host}`;
};

// Upload avatar handler
export const handleUploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se seleccionó ninguna imagen.' });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const url = `${baseUrl}/uploads/avatars/${req.file.filename}`;

    res.json({
      status: 'success',
      url,
      filename: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
};

// Upload banner handler
export const handleUploadBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se seleccionó ninguna imagen.' });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const url = `${baseUrl}/uploads/banners/${req.file.filename}`;

    res.json({
      status: 'success',
      url,
      filename: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
};

// Upload post image handler
export const handleUploadPostImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se seleccionó ninguna imagen.' });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const url = `${baseUrl}/uploads/posts/${req.file.filename}`;

    res.json({
      status: 'success',
      url,
      filename: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
};
