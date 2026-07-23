import { Request, Response, NextFunction } from 'express';
import * as PostsService from './posts.service';

// ========== POSTS ==========

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await PostsService.createPost(req.body, req.user!.id, req.body.mentions);
    res.status(201).json(post);
  } catch (err) { next(err); }
};

export const getFeed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const personalized = req.query.personalized === 'true';
    
    if (personalized && req.user) {
      const posts = await PostsService.getPersonalizedFeed(req.user.id, page, limit);
      res.json(posts);
    } else {
      const posts = await PostsService.getFeed(req.user?.id, page, limit);
      res.json(posts);
    }
  } catch (err) { next(err); }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await PostsService.updatePost(String(req.params.id), req.body, req.user!.id);
    res.json(post);
  } catch (err) { next(err); }
};

export const getUserPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.userId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const posts = await PostsService.getUserPosts(userId, req.user?.id, page, limit);
    res.json(posts);
  } catch (err) { next(err); }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await PostsService.getPostById(String(req.params.id), req.user?.id);
    res.json(post);
  } catch (err) { next(err); }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PostsService.deletePost(String(req.params.id), req.user!.id, req.body.moderationNote);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== LIKES ==========

export const likePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PostsService.likePost(String(req.params.id), req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

export const unlikePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PostsService.unlikePost(String(req.params.id), req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== COMMENTS ==========

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await PostsService.createComment(String(req.params.postId), req.body, req.user!.id, req.body.mentions);
    res.status(201).json(comment);
  } catch (err) { next(err); }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await PostsService.getComments(String(req.params.postId), req.user?.id);
    res.json(comments);
  } catch (err) { next(err); }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PostsService.deleteComment(String(req.params.commentId), req.user!.id, req.body.moderationNote);
    res.json(result);
  } catch (err) { next(err); }
};

export const likeComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = String(req.params.commentId);
    const result = await PostsService.likeComment(commentId, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

export const unlikeComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = String(req.params.commentId);
    const result = await PostsService.unlikeComment(commentId, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== HASHTAGS ==========

export const getTrendingHashtags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(20, Number(req.query.limit) || 10);
    const hashtags = await PostsService.getTrendingHashtags(limit);
    res.json(hashtags);
  } catch (err) { next(err); }
};

export const getPostsByHashtag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const posts = await PostsService.getPostsByHashtag(String(req.params.hashtag), page, limit);
    res.json(posts);
  } catch (err) { next(err); }
};

// ========== REPORTS ==========

export const reportPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PostsService.reportPost({
      postId: String(req.params.id),
      reporterId: req.user!.id,
      reason: req.body.reason,
      description: req.body.description,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const reportComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PostsService.reportComment({
      commentId: String(req.params.commentId),
      reporterId: req.user!.id,
      reason: req.body.reason,
      description: req.body.description,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

// ========== DIRECT MESSAGES ==========

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { receiverId, content } = req.body;
    const message = await PostsService.sendMessage(content, req.user!.id, receiverId);
    res.status(201).json(message);
  } catch (err) { next(err); }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const otherUserId = String(req.params.userId);
    const messages = await PostsService.getConversation(req.user!.id, otherUserId);
    res.json(messages);
  } catch (err) { next(err); }
};

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversations = await PostsService.getConversations(req.user!.id);
    res.json(conversations);
  } catch (err) { next(err); }
};

export const getUnreadDmCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await PostsService.getUnreadDmCount(req.user!.id);
    res.json({ count });
  } catch (err) { next(err); }
};
