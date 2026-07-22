import AppError from '../../errors/AppError';
import { DEFAULT_TIERS } from '@gremio-estelar/shared';
import * as PaymentsRepository from './payments.repository';
import * as UserRepository from '../users/user.repository';

// Tiers
export const getTiers = async (includeInactive = false) => {
  const tiers = includeInactive
    ? await PaymentsRepository.findAllTiers()
    : await PaymentsRepository.findActiveTiers();

  const parseBenefits = (benefits: string | null): string[] => {
    try { return JSON.parse(benefits || '[]'); } catch { return []; }
  };

  return tiers.map(t => ({
    ...t,
    benefits: parseBenefits(t.benefits),
  }));
};

export const getTierById = async (id: string) => {
  const tier = await PaymentsRepository.findTierById(id);
  if (!tier) throw new AppError('Plan no encontrado', 404);
  try { return { ...tier, benefits: JSON.parse(tier.benefits || '[]') }; }
  catch { return { ...tier, benefits: [] }; }
};

// Subscriptions
export const getMySubscription = async (userId: string) => {
  return PaymentsRepository.findUserSubscription(userId);
};

export const getMySubscriptions = async (userId: string) => {
  return PaymentsRepository.findUserSubscriptions(userId);
};

export const subscribe = async (userId: string, tierId: string) => {
  const tier = await PaymentsRepository.findTierById(tierId);
  if (!tier || !tier.active) throw new AppError('Plan no disponible', 404);

  // Check for existing active subscription
  const existing = await PaymentsRepository.findUserSubscription(userId);
  if (existing) {
    throw new AppError('Ya tienes una suscripción activa. Cancélala primero.', 409);
  }

  // Calculate period end (1 month or 1 year)
  const now = new Date();
  const periodEnd = new Date(now);
  if (tier.interval === 'year') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // In production, this would create a Stripe Checkout Session
  const subscription = await PaymentsRepository.createSubscription({
    userId,
    tierId,
    currentPeriodEnd: periodEnd,
  });

  return subscription;
};

export const cancelSubscription = async (userId: string) => {
  const sub = await PaymentsRepository.findUserSubscription(userId);
  if (!sub) throw new AppError('No tienes una suscripción activa', 404);

  return PaymentsRepository.cancelSubscription(sub.id);
};

// Donations
export const donate = async (donorId: string, payload: {
  recipientId: string;
  amount: number;
  message?: string;
  anonymous?: boolean;
}) => {
  if (donorId === payload.recipientId) {
    throw new AppError('No puedes donarte a ti mismo', 400);
  }
  if (payload.amount < 1) {
    throw new AppError('El monto mínimo es $1 USD', 400);
  }
  if (payload.amount > 1000) {
    throw new AppError('El monto máximo es $1,000 USD', 400);
  }

  // Solo se puede donar a VTubers
  const recipient = await UserRepository.findById(payload.recipientId);
  if (!recipient) {
    throw new AppError('El usuario receptor no existe', 404);
  }
  if (recipient.role !== 'VTUBER') {
    throw new AppError('Solo puedes donar a VTubers', 403);
  }

  return PaymentsRepository.createDonation({
    donorId,
    recipientId: payload.recipientId,
    amount: payload.amount,
    message: payload.message,
    anonymous: payload.anonymous,
  });
};

export const getDonations = async (userId: string, limit = 50) => {
  return PaymentsRepository.findDonationsByUser(userId, limit);
};

export const getDonationsSent = async (userId: string, limit = 50) => {
  return PaymentsRepository.findDonationsSentByUser(userId, limit);
};

export const getDonationStats = async (userId: string) => {
  return PaymentsRepository.getDonationStats(userId);
};

// Seed default tiers
export const seedTiers = async () => {
  for (const tier of DEFAULT_TIERS) {
    const existing = await PaymentsRepository.findActiveTiers();
    if (!existing.find(t => t.name === tier.name)) {
      await PaymentsRepository.createTier({
        name: tier.name,
        description: tier.description,
        price: tier.price,
        interval: tier.interval,
        benefits: JSON.stringify(tier.benefits),
        badgeLabel: tier.badgeLabel || undefined,
        color: tier.color || undefined,
      });
    }
  }
};
