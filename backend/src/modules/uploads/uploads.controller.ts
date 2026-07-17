import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
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

// Helper: compress buffer with Sharp, then upload to Cloudinary
const uploadToCloudinary = async (buffer: Buffer, folder: string): Promise<string> => {
  // Compress & resize server-side as a safety net
  const maxWidth = folder.includes('logo') ? 512 : folder.includes('banner') ? 1920 : 1920;
  const maxHeight = folder.includes('logo') ? 512 : folder.includes('banner') ? 1080 : 1080;

  const compressed = await sharp(buffer)
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',      // Preserve aspect ratio
      withoutEnlargement: true, // Don't upscale small images
    })
    .webp({ quality: 80 })
    .toBuffer();

  console.log(
    `📦 [Sharp] ${folder}: ${(buffer.length / 1024).toFixed(1)}KB → ${(compressed.length / 1024).toFixed(1)}KB (${Math.round((1 - compressed.length / buffer.length) * 100)}% reducción)`
  );

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `gremio-estelar/${folder}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    uploadStream.end(compressed);
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

// Upload cafe image (logo / banner) handler
export const handleUploadCafeImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se seleccionó ninguna imagen.' });
      return;
    }

    const type = (req.query.type as string) || 'logo'; // 'logo' or 'banner'
    const folder = type === 'banner' ? 'cafe-banners' : 'cafe-logos';
    const url = await uploadToCloudinary(req.file.buffer, folder);

    res.json({
      status: 'success',
      url,
      type,
      filename: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
};
