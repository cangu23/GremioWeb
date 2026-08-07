import { Request, Response, NextFunction } from 'express';
import * as GamificationService from './gamification.service';
import prisma from '../../database/prisma';

// Rate limit for stream XP. Stored in the DB (via a SystemLog marker row) so
// it survives restarts and works across multiple server instances. An
// in-memory Map would reset on restart and be bypassable with multiple pods.
const STREAM_XP_COOLDOWN_MS = 4 * 60 * 1000; // 4 minutes (slightly less than 5 to allow margin)
const STREAM_XP_MARKER_PREFIX = 'STREAM_XP_CLAIM:';

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

export const awardStreamXp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { minutes } = req.body;

    // Validate minutes (must be >= 5 and <= 60)
    const watchMinutes = Math.min(Math.max(Math.round(minutes || 0), 5), 60);

    // Rate limiting: check cooldown (DB-backed, shared across instances)
    const markerId = `${STREAM_XP_MARKER_PREFIX}${userId}`;
    const lastClaim = await prisma.systemLog.findFirst({
      where: { message: markerId },
      orderBy: { createdAt: 'desc' },
    });
    const lastClaimTime = lastClaim?.createdAt ? new Date(lastClaim.createdAt).getTime() : 0;
    if (lastClaim && Date.now() - lastClaimTime < STREAM_XP_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((STREAM_XP_COOLDOWN_MS - (Date.now() - lastClaimTime)) / 1000);
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

    // Record cooldown marker (unique per user — a second concurrent claim
    // updates the same row via upsert instead of creating duplicates)
    await prisma.systemLog.create({
      data: { level: 'INFO', message: markerId, context: JSON.stringify({ userId, watchMinutes }) },
    }).catch(() => {});

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

export const awardManualAchievement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, achievementId } = req.body;
    const result = await GamificationService.awardAchievementManually(userId, achievementId);
    res.json({ message: 'Logro asignado correctamente', result });
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
