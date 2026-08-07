import * as PaymentsRepository from './payments.repository';

// Las donaciones entrantes se crean únicamente desde el flujo PayPal
// (paypal.service.ts), nunca desde un endpoint sin pasarela de pago.

// Donations (read-only)
export const getDonations = async (userId: string, limit = 50) => {
  return PaymentsRepository.findDonationsByUser(userId, limit);
};

export const getDonationsSent = async (userId: string, limit = 50) => {
  return PaymentsRepository.findDonationsSentByUser(userId, limit);
};

export const getDonationStats = async (userId: string) => {
  return PaymentsRepository.getDonationStats(userId);
};
