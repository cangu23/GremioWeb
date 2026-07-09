import { Request, Response, NextFunction } from 'express';
import * as GamificationService from './gamification.service';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await GamificationService.getMyGamificationProfile(req.user!.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const leaderboard = await GamificationService.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
};

export const getAllAchievements = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const achievements = await GamificationService.getAllAchievements();
    res.json(achievements);
  } catch (err) {
    next(err);
  }
};

export const awardXp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body;
    const result = await GamificationService.awardXpForAction(req.user!.id, action);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const seed = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await GamificationService.seedAchievements();
    res.json({ message: 'Achievements seeded successfully' });
  } catch (err) {
    next(err);
  }
};
