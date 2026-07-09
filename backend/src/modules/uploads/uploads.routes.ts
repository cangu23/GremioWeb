import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as UploadsController from './uploads.controller';

const router = Router();

// Upload avatar (requires auth)
router.post('/avatar', authenticate, UploadsController.uploadAvatar, UploadsController.handleUploadAvatar);

// Upload banner (requires auth)
router.post('/banner', authenticate, UploadsController.uploadBanner, UploadsController.handleUploadBanner);

export default router;
