import AppError from '../../errors/AppError';
import * as PaymentsRepository from './payments.repository';
import * as UserRepository from '../users/user.repository';
import { activatePlatformPlan } from '../subscriptions/platform-subscriptions.service';
import prisma from '../../database/prisma';

const PAYPAL_SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const PAYPAL_LIVE_BASE = 'https://api-m.paypal.com';

const getPayPalBaseUrl = () => {
  return process.env.PAYPAL_MODE === 'live' ? PAYPAL_LIVE_BASE : PAYPAL_SANDBOX_BASE;
};

/**
 * Obtiene el access_token OAuth2 de PayPal
 */
const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const paypalMode = (process.env.PAYPAL_MODE || 'sandbox').trim().toLowerCase();

  if (!clientId || !clientSecret) {
    return null; // Modo simulación si no hay credenciales en .env
  }

  const baseUrl = paypalMode === 'live' ? PAYPAL_LIVE_BASE : PAYPAL_SANDBOX_BASE;

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[PayPal Token Error ${response.status}] Endpoint: ${baseUrl}`, data);
      const detail = data?.error_description || data?.message || data?.error || `HTTP ${response.status}`;
      throw new AppError(`Error de autenticación con PayPal: ${detail} (${paypalMode.toUpperCase()})`, 400);
    }

    return data.access_token;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('[PayPal Token Fetch Error]', err);
    throw new AppError(`Error de comunicación con PayPal API: ${err?.message || 'Fallo de red'}`, 500);
  }
};

interface CreatePayPalOrderParams {
  userId: string;
  amount: number;
  type: 'PLAN_SUSCRIPTION' | 'DONATION';
  planKey?: string;
  recipientId?: string;
  message?: string;
  anonymous?: boolean;
}

/**
 * Crea una orden de pago en PayPal y devuelve la URL de aprobación
 */
export const createPayPalOrder = async (params: CreatePayPalOrderParams) => {
  const { userId, amount, type, planKey, recipientId, message, anonymous } = params;

  if (amount <= 0) {
    throw new AppError('El monto debe ser mayor a 0 USD', 400);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const clientTxId = `PAYPAL_${type}_${userId.slice(0, 8)}_${Date.now()}`;

  let pendingTxId = '';
  try {
    // Registrar intención de pago en la BD
    const pendingTx = await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: `PAYPAL_PENDING:${clientTxId}`,
        context: JSON.stringify({
          userId,
          amount,
          type,
          planKey,
          recipientId,
          message,
          anonymous,
          createdAt: new Date().toISOString(),
        }),
      },
    });
    pendingTxId = pendingTx.id;
  } catch (dbErr) {
    console.warn('[PayPal Warning] No se pudo guardar el log de intención de pago:', dbErr);
  }

  const returnUrl = `${frontendUrl}/payments/paypal/callback?txId=${pendingTxId}&clientTxId=${clientTxId}`;
  const cancelUrl = `${frontendUrl}/payments/paypal/callback?txId=${pendingTxId}&status=canceled`;

  const accessToken = await getPayPalAccessToken();

  // Modo Demo / Desarrollo sin credenciales PayPal
  if (!accessToken) {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.PAYPAL_STRICT === 'true';
    const allowDemo = process.env.PAYPAL_ALLOW_DEMO === 'true';

    if (isProduction && !allowDemo) {
      throw new AppError(
        'La pasarela de pago PayPal no está configurada en producción. Configura PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en las variables de entorno del backend.',
        503
      );
    }

    console.log(`[PayPal Demo] Simulando orden PayPal de $${amount} USD (${clientTxId})`);
    return {
      mode: 'DEMO',
      approveUrl: `${returnUrl}&orderId=SIMULATED_${Date.now()}`,
      clientTxId,
      message: 'PayPal Client ID no configurado en .env. Se usa la pasarela interactiva de desarrollo.',
    };
  }

  const description = type === 'PLAN_SUSCRIPTION'
    ? `Membresía Plan ${planKey} en Gremio Estelar`
    : `Donación a VTuber en Gremio Estelar`;

  try {
    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: clientTxId,
            description,
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'Gremio Estelar',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      console.error('[PayPal Create Order Error]', data);
      throw new AppError(data.message || 'Error al crear orden en PayPal', 500);
    }

    const approveLink = data.links?.find((l: any) => l.rel === 'approve')?.href;

    return {
      mode: 'LIVE',
      orderId: data.id,
      approveUrl: approveLink || data.links?.[0]?.href,
      clientTxId,
    };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('[PayPal Fetch Error]', err);
    throw new AppError('Error de comunicación con PayPal API', 500);
  }
};

/**
 * Captura y confirma la orden aprobada por el usuario en PayPal
 */
export const capturePayPalOrder = async (orderId: string, clientTxId: string, dbTxId?: string) => {
  let txLog = null;
  if (dbTxId) {
    txLog = await prisma.systemLog.findUnique({ where: { id: dbTxId } });
  } else {
    txLog = await prisma.systemLog.findFirst({
      where: { message: `PAYPAL_PENDING:${clientTxId}` },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!txLog || !txLog.context) {
    throw new AppError('Transacción de PayPal no encontrada o expirada', 404);
  }

  const payload = JSON.parse(txLog.context);
  const { userId, amount, type, planKey, recipientId, message, anonymous } = payload;

  const accessToken = await getPayPalAccessToken();
  let paymentApproved = false;

  if (!accessToken || orderId.startsWith('SIMULATED_')) {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.PAYPAL_STRICT === 'true';
    const allowDemo = process.env.PAYPAL_ALLOW_DEMO === 'true';

    if (isProduction && !allowDemo) {
      throw new AppError('Pagos simulados no están permitidos en entorno de producción sin credenciales reales de PayPal.', 403);
    }
    paymentApproved = true;
  } else {
    try {
      const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok && (data.status === 'COMPLETED' || data.status === 'APPROVED')) {
        paymentApproved = true;
      } else {
        throw new AppError(`PayPal no completó la transacción (Estado: ${data.status || 'Fallido'})`, 400);
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Error al capturar la orden en PayPal', 500);
    }
  }

  if (!paymentApproved) {
    throw new AppError('La transacción de PayPal no pudo ser confirmada', 400);
  }

  // PROCESAR COMPRA SEGÚN EL TIPO
  if (type === 'PLAN_SUSCRIPTION' && planKey) {
    // Activar suscripción mensual por 30 días en la base de datos
    await activatePlatformPlan(userId, planKey as any, 30);

    const bonusMap: Record<string, number> = { ASTRO: 500, NOVA: 1500, STELLAR: 5000 };
    const bonusStardust = bonusMap[planKey] || 500;

    await prisma.user.update({
      where: { id: userId },
      data: { stardust: { increment: bonusStardust } },
    });

    await prisma.stardustTransaction.create({
      data: {
        userId,
        amount: bonusStardust,
        reason: `Bono por activar Plan ${planKey} vía PayPal ($${amount} USD)`,
      },
    });

    if (txLog) {
      await prisma.systemLog.update({
        where: { id: txLog.id },
        data: { message: `PAYPAL_COMPLETED:${clientTxId}` },
      });
    }

    return {
      status: 'SUCCESS',
      type: 'PLAN_SUSCRIPTION',
      planKey,
      amount,
      message: `¡Felicidades! Tu Plan ${planKey} se ha activado exitosamente mediante PayPal.`,
    };
  }

  if (type === 'DONATION' && recipientId) {
    const donation = await PaymentsRepository.createDonation({
      donorId: userId,
      recipientId,
      amount,
      message,
      anonymous,
    });

    const stardustReward = Math.round(amount * 10);
    await prisma.user.update({
      where: { id: userId },
      data: { stardust: { increment: stardustReward } },
    });

    await prisma.stardustTransaction.create({
      data: {
        userId,
        amount: stardustReward,
        reason: `Recompensa por Donación vía PayPal ($${amount} USD)`,
      },
    });

    if (txLog) {
      await prisma.systemLog.update({
        where: { id: txLog.id },
        data: { message: `PAYPAL_COMPLETED:${clientTxId}` },
      });
    }

    return {
      status: 'SUCCESS',
      type: 'DONATION',
      donation,
      amount,
      message: `¡Donación de $${amount} USD enviada con éxito mediante PayPal!`,
    };
  }

  throw new AppError('Tipo de pago no soportado', 400);
};
