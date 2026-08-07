import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as UploadsController from './uploads.controller';

const router = Router();

// All uploads use the same multer middleware with memory storage
// Upload avatar (requires auth)
router.post('/avatar', authenticate, UploadsController.uploadImage, UploadsController.handleUploadAvatar);

// Upload banner (requires auth)
router.post('/banner', authenticate, UploadsController.uploadImage, UploadsController.handleUploadBanner);

// Upload video banner (STELLAR only) — video crudo, sin Media Engine
router.post('/banner/video', authenticate, UploadsController.uploadVideoBanner, UploadsController.handleUploadVideoBanner);

// Upload post image (requires auth)
router.post('/post', authenticate, UploadsController.uploadImage, UploadsController.handleUploadPostImage);

// Upload guild chat image (requires auth)
router.post('/guild', authenticate, UploadsController.uploadImage, UploadsController.handleUploadGuildImage);

// Upload sticker image (requires auth)
router.post('/sticker', authenticate, UploadsController.uploadImage, UploadsController.handleUploadSticker);

// Upload cafe image (logo/banner) (requires auth)
router.post('/cafe', authenticate, UploadsController.uploadImage, UploadsController.handleUploadCafeImage);

// Upload pet image / GIF (requires auth)
router.post('/pet', authenticate, UploadsController.uploadImage, UploadsController.handleUploadPetImage);

// Upload general image / GIF (requires auth)
router.post('/image', authenticate, UploadsController.uploadImage, UploadsController.handleUploadGeneralImage);

export default router;
