import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';
import { validateRequest } from '../auth/validateRequest';
import { createPostSchema, createCommentSchema, reportPostSchema, reportCommentSchema } from './posts.validation';
import * as PostsController from './posts.controller';

const router = Router();

// ========== POSTS ==========
// Public routes
router.get('/', optionalAuth, PostsController.getFeed);
router.get('/hashtags/trending', optionalAuth, PostsController.getTrendingHashtags);
router.get('/hashtag/:hashtag', optionalAuth, PostsController.getPostsByHashtag);
router.get('/user/:userId', optionalAuth, PostsController.getUserPosts);
router.get('/:id', optionalAuth, PostsController.getPostById);

// Protected routes with validation
router.post('/', authenticate, validateRequest(createPostSchema), PostsController.createPost);
router.put('/:id', authenticate, PostsController.updatePost);
router.delete('/:id', authenticate, PostsController.deletePost);

// ========== REPORTS ==========
router.post('/:id/report', authenticate, validateRequest(reportPostSchema), PostsController.reportPost);

// ========== LIKES ==========
router.post('/:id/like', authenticate, PostsController.likePost);
router.post('/:id/unlike', authenticate, PostsController.unlikePost);

// ========== COMMENTS ==========
router.get('/:postId/comments', optionalAuth, PostsController.getComments);
router.post('/:postId/comments', authenticate, validateRequest(createCommentSchema), PostsController.createComment);
router.delete('/comments/:commentId', authenticate, PostsController.deleteComment);
router.post('/comments/:commentId/like', authenticate, PostsController.likeComment);
router.post('/comments/:commentId/unlike', authenticate, PostsController.unlikeComment);
router.post('/comments/:commentId/report', authenticate, validateRequest(reportCommentSchema), PostsController.reportComment);

export default router;
