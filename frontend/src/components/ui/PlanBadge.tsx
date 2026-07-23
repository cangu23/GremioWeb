'use client';

interface PlanBadgeProps {
  plan?: string | null;
  role?: string | null;
  showIconOnly?: boolean;
}

export default function PlanBadge({ plan, role, showIconOnly = false }: PlanBadgeProps) {
  const isVipRole = role === 'VTUBER' || role === 'MAID' || role === 'ADMIN';
  const activePlan = isVipRole ? 'STELLAR' : (plan || 'FREE');

  if (activePlan === 'FREE' && !isVipRole) return null;

  const BADGE_CONFIG: Record<string, { label: string; bg: string; border: string; color: string; icon: string; glow: string }> = {
    ASTRO: {
      label: 'Astro',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      color: '#38bdf8',
      icon: '⭐',
      glow: '0 0 10px rgba(56, 189, 248, 0.3)',
    },
    NOVA: {
      label: 'Nova Pro',
      bg: 'rgba(192, 132, 252, 0.15)',
      border: '1px solid rgba(192, 132, 252, 0.5)',
      color: '#c084fc',
      icon: '✨',
      glow: '0 0 12px rgba(192, 132, 252, 0.4)',
    },
    STELLAR: {
      label: 'Stellar Elite',
      bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.25))',
      border: '1px solid rgba(251, 191, 36, 0.6)',
      color: '#fbbf24',
      icon: '🌟',
      glow: '0 0 15px rgba(251, 191, 36, 0.5)',
    },
  };

  const config = BADGE_CONFIG[activePlan] || BADGE_CONFIG.ASTRO;

  if (showIconOnly) {
    return (
      <span
        title={`Plan ${config.label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.82rem',
          filter: `drop-shadow(${config.glow})`,
        }}
      >
        {config.icon}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '999px',
        background: config.bg,
        border: config.border,
        color: config.color,
        fontSize: '0.72rem',
        fontWeight: 700,
        boxShadow: config.glow,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ fontSize: '0.75rem' }}>{config.icon}</span>
      {config.label}
    </span>
  );
}
