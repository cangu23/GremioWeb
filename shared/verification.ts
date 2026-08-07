// ============================================================
// Verification (blue badge) — shared helpers
// Used by backend (enforcement/delivery) and frontend (display)
// ============================================================
import { isStaffRole } from './role';

export const VERIFICATION_PRICE = 1.5; // USD / mes
export const VERIFICATION_DURATION_DAYS = 30;

export interface VerificationUserLike {
  verifiedUntil?: string | Date | null;
  vtuberProfile?: { isVerified?: boolean | null } | null;
  role?: string | null;
}

/**
 * Regla unificada de quién luce la insignia azul de verificado:
 *  - staff real (ADMIN/MODERADOR/STAFF/MOD/OWNER) — verificación administrativa
 *  - VTuberProfile.isVerified (admin o compra en VTubers)
 *  - verifiedUntil vigente (compra de la insignia de verificación)
 */
export function isVerifiedEffective(user?: VerificationUserLike | null): boolean {
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  if (user.vtuberProfile?.isVerified) return true;
  if (user.verifiedUntil) {
    return new Date(user.verifiedUntil).getTime() > Date.now();
  }
  return false;
}

/**
 * Inserta el campo computado `isVerified` en un objeto usuario para que el
 * frontend lo pinte sin tocar cada componente (los componentes ya leen
 * `user.isVerified` como fallback).
 */
export function attachVerified<T extends Record<string, unknown>>(user: T): T & { isVerified: boolean } {
  return {
    ...user,
    isVerified: isVerifiedEffective(user as unknown as VerificationUserLike),
  };
}

/** Devuelve la fecha de expiración formateada (YYYY-MM-DD) o null. */
export function verifiedExpiresOn(verifiedUntil?: string | Date | null): string | null {
  if (!verifiedUntil) return null;
  const d = new Date(verifiedUntil);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}
