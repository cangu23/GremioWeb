import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';

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

export const getMyPlatformPlan = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true },
  });

  if (!user) throw new AppError('Usuario no encontrado', 404);

  const activeSub = await prisma.platformSubscription.findUnique({
    where: { userId },
  });

  // VTUBER, MAID, MODERATOR, ADMIN automatically enjoy STELLAR status
  const effectivePlan = (user.role === 'VTUBER' || user.role === 'MAID' || user.role === 'ADMIN')
    ? 'STELLAR'
    : (user.plan || 'FREE');

  return {
    plan: effectivePlan,
    role: user.role,
    subscription: activeSub,
    planInfo: PLATFORM_PLANS[effectivePlan] || PLATFORM_PLANS.FREE,
  };
};

export const activatePlatformPlan = async (userId: string, plan: 'ASTRO' | 'NOVA' | 'STELLAR') => {
  if (!PLATFORM_PLANS[plan]) {
    throw new AppError('Plan no válido', 400);
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

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
      data: { plan },
    }),
  ]);

  return {
    message: `¡Bienvenido al plan ${plan}! Tus beneficios y multiplicadores ya están activos.`,
    subscription: sub,
    planInfo: PLATFORM_PLANS[plan],
  };
};

export const cancelPlatformPlan = async (userId: string) => {
  const sub = await prisma.platformSubscription.findUnique({ where: { userId } });
  if (!sub) throw new AppError('No tienes una suscripción activa', 404);

  const updatedSub = await prisma.platformSubscription.update({
    where: { userId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { plan: 'FREE' },
  });

  return {
    message: 'Tu suscripción ha sido cancelada. Has vuelto al plan Explorer gratuito.',
    subscription: updatedSub,
  };
};
