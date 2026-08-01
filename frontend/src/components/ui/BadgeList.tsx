'use client';

import React from 'react';

export type BadgeType =
  | 'FOUNDER'
  | 'BETA_TESTER'
  | 'DONATOR'
  | 'VERIFIED'
  | 'DEVELOPER'
  | 'LEGENDARY'
  | 'EARLY_100'
  | 'VETERAN_1YR'
  | 'EVENT_WINNER'
  | string;

interface BadgeListProps {
  badges?: BadgeType[] | string[] | null;
  size?: 'sm' | 'md' | 'lg';
  isVerified?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const BADGE_CONFIGS: Record<string, {
  label: string;
  bg: string;
  border: string;
  color: string;
  glow: string;
  svgPath: React.ReactNode;
}> = {
  FOUNDER: {
    label: 'Fundador 🏆',
    bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(245, 158, 11, 0.25))',
    border: 'rgba(255, 215, 0, 0.5)',
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.35)',
    svgPath: <path fill="currentColor" d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H8v2h8v-2h-3v-2.1c2.16-.42 3.82-2.12 4.39-4.34C19.7 11.2 21 9.25 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />,
  },
  BETA_TESTER: {
    label: 'Beta Tester 🧪',
    bg: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 176, 255, 0.25))',
    border: 'rgba(0, 229, 255, 0.5)',
    color: '#00e5ff',
    glow: 'rgba(0, 229, 255, 0.4)',
    svgPath: <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M10 2v7.31L4.75 18.5A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.75-2.5L14 9.31V2M8.5 2h7M7 15h10" />,
  },
  DONATOR: {
    label: 'Donador 💜',
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.25))',
    border: 'rgba(168, 85, 247, 0.5)',
    color: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.35)',
    svgPath: <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  },
  VERIFIED: {
    label: 'Verificado ⭐',
    bg: 'linear-gradient(135deg, rgba(29, 155, 240, 0.2), rgba(56, 189, 248, 0.25))',
    border: 'rgba(29, 155, 240, 0.5)',
    color: '#38bdf8',
    glow: 'rgba(29, 155, 240, 0.4)',
    svgPath: <path fill="currentColor" d="M12 2L9.19 3.63 6 3 4.81 6 2 7.5l.63 3.19L2 13.88 4.81 15.38 6 18.38l3.19-.63L12 19.38l2.81-1.63L18 18.38l1.19-3L22 13.88l-.63-3.19L22 7.5l-2.81-1.5L18 3l-3.19.63L12 2zm-1 13l-4-4 1.41-1.41L11 12.17l6.59-6.59L19 7l-8 8z" />,
  },
  DEVELOPER: {
    label: 'Desarrollador 🎖️',
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.25))',
    border: 'rgba(16, 185, 129, 0.5)',
    color: '#34d399',
    glow: 'rgba(16, 185, 129, 0.4)',
    svgPath: <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  },
  LEGENDARY: {
    label: 'Legendario 👑',
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.25))',
    border: 'rgba(245, 158, 11, 0.6)',
    color: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.45)',
    svgPath: <path fill="currentColor" d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />,
  },
  EARLY_100: {
    label: 'Primeros 100 🎉',
    bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(245, 158, 11, 0.2))',
    border: 'rgba(236, 72, 153, 0.5)',
    color: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.35)',
    svgPath: <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  },
  VETERAN_1YR: {
    label: '1 Año 🎂',
    bg: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(244, 63, 94, 0.2))',
    border: 'rgba(251, 146, 60, 0.5)',
    color: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.35)',
    svgPath: <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 11h16M12 3v4" />,
  },
  EVENT_WINNER: {
    label: 'Campeón 🏅',
    bg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(217, 119, 6, 0.2))',
    border: 'rgba(234, 179, 8, 0.6)',
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.4)',
    svgPath: <polygon fill="currentColor" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  },
};

export default function BadgeList({
  badges = [],
  size = 'md',
  isVerified = false,
  className = '',
  style = {},
}: BadgeListProps) {
  const badgeList: string[] = Array.isArray(badges) ? [...badges] : [];
  if (isVerified && !badgeList.includes('VERIFIED')) {
    badgeList.unshift('VERIFIED');
  }

  if (badgeList.length === 0) return null;

  const sizeMap = {
    sm: { iconSize: 11, fontSize: '0.60rem', padding: '2px 5px', gap: '3px' },
    md: { iconSize: 13, fontSize: '0.68rem', padding: '3px 7px', gap: '4px' },
    lg: { iconSize: 15, fontSize: '0.76rem', padding: '4px 9px', gap: '5px' },
  }[size];

  return (
    <div
      className={`badge-list ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {badgeList.map((b) => {
        const config = BADGE_CONFIGS[b] || {
          label: b,
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.15)',
          color: '#e4e4e7',
          glow: 'none',
          svgPath: <path fill="currentColor" d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />,
        };

        return (
          <span
            key={b}
            title={config.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: sizeMap.gap,
              padding: sizeMap.padding,
              borderRadius: '6px',
              background: config.bg,
              backdropFilter: 'blur(6px)',
              border: `1px solid ${config.border}`,
              color: config.color,
              fontSize: sizeMap.fontSize,
              fontWeight: 800,
              letterSpacing: '0.03em',
              boxShadow: config.glow !== 'none' ? `0 2px 8px ${config.glow}` : 'none',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            <svg width={sizeMap.iconSize} height={sizeMap.iconSize} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              {config.svgPath}
            </svg>
            <span>{config.label}</span>
          </span>
        );
      })}
    </div>
  );
}
