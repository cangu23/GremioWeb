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

export const getLiveVtubers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const live = await VTubersService.getLiveVtubers();
    res.json(live);
  } catch (err) {
    next(err);
  }
};
