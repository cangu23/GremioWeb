import { Request, Response, NextFunction } from 'express';
import * as StreamersService from './streamers.service';

export const getFeaturedStreamers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const featured = await StreamersService.getFeaturedStreamers();
    res.json(featured);
  } catch (err) {
    next(err);
  }
};

export const getStreamersDirectory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string)?.trim();
    const contentType = (req.query.contentType as string)?.trim();
    const language = (req.query.language as string)?.trim();

    const result = await StreamersService.getStreamersDirectory({
      search: search || undefined,
      contentType: contentType || undefined,
      language: language || undefined,
      page,
      limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getLiveStreamers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const live = await StreamersService.getLiveStreamers();
    res.json(live);
  } catch (err) {
    next(err);
  }
};

// ========== MI PERFIL ==========

export const getMyStreamerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await StreamersService.getMyStreamerProfile(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateMyStreamerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await StreamersService.updateMyStreamerProfile(req.user!.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
