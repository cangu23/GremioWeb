'use client';

import React from 'react';

interface PlanBadgeProps {
  plan?: string | null;
  role?: string | null;
  showIconOnly?: boolean;
}

function StarSvg({ color = 'currentColor', size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SparkleSvg({ color = 'currentColor', size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    </svg>
  );
}

export default function PlanBadge({ plan, role, showIconOnly = false }: PlanBadgeProps) {
  const isVipRole = role === 'VTUBER' || role === 'MAID' || role === 'ADMIN';
  const activePlan = isVipRole ? 'STELLAR' : (plan || 'FREE');

  if (activePlan === 'FREE' && !isVipRole) return null;

  const BADGE_CONFIG: Record<string, { label: string; bg: string; border: string; color: string; glow: string; renderIcon: () => React.ReactNode }> = {
    ASTRO: {
      label: 'Astro',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      color: '#38bdf8',
      glow: '0 0 10px rgba(56, 189, 248, 0.3)',
      renderIcon: () => <StarSvg color="#38bdf8" size={13} />,
    },
    NOVA: {
      label: 'Nova Pro',
      bg: 'rgba(192, 132, 252, 0.15)',
      border: '1px solid rgba(192, 132, 252, 0.5)',
      color: '#c084fc',
      glow: '0 0 12px rgba(192, 132, 252, 0.4)',
      renderIcon: () => <SparkleSvg color="#c084fc" size={13} />,
    },
    STELLAR: {
      label: 'Stellar Elite',
      bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.25))',
      border: '1px solid rgba(251, 191, 36, 0.6)',
      color: '#fbbf24',
      glow: '0 0 15px rgba(251, 191, 36, 0.5)',
      renderIcon: () => <StarSvg color="#fbbf24" size={14} />,
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
          filter: `drop-shadow(${config.glow})`,
        }}
      >
        {config.renderIcon()}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
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
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{config.renderIcon()}</span>
      {config.label}
    </span>
  );
}
