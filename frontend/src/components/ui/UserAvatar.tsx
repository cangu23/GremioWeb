'use client';

import { useState, useCallback, useRef } from 'react';
import ProfileCardWidget from './ProfileCardWidget';
import { useAuth } from '@/lib/AuthContext';
import { getEffectivePlan } from '@gremio-estelar/shared';

// Borde de avatar por plan (beneficio prometido) — se usa SOLO como fallback
// cuando el usuario no tiene un frame/decoration equipado de la tienda.
export function getPlanAvatarBorder(plan?: string | null, role?: string | null): { bg: string; glow: string; spin: boolean } | null {
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

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  note?: string | null;
  noteColor?: string | null;
  noteUpdatedAt?: string | null;
  userId?: string;
  isVerified?: boolean;
  isLive?: boolean;
  frameUrl?: string | null;
  equippedFrame?: string | null;
  purchases?: any[] | null;
  user?: any | null;
  className?: string;
  style?: React.CSSProperties;
}

export function extractAvatarDecoration(
  userOrPurchases?: any,
  directFrameUrl?: string | null,
  directEquippedFrame?: string | null
): { frameUrl?: string | null; equippedFrame?: string | null } {
  if (directFrameUrl) return { frameUrl: directFrameUrl };
  if (directEquippedFrame) return { equippedFrame: directEquippedFrame };

  if (!userOrPurchases) return {};

  const purchases = Array.isArray(userOrPurchases)
    ? userOrPurchases
    : (userOrPurchases?.purchases || userOrPurchases?.user?.purchases);

  if (Array.isArray(purchases)) {
    const equippedPurchase = purchases.find((p: any) =>
      p.equipped && p.item && (
        p.item.type === 'AVATAR_FRAME' ||
        p.item.type === 'FRAME' ||
        p.item.type === 'DECORATION' ||
        p.item.type === 'AVATAR_BORDER'
      )
    );

    if (equippedPurchase?.item) {
      const item = equippedPurchase.item;
      // 1. Direct imageUrl property on item
      if (item.imageUrl) return { frameUrl: item.imageUrl };

      // 2. Parsed JSON or string in item.data
      if (item.data) {
        try {
          const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          if (parsed?.frameUrl || parsed?.imageUrl || parsed?.url) {
            return { frameUrl: parsed.frameUrl || parsed.imageUrl || parsed.url };
          }
          if (parsed?.gradient || parsed?.borderColor || parsed?.color || parsed?.style) {
            return { equippedFrame: parsed.gradient || parsed.borderColor || parsed.color || parsed.style };
          }
        } catch {
          if (typeof item.data === 'string' && (item.data.includes('http') || item.data.includes('/uploads/'))) {
            return { frameUrl: item.data };
          }
          return { equippedFrame: item.data };
        }
      }
      return { equippedFrame: 'linear-gradient(135deg, #ff007f, #7928ca, #00dfd8)' };
    }
  }

  // Fallback to direct user fields
  if (userOrPurchases?.equippedFrameUrl || userOrPurchases?.frameUrl) {
    return { frameUrl: userOrPurchases.equippedFrameUrl || userOrPurchases.frameUrl };
  }
  if (userOrPurchases?.equippedFrame) {
    return { equippedFrame: userOrPurchases.equippedFrame };
  }

  return {};
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'ahora';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

export function getNoteBubbleStyle(color?: string | null) {
  if (!color) {
    return {
      background: 'linear-gradient(135deg, rgba(35,28,65,0.98), rgba(20,16,40,0.98))',
      tailBackground: 'rgba(28,24,52,0.98)',
      borderColor: 'rgba(139,92,246,0.4)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.6), 0 0 14px rgba(139,92,246,0.25)',
      glow: 'rgba(139,92,246,0.6)',
      textColor: '#ffffff',
    };
  }

  const hex = color.toLowerCase();
  const presetMap: Record<string, { bg: string; tail: string; glow: string }> = {
    '#8b5cf6': { bg: 'linear-gradient(135deg, #8b5cf6, #5b21b6)', tail: '#7c3aed', glow: 'rgba(139,92,246,0.6)' },
    '#ec4899': { bg: 'linear-gradient(135deg, #ec4899, #9d174d)', tail: '#db2777', glow: 'rgba(236,72,153,0.6)' },
    '#3b82f6': { bg: 'linear-gradient(135deg, #3b82f6, #1e40af)', tail: '#2563eb', glow: 'rgba(59,130,246,0.6)' },
    '#06b6d4': { bg: 'linear-gradient(135deg, #06b6d4, #155e75)', tail: '#0891b2', glow: 'rgba(6,182,212,0.6)' },
    '#10b981': { bg: 'linear-gradient(135deg, #10b981, #065f46)', tail: '#059669', glow: 'rgba(16,185,129,0.6)' },
    '#f59e0b': { bg: 'linear-gradient(135deg, #f59e0b, #92400e)', tail: '#d97706', glow: 'rgba(245,158,11,0.6)' },
    '#ef4444': { bg: 'linear-gradient(135deg, #ef4444, #991b1b)', tail: '#dc2626', glow: 'rgba(239,68,68,0.6)' },
    '#a855f7': { bg: 'linear-gradient(135deg, #a855f7, #6b21a8)', tail: '#9333ea', glow: 'rgba(168,85,247,0.6)' },
  };

  const preset = presetMap[hex] || {
    bg: `linear-gradient(135deg, ${color}, rgba(20,20,40,0.95))`,
    tail: color,
    glow: `${color}80`,
  };

  return {
    background: preset.bg,
    tailBackground: preset.tail,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    boxShadow: `0 6px 20px ${preset.glow}, 0 0 16px ${preset.glow}`,
    glow: preset.glow,
    textColor: '#ffffff',
  };
}

export default function UserAvatar({
  src, alt, size = 40, note, noteColor, noteUpdatedAt, userId,
  isVerified, isLive, frameUrl, equippedFrame, purchases, user, className, style,
}: UserAvatarProps) {
  const { user: currentUser } = useAuth();

  const isSelf = currentUser && (
    (userId && currentUser.id === userId) ||
    (user?.id && currentUser.id === user.id) ||
    (user?.username && currentUser.username?.toLowerCase() === user.username.toLowerCase()) ||
    (alt && (currentUser.username?.toLowerCase() === alt.toLowerCase().replace(/^@/, '') || currentUser.displayName?.toLowerCase() === alt.toLowerCase()))
  );

  const currAny = currentUser as any;
  const effectiveUserData = (isSelf && (currAny?.purchases || currAny?.equippedFrame || currAny?.equippedFrameUrl)) ? currAny : (purchases || user);
  const resolvedDecoration = extractAvatarDecoration(effectiveUserData, frameUrl, equippedFrame);
  const activeFrameUrl = resolvedDecoration.frameUrl;
  const activeEquippedFrame = resolvedDecoration.equippedFrame;
  const [showNote, setShowNote] = useState(false);
  const [profileCardUserId, setProfileCardUserId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const hasNote = !!note;
  const customNoteColor = noteColor || user?.noteColor || (isSelf ? (currentUser as any)?.noteColor : null);
  const noteStyle = getNoteBubbleStyle(customNoteColor);
  const ringSize = size + 6; // 3px padding per side
  const noteDotSize = Math.max(10, Math.round(size * 0.28));
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openProfileCard = useCallback(() => {
    if (userId) setProfileCardUserId(userId);
  }, [userId]);

  const closeProfileCard = useCallback(() => {
    setProfileCardUserId(null);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hasNote) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setShowNote(true);
    }
  }, [hasNote]);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowNote(false);
    }, 300); // Small delay to allow moving to the bubble
  }, []);

  const handleNoteBubbleEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handleNoteBubbleLeave = useCallback(() => {
    setShowNote(false);
  }, []);

  const avatarContent = (
    <>
      {/* Profile card widget */}
      {profileCardUserId && (
        <ProfileCardWidget userId={profileCardUserId} onClose={closeProfileCard} />
      )}

      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          cursor: 'pointer',
          overflow: 'visible',
          ...(style as React.CSSProperties),
        }}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (userId) {
            e.preventDefault();
            e.stopPropagation();
            openProfileCard();
          }
          // Sin userId, el click pasa al padre (ej: botón del navbar)
        }}
      >
      {/* Note ring */}
      {hasNote && (
        <div
          style={{
            position: 'absolute',
            top: '-3px', left: '-3px',
            width: ringSize, height: ringSize,
            borderRadius: '50%',
            background: 'conic-gradient(var(--primary) 0deg, rgba(139,92,246,0.2) 60deg, var(--secondary) 180deg, var(--accent) 270deg, var(--primary) 360deg)',
            animation: 'spin 3s linear infinite',
            zIndex: 0,
          }}
        />
      )}

      {/* Equipped Avatar Frame / Decoration Overlay */}
      {activeFrameUrl ? (
        <div
          style={{
            position: 'absolute',
            top: '-18%', left: '-18%',
            width: '136%', height: '136%',
            pointerEvents: 'none',
            zIndex: 2,
            backgroundImage: `url(${activeFrameUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
          }}
        />
      ) : activeEquippedFrame ? (
        <div
          style={{
            position: 'absolute',
            top: '-3px', left: '-3px',
            width: size + 6, height: size + 6,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 0,
            background: activeEquippedFrame,
            animation: (activeEquippedFrame.includes('gradient') || activeEquippedFrame.includes('conic')) ? 'spin 4s linear infinite' : 'none',
            boxShadow: `0 0 12px ${activeEquippedFrame.startsWith('#') || activeEquippedFrame.startsWith('rgb') ? activeEquippedFrame : 'rgba(139,92,246,0.6)'}`,
          }}
        />
      ) : (() => {
        // Fallback: borde por plan premium (ASTRO/NOVA/STELLAR) cuando no hay
        // frame equipado de la tienda — beneficio prometido por los planes.
        const planUser = isSelf ? (currentUser as any) : user;
        const planBorder = getPlanAvatarBorder(planUser?.plan, planUser?.role);
        if (!planBorder) return null;
        return (
          <div
            style={{
              position: 'absolute',
              top: '-3px', left: '-3px',
              width: size + 6, height: size + 6,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 0,
              background: planBorder.bg,
              animation: planBorder.spin ? 'spin 4s linear infinite' : 'none',
              boxShadow: `0 0 12px ${planBorder.glow}`,
              opacity: 0.85,
            }}
          />
        );
      })()}

      {/* Avatar image */}
      <div
        style={{
          width: size, height: size,
          borderRadius: '50%',
          background: (src && !imageError)
            ? 'transparent'
            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 'bold', fontSize: `${Math.round(size * 0.45)}px`,
          overflow: 'hidden', flexShrink: 0,
          position: 'relative', zIndex: 1,
          border: isLive ? '2px solid #ff0055' : (activeEquippedFrame || activeFrameUrl) ? '2px solid var(--background, #0a0a0c)' : '2px solid transparent',
          boxShadow: isLive ? '0 0 14px rgba(255,0,85,0.6)' : 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (hasNote) {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = isLive ? '0 0 14px rgba(255,0,85,0.6)' : 'none';
        }}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
          />
        ) : (
          (alt || '?').charAt(0).toUpperCase()
        )}
      </div>

      {/* Note dot indicator (small dot at bottom-right) */}
      {hasNote && (
        <div
          style={{
            position: 'absolute',
            bottom: '-2px', right: '-2px',
            width: noteDotSize, height: noteDotSize,
            borderRadius: '50%',
            background: noteStyle.tailBackground,
            border: `2px solid var(--background)`,
            zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 10px ${noteStyle.glow}`,
          }}
        >
          <svg width={noteDotSize * 0.5} height={noteDotSize * 0.5} viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      )}

      {/* Live indicator */}
      {isLive && (
        <div
          style={{
            position: 'absolute',
            bottom: -3, left: '50%', transform: 'translateX(-50%)',
            padding: '2px 8px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff0055, #ff2a6d)',
            fontSize: '0.58rem', fontWeight: 800, color: '#fff',
            letterSpacing: '0.04em',
            zIndex: 3, whiteSpace: 'nowrap',
            boxShadow: '0 0 10px rgba(255,0,85,0.7)',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff' }} />
          LIVE
        </div>
      )}



      {/* Discord / Instagram style Note Bubble floating above avatar */}
      {hasNote && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 12px',
            borderRadius: '16px',
            background: noteStyle.background,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${noteStyle.borderColor}`,
            boxShadow: noteStyle.boxShadow,
            zIndex: 20,
            maxWidth: '150px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{note}</span>

          {/* Bubble tail pointing down to top of avatar */}
          <div
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '8px',
              height: '8px',
              background: noteStyle.tailBackground,
              borderRight: `1px solid ${noteStyle.borderColor}`,
              borderBottom: `1px solid ${noteStyle.borderColor}`,
              borderRadius: '0 0 2px 0',
              zIndex: -1,
            }}
          />
        </div>
      )}

      {/* Note expanded cloud bubble on hover */}
      {hasNote && showNote && (
        <div
          onMouseEnter={handleNoteBubbleEnter}
          onMouseLeave={handleNoteBubbleLeave}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 16px)', left: '50%', transform: 'translateX(-50%)',
            padding: '14px 20px',
            borderRadius: '20px',
            background: noteStyle.background,
            backdropFilter: 'blur(16px)',
            border: `1px solid ${noteStyle.borderColor}`,
            boxShadow: noteStyle.boxShadow,
            zIndex: 100,
            minWidth: '160px',
            maxWidth: '290px',
            whiteSpace: 'nowrap',
            animation: 'noteCloudIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'default',
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative top gradient line */}
          <div style={{
            position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
            borderRadius: '1px',
          }} />

          {/* Note text */}
          <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.5, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {note}
          </div>
          {noteUpdatedAt && (
            <div style={{
              fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)',
              marginTop: '6px',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontWeight: 500,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              hace {timeAgo(noteUpdatedAt)}
            </div>
          )}
          {/* Cloud tail */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
              width: '14px', height: '14px',
              background: noteStyle.tailBackground,
              borderRight: `1px solid ${noteStyle.borderColor}`,
              borderBottom: `1px solid ${noteStyle.borderColor}`,
              borderRadius: '0 0 4px 0',
              zIndex: -1,
            }}
          />
        </div>
      )}
    </div>
    </>
  );

  if (userId) {
    return avatarContent;
  }

  return avatarContent;
}
