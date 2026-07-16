/* ──────────────────────────────────────────────────────────────
   SVG Icon Library — replaces emoji icons across VTuber pages
   Feather-style: 24×24, stroke-based, currentColor
   ────────────────────────────────────────────────────────────── */

import React from 'react';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
};

function withDefaults(children: React.ReactNode, props: IconProps, viewBox = '0 0 24 24') {
  const { size = 20, color = 'currentColor', strokeWidth = 2, fill: fillProp, title, className, style } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fillProp || 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/* ─────────── Navigation ─────────── */

export const ArrowLeft = (props: IconProps) => withDefaults(
  <><polyline points="15 18 9 12 15 6" /></>, props
);

export const ArrowRight = (props: IconProps) => withDefaults(
  <><polyline points="9 18 15 12 9 6" /></>, props
);

export const ChevronDown = (props: IconProps) => withDefaults(
  <><polyline points="6 9 12 15 18 9" /></>, props
);

export const X = (props: IconProps) => withDefaults(
  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, props
);

/* ─────────── Status / Badges ─────────── */

export const Star = (props: IconProps) => withDefaults(
  <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>, props
);

export const Check = (props: IconProps) => withDefaults(
  <><polyline points="8 12 11 15 16 9" /></>, props
);

export const CircleCheck = (props: IconProps) => withDefaults(
  <><circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" /></>, props
);

export const LiveDot = ({ size = 8, ...props }: IconProps & { pulse?: boolean }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: props.color || '#e91e63',
      display: 'inline-block',
      flexShrink: 0,
      animation: (props as any).pulse ? 'vtuber-pulse-dot 1.5s ease infinite' : undefined,
    }}
  />
);

/* ─────────── Social / Content Type ─────────── */

export const Twitch = (props: IconProps) => withDefaults(
  <><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" /></>, props
);

export const Youtube = (props: IconProps) => withDefaults(
  <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></>, props
);

export const Twitter = (props: IconProps) => withDefaults(
  <><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></>, props
);

export const Discord = (props: IconProps) => withDefaults(
  <><path d="M9 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /><path d="M7.68 3.3C9.1 2.7 10.5 2.3 12 2c1.5.3 2.9.7 4.32 1.3l.18.08c.85.34 1.62.8 2.3 1.35A9.8 9.8 0 0 1 22 12c0 1.6-.4 3.2-1.1 4.6a9.6 9.6 0 0 1-2.9 3.3l-.2.13-1.9-.9a15 15 0 0 1-3.8.2l-1.9.9-.2-.13a9.6 9.6 0 0 1-3.3-3.3A9.2 9.2 0 0 1 2 12a9.8 9.8 0 0 1 3.2-7.27 8.5 8.5 0 0 1 2.28-1.35z" /></>, props
);

export const Globe = (props: IconProps) => withDefaults(
  <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>, props
);

export const MessageCircle = (props: IconProps) => withDefaults(
  <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></>, props
);

export const Send = (props: IconProps) => withDefaults(
  <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>, props
);

export const Link2 = (props: IconProps) => withDefaults(
  <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>, props
);

export const ExternalLink = (props: IconProps) => withDefaults(
  <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>, props
);

/* ─────────── Content Type Icons ─────────── */

export const Gamepad = (props: IconProps) => withDefaults(
  <><line x1="6" y1="11" x2="6" y2="14" /><line x1="4.5" y1="12.5" x2="7.5" y2="12.5" /><path d="M15 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm3 0a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" /><path d="M21 12a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7h5a7 7 0 0 1 7 7v3z" /></>, props
);

export const Music = (props: IconProps) => withDefaults(
  <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>, props
);

export const Palette = (props: IconProps) => withDefaults(
  <><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.8.7-1.5 1.5-1.5H16c4.4 0 8-3.6 8-8 0-5.5-5.5-10-12-10z" /></>, props
);

export const Mic = (props: IconProps) => withDefaults(
  <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><line x1="19" y1="10" x2="19" y2="12a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></>, props
);

export const Headphones = (props: IconProps) => withDefaults(
  <><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></>, props
);

export const MessageSquare = (props: IconProps) => withDefaults(
  <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>, props
);

/* ─────────── Stats ─────────── */

export const Users = (props: IconProps) => withDefaults(
  <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, props
);

export const FileText = (props: IconProps) => withDefaults(
  <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>, props
);

export const Heart = (props: IconProps) => withDefaults(
  <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></>, props
);

/* ─────────── Misc ─────────── */

export const Image = (props: IconProps) => withDefaults(
  <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>, props
);

export const Calendar = (props: IconProps) => withDefaults(
  <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>, props
);

export const BookOpen = (props: IconProps) => withDefaults(
  <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>, props
);

export const Info = (props: IconProps) => withDefaults(
  <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, props
);

export const Telescope = (props: IconProps) => withDefaults(
  <><path d="M10 2l4 4-4 4-1-3-3-1 4-4z" /><path d="M14 10l3 3" /><path d="M4 14l6 1 4-4" /><path d="M15 11l4 7" /><path d="M10 12l-3 8" /></>, props
);

export const Rocket = (props: IconProps) => withDefaults(
  <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></>, props
);

export const Search = (props: IconProps) => withDefaults(
  <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>, props
);

export const ZoomIn = (props: IconProps) => withDefaults(
  <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></>, props
);

export const Sparkles = (props: IconProps) => withDefaults(
  <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M5.5 15.5L4 18l2.5-1.5L8 19l1-2.5L11.5 15 9 13.5 8 11l-1 2.5L5.5 15.5z" /><path d="M18 5l-.5 1.5L16 7l1.5.5L18 9l.5-1.5L20 7l-1.5-.5L18 5z" /></>, props
);

export const Hash = (props: IconProps) => withDefaults(
  <><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></>, props
);

/* ─────────── Extras needed by Navbar ─────────── */

export const Shield = (props: IconProps) => withDefaults(
  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>, props
);

export const Award = (props: IconProps) => withDefaults(
  <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>, props
);

export const BarChart = (props: IconProps) => withDefaults(
  <><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>, props
);

export const Bell = (props: IconProps) => withDefaults(
  <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>, props
);

export const Backpack = (props: IconProps) => withDefaults(
  <><path d="M5 20h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2z" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M9 13h6" /><path d="M9 17h6" /></>, props
);

export const Settings = (props: IconProps) => withDefaults(
  <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>, props
);

export const LogOut = (props: IconProps) => withDefaults(
  <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>, props
);

export const Key = (props: IconProps) => withDefaults(
  <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></>, props
);

export const ShoppingBag = (props: IconProps) => withDefaults(
  <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>, props
);

export const Plus = (props: IconProps) => withDefaults(
  <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, props
);

export const Grid = (props: IconProps) => withDefaults(
  <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>, props
);

export const TrendingUp = (props: IconProps) => withDefaults(
  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>, props
);

export const User = (props: IconProps) => withDefaults(
  <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, props
);

export const HelpCircle = (props: IconProps) => withDefaults(
  <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>, props
);
