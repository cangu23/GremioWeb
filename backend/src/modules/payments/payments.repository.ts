import prisma from '../../database/prisma';

// Tiers
export const findActiveTiers = () =>
  prisma.subscriptionTier.findMany({
    where: { active: true },
    orderBy: { price: 'asc' },
  });

export const findAllTiers = () =>
  prisma.subscriptionTier.findMany({ orderBy: { price: 'asc' } });

export const findTierById = (id: string) =>
  prisma.subscriptionTier.findUnique({ where: { id } });

export const createTier = (data: {
  name: string;
  description: string;
  price: number;
  interval: string;
  benefits: string;
  badgeLabel?: string;
  color?: string;
}) =>
  prisma.subscriptionTier.create({ data });

export const updateTier = (id: string, data: Partial<{
  name: string;
  description: string;
  price: number;
  interval: string;
  benefits: string;
  badgeLabel: string;
  color: string;
  active: boolean;
}>) =>
  prisma.subscriptionTier.update({ where: { id }, data });

// Subscriptions
export const findUserSubscription = (userId: string) =>
  prisma.userSubscription.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { tier: true },
    orderBy: { currentPeriodEnd: 'desc' },
  });

export const findUserSubscriptions = (userId: string) =>
  prisma.userSubscription.findMany({
    where: { userId },
    include: { tier: true },
    orderBy: { createdAt: 'desc' },
  });

export const createSubscription = (data: {
  userId: string;
  tierId: string;
  status?: string;
  currentPeriodEnd: Date;
  stripePriceId?: string;
  stripeSubId?: string;
}) =>
  prisma.userSubscription.create({ data, include: { tier: true } });

export const cancelSubscription = (id: string) =>
  prisma.userSubscription.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

// Donations
export const createDonation = (data: {
  donorId: string;
  recipientId: string;
  amount: number;
  currency?: string;
  message?: string;
  anonymous?: boolean;
}) =>
  prisma.donation.create({
    data,
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

export const findDonationsByUser = (userId: string, limit = 50) =>
  prisma.donation.findMany({
    where: { recipientId: userId },
    include: {
      donor: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

export const findDonationsSentByUser = (userId: string, limit = 50) =>
  prisma.donation.findMany({
    where: { donorId: userId },
    include: {
      recipient: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

export const getDonationStats = (userId: string) =>
  prisma.donation.aggregate({
    where: { recipientId: userId },
    _sum: { amount: true },
    _count: true,
  });
