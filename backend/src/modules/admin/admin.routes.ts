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
  updatePostModerationSchema,
  updateCommentAdminSchema,
  updateCommentModerationSchema,
  createReportSchema,
  resolveReportSchema,
} from './admin.validation';
import * as AdminController from './admin.controller';
import * as CodesController from './codes.controller';
import * as RequestsController from './requests.controller';
import * as SettingsController from './settings.controller';
import * as StickersController from './stickers.controller';

const router = Router();

// Base authentication and staff authorization (ADMIN or MODERATOR)
router.use(authenticate, authorize(Role.ADMIN, Role.MODERATOR));

const adminOnly = authorize(Role.ADMIN);

// ========== DASHBOARD (Staff) ==========
router.get('/dashboard/stats', validateRequest(adminQuerySchema), AdminController.getDashboardStats);
router.get('/dashboard/activity', validateRequest(adminQuerySchema), AdminController.getRecentActivity);

// ========== USERS (Admin Only) ==========
router.get('/users', adminOnly, validateRequest(adminQuerySchema), AdminController.listUsers);
router.get('/users/:id', adminOnly, validateRequest(adminQuerySchema), AdminController.getUserDetail);
router.patch('/users/:id', adminOnly, validateRequest(updateUserAdminSchema), AdminController.updateUser);
router.delete('/users/:id', adminOnly, AdminController.deleteUser);
router.post('/users/:id/restore', adminOnly, AdminController.restoreUser);
router.post('/users/cleanup-profiles', adminOnly, AdminController.cleanupUserProfiles);

// ========== VTUBERS (Staff View, Admin Edit) ==========
router.get('/vtubers', validateRequest(adminQuerySchema), AdminController.listVtubers);
router.get('/vtubers/:id', validateRequest(adminQuerySchema), AdminController.getVtuberDetail);
router.patch('/vtubers/:id', adminOnly, validateRequest(updateVtuberAdminSchema), AdminController.updateVtuber);

// ========== EVENTS (Staff View, Admin Edit) ==========
router.get('/events', validateRequest(adminQuerySchema), AdminController.listEvents);
router.get('/events/:id', validateRequest(adminQuerySchema), AdminController.getEventDetail);
router.patch('/events/:id', adminOnly, validateRequest(updateEventAdminSchema), AdminController.updateEvent);
router.delete('/events/:id', adminOnly, AdminController.deleteEvent);

// ========== GUILDS (Staff View, Admin Edit) ==========
router.get('/guilds', validateRequest(adminQuerySchema), AdminController.listGuilds);
router.get('/guilds/:id', validateRequest(adminQuerySchema), AdminController.getGuildDetail);
router.patch('/guilds/:id', adminOnly, validateRequest(updateGuildAdminSchema), AdminController.updateGuild);
router.delete('/guilds/:id', adminOnly, AdminController.deleteGuild);

// ========== POSTS (Moderation — Staff) ==========
router.get('/posts', validateRequest(adminQuerySchema), AdminController.listPosts);
router.get('/posts/:id', validateRequest(adminQuerySchema), AdminController.getPostDetail);
// Moderators can only hide/pin posts. Editing the actual content requires ADMIN.
router.patch('/posts/:id', (req, res, next) => {
  if (req.body.content !== undefined) {
    return adminOnly(req, res, () => {
      validateRequest(updatePostAdminSchema)(req, res, next);
    });
  }
  return validateRequest(updatePostModerationSchema)(req, res, next);
}, AdminController.updatePost);
router.delete('/posts/:id', AdminController.deletePost);
router.post('/posts/:id/restore', AdminController.restorePost);

// ========== COMMENTS (Moderation — Staff) ==========
router.get('/comments', validateRequest(adminQuerySchema), AdminController.listComments);
// Moderators can only hide comments. Editing comment text requires ADMIN.
router.patch('/comments/:id', (req, res, next) => {
  if (req.body.content !== undefined) {
    return adminOnly(req, res, () => {
      validateRequest(updateCommentAdminSchema)(req, res, next);
    });
  }
  return validateRequest(updateCommentModerationSchema)(req, res, next);
}, AdminController.updateComment);
router.delete('/comments/:id', AdminController.deleteComment);

// ========== REPORTS (Moderation — Staff) ==========
router.get('/reports', validateRequest(adminQuerySchema), AdminController.listReports);
router.post('/reports', validateRequest(createReportSchema), AdminController.createReport);
router.patch('/reports/:id', validateRequest(resolveReportSchema), AdminController.resolveReport);

// ========== INVITATION CODES (Admin Only) ==========
router.post('/codes/generate', adminOnly, CodesController.generateCode);
router.get('/codes', adminOnly, validateRequest(adminQuerySchema), CodesController.listCodes);
router.delete('/codes/:id', adminOnly, CodesController.revokeCode);

// ========== VTUBER REQUESTS (Staff View & Approve) ==========
router.get('/vtuber-requests', validateRequest(adminQuerySchema), RequestsController.listRequests);
router.get('/vtuber-requests/:id', validateRequest(adminQuerySchema), RequestsController.getRequestDetail);
router.post('/vtuber-requests/:id/approve', RequestsController.approveRequest);
router.post('/vtuber-requests/:id/reject', RequestsController.rejectRequest);

// ========== LOGS (Staff) ==========
router.get('/logs', validateRequest(adminQuerySchema), AdminController.listLogs);

// ========== CAFE SETTINGS (Admin Only) ==========
router.get('/settings', adminOnly, validateRequest(adminQuerySchema), SettingsController.getAllSettings);
router.patch('/settings', adminOnly, SettingsController.updateSettings);

// ========== STICKERS / EMOJIS (Admin Only) ==========
router.get('/stickers', adminOnly, validateRequest(adminQuerySchema), StickersController.listStickers);
router.post('/stickers', adminOnly, StickersController.createSticker);
router.patch('/stickers/:id', adminOnly, StickersController.updateSticker);
router.delete('/stickers/:id', adminOnly, StickersController.deleteSticker);

export default router;
