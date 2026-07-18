import { Request, Response, NextFunction } from 'express';
import * as WarningsService from './warnings.service';

export const issueWarning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, reason } = req.body;
    const result = await WarningsService.issueWarning(userId, req.user!.id, reason, req.ip);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const getUserWarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warnings = await WarningsService.getUserWarnings(String(req.params.userId));
    res.json(warnings);
  } catch (err) { next(err); }
};

export const listWarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const result = await WarningsService.listWarnings(page, limit);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId, type } = req.body; // type: 'global', 'guild', or 'dm'
    const result = await WarningsService.deleteChatMessage(messageId, type, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteFeedPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.body;
    const result = await WarningsService.deleteFeedPost(postId, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};
