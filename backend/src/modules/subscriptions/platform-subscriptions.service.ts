import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';
import { isStaffRole } from '@gremio-estelar/shared';

export interface PlanBenefitInfo {
  name: string;
  price: number;
  description: string;
  stardustMultiplier: number;
  xpMultiplier: number;
  maxImagesPerDay: number;
  badgeColor: string;
  benefits: string[];
}

export const PLATFORM_PLANS: Record<string, PlanBenefitInfo> = {
  FREE: {
    name: 'Explorer (Gratis)',
    price: 0,
    description: 'Acceso total y gratuito a la plataforma',
    stardustMultiplier: 1.0,
    xpMultiplier: 1.0,
    maxImagesPerDay: 20,
    badgeColor: '#888888',
    benefits: [
      'Publicaciones y chats ilimitados',
      'Acceso completo a Gremios y Eventos',
      'Misiones diarias y sistema de Stardust',
      'Hasta 20 imágenes por día en publicaciones',
      'Personalización básica de perfil (color de banner)',
    ],
  },
  ASTRO: {
    name: 'Astro',
    price: 2.99,
    description: 'Personalización visual y velocidad',
    stardustMultiplier: 1.2,
    xpMultiplier: 1.5,
    maxImagesPerDay: 100,
    badgeColor: '#38bdf8',
    benefits: [
      'Todo lo de Explorer',
      'Insignia de plan Astro azul neón en tu perfil y chats',
      'Borde de avatar azul neón',
      'Gradiente o imagen personalizada en el banner',
      'Subida de imágenes optimizada a alta calidad (hasta 100/día)',
      'Soporte para GIFs en publicaciones y comentarios',
      'Multiplicador +20% Stardust y +50% XP',
      'Pack de stickers exclusivos Astro',
    ],
  },
  NOVA: {
    name: 'Nova Pro',
    price: 5.99,
    description: 'Para creadores y fans dedicados',
    stardustMultiplier: 1.5,
    xpMultiplier: 2.0,
    maxImagesPerDay: 100,
    badgeColor: '#c084fc',
    benefits: [
      'Todo lo de Astro',
      'Insignia de plan Nova Pro morada neón',
      'Borde de avatar morado pulsante',
      'Banner animado (GIF)',
      'Reproductor de música personalizada en tu perfil',
      'Reacciones animadas en chat y publicaciones',
      'Grupos de mensajes privados (DMs grupales)',
      'Multiplicador +50% Stardust y ×2 XP',
      'Estadísticas avanzadas de visualización de perfil',
    ],
  },
  STELLAR: {
    name: 'Stellar Elite',
    price: 12.99,
    description: 'El nivel máximo de prestigio estelar',
    stardustMultiplier: 2.0,
    xpMultiplier: 3.0,
    maxImagesPerDay: 500,
    badgeColor: '#fbbf24',
    benefits: [
      'Todo lo de Nova Pro',
      'Insignia animada de estrella dorada de máxima jerarquía',
      'Borde de avatar dorado animado con efecto de brillo',
      'Efectos de partículas cósmicas flotantes en tu perfil',
      'Mascota virtual acompañante en tu perfil',
      'Acceso directo a Eventos VIP exclusivos',
      'Multiplicador ×2 Stardust (+100%) y ×3 XP',
      'Acceso anticipado a nuevas herramientas (Beta Privada)',
      'Canal de soporte prioritario directo',
    ],
  },
};

function userHasRole(roleStr: string | null | undefined, targetRole: string): boolean {
  if (!roleStr) return false;
  return roleStr.split(',').map((r) => r.trim()).includes(targetRole);
}

/**
 * Plan efectivo para beneficios premium — UNA SOLA FUENTE DE VERDAD.
 * Política de producción: solo staff real (isStaffRole) y roles VIP de pago
 * reciben un plan elevado sin pagar. VTUBER/MAID/BETA_TESTER usan su plan.
 */
export function getEffectivePlan(plan?: string | null, role?: string | null): string {
  if (isStaffRole(role) || userHasRole(role, 'VIP_STELLAR')) return 'STELLAR';
  if (userHasRole(role, 'VIP_NOVA')) return 'NOVA';
  if (userHasRole(role, 'VIP_ASTRO')) return 'ASTRO';
  return plan || 'FREE';
}

/**
 * Multiplicador de XP del plan efectivo — UNA SOLA FUENTE DE VERDAD.
 * Los planes prometen ×1.5 (ASTRO), ×2 (NOVA) y ×3 (STELLAR) sobre el XP base.
 */
export function getXpMultiplier(plan?: string | null, role?: string | null): number {
  const effective = getEffectivePlan(plan, role);
  return PLATFORM_PLANS[effective]?.xpMultiplier ?? 1;
}

/**
 * Multiplicador de XP del usuario consultado en BD (para servicios que no
 * tienen el plan/rol a mano). Devuelve 1 si el usuario no existe.
 */
