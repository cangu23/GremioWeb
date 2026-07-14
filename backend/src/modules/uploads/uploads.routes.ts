import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as UploadsController from './uploads.controller';

const router = Router();

// All uploads use the same multer middleware with memory storage
// Upload avatar (requires auth)
router.post('/avatar', authenticate, UploadsController.uploadImage, UploadsController.handleUploadAvatar);

// Upload banner (requires auth)
router.post('/banner', authenticate, UploadsController.uploadImage, UploadsController.handleUploadBanner);

// Upload post image (requires auth)
router.post('/post', authenticate, UploadsController.uploadImage, UploadsController.handleUploadPostImage);

// Upload guild chat image (requires auth)
router.post('/guild', authenticate, UploadsController.uploadImage, UploadsController.handleUploadGuildImage);

export default router;
