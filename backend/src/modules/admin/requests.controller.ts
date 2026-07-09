import { Request, Response, NextFunction } from 'express';
import * as RequestsService from './requests.service';

export const submitRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await RequestsService.submitRequest({
      userId: req.user!.id,
      displayName: req.body.displayName,
      description: req.body.description,
      avatarUrl: req.body.avatarUrl,
      lore: req.body.lore,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const listRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const result = await RequestsService.listRequests({
      page,
      limit,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
};

export const getRequestDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await RequestsService.getRequestDetail(String(req.params.id));
    res.json(result);
  } catch (err) { next(err); }
};

export const approveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await RequestsService.approveRequest(String(req.params.id), req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

export const rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await RequestsService.rejectRequest(
      String(req.params.id),
      req.user!.id,
      req.body.notes
    );
    res.json(result);
  } catch (err) { next(err); }
};
