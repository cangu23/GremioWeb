// ============================================================
// Plans (premium tiers) — shared helpers
// Used by the frontend to gate premium features (banner GIF,
// video banner, group DMs, animated reactions, pet, stats…).
// Mirrors backend/src/modules/subscriptions/platform-subscriptions.service.ts
// ============================================================
import { isStaffRole } from './role';

export const PLAN_RANK: Record<string, number> = { FREE: 0, ASTRO: 1, NOVA: 2, STELLAR: 3 };
export const PLAN_ORDER = ['FREE', 'ASTRO', 'NOVA', 'STELLAR'] as const;
export type PlanName = (typeof PLAN_ORDER)[number];

export const PLAN_LABELS: Record<string, string> = {
  FREE: 'Explorer (Gratis)',
  ASTRO: 'Astro',
  NOVA: 'Nova Pro',
  STELLAR: 'Stellar Elite',
};

function userHasRole(roleStr: string | null | undefined, targetRole: string): boolean {
  if (!roleStr) return false;
  return roleStr.split(',').map((r) => r.trim()).includes(targetRole);
}

/**
 * Plan efectivo para beneficios premium — UNA SOLA FUENTE DE VERDAD (frontend).
 * Solo staff real (isStaffRole) y roles VIP de pago reciben un plan elevado
 * sin pagar. VTUBER/MAID/BETA_TESTER usan su plan.
 */
export function getEffectivePlan(plan?: string | null, role?: string | null): string {
  if (isStaffRole(role) || userHasRole(role, 'VIP_STELLAR')) return 'STELLAR';
  if (userHasRole(role, 'VIP_NOVA')) return 'NOVA';
  if (userHasRole(role, 'VIP_ASTRO')) return 'ASTRO';
  return plan || 'FREE';
}

/** ¿El plan efectivo alcanza (o supera) el tier requerido? */
export function planMeetsOrExceeds(plan?: string | null, role?: string | null, required?: string | null): boolean {
  const effective = getEffectivePlan(plan, role);
  return (PLAN_RANK[effective] ?? 0) >= (PLAN_RANK[required || 'FREE'] ?? 99);
}

/** Multiplicador de XP prometido por el plan efectivo. */
export function getXpMultiplier(plan?: string | null, role?: string | null): number {
  const effective = getEffectivePlan(plan, role);
  switch (effective) {
    case 'STELLAR': return 3;
    case 'NOVA': return 2;
    case 'ASTRO': return 1.5;
    default: return 1;
  }
}

/** Label human-readable del plan efectivo. */
export function getPlanLabel(plan?: string | null, role?: string | null): string {
  const effective = getEffectivePlan(plan, role);
  return PLAN_LABELS[effective] || PLAN_LABELS.FREE;
}
