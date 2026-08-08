import crypto from 'crypto';
import AppError from '../../errors/AppError';
import { PLATFORM_PLANS } from '../subscriptions/platform-subscriptions.service';
import { VERIFICATION_PRICE, VERIFICATION_DURATION_DAYS, hasAnyRole } from '@gremio-estelar/shared';
import prisma from '../../database/prisma';

const PAYPAL_SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const PAYPAL_LIVE_BASE = 'https://api-m.paypal.com';

const getPayPalBaseUrl = () => {
  return process.env.PAYPAL_MODE === 'live' ? PAYPAL_LIVE_BASE : PAYPAL_SANDBOX_BASE;
};

/**
 * true cuando corre en un entorno real de producción (el modo demo está vetado).
 * PAYPAL_STRICT=true fuerza el modo estricto incluso en desarrollo.
 */
const isRealProduction = () =>
  process.env.NODE_ENV === 'production' || process.env.PAYPAL_STRICT === 'true';

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
  type: 'PLAN_SUSCRIPTION' | 'GIFT_PLAN' | 'DONATION' | 'VERIFICATION';
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
  } else if (type === 'VERIFICATION') {
    // Insignia de verificación: precio fijo de $1.50 USD / mes (server-side).
    if (Math.abs(amount - VERIFICATION_PRICE) > 0.01) {
      throw new AppError('El monto no coincide con el precio de la verificación ($1.50 USD)', 400);
    }
  } else if (type === 'DONATION') {
    if (amount < 1 || amount > 5000) {
      throw new AppError('Las donaciones deben ser entre $1 y $5000 USD', 400);
    }

    // Validación del destinatario: debe existir, no ser el propio donante y
    // ser un VTuber (mismas reglas que el endpoint de donaciones legacy).
    if (!recipientId) {
      throw new AppError('Falta el destinatario de la donación', 400);
    }
    if (recipientId === userId) {
      throw new AppError('No puedes donarte a ti mismo', 400);
    }
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, role: true },
    });
    if (!recipient) {
      throw new AppError('El usuario receptor no existe', 404);
    }
    if (!hasAnyRole(recipient.role, ['VTUBER'])) {
      throw new AppError('Solo puedes donar a VTubers', 403);
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
    if (isRealProduction()) {
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
    : type === 'VERIFICATION'
    ? 'Insignia de Verificación (1 mes) en Gremio Estelar'
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
            // custom_id llega al webhook PAYMENT.CAPTURE.COMPLETED como
            // resource.custom_id y permite correlacionar el evento con la
            // intención de pago guardada en la BD.
            custom_id: clientTxId,
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
 * Procesa y entrega los beneficios de un pago YA confirmado (por captura o
 * por webhook).
 *
 * Idempotencia: el primer paso marca la intención de pago como COMPLETED de
 * forma atómica (updateMany con filtro PENDING). Cualquier llamada paralela o
 * reintento posterior no encuentra la fila en estado PENDING y lanza 409, de
 * modo que el plan, el Stardust y las donaciones nunca se entregan dos veces.
 *
 * Nota: hay una ventana mínima entre el marcado y la entrega de beneficios;
 * si el proceso muere justo en ese instante, el pago quedará registrado como
 * COMPLETED sin beneficios (recuperable manualmente desde el dashboard de
 * PayPal). Es el trade-off elegido para garantizar que jamás se dupliquen
 * beneficios con dinero real.
 */
async function processPayPalPayment(clientTxId: string, txLog: { id: string; context: string | null }) {
  const payload = JSON.parse(txLog.context || '{}');
  const { userId, amount, type, planKey, recipientId, message, anonymous } = payload;
  const planName = planKey as string;

  // Guard atómico + entrega de beneficios en UNA transacción: si algo falla a
  // mitad de camino, la intención de pago sigue PENDING y PayPal reintenta el
  // webhook (o el usuario reintenta la captura). La concurrencia la resuelve
  // el updateMany con filtro PENDING (un solo ganador; los demás reciben 409).
  return prisma.$transaction(async (tx) => {
    const marked = await tx.systemLog.updateMany({
      where: { id: txLog.id, message: `PAYPAL_PENDING:${clientTxId}` },
      data: { message: `PAYPAL_COMPLETED:${clientTxId}` },
    });
    if (marked.count === 0) {
      throw new AppError('Esta transacción ya fue procesada', 409);
    }

    // PROCESAR COMPRA SEGÚN EL TIPO
    if ((type === 'PLAN_SUSCRIPTION' || type === 'GIFT_PLAN') && planName) {
      const isGift = Boolean(recipientId && recipientId !== userId);
      const targetUserId = isGift ? recipientId! : userId;

      // Activar suscripción por 30 días (inline de activatePlatformPlan para
      // mantener todo dentro de esta transacción — no se pueden anidar).
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);
      await tx.platformSubscription.upsert({
        where: { userId: targetUserId },
        update: { plan: planName, status: 'ACTIVE', currentPeriodEnd: periodEnd, cancelledAt: null },
        create: { userId: targetUserId, plan: planName, status: 'ACTIVE', currentPeriodEnd: periodEnd },
      });

      // STELLAR incluye la insignia de verificación durante todo el plan.
      const verifiedUntil =
        planName === 'STELLAR' ? new Date(periodEnd.getTime()) : undefined;

      await tx.user.update({
        where: { id: targetUserId },
        data: { plan: planName, ...(verifiedUntil ? { verifiedUntil } : {}) },
      });

      const bonusMap: Record<string, number> = { ASTRO: 500, NOVA: 1500, STELLAR: 5000 };
      const bonusStardust = bonusMap[planName] || 500;

      await tx.user.update({
        where: { id: targetUserId },
        data: { stardust: { increment: bonusStardust } },
      });

      await tx.stardustTransaction.create({
        data: {
          userId: targetUserId,
          amount: bonusStardust,
          reason: isGift
            ? `Bono por regalo de Plan ${planName} vía PayPal ($${amount} USD)`
            : `Bono por activar Plan ${planName} vía PayPal ($${amount} USD)`,
        },
      });

      // Obtener nombres para los logs/notificaciones de regalo
      let targetUsername = 'Usuario';
      let donorUsername = 'Alguien';

      if (isGift) {
        const targetUser = await tx.user.findUnique({ where: { id: targetUserId } });
        if (targetUser) targetUsername = targetUser.username || targetUser.displayName || 'Usuario';

        if (!anonymous) {
          const donorUser = await tx.user.findUnique({ where: { id: userId } });
          if (donorUser) donorUsername = donorUser.displayName || donorUser.username || 'Alguien';
        } else {
          donorUsername = 'Un usuario anónimo';
        }

        await tx.systemLog.create({
          data: {
            level: 'INFO',
            message: `GIFT_RECEIVED:${targetUserId}`,
            context: JSON.stringify({
              donorId: anonymous ? null : userId,
              donorName: donorUsername,
              planKey: planName,
              message: message || '',
              createdAt: new Date().toISOString(),
            }),
          },
        });
      }

      if (isGift) {
        return {
          status: 'SUCCESS',
          type: 'GIFT_PLAN',
          planKey: planName,
          amount,
          recipientUsername: targetUsername,
          message: `¡Fantástico! Le has regalado la membresía Plan ${planName} a @${targetUsername} con éxito.`,
        };
      }

      return {
        status: 'SUCCESS',
        type: 'PLAN_SUSCRIPTION',
        planKey: planName,
        amount,
        message: `¡Felicidades! Tu Plan ${planName} se ha activado exitosamente mediante PayPal.`,
      };
    }

    if (type === 'VERIFICATION') {
      // Insignia azul de verificación por 30 días (se apila sobre el tiempo
      // restante si el usuario ya tiene verificación activa).
      const now = new Date();
      const existingVerified = await tx.user.findUnique({
        where: { id: userId },
        select: { verifiedUntil: true },
      });
      const base =
        existingVerified?.verifiedUntil && new Date(existingVerified.verifiedUntil) > now
          ? new Date(existingVerified.verifiedUntil)
          : now;
      const verifiedUntil = new Date(base);
      verifiedUntil.setDate(verifiedUntil.getDate() + VERIFICATION_DURATION_DAYS);

      await tx.user.update({
        where: { id: userId },
        data: { verifiedUntil },
      });

      return {
        status: 'SUCCESS',
        type: 'VERIFICATION',
        amount,
        verifiedUntil,
        message: `¡Tu insignia de verificación está activa hasta el ${verifiedUntil.toISOString().split('T')[0]}!`,
      };
    }

    if (type === 'DONATION' && recipientId) {
      const donation = await tx.donation.create({
        data: {
          donorId: userId,
          recipientId,
          amount,
          message,
          anonymous,
        },
        include: {
          recipient: {
            select: {
              id: true,
              username: true,
              vtuberProfile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      });

      const stardustReward = Math.round(amount * 10);
      await tx.user.update({
        where: { id: userId },
        data: { stardust: { increment: stardustReward } },
      });

      await tx.stardustTransaction.create({
        data: {
          userId,
          amount: stardustReward,
          reason: `Recompensa por Donación vía PayPal ($${amount} USD)`,
        },
      });

      return {
        status: 'SUCCESS',
        type: 'DONATION',
        donation,
        amount,
        message: `¡Donación de $${amount} USD enviada con éxito mediante PayPal!`,
      };
    }

    throw new AppError('Tipo de pago no soportado', 400);
  });
}

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

  // Reintento con txId: si la transacción ya fue marcada como COMPLETED,
  // rechazarla aquí (además del guard atómico en processPayPalPayment).
  if (!txLog.message.startsWith('PAYPAL_PENDING:')) {
    throw new AppError('Esta transacción ya fue procesada', 409);
  }

  const payload = JSON.parse(txLog.context);
  const { userId, amount } = payload;

  // Ownership check: solo el usuario que creó la intención de pago puede
  // confirmarla (evita usar un txId ajeno para activar un plan).
  if (callerUserId && userId !== callerUserId) {
    throw new AppError('No tienes permiso para confirmar esta transacción', 403);
  }

  const accessToken = await getPayPalAccessToken();

  if (!accessToken || String(orderId).startsWith('SIMULATED_')) {
    // Simulated payments grant paid plans for free — never allowed in production.
    if (isRealProduction()) {
      throw new AppError('Pagos simulados no están permitidos en entorno de producción sin credenciales reales de PayPal.', 403);
    }
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
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Error al capturar la orden en PayPal', 500);
    }
  }

  return processPayPalPayment(clientTxId, txLog);
};

// ════════════════════════════════════════════════════════════════
// WEBHOOK DE PAYPAL (PAYMENT.CAPTURE.COMPLETED)
// ════════════════════════════════════════════════════════════════
// Permite entregar los beneficios aunque el usuario cierre el navegador
// después de pagar (la captura vía callback del navegador ya no es el único
// camino). La firma se verifica contra el certificado de PayPal y el evento
// se correlaciona con la intención de pago mediante resource.custom_id.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32Decimal = (data: Buffer): string => {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  // PayPal firma con el CRC32 del body crudo en FORMA DECIMAL
  // (el sample oficial: parseInt('0x' + crc32hex).toString()). Un formato
  // incorrecto aquí rompería la verificación de firma silenciosamente.
  return ((crc ^ 0xffffffff) >>> 0).toString(10);
};

/** Extrae la primera clave pública válida de un PEM (cadena de certificados). */
function extractPublicKeyFromCertChain(pem: string): crypto.KeyObject | null {
  const blocks = pem.split('-----BEGIN CERTIFICATE-----');
  for (const block of blocks) {
    const endIdx = block.indexOf('-----END CERTIFICATE-----');
    if (endIdx === -1) continue;
    const body = block.slice(0, endIdx);
    const certPem = `-----BEGIN CERTIFICATE-----${body}-----END CERTIFICATE-----`.trim();
    try {
      const cert = new crypto.X509Certificate(certPem);
      return cert.publicKey;
    } catch {
      // Intenta con el siguiente certificado de la cadena
    }
  }
  return null;
}

/**
 * Verifica la firma de un webhook de PayPal.
 * Ver: https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
 */
export async function verifyPayPalWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'] || 'SHA256withRSA';

  if (!webhookId || !transmissionId || !transmissionTime || !transmissionSig || !certUrl) {
    return false;
  }

  // Anti-replay: el evento debe ser reciente (los reintentos de PayPal usan
  // cabeceras de transmisión nuevas, así que esto no afecta a reintentos reales).
  const transmissionMs = Date.parse(String(transmissionTime));
  if (Number.isNaN(transmissionMs) || Math.abs(Date.now() - transmissionMs) > 10 * 60 * 1000) {
    console.warn('[PayPal Webhook] Rechazado por antigüedad de transmission-time');
    return false;
  }

  // Anti-SSRF: solo se descarga el certificado si lo sirve un host de PayPal.
  const certUrlStr = String(certUrl);
  if (!/^https:\/\//i.test(certUrlStr)) return false;
  try {
    const certHost = new URL(certUrlStr).hostname.toLowerCase();
    const isPayPalHost =
      certHost === 'www.paypalobjects.com' ||
      certHost.endsWith('.paypal.com') ||
      certHost.endsWith('.paypalobjects.com');
    if (!isPayPalHost) return false;
  } catch {
    return false;
  }

  let certPem: string;
  try {
    const certRes = await fetch(certUrlStr);
    if (!certRes.ok) return false;
    certPem = await certRes.text();
  } catch {
    return false;
  }

  const publicKey = extractPublicKeyFromCertChain(certPem);
  if (!publicKey) return false;

  // Mensaje firmado por PayPal: "transmission_id|transmission_time|webhook_id|crc32(decimal)"
  const message = `${transmissionId}|${transmissionTime}|${webhookId}|${crc32Decimal(Buffer.from(rawBody, 'utf8'))}`;
  const algorithm = /sha256/i.test(String(authAlgo)) ? 'RSA-SHA256' : 'RSA-SHA1';

  try {
    return crypto.verify(
      algorithm,
      Buffer.from(message, 'utf8'),
      publicKey,
      Buffer.from(String(transmissionSig), 'base64')
    );
  } catch {
    return false;
  }
}

/**
 * Maneja el webhook de PayPal. Debe responderse 2xx para que PayPal deje de
 * reintentar, y 5xx/4xx para que reintente.
 */
export const handlePayPalWebhook = async (
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) {
    // Fail-closed: sin webhook ID configurado no procesamos nada. 503 hace
    // que PayPal reintente hasta que se configure correctamente.
    throw new AppError('PayPal webhook no configurado (falta PAYPAL_WEBHOOK_ID).', 503);
  }

  const valid = await verifyPayPalWebhookSignature(headers, rawBody);
  if (!valid) {
    console.error('[PayPal Webhook] Firma inválida — rechazando evento');
    throw new AppError('Firma del webhook de PayPal inválida', 400);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    throw new AppError('Payload del webhook de PayPal inválido', 400);
  }

  if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    // Otros eventos se reconocen silenciosamente (ACK para PayPal).
    return { status: 'IGNORED', eventType: event.event_type };
  }

  const resource = event.resource || {};
  const clientTxId = resource.custom_id as string | undefined;
  if (!clientTxId) {
    throw new AppError('Webhook sin custom_id — no se puede correlacionar la transacción', 400);
  }

  const paidAmount = Number(resource.amount?.value);
  const paidCurrency = resource.amount?.currency_code;

  const txLog = await prisma.systemLog.findFirst({
    where: { message: `PAYPAL_PENDING:${clientTxId}` },
    orderBy: { createdAt: 'desc' },
  });
  if (!txLog || !txLog.context) {
    throw new AppError('Transacción de PayPal no encontrada para el webhook', 404);
  }

  const payload = JSON.parse(txLog.context);
  const { amount } = payload;

  // El monto cobrado debe coincidir con la intención de pago guardada.
  if (paidCurrency !== 'USD' || !(paidAmount > 0) || Math.abs(paidAmount - amount) > 0.01) {
    throw new AppError('El monto del webhook no coincide con la transacción', 400);
  }

  try {
    const result = await processPayPalPayment(clientTxId, txLog);
    console.log(`[PayPal Webhook] ${event.event_type} procesado para ${clientTxId}`);
    return result;
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 409) {
      // Idempotencia: PayPal reintentó un evento ya procesado → ACK.
      return { status: 'ALREADY_PROCESSED' };
    }
    throw err;
  }
};
