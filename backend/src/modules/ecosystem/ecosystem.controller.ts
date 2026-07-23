import { Request, Response } from 'express';
import * as StardustService from './stardust.service';
import * as MissionsService from './missions.service';
import * as SeasonsService from './seasons.service';
import * as PlatformService from '../subscriptions/platform-subscriptions.service';
import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';

export const getStardust = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const balance = await StardustService.getStardustBalance(userId);
  const history = await StardustService.getStardustHistory(userId, 15);
  res.json({ success: true, data: { ...balance, history } });
};

export const getMissions = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const missions = await MissionsService.getUserMissions(userId);
  res.json({ success: true, data: missions });
};

export const claimMission = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const result = await MissionsService.claimMissionReward(userId, id);
  res.json({ success: true, data: result });
};

export const getPlatformPlan = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const planDetails = await PlatformService.getMyPlatformPlan(userId);
  res.json({ success: true, data: planDetails });
};

export const getAllPlans = async (_req: any, res: Response) => {
  res.json({ success: true, data: PlatformService.PLATFORM_PLANS });
};

export const activatePlan = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const { plan } = req.body;
  const result = await PlatformService.activatePlatformPlan(userId, plan);
  res.json({ success: true, data: result });
};

export const cancelPlan = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const result = await PlatformService.cancelPlatformPlan(userId);
  res.json({ success: true, data: result });
};

export const getUserTitles = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const titles = await prisma.userTitle.findMany({
    where: { userId },
    include: { title: true },
  });
  res.json({ success: true, data: titles.map(t => t.title) });
};

export const equipTitle = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const { titleName } = req.body;

  if (titleName) {
    const hasTitle = await prisma.userTitle.findFirst({
      where: { userId, title: { name: titleName } },
    });
    if (!hasTitle && titleName !== 'Explorador') {
      throw new AppError('Aún no has desbloqueado este título', 400);
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { activeTitle: titleName || null },
  });

  res.json({ success: true, message: `Título actualizado a: ${titleName || 'Ninguno'}` });
};

export const getSeasonPass = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const data = await SeasonsService.getUserSeasonPass(userId);
  res.json({ success: true, data });
};

export const claimPassLevel = async (req: any, res: Response) => {
  const userId = req.user!.id;
  const { level } = req.body;
  const result = await SeasonsService.claimPassLevel(userId, Number(level));
  res.json({ success: true, data: result });
};
