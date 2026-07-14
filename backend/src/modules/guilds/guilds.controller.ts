import { Request, Response, NextFunction } from 'express';
import * as GuildsService from './guilds.service';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const guild = await GuildsService.create(req.body, userId);
    res.status(201).json(guild);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const guilds = await GuildsService.getAll(currentUserId);
    res.status(200).json(guilds);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const currentUserId = req.user?.id;
    const guild = await GuildsService.getById(id, currentUserId);
    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const guild = await GuildsService.update(id, req.body, userId);
    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const result = await GuildsService.remove(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const join = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const guildId = String(req.params.id);
    const result = await GuildsService.join(guildId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const leave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const guildId = String(req.params.id);
    const result = await GuildsService.leave(guildId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const kickMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requesterId = req.user!.id;
    const guildId = String(req.params.id);
    const targetUserId = String(req.params.userId);
    const result = await GuildsService.kickMember(guildId, targetUserId, requesterId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const changeMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requesterId = req.user!.id;
    const guildId = String(req.params.id);
    const targetUserId = String(req.params.userId);
    const { role } = req.body;
    const result = await GuildsService.changeMemberRole(guildId, targetUserId, role, requesterId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const transferLeadership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requesterId = req.user!.id;
    const guildId = String(req.params.id);
    const targetUserId = String(req.params.userId);
    const result = await GuildsService.transferLeadership(guildId, targetUserId, requesterId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyGuilds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const guilds = await GuildsService.getMyGuilds(userId);
    res.status(200).json(guilds);
  } catch (error) {
    next(error);
  }
};