export const getXpMultiplierForUser = async (userId: string): Promise<number> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, role: true },
    });
    if (!user) return 1;
    return getXpMultiplier(user.plan, user.role);
  } catch {
    return 1;
  }
};

/**
 * Ranking de planes para comparar tiers (FREE < ASTRO < NOVA < STELLAR).
 */
const PLAN_RANK: Record<string, number> = { FREE: 0, ASTRO: 1, NOVA: 2, STELLAR: 3 };
export function planMeetsOrExceeds(plan: string | null | undefined, required: string): boolean {
  const effective = getEffectivePlan(plan);
  return (PLAN_RANK[effective] ?? 0) >= (PLAN_RANK[required] ?? 99);
}

export const getMyPlatformPlan = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, verifiedUntil: true },
  });

  if (!user) throw new AppError('Usuario no encontrado', 404);

  // Política de planes (producción): solo el staff interno real y los roles
  // VIP de pago reciben beneficios premium sin pagar (ver getEffectivePlan).
  const isStaff = isStaffRole(user.role);
  const hasStellarVip = userHasRole(user.role, 'VIP_STELLAR');

  let activeSub = await prisma.platformSubscription.findUnique({
    where: { userId },
  });

  // Verificar expiración del periodo mensual (30 días)
  if (activeSub && activeSub.currentPeriodEnd < new Date() && activeSub.status === 'ACTIVE') {
    const expiredPlan = activeSub.plan;
    activeSub = await prisma.platformSubscription.update({
      where: { userId },
      data: { status: 'EXPIRED' },
    });

    if (!isStaff && !hasStellarVip) {
      // Si el verificado venía incluido con STELLAR (caduca con el plan),
      // se revoca junto con el plan. El comprado aparte se conserva.
      const verifiedIncluded = expiredPlan === 'STELLAR' && !!user.verifiedUntil;
      await prisma.user.update({
        where: { id: userId },
        data: { plan: 'FREE', ...(verifiedIncluded ? { verifiedUntil: null } : {}) },
      });
      user.plan = 'FREE';
      if (verifiedIncluded) user.verifiedUntil = null;
    }
  }

  // El verificado comprado expira solo (no se revoca con el plan).
  const effectivePlan = getEffectivePlan(user.plan, user.role);

  return {
    plan: effectivePlan,
    role: user.role,
    subscription: activeSub,
    planInfo: PLATFORM_PLANS[effectivePlan] || PLATFORM_PLANS.FREE,
    verifiedUntil: activeSub?.plan === 'STELLAR' ? activeSub.currentPeriodEnd : user.verifiedUntil,
  };
};

export const activatePlatformPlan = async (
  userId: string,
  plan: 'ASTRO' | 'NOVA' | 'STELLAR',
  durationDays = 30
) => {
  if (!PLATFORM_PLANS[plan]) {
    throw new AppError('Plan no válido', 400);
  }

  // El nuevo periodo se APILA sobre el tiempo restante de una suscripción
  // activa (renovar/extender no descarta los días que quedaban). Si no hay
  // suscripción activa vigente, el periodo empieza desde hoy.
  const existing = await prisma.platformSubscription.findUnique({
    where: { userId },
    select: { currentPeriodEnd: true, status: true },
  });
  const now = new Date();
  const base =
    existing && existing.status === 'ACTIVE' && existing.currentPeriodEnd > now
      ? existing.currentPeriodEnd
      : now;

  const periodEnd = new Date(base);
  periodEnd.setDate(periodEnd.getDate() + durationDays);

  // STELLAR incluye la insignia de verificación durante todo el plan.
  const verifiedUntil = plan === 'STELLAR' ? new Date(periodEnd.getTime()) : undefined;

  const [sub] = await prisma.$transaction([
    prisma.platformSubscription.upsert({
      where: { userId },
      update: {
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
      },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: periodEnd,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan, ...(verifiedUntil ? { verifiedUntil } : {}) },
    }),
  ]);

  return {
    message: `¡Bienvenido al plan ${plan}! Tus beneficios y multiplicadores ya están activos por ${durationDays} días.`,
    subscription: sub,
    planInfo: PLATFORM_PLANS[plan],
  };
};

export const cancelPlatformPlan = async (userId: string) => {
  const sub = await prisma.platformSubscription.findUnique({ where: { userId } });
  if (!sub) throw new AppError('No tienes una suscripción activa', 404);

  const subPlan = sub.plan;
  const updatedSub = await prisma.platformSubscription.update({
    where: { userId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  // Al cancelar, el verificado incluido por STELLAR expira con el plan (el
  // comprado por separado se conserva, se distingue porque no caducó aún).
  const isStellarIncluded =
    subPlan === 'STELLAR' &&
    sub.currentPeriodEnd &&
    sub.currentPeriodEnd > new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: 'FREE',
      ...(isStellarIncluded
        ? { verifiedUntil: null }
        : {}),
    },
  });

  return {
    message: 'Tu suscripción ha sido cancelada. Has vuelto al plan Explorer gratuito.',
    subscription: updatedSub,
  };
};
