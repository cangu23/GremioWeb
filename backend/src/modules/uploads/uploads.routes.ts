import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as UploadsController from './uploads.controller';

const router = Router();

// Upload avatar (requires auth)
router.post('/avatar', authenticate, UploadsController.uploadAvatar, UploadsController.handleUploadAvatar);

// Upload banner (requires auth)
router.post('/banner', authenticate, UploadsController.uploadBanner, UploadsController.handleUploadBanner);

// Upload post image (requires auth)
router.post('/post', authenticate, UploadsController.uploadPostImage, UploadsController.handleUploadPostImage);

// Upload guild chat image (requires auth)
router.post('/guild', authenticate, UploadsController.uploadGuildImage, UploadsController.handleUploadGuildImage);

export default router;
