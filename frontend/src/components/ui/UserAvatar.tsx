'use client';

import { useState, useCallback } from 'react';
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

  const openProfileCard = useCallback(() => {
    if (userId) setProfileCardUserId(userId);
  }, [userId]);

  const closeProfileCard = useCallback(() => {
    setProfileCardUserId(null);
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
          ...(style as React.CSSProperties),
        }}
        className={className}
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
          border: isLive ? '2px solid var(--warm)' : '2px solid transparent',
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
          e.currentTarget.style.boxShadow = 'none';
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
            bottom: -2, left: '50%', transform: 'translateX(-50%)',
            padding: '1px 6px', borderRadius: '6px',
            background: 'var(--warm)',
            fontSize: '0.55rem', fontWeight: 700, color: '#fff',
            zIndex: 3, whiteSpace: 'nowrap',
          }}
        >
          LIVE
        </div>
      )}

      {/* Verified badge */}
      {isVerified && (
        <div
          style={{
            position: 'absolute',
            top: -2, right: -2,
            zIndex: 2,
          }}
        >
          <svg width={Math.round(size * 0.35)} height={Math.round(size * 0.35)} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
            <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Note tooltip */}
      {hasNote && showNote && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%', left: '50%', transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '8px 14px',
            borderRadius: '12px',
            background: 'rgba(20,20,35,0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 100,
            minWidth: '140px',
            maxWidth: '250px',
            whiteSpace: 'nowrap',
            animation: 'fadeInUp 0.15s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>
            {note}
          </div>
          {noteUpdatedAt && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.7 }}>
              hace {timeAgo(noteUpdatedAt)}
            </div>
          )}
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%', left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(20,20,35,0.96)',
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
