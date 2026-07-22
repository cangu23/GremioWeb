import { Router } from 'express';
import { Role } from '@gremio-estelar/shared';
import { authenticate } from '../auth/authenticate';
import { authorize } from '../auth/authorize';
import { validateRequest } from '../auth/validateRequest';
import {
  adminQuerySchema,
  updateUserAdminSchema,
  updateVtuberAdminSchema,
  updateEventAdminSchema,
  updateGuildAdminSchema,
  updatePostAdminSchema,
  updateCommentAdminSchema,
  createReportSchema,
  resolveReportSchema,
} from './admin.validation';
import * as AdminController from './admin.controller';
import * as CodesController from './codes.controller';
import * as RequestsController from './requests.controller';
import * as SettingsController from './settings.controller';
import * as StickersController from './stickers.controller';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize(Role.ADMIN));

// ========== DASHBOARD ==========
router.get('/dashboard/stats', validateRequest(adminQuerySchema), AdminController.getDashboardStats);
router.get('/dashboard/activity', validateRequest(adminQuerySchema), AdminController.getRecentActivity);

// ========== USERS ==========
router.get('/users', validateRequest(adminQuerySchema), AdminController.listUsers);
router.get('/users/:id', validateRequest(adminQuerySchema), AdminController.getUserDetail);
router.patch('/users/:id', validateRequest(updateUserAdminSchema), AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/:id/restore', AdminController.restoreUser);
router.post('/users/cleanup-profiles', AdminController.cleanupUserProfiles);

// ========== VTUBERS ==========
router.get('/vtubers', validateRequest(adminQuerySchema), AdminController.listVtubers);
router.get('/vtubers/:id', validateRequest(adminQuerySchema), AdminController.getVtuberDetail);
router.patch('/vtubers/:id', validateRequest(updateVtuberAdminSchema), AdminController.updateVtuber);

// ========== EVENTS ==========
router.get('/events', validateRequest(adminQuerySchema), AdminController.listEvents);
router.get('/events/:id', validateRequest(adminQuerySchema), AdminController.getEventDetail);
router.patch('/events/:id', validateRequest(updateEventAdminSchema), AdminController.updateEvent);
router.delete('/events/:id', AdminController.deleteEvent);

// ========== GUILDS ==========
router.get('/guilds', validateRequest(adminQuerySchema), AdminController.listGuilds);
router.get('/guilds/:id', validateRequest(adminQuerySchema), AdminController.getGuildDetail);
router.patch('/guilds/:id', validateRequest(updateGuildAdminSchema), AdminController.updateGuild);
router.delete('/guilds/:id', AdminController.deleteGuild);

// ========== POSTS ==========
router.get('/posts', validateRequest(adminQuerySchema), AdminController.listPosts);
router.get('/posts/:id', validateRequest(adminQuerySchema), AdminController.getPostDetail);
router.patch('/posts/:id', validateRequest(updatePostAdminSchema), AdminController.updatePost);
router.delete('/posts/:id', AdminController.deletePost);
router.post('/posts/:id/restore', AdminController.restorePost);

// ========== COMMENTS ==========
router.get('/comments', validateRequest(adminQuerySchema), AdminController.listComments);
router.patch('/comments/:id', validateRequest(updateCommentAdminSchema), AdminController.updateComment);
router.delete('/comments/:id', AdminController.deleteComment);

// ========== REPORTS ==========
router.get('/reports', validateRequest(adminQuerySchema), AdminController.listReports);
router.post('/reports', validateRequest(createReportSchema), AdminController.createReport);
router.patch('/reports/:id', validateRequest(resolveReportSchema), AdminController.resolveReport);

// ========== INVITATION CODES ==========
router.post('/codes/generate', CodesController.generateCode);
router.get('/codes', validateRequest(adminQuerySchema), CodesController.listCodes);
router.delete('/codes/:id', CodesController.revokeCode);

// ========== VTUBER REQUESTS ==========
router.get('/vtuber-requests', validateRequest(adminQuerySchema), RequestsController.listRequests);
router.get('/vtuber-requests/:id', validateRequest(adminQuerySchema), RequestsController.getRequestDetail);
router.post('/vtuber-requests/:id/approve', RequestsController.approveRequest);
router.post('/vtuber-requests/:id/reject', RequestsController.rejectRequest);

// ========== LOGS ==========
router.get('/logs', validateRequest(adminQuerySchema), AdminController.listLogs);

// ========== CAFE SETTINGS ==========
router.get('/settings', validateRequest(adminQuerySchema), SettingsController.getAllSettings);
router.patch('/settings', SettingsController.updateSettings);

// ========== STICKERS / EMOJIS (Admin CRUD) ==========
router.get('/stickers', validateRequest(adminQuerySchema), StickersController.listStickers);
router.post('/stickers', StickersController.createSticker);
router.patch('/stickers/:id', StickersController.updateSticker);
router.delete('/stickers/:id', StickersController.deleteSticker);

export default router;
