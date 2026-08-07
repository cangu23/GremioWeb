import AppError from '../../errors/AppError';
import * as PaymentsRepository from './payments.repository';
import * as UserRepository from '../users/user.repository';
import { activatePlatformPlan, PLATFORM_PLANS } from '../subscriptions/platform-subscriptions.service';
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
  type: 'PLAN_SUSCRIPTION' | 'GIFT_PLAN' | 'DONATION';
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

  // Server-side price validation: the client must not be able to declare a
  // different amount than the real price of the selected plan (otherwise a
  // user could declare $0.01 for a NOVA plan and pay almost nothing).
  if (type === 'PLAN_SUSCRIPTION' || type === 'GIFT_PLAN') {
    const planInfo = PLATFORM_PLANS[planKey as string];
    if (!planInfo || planInfo.price <= 0) {
      throw new AppError('Plan no válido para pago con PayPal', 400);
    }
    if (Math.abs(amount - planInfo.price) > 0.01) {
      throw new AppError('El monto no coincide con el precio del plan seleccionado', 400);
    }
  } else if (type === 'DONATION') {
    if (amount < 1 || amount > 5000) {
      throw new AppError('Las donaciones deben ser entre $1 y $5000 USD', 400);
    }
  } else {
    throw new AppError('Tipo de pago no soportado', 400);
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

  // Modo Demo / Desarrollo sin credenciales PayPal.
  // Demo grants paid plans for free, so it is NEVER allowed in production,
  // regardless of PAYPAL_ALLOW_DEMO.
  if (!accessToken) {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.PAYPAL_STRICT === 'true';

    if (isProduction) {
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

  const description = type === 'GIFT_PLAN' || (type === 'PLAN_SUSCRIPTION' && recipientId && recipientId !== userId)
    ? `Regalo de Membresía Plan ${planKey} en Gremio Estelar`
    : type === 'PLAN_SUSCRIPTION'
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
 * Captura y confirma la orden aprobada por el usuario en PayPal.
 *
 * Seguridad: la orden capturada se valida contra la intención de pago guardada
 * (mismo reference_id, mismo monto y divisa USD) y solo el usuario que creó la
 * transacción puede confirmarla. Sin estas comprobaciones un usuario podría
 * pagar $0.01 (o nada en modo demo) para activar un plan completo.
 */
export const capturePayPalOrder = async (orderId: string, clientTxId: string, dbTxId?: string, callerUserId?: string) => {
  if (!clientTxId) {
    throw new AppError('Falta el identificador de la transacción', 400);
  }

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

  // Ownership check: solo el usuario que creó la intención de pago puede
  // confirmarla (evita usar un txId ajeno para activar un plan).
  if (callerUserId && userId !== callerUserId) {
    throw new AppError('No tienes permiso para confirmar esta transacción', 403);
  }

  const accessToken = await getPayPalAccessToken();
  let paymentApproved = false;

  if (!accessToken || orderId.startsWith('SIMULATED_')) {
    // Simulated payments grant paid plans for free — never allowed in production.
    const isProduction = process.env.NODE_ENV === 'production' || process.env.PAYPAL_STRICT === 'true';

    if (isProduction) {
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
      const purchaseUnit = data.purchase_units?.[0];
      const capture = purchaseUnit?.payments?.captures?.[0];
      const paidAmount = Number(capture?.amount?.value);
      const paidCurrency = capture?.amount?.currency_code;
      const referenceId = purchaseUnit?.reference_id;

      // La orden debe estar completamente capturada (status COMPLETED, no
      // APPROVED — APPROVED significa que el dinero aún no se ha cobrado).
      if (!response.ok || data.status !== 'COMPLETED' || capture?.status !== 'COMPLETED') {
        throw new AppError(`PayPal no completó la transacción (Estado: ${data.status || 'Fallido'})`, 400);
      }

      // La orden capturada debe corresponder a esta intención de pago.
      if (!referenceId || referenceId !== clientTxId) {
        throw new AppError('La orden de PayPal no corresponde a esta transacción', 400);
      }

      // El monto pagado debe coincidir con el monto almacenado (misma divisa).
      if (paidCurrency !== 'USD' || !(paidAmount > 0) || Math.abs(paidAmount - amount) > 0.01) {
        throw new AppError('El monto pagado no coincide con el monto de la transacción', 400);
      }

      paymentApproved = true;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Error al capturar la orden en PayPal', 500);
    }
  }

  if (!paymentApproved) {
    throw new AppError('La transacción de PayPal no pudo ser confirmada', 400);
  }

  // PROCESAR COMPRA SEGÚN EL TIPO
  if ((type === 'PLAN_SUSCRIPTION' || type === 'GIFT_PLAN') && planKey) {
    const isGift = Boolean(recipientId && recipientId !== userId);
    const targetUserId = isGift ? recipientId! : userId;

    // Activar suscripción mensual por 30 días para el usuario correspondiente
    await activatePlatformPlan(targetUserId, planKey as any, 30);

    const bonusMap: Record<string, number> = { ASTRO: 500, NOVA: 1500, STELLAR: 5000 };
    const bonusStardust = bonusMap[planKey] || 500;

    // Acreditar bono de Stardust al beneficiario del plan
    await prisma.user.update({
      where: { id: targetUserId },
      data: { stardust: { increment: bonusStardust } },
    });

    await prisma.stardustTransaction.create({
      data: {
        userId: targetUserId,
        amount: bonusStardust,
        reason: isGift
          ? `Bono por regalo de Plan ${planKey} vía PayPal ($${amount} USD)`
          : `Bono por activar Plan ${planKey} vía PayPal ($${amount} USD)`,
      },
    });

    // Obtener nombres para los logs/notificaciones de regalo
    let targetUsername = 'Usuario';
    let donorUsername = 'Alguien';

    if (isGift) {
      const targetUser = await UserRepository.findById(targetUserId);
      if (targetUser) targetUsername = targetUser.username || targetUser.displayName || 'Usuario';

      if (!anonymous) {
        const donorUser = await UserRepository.findById(userId);
        if (donorUser) donorUsername = donorUser.displayName || donorUser.username || 'Alguien';
      } else {
        donorUsername = 'Un usuario anónimo';
      }

      // Notificar en la base de datos al receptor del regalo
      try {
        await prisma.systemLog.create({
          data: {
            level: 'INFO',
            message: `GIFT_RECEIVED:${targetUserId}`,
            context: JSON.stringify({
              donorId: anonymous ? null : userId,
              donorName: donorUsername,
              planKey,
              message: message || '',
              createdAt: new Date().toISOString(),
            }),
          },
        });
      } catch (logErr) {
        console.warn('[PayPal Gift Log Error]', logErr);
      }
    }

    if (txLog) {
      await prisma.systemLog.update({
        where: { id: txLog.id },
        data: { message: `PAYPAL_COMPLETED:${clientTxId}` },
      });
    }

    if (isGift) {
      return {
        status: 'SUCCESS',
        type: 'GIFT_PLAN',
        planKey,
        amount,
        recipientUsername: targetUsername,
        message: `¡Fantástico! Le has regalado la membresía Plan ${planKey} a @${targetUsername} con éxito.`,
      };
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
