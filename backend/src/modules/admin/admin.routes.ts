import { Router } from 'express';
import { Role } from '@gremio-estelar/shared';
import { authenticate } from '../auth/authenticate';
import { authorize } from '../auth/authorize';
import { validateRequest } from '../auth/validateRequest';
import {
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

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize(Role.ADMIN));

// ========== DASHBOARD ==========
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/activity', AdminController.getRecentActivity);

// ========== USERS ==========
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.patch('/users/:id', validateRequest(updateUserAdminSchema), AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/:id/restore', AdminController.restoreUser);

// ========== VTUBERS ==========
router.get('/vtubers', AdminController.listVtubers);
router.get('/vtubers/:id', AdminController.getVtuberDetail);
router.patch('/vtubers/:id', validateRequest(updateVtuberAdminSchema), AdminController.updateVtuber);

// ========== EVENTS ==========
router.get('/events', AdminController.listEvents);
router.get('/events/:id', AdminController.getEventDetail);
router.patch('/events/:id', validateRequest(updateEventAdminSchema), AdminController.updateEvent);
router.delete('/events/:id', AdminController.deleteEvent);

// ========== GUILDS ==========
router.get('/guilds', AdminController.listGuilds);
router.get('/guilds/:id', AdminController.getGuildDetail);
router.patch('/guilds/:id', validateRequest(updateGuildAdminSchema), AdminController.updateGuild);
router.delete('/guilds/:id', AdminController.deleteGuild);

// ========== POSTS ==========
router.get('/posts', AdminController.listPosts);
router.get('/posts/:id', AdminController.getPostDetail);
router.patch('/posts/:id', validateRequest(updatePostAdminSchema), AdminController.updatePost);
router.delete('/posts/:id', AdminController.deletePost);
router.post('/posts/:id/restore', AdminController.restorePost);

// ========== COMMENTS ==========
router.get('/comments', AdminController.listComments);
router.patch('/comments/:id', validateRequest(updateCommentAdminSchema), AdminController.updateComment);
router.delete('/comments/:id', AdminController.deleteComment);

// ========== REPORTS ==========
router.get('/reports', AdminController.listReports);
router.post('/reports', validateRequest(createReportSchema), AdminController.createReport);
router.patch('/reports/:id', validateRequest(resolveReportSchema), AdminController.resolveReport);

// ========== LOGS ==========
router.get('/logs', AdminController.listLogs);

export default router;
