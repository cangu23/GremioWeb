import { Request, Response, NextFunction } from 'express';
import * as VTubersService from './vtubers.service';

export const getFeaturedVtubers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const featured = await VTubersService.getFeaturedVtubers();
    res.json(featured);
  } catch (err) {
    next(err);
  }
};

export const getVtubersDirectory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string)?.trim();
    const contentType = (req.query.contentType as string)?.trim();
    const language = (req.query.language as string)?.trim();

    const result = await VTubersService.getVtubersDirectory({
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

export const getLiveVtubers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const live = await VTubersService.getLiveVtubers();
    res.json(live);
  } catch (err) {
    next(err);
  }
};
