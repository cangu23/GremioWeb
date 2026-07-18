import { Request, Response, NextFunction } from 'express';
import * as RouletteService from './roulette.service';

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await RouletteService.getStatus(req.user!.id);
    res.json(status);
  } catch (err) { next(err); }
};

export const spin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await RouletteService.spin(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await RouletteService.getHistory(req.user!.id);
    res.json(history);
  } catch (err) { next(err); }
};
