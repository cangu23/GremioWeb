import { getEffectivePlan } from '@gremio-estelar/shared';

export interface PlanAvatarBorder {
  bg: string;
  glow: string;
  spin: boolean;
}

// Borde de avatar por plan (beneficio prometido) — se usa SOLO como fallback
// cuando el usuario no tiene un frame/decoration equipado de la tienda.
// El usuario puede ocultarlo desde Inventario o Ajustes (profileFrame === 'OFF').
export function getPlanAvatarBorder(plan?: string | null, role?: string | null): PlanAvatarBorder | null {
  const effective = getEffectivePlan(plan, role);
  switch (effective) {
    case 'STELLAR':
      return {
        bg: 'conic-gradient(from 0deg, #ffd700, #ff6b35, #c084fc, #ffd700)',
        glow: 'rgba(255,215,0,0.7)',
        spin: true,
      };
    case 'NOVA':
      return {
        bg: 'conic-gradient(from 0deg, #c084fc, #7c3aed, #38bdf8, #c084fc)',
        glow: 'rgba(192,132,252,0.6)',
        spin: true,
      };
    case 'ASTRO':
      return {
        bg: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #818cf8, #38bdf8)',
        glow: 'rgba(56,189,248,0.6)',
        spin: true,
      };
    default:
      return null;
  }
}
