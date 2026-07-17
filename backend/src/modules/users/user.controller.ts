import { Request, Response, NextFunction } from 'express';
import * as UserService from './user.service';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const profile = await UserService.getMe(userId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const updatedProfile = await UserService.updateMe(userId, req.body);
    res.status(200).json(updatedProfile);
  } catch (error) {
    next(error);
  }
};

export const getPublicUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const publicProfile = await UserService.getPublicUser(id);
    res.status(200).json(publicProfile);
  } catch (error) {
    next(error);
  }
};

export const getUsersByRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = String(req.params.role || '').toUpperCase();
    const users = await UserService.getUsersByRole(role);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '');
    const users = await UserService.searchUsers(q);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { note } = req.body;
    const result = await UserService.updateNote(userId, note);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
