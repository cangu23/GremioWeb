import AppError from '../../errors/AppError';
import * as PaymentsRepository from './payments.repository';
import * as UserRepository from '../users/user.repository';
import prisma from '../../database/prisma';

const PAYPHONE_API_BASE = 'https://pay.payphonetodoesposible.com/api/v2/Payment';

interface PreparePaymentParams {
  userId: string;
  amount: number; // In USD, e.g., 5.99
  type: 'PLAN_SUSCRIPTION' | 'DONATION';
  planKey?: string; // ASTRO, NOVA, STELLAR
  recipientId?: string; // For VTuber donation
  message?: string;
  anonymous?: boolean;
}

/**
 * Prepara una transacción de PayPhone y devuelve la URL de checkout
 */
export const preparePayment = async (params: PreparePaymentParams) => {
  const { userId, amount, type, planKey, recipientId, message, anonymous } = params;

  if (amount <= 0) {
    throw new AppError('El monto debe ser mayor a 0', 400);
  }

  const token = process.env.PAYPHONE_TOKEN;
  const storeId = process.env.PAYPHONE_STORE_ID;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const clientTransactionId = `PAYPHONE_${type}_${userId.slice(0, 8)}_${Date.now()}`;
  const amountInCents = Math.round(amount * 100);

  // Guardar intención de pago en la BD
  const pendingTx = await prisma.systemLog.create({
    data: {
      level: 'INFO',
      message: `PAYPHONE_PENDING:${clientTransactionId}`,
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

  const responseUrl = `${frontendUrl}/payments/payphone/callback?txId=${pendingTx.id}&clientTxId=${clientTransactionId}`;
  const cancellationUrl = `${frontendUrl}/payments/payphone/callback?txId=${pendingTx.id}&status=canceled`;

  // Si no hay token de PayPhone configurado en .env (modo desarrollo / demo)
  if (!token) {
    console.log(`[PayPhone Demo] Simulando checkout para $${amount} USD (${clientTransactionId})`);
    return {
      mode: 'DEMO',
      payUrl: `${responseUrl}&demoId=SIMULATED_${Date.now()}`,
      clientTransactionId,
      message: 'PayPhone Token no configurado en .env. Se usará el simulador interactivo para desarrollo.',
    };
  }

  // Si hay token real, hacer la petición a la API v2 de PayPhone
  try {
    const response = await fetch(`${PAYPHONE_API_BASE}/Prepare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        amountWithoutTax: amountInCents,
        currency: 'USD',
        clientTransactionId,
        responseUrl,
        cancellationUrl,
        ...(storeId ? { storeId } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.payWithPayPhone) {
      console.error('[PayPhone API Error]', data);
      throw new AppError(data.message || 'Error al conectar con la pasarela PayPhone', 500);
    }

    return {
      mode: 'LIVE',
      payUrl: data.payWithPayPhone || data.payWithCard,
      paymentId: data.paymentId,
      clientTransactionId,
    };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('[PayPhone Fetch Error]', err);
    throw new AppError('Error al comunicarse con PayPhone Ecuador', 500);
  }
};

/**
 * Confirma el pago enviado por PayPhone tras completar el formulario
 */
export const confirmPayment = async (payPhonePaymentId: string, clientTransactionId: string, dbTxId?: string) => {
  const token = process.env.PAYPHONE_TOKEN;

  // Buscar log de intención en la BD
  let txLog = null;
  if (dbTxId) {
    txLog = await prisma.systemLog.findUnique({ where: { id: dbTxId } });
  } else {
    txLog = await prisma.systemLog.findFirst({
      where: { message: `PAYPHONE_PENDING:${clientTransactionId}` },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!txLog || !txLog.context) {
    throw new AppError('Transacción no encontrada o expirada', 404);
  }

  const payload = JSON.parse(txLog.context);
  const { userId, amount, type, planKey, recipientId, message, anonymous } = payload;

  let paymentApproved = false;

  // Si es modo Demo (sin token real o payPhonePaymentId simulado)
  if (!token || payPhonePaymentId.startsWith('SIMULATED_')) {
    paymentApproved = true;
  } else {
    // Confirmar directamente con los servidores de PayPhone
    try {
      const response = await fetch(`${PAYPHONE_API_BASE}/Confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: Number(payPhonePaymentId),
          clientTxId: clientTransactionId,
        }),
      });

      const data = await response.json();
      if (response.ok && (data.statusCode === 3 || data.transactionStatus === 'Approved')) {
        paymentApproved = true;
      } else {
        throw new AppError(`El pago fue rechazado por PayPhone (Estado: ${data.transactionStatus || 'Fallido'})`, 400);
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Error al verificar el estado de la transacción con PayPhone', 500);
    }
  }

  if (!paymentApproved) {
    throw new AppError('La transacción no pudo ser verificada', 400);
  }

  // PROCESAR COMPRA SEGÚN EL TIPO
  if (type === 'PLAN_SUSCRIPTION' && planKey) {
    // Actualizar plan del usuario
    await UserRepository.update(userId, {
      role: (planKey === 'NOVA' || planKey === 'STELLAR') ? 'VTUBER' : undefined,
    });

    // Otorgar Stardust Bonus
    const bonusMap: Record<string, number> = { ASTRO: 500, NOVA: 1500, STELLAR: 5000 };
    const bonusStardust = bonusMap[planKey] || 500;

    await prisma.userStardust.upsert({
      where: { userId },
      create: { userId, amount: bonusStardust },
      update: { amount: { increment: bonusStardust } },
    });

    await prisma.stardustTransaction.create({
      data: {
        userId,
        amount: bonusStardust,
        type: 'EARNED',
        reason: `Bono por activar Plan ${planKey} vía PayPhone ($${amount} USD)`,
      },
    });

    // Marcar log como procesado
    await prisma.systemLog.update({
      where: { id: txLog.id },
      data: { message: `PAYPHONE_COMPLETED:${clientTransactionId}` },
    });

    return {
      status: 'SUCCESS',
      type: 'PLAN_SUSCRIPTION',
      planKey,
      amount,
      message: `¡Felicidades! Tu Plan ${planKey} se ha activado exitosamente mediante PayPhone Ecuador.`,
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

    // Otorgar Stardust por donar (10 stardust por dólar)
    const stardustReward = Math.round(amount * 10);
    await prisma.userStardust.upsert({
      where: { userId },
      create: { userId, amount: stardustReward },
      update: { amount: { increment: stardustReward } },
    });

    await prisma.stardustTransaction.create({
      data: {
        userId,
        amount: stardustReward,
        type: 'EARNED',
        reason: `Recompensa por Donación vía PayPhone ($${amount} USD)`,
      },
    });

    // Marcar log como procesado
    await prisma.systemLog.update({
      where: { id: txLog.id },
      data: { message: `PAYPHONE_COMPLETED:${clientTransactionId}` },
    });

    return {
      status: 'SUCCESS',
      type: 'DONATION',
      donation,
      amount,
      message: `¡Donación de $${amount} USD enviada con éxito mediante PayPhone!`,
    };
  }

  throw new AppError('Tipo de pago no soportado', 400);
};
