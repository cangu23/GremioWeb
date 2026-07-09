import { prisma } from '../../database';

/**
 * Creates and stores a new refresh token.
 * @param token The hashed refresh token.
 * @param userId The ID of the user.
 * @param expiresAt The expiration date of the token.
 */
export const createRefreshToken = (
  hashedToken: string,
  userId: string,
  expiresAt: Date
) => {
  return prisma.refreshToken.create({
    data: {
      hashedToken,
      userId,
      expiresAt,
    },
  });
};

/**
 * Finds a refresh token by its hashed value.
 * @param hashedToken The hashed token to find.
 */
export const findRefreshTokenByHash = (hashedToken: string) => {
  return prisma.refreshToken.findUnique({
    where: {
      hashedToken,
    },
  });
};

/**
 * Deletes a refresh token from the database.
 * Uses deleteMany to avoid throwing when the token doesn't exist (e.g., concurrent requests).
 * @param hashedToken The hashed token to delete.
 */
export const deleteRefreshToken = (hashedToken: string) => {
  return prisma.refreshToken.deleteMany({
    where: {
      hashedToken,
    },
  });
};