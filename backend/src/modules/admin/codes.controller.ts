import { Request, Response, NextFunction } from 'express';
import * as CodesService from './codes.service';

export const generateCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CodesService.generateCode({
      name: req.body.name,
      role: req.body.role,
      generatedById: req.user!.id,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const listCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const result = await CodesService.listCodes({
      page,
      limit,
      status: req.query.status as string | undefined,
      role: req.query.role as string | undefined,
      search: req.query.search as string | undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
};

export const revokeCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CodesService.revokeCode(String(req.params.id));
    res.json(result);
  } catch (err) { next(err); }
};

export const redeemCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CodesService.redeemCode(req.body.code, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};
