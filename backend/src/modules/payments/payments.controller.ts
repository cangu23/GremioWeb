import { Request, Response, NextFunction } from 'express';
import * as PaymentsService from './payments.service';
import * as PayPalService from './paypal.service';

// Donations (read-only — los pagos se hacen por PayPal)
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

// PayPal Gateway Integration
export const preparePayPal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, type, planKey, recipientId, message, anonymous } = req.body;
    const result = await PayPalService.createPayPalOrder({
      userId: req.user!.id,
      amount: Number(amount),
      type,
      planKey,
      recipientId,
      message,
      anonymous,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const confirmPayPal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, clientTxId, txId } = req.body;
    const result = await PayPalService.capturePayPalOrder(
      String(orderId || 'SIMULATED'),
      String(clientTxId || ''),
      String(txId || ''),
      req.user!.id
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

/**
 * Webhook público de PayPal (sin autenticación). La firma se verifica con el
 * certificado de PayPal y el payload se correlaciona mediante custom_id.
 * El body crudo es necesario para la verificación de firma y se captura en
 * app.ts mediante express.json({ verify }).
 */
export const paypalWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody || rawBody.length === 0) {
      res.status(400).json({ status: 'error', message: 'Falta el cuerpo del webhook' });
      return;
    }
    const result = await PayPalService.handlePayPalWebhook(
      req.headers,
      rawBody.toString('utf8')
    );
    res.json(result);
  } catch (err) { next(err); }
};
