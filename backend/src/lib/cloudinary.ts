import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env';

// CLOUDINARY_URL is the standard way (e.g. cloudinary://key:secret@cloudname)
// If set, the SDK parses it automatically.
// Individual env vars are the fallback.
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export default cloudinary;
