'use client';

import React from 'react';

export type RoleType =
  | 'ADMIN'
  | 'MODERATOR'
  | 'STAFF'
  | 'BETA_TESTER'
  | 'VTUBER'
  | 'STREAMER'
  | 'MAID'
  | 'ARTIST'
  | 'CLIPPER'
  | 'VIP_STELLAR'
  | 'VIP_NOVA'
  | 'VIP_ASTRO'
  | 'BOT'
  | 'USER'
  | string;

interface RoleBadgeProps {
  role?: RoleType | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  isVerified?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/* ─── Vector SVG Icons ─── */
function AdminCrownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}

function ModeratorShieldIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function StaffWrenchIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function BetaFlaskIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v7.31L4.75 18.5A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.75-2.5L14 9.31V2" />
      <line x1="8.5" y1="2" x2="15.5" y2="2" />
      <path d="M7 15h10" />
    </svg>
  );
}

function VtuberSparkleIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    </svg>
  );
}

function StreamerBroadcastIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

function MaidRibbonIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ArtistPaletteIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.5-.72 1.5-1.5 0-.4-.15-.78-.42-1.07-.27-.29-.43-.68-.43-1.08 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.97-4.48-9-10-9z" />
    </svg>
  );
}

function ClipperFilmIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function VipStellarIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffd700">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function VipNovaIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#38bdf8">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function VipAstroIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#c084fc">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function BotCpuIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="15" x2="23" y2="15" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="15" x2="4" y2="15" />
    </svg>
  );
}

function UserFeatherIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function VerifiedCheckmarkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(29, 155, 240, 0.6))' }}>
      <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
      <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Role Metadata & Styling Map ─── */
const ROLE_CONFIGS: Record<string, {
  label: string;
  bg: string;
  border: string;
  color: string;
  glow: string;
  IconComponent: React.ComponentType<{ size?: number }>;
}> = {
  ADMIN: {
    label: 'ADMIN',
    bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(217, 119, 6, 0.25))',
    border: 'rgba(251, 191, 36, 0.5)',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.35)',
    IconComponent: AdminCrownIcon,
  },
  MODERATOR: {
    label: 'MODERADOR',
    bg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(225, 29, 72, 0.25))',
    border: 'rgba(244, 63, 94, 0.5)',
    color: '#fb7185',
    glow: 'rgba(244, 63, 94, 0.35)',
    IconComponent: ModeratorShieldIcon,
  },
  STAFF: {
    label: 'STAFF',
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))',
    border: 'rgba(16, 185, 129, 0.5)',
    color: '#34d399',
    glow: 'rgba(16, 185, 129, 0.35)',
    IconComponent: StaffWrenchIcon,
  },
  BETA_TESTER: {
    label: 'BETA TESTER',
    bg: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 176, 255, 0.25))',
    border: 'rgba(0, 229, 255, 0.5)',
    color: '#00e5ff',
    glow: 'rgba(0, 229, 255, 0.4)',
    IconComponent: BetaFlaskIcon,
  },
  VTUBER: {
    label: 'VTUBER',
    bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(244, 63, 94, 0.25))',
    border: 'rgba(236, 72, 153, 0.5)',
    color: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.35)',
    IconComponent: VtuberSparkleIcon,
  },
  STREAMER: {
    label: 'STREAMER',
    bg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.25))',
    border: 'rgba(56, 189, 248, 0.5)',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.35)',
    IconComponent: StreamerBroadcastIcon,
  },
  MAID: {
    label: 'MAID',
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.25))',
    border: 'rgba(168, 85, 247, 0.5)',
    color: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.35)',
    IconComponent: MaidRibbonIcon,
  },
  ARTIST: {
    label: 'ARTISTA',
    bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.25))',
    border: 'rgba(139, 92, 246, 0.5)',
    color: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.35)',
    IconComponent: ArtistPaletteIcon,
  },
  CLIPPER: {
    label: 'CLIPPER',
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.25))',
    border: 'rgba(245, 158, 11, 0.5)',
    color: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.35)',
    IconComponent: ClipperFilmIcon,
  },
  VIP_STELLAR: {
    label: 'VIP STELLAR',
    bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(245, 158, 11, 0.2))',
    border: 'rgba(255, 215, 0, 0.6)',
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.45)',
    IconComponent: VipStellarIcon,
  },
  VIP_NOVA: {
    label: 'VIP NOVA',
    bg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.25))',
    border: 'rgba(56, 189, 248, 0.5)',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.35)',
    IconComponent: VipNovaIcon,
  },
  VIP_ASTRO: {
    label: 'VIP ASTRO',
    bg: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2), rgba(192, 132, 252, 0.25))',
    border: 'rgba(129, 140, 248, 0.5)',
    color: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.35)',
    IconComponent: VipAstroIcon,
  },
  BOT: {
    label: 'BOT',
    bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.25))',
    border: 'rgba(34, 197, 94, 0.5)',
    color: '#4ade80',
    glow: 'rgba(34, 197, 94, 0.35)',
    IconComponent: BotCpuIcon,
  },
  USER: {
    label: 'AVENTURERO',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.16)',
    color: '#a1a1aa',
    glow: 'none',
    IconComponent: UserFeatherIcon,
  },
};

export default function RoleBadge({
  role = 'USER',
  size = 'md',
  showLabel = true,
  isVerified = false,
  className = '',
  style = {},
}: RoleBadgeProps) {
  const normRole = (role || 'USER').toUpperCase();
  const config = ROLE_CONFIGS[normRole] || ROLE_CONFIGS.USER;
  const { label, bg, border, color, glow, IconComponent } = config;

  const sizeMap = {
    sm: { iconSize: 10, fontSize: '0.62rem', padding: '2px 6px', gap: '3px', borderRadius: '5px' },
    md: { iconSize: 12, fontSize: '0.70rem', padding: '3px 8px', gap: '4px', borderRadius: '7px' },
    lg: { iconSize: 15, fontSize: '0.80rem', padding: '4px 11px', gap: '6px', borderRadius: '9px' },
  }[size];

  return (
    <span
      className={`role-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeMap.gap,
        padding: sizeMap.padding,
        borderRadius: sizeMap.borderRadius,
        background: bg,
        backdropFilter: 'blur(8px)',
        border: `1px solid ${border}`,
        color: color,
        fontSize: sizeMap.fontSize,
        fontWeight: 800,
        letterSpacing: '0.04em',
        boxShadow: glow !== 'none' ? `0 2px 10px ${glow}` : 'none',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      <IconComponent size={sizeMap.iconSize} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
