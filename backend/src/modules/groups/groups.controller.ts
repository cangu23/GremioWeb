import { Request, Response, NextFunction } from 'express';
import * as GroupsService from './groups.service';

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, memberIds } = req.body;
    const group = await GroupsService.createGroup(req.user!.id, name, memberIds);
    res.status(201).json(group);
  } catch (err) { next(err); }
};

export const listMyGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await GroupsService.listMyGroups(req.user!.id);
    res.json(groups);
  } catch (err) { next(err); }
};

export const getGroupMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const messages = await GroupsService.getGroupMessages(String(req.params.groupId), req.user!.id, limit);
    res.json(messages);
  } catch (err) { next(err); }
};

export const sendGroupMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await GroupsService.sendGroupMessage(String(req.params.groupId), req.user!.id, String(req.body.content || ''));
    res.status(201).json(message);
  } catch (err) { next(err); }
};

export const addGroupMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await GroupsService.addGroupMember(String(req.params.groupId), req.user!.id, String(req.body.userId || ''));
    res.status(201).json(member);
  } catch (err) { next(err); }
};

export const removeGroupMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await GroupsService.removeGroupMember(String(req.params.groupId), req.user!.id, String(req.params.userId));
    res.json(result);
  } catch (err) { next(err); }
};

export const leaveGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await GroupsService.leaveGroup(String(req.params.groupId), req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};
