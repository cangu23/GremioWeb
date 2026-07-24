'use client';

import { useState, useCallback, useRef } from 'react';
import ProfileCardWidget from './ProfileCardWidget';

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  note?: string | null;
  noteUpdatedAt?: string | null;
  userId?: string;
  isVerified?: boolean;
  isLive?: boolean;
  className?: string;
  style?: React.CSSProperties;
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

export default function UserAvatar({
  src, alt, size = 40, note, noteUpdatedAt, userId,
  isVerified, isLive, className, style,
}: UserAvatarProps) {
  const [showNote, setShowNote] = useState(false);
  const [profileCardUserId, setProfileCardUserId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const hasNote = !!note;
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
          border: isLive ? '2px solid #ff0055' : '2px solid transparent',
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
            background: 'var(--primary)',
            border: `2px solid var(--background)`,
            zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 8px rgba(139,92,246,0.5)',
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
            padding: '4px 10px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(28,25,50,0.97), rgba(15,14,30,0.97))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139,92,246,0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5), 0 0 12px rgba(139,92,246,0.2)',
            zIndex: 20,
            maxWidth: '140px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#fff',
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
              background: 'rgba(28,25,50,0.97)',
              borderRight: '1px solid rgba(139,92,246,0.4)',
              borderBottom: '1px solid rgba(139,92,246,0.4)',
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
            padding: '12px 18px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(30,28,55,0.98), rgba(20,20,40,0.98))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(139,92,246,0.4)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.2)',
            zIndex: 100,
            minWidth: '150px',
            maxWidth: '280px',
            whiteSpace: 'nowrap',
            animation: 'noteCloudIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'default',
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative top gradient line */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
            borderRadius: '1px',
          }} />

          {/* Note text */}
          <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 500, lineHeight: 1.5 }}>
            {note}
          </div>
          {noteUpdatedAt && (
            <div style={{
              fontSize: '0.65rem', color: 'var(--text-muted)',
              marginTop: '6px', opacity: 0.6,
              display: 'flex', alignItems: 'center', gap: '4px',
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
              background: 'rgba(30,28,55,0.98)',
              borderRight: '1px solid rgba(139,92,246,0.4)',
              borderBottom: '1px solid rgba(139,92,246,0.4)',
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
