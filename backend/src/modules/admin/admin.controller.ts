import { Request, Response, NextFunction } from 'express';
import * as AdminService from './admin.service';
import { AdminQueryInput } from './admin.types';


// ========== DASHBOARD ==========

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await AdminService.getDashboardStats();
    res.json(stats);
  } catch (err) { next(err); }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const activity = await AdminService.getRecentActivity(limit);
    res.json(activity);
  } catch (err) { next(err); }
};

// ========== USERS ==========

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listUsers(req.query as unknown as AdminQueryInput);
    res.json(result);
  } catch (err) { next(err); }
};

export const getUserDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AdminService.getUserDetail(String(req.params.id));
    res.json(user);
  } catch (err) { next(err); }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.updateUser(String(req.params.id), req.body, req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.deleteUser(String(req.params.id), req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

export const restoreUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.restoreUser(String(req.params.id), req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== VTUBERS ==========

export const listVtubers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listVtubers(req.query as unknown as AdminQueryInput);
    res.json(result);
  } catch (err) { next(err); }
};

export const getVtuberDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await AdminService.getVtuberDetail(String(req.params.id));
    res.json(profile);
  } catch (err) { next(err); }
};

export const updateVtuber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.updateVtuber(String(req.params.id), req.body, req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== EVENTS ==========

export const listEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listEvents(req.query as unknown as AdminQueryInput);
    res.json(result);
  } catch (err) { next(err); }
};

export const getEventDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await AdminService.getEventDetail(String(req.params.id));
    res.json(event);
  } catch (err) { next(err); }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.updateEvent(String(req.params.id), req.body, req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.deleteEvent(String(req.params.id), req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== GUILDS ==========

export const listGuilds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listGuilds(req.query as unknown as AdminQueryInput);
    res.json(result);
  } catch (err) { next(err); }
};

export const getGuildDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guild = await AdminService.getGuildDetail(String(req.params.id));
    res.json(guild);
  } catch (err) { next(err); }
};

export const updateGuild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.updateGuild(String(req.params.id), req.body, req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteGuild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.deleteGuild(String(req.params.id), req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== POSTS ==========

export const listPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listPosts(req.query as unknown as AdminQueryInput);
    res.json(result);
  } catch (err) { next(err); }
};

export const getPostDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await AdminService.getPostDetail(String(req.params.id));
    res.json(post);
  } catch (err) { next(err); }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.updatePost(String(req.params.id), req.body, req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.deletePost(String(req.params.id), req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

export const restorePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.restorePost(String(req.params.id), req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== COMMENTS ==========

export const listComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listComments(req.query as unknown as AdminQueryInput);
    res.json(result);
  } catch (err) { next(err); }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.updateComment(String(req.params.id), req.body, req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.deleteComment(String(req.params.id), req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== REPORTS ==========

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.createReport({
      ...req.body,
      reporterId: req.user!.id,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const listReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listReports(req.query as unknown as AdminQueryInput);
    res.json(result);
  } catch (err) { next(err); }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.resolveReport(String(req.params.id), req.body, req.user!.id, req.ip);
    res.json(result);
  } catch (err) { next(err); }
};

// ========== LOGS ==========

export const listLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listLogs(req.query as unknown as AdminQueryInput);
    res.json(result);
  } catch (err) { next(err); }
};
