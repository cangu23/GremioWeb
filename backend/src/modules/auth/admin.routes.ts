import { Router } from 'express';
import { Role } from '@gremio-estelar/shared';
import { authenticate } from './authenticate';
import { authorize } from './authorize';
import * as AdminController from './admin.controller';

const router = Router();

router.get(
  '/test',
  authenticate,
  authorize(Role.ADMIN),
  AdminController.testAdminAccess
);

export default router;
