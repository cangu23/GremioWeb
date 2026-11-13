import { Request, Response, NextFunction } from 'express';
import * as ReferralService from './referral.service';
import { prisma } from '../../database/index';

export const getMyReferrals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    const data = await ReferralService.getMyReferrals(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
    const leaderboard = await ReferralService.getReferralLeaderboard(limit);
    res.json({
      campaign: {
        title: '✦ Campaña de Crecimiento del Gremio ✦',
        rewards: [
          'VRChat Plus (Suscripción)',
          'Discord Nitro',
          'Títulos estelares y Stardust extra',
        ],
        antiCheatNotice: 'Las cuentas creadas en la misma red/IP o no verificadas son filtradas automáticamente.',
      },
      leaderboard,
    });
  } catch (err) {
    next(err);
  }
};

export const checkReferralCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ valid: false, message: 'Código requerido' });
    }

    const referrer = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: code, mode: 'insensitive' } },
          { id: code },
        ],
      },
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!referrer) {
      return res.status(404).json({ valid: false, message: 'Código de invitación no encontrado' });
    }

    res.json({
      valid: true,
      referrer: {
        username: referrer.username,
        displayName: referrer.displayName || referrer.username,
        avatarUrl: referrer.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};
