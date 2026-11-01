import { Request, Response, NextFunction } from 'express';
import * as CreatorService from './creator-codes.service';

/**
 * Valida un código de creador ingresado por un comprador.
 */
export async function validateCode(req: Request, res: Response, next: NextFunction) {
  try {
    const rawCode = String(req.query.code || '');
    const buyerId = (req as any).user?.id;
    const result = await CreatorService.validateCreatorCode(rawCode, buyerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene el dashboard y saldo de la creadora autenticada.
 */
export async function getMyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const data = await CreatorService.getCreatorDashboard(userId);
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
}

/**
 * Crea o actualiza el código personalizado de la creadora.
 */
export async function setupMyCode(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { desiredCode } = req.body;
    const code = await CreatorService.getOrCreateCreatorCode(userId, desiredCode);
    res.json({ status: 'ok', data: code });
  } catch (err) {
    next(err);
  }
}

/**
 * Solicita retiro de saldo acumulado.
 */
export async function handleRequestPayout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { amount, paypalEmail } = req.body;
    const payout = await CreatorService.requestPayout(userId, Number(amount), String(paypalEmail));
    res.status(201).json({ status: 'ok', data: payout });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Resumen financiero global (35% Servidores, 35% Creadores, 30% Fundador).
 */
export async function getFinancialSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await CreatorService.getFinancialSummaryAdmin();
    res.json({ status: 'ok', data: summary });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Lista de retiros de creadoras.
 */
export async function listPayouts(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const payouts = await CreatorService.listPayoutsAdmin(status);
    res.json({ status: 'ok', data: payouts });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Procesa una solicitud de retiro (Marcar Pagado o Rechazar).
 */
export async function processPayout(req: Request, res: Response, next: NextFunction) {
  try {
    const payoutId = req.params.id as string;
    const { action, adminNotes } = req.body;
    const result = await CreatorService.processPayoutAdmin(payoutId, action, adminNotes);
    res.json({ status: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}
