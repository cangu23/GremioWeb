import { Request, Response, NextFunction } from 'express';
import * as DailyRewardsService from './daily-rewards.service';

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await DailyRewardsService.getStatus(req.user!.id);
    res.json(status);
  } catch (err) { next(err); }
};

export const claim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DailyRewardsService.claim(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};
