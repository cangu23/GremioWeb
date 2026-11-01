import { Router } from 'express';
import { Role } from '@gremio-estelar/shared';
import { authenticate } from '../auth/authenticate';
import { authorize } from '../auth/authorize';
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

// Upload sticker image (requires ADMIN)
router.post('/sticker', authenticate, authorize(Role.ADMIN), UploadsController.uploadImage, UploadsController.handleUploadSticker);

// Upload cafe image (logo/banner) (requires ADMIN)
router.post('/cafe', authenticate, authorize(Role.ADMIN), UploadsController.uploadImage, UploadsController.handleUploadCafeImage);

// Upload pet image / GIF (requires auth)
router.post('/pet', authenticate, UploadsController.uploadImage, UploadsController.handleUploadPetImage);

// Upload general image / GIF (requires auth)
router.post('/image', authenticate, UploadsController.uploadImage, UploadsController.handleUploadGeneralImage);

export default router;
