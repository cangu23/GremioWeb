import { Request, Response, NextFunction } from 'express';
import * as PaymentsService from './payments.service';

export const getTiers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await PaymentsService.getTiers();
    res.json(tiers);
  } catch (err) { next(err); }
};

export const getTierById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tier = await PaymentsService.getTierById(String(req.params.id));
    res.json(tier);
  } catch (err) { next(err); }
};

export const getMySubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await PaymentsService.getMySubscription(req.user!.id);
    res.json(sub);
  } catch (err) { next(err); }
};

export const getMySubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subs = await PaymentsService.getMySubscriptions(req.user!.id);
    res.json(subs);
  } catch (err) { next(err); }
};

export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tierId } = req.body;
    const sub = await PaymentsService.subscribe(req.user!.id, tierId);
    res.status(201).json(sub);
  } catch (err) { next(err); }
};

export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PaymentsService.cancelSubscription(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

export const donate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donation = await PaymentsService.donate(req.user!.id, req.body);
    res.status(201).json(donation);
  } catch (err) { next(err); }
};

export const getDonations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const donations = await PaymentsService.getDonations(req.user!.id, limit);
    res.json(donations);
  } catch (err) { next(err); }
};

export const getDonationsSent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const donations = await PaymentsService.getDonationsSent(req.user!.id, limit);
    res.json(donations);
  } catch (err) { next(err); }
};

export const getDonationStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await PaymentsService.getDonationStats(req.user!.id);
    res.json(stats);
  } catch (err) { next(err); }
};

export const seedTiers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await PaymentsService.seedTiers();
    res.json({ message: 'Planes seedeados correctamente' });
  } catch (err) { next(err); }
};
