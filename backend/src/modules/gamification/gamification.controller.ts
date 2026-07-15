import { Request, Response, NextFunction } from 'express';
import * as GamificationService from './gamification.service';

// Simple in-memory rate limit: user -> last claim timestamp
const streamXpCooldowns = new Map<string, number>();
const STREAM_XP_COOLDOWN_MS = 4 * 60 * 1000; // 4 minutes (slightly less than 5 to allow margin)

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

export const awardStreamXp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { minutes } = req.body;

    // Validate minutes (must be >= 5 and <= 60)
    const watchMinutes = Math.min(Math.max(Math.round(minutes || 0), 5), 60);

    // Rate limiting: check cooldown
    const lastClaim = streamXpCooldowns.get(userId);
    if (lastClaim && Date.now() - lastClaim < STREAM_XP_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((STREAM_XP_COOLDOWN_MS - (Date.now() - lastClaim)) / 1000);
      res.status(429).json({
        message: `Debes esperar ${remainingSeconds}s antes de reclamar más XP`,
        cooldownRemaining: remainingSeconds,
      });
      return;
    }

    // Calculate points: 20 pts per 5 minutes watched
    const xpUnits = Math.floor(watchMinutes / 5);
    const xpAmount = xpUnits * 20;

    if (xpAmount <= 0) {
      res.status(400).json({ message: 'Debes ver al menos 5 minutos para ganar puntos' });
      return;
    }

    // Award XP: custom amount based on minutes watched
    const result = await GamificationService.awardCustomXp(userId, xpAmount);

    // Set cooldown
    streamXpCooldowns.set(userId, Date.now());

    // Clean up old entries every 100 claims
    if (streamXpCooldowns.size > 1000) {
      const now = Date.now();
      for (const [uid, ts] of streamXpCooldowns) {
        if (now - ts > STREAM_XP_COOLDOWN_MS * 2) {
          streamXpCooldowns.delete(uid);
        }
      }
    }

    res.json({
      ...result,
      xpAwarded: xpAmount,
      watchMinutes,
      message: `+${xpAmount} XP por ver ${watchMinutes} min de stream`,
    });
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
