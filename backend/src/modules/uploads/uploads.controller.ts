import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cloudinary from '../../lib/cloudinary';

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

// Use memory storage so we can upload the buffer directly to Cloudinary
const memoryStorage = multer.memoryStorage();

export const uploadImage = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `gremio-estelar/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

// Upload avatar handler
export const handleUploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se seleccionó ninguna imagen.' });
      return;
    }

    const url = await uploadToCloudinary(req.file.buffer, 'avatars');

    res.json({
      status: 'success',
      url,
      filename: req.file.originalname,
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

    const url = await uploadToCloudinary(req.file.buffer, 'banners');

    res.json({
      status: 'success',
      url,
      filename: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
};

// Upload guild chat image handler
export const handleUploadGuildImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se seleccionó ninguna imagen.' });
      return;
    }

    const url = await uploadToCloudinary(req.file.buffer, 'guild');

    res.json({
      status: 'success',
      url,
      filename: req.file.originalname,
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

    const url = await uploadToCloudinary(req.file.buffer, 'posts');

    res.json({
      status: 'success',
      url,
      filename: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
};
