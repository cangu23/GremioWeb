import { Request, Response, NextFunction } from 'express';
import * as SearchService from './search.service';

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '');
    const limit = Number(req.query.limit) || 5;

    const results = await SearchService.globalSearch(q, limit);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};
