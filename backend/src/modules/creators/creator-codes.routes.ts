import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { authorize } from '../auth/authorize';
import { Role } from '@gremio-estelar/shared';
import * as Controller from './creator-codes.controller';

const router = Router();

// 1. Validar código en checkout (Público / Autenticado opcional)
router.get('/validate', Controller.validateCode);

// 2. Rutas para Creadoras (VTuber, Streamer, Maid, Staff, Admin)
const creatorRoles = [Role.VTUBER, Role.STREAMER, Role.MAID, Role.ARTIST, Role.CLIPPER, Role.PARTNER, Role.STAFF, Role.MODERATOR, Role.MOD, Role.ADMIN, Role.OWNER];
router.get('/my-dashboard', authenticate, authorize(...creatorRoles), Controller.getMyDashboard);
router.post('/my-code', authenticate, authorize(...creatorRoles), Controller.setupMyCode);
router.post('/payout', authenticate, authorize(...creatorRoles), Controller.handleRequestPayout);

// 3. Rutas de Administración y Finanzas (Admin Only)
router.get('/admin/summary', authenticate, authorize(Role.ADMIN), Controller.getFinancialSummary);
router.get('/admin/payouts', authenticate, authorize(Role.ADMIN), Controller.listPayouts);
router.post('/admin/payouts/:id/process', authenticate, authorize(Role.ADMIN), Controller.processPayout);

export default router;
