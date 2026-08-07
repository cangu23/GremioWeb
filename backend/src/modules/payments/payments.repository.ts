import prisma from '../../database/prisma';

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
