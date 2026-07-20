'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

// ── Types ──
interface ProfileCardData {
  id: string;
  username: string;
  role: string;
  xp: number;
  level: number;
  note?: string | null;
  noteUpdatedAt?: string | null;
  vtuberProfile?: {
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    description: string | null;
    isVerified: boolean;
    isApproved: boolean;
    isFeatured: boolean;
    isLive: boolean;
    themeColor: string | null;
    twitchUrl: string | null;
    youtubeUrl: string | null;
    twitterUrl: string | null;
    discordUrl: string | null;
    fanName: string | null;
    oshiMark: string | null;
  } | null;
  _count: { followers: number; following: number };
  isFollowedByMe: boolean;
}

interface ProfileCardWidgetProps {
  userId: string;
  onClose: () => void;
}

// ── Helpers ──
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// ── Component ──
export default function ProfileCardWidget({ userId, onClose }: ProfileCardWidgetProps) {
  const [profile, setProfile] = useState<ProfileCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowed, setIsFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Fetch profile data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/social/profile/${userId}`, {});
        if (!cancelled) {
          setProfile(data);
          setIsFollowed(data.isFollowedByMe);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowLoading(true);
    try {
      if (isFollowed) {
        await apiFetch(`/social/unfollow/${userId}`, { method: 'POST' });
        setIsFollowed(false);
        setProfile(prev => prev ? { ...prev, _count: { ...prev._count, followers: prev._count.followers - 1 } } : prev);
      } else {
        await apiFetch(`/social/follow/${userId}`, { method: 'POST' });
        setIsFollowed(true);
        setProfile(prev => prev ? { ...prev, _count: { ...prev._count, followers: prev._count.followers + 1 } } : prev);
      }
    } catch { /* ignore */ }
    finally { setFollowLoading(false); }
  };

  // ── Render ──
  if (typeof window === 'undefined') return null;

  const overlayContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 15000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pcfFadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '92%', maxWidth: '380px',
          borderRadius: '20px',
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.06)',
          animation: 'pcfZoomIn 0.25s ease-out',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {loading ? (
          /* ── Loading skeleton ── */
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              margin: '0 auto 12px',
              background: 'rgba(255,255,255,0.05)',
              animation: 'pcfPulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
              height: '14px', width: '140px', margin: '0 auto 8px',
              borderRadius: '6px', background: 'rgba(255,255,255,0.04)',
            }} />
            <div style={{
              height: '10px', width: '100px', margin: '0 auto',
              borderRadius: '6px', background: 'rgba(255,255,255,0.03)',
            }} />
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--error)', fontSize: '0.85rem' }}>
            {error}
          </div>
        ) : profile && (
          <CardContent
            profile={profile}
            isFollowed={isFollowed}
            followLoading={followLoading}
            handleFollow={handleFollow}
            onClose={onClose}
          />
        )}
      </div>

      <style>{`
        @keyframes pcfFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pcfZoomIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pcfPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes pcfGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.1); }
          50% { box-shadow: 0 0 40px rgba(139,92,246,0.2); }
        }
      `}</style>
    </div>
  );

  return createPortal(overlayContent, document.body);
}

// ── Card Content ──
function CardContent({
  profile, isFollowed, followLoading, handleFollow, onClose,
}: {
  profile: ProfileCardData;
  isFollowed: boolean;
  followLoading: boolean;
  handleFollow: (e: React.MouseEvent) => Promise<void>;
  onClose: () => void;
}) {
  const vtuber = profile.vtuberProfile;
  const displayName = vtuber?.displayName || profile.username;
  const avatarUrl = vtuber?.avatarUrl;
  const bannerUrl = vtuber?.bannerUrl;
  const themeColor = vtuber?.themeColor || 'var(--primary)';
  const isVtubers = profile.role === 'VTUBER' || vtuber?.isApproved;
  const hasCustomBanner = !!bannerUrl;
  const isVerified = vtuber?.isVerified;
  const isFeatured = vtuber?.isFeatured;
  const isLive = vtuber?.isLive;

  // Social links present
  const socialLinks = [
    vtuber?.twitchUrl && { url: vtuber.twitchUrl, label: 'Twitch', color: '#9146FF' },
    vtuber?.youtubeUrl && { url: vtuber.youtubeUrl, label: 'YouTube', color: '#FF0000' },
    vtuber?.twitterUrl && { url: vtuber.twitterUrl, label: 'X', color: '#1DA1F2' },
    vtuber?.discordUrl && { url: vtuber.discordUrl, label: 'Discord', color: '#5865F2' },
  ].filter(Boolean) as { url: string; label: string; color: string }[];

  return (
    <>
      {/* ── Close button ── */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 5,
          width: '28px', height: '28px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', transition: 'all 0.15s',
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
      >
        ✕
      </button>

      {/* ── Banner section ── */}
      <div style={{
        position: 'relative',
        height: hasCustomBanner ? '140px' : '100px',
        background: hasCustomBanner
          ? `url(${bannerUrl}) center/cover`
          : `linear-gradient(135deg, ${themeColor}, rgba(0,0,0,0.3) 70%)`,
        overflow: 'hidden',
      }}>
        {/* Decorative gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 50%, rgba(26,26,46,0.9) 100%)',
          zIndex: 1,
        }} />

        {/* Featured glow */}
        {isFeatured && (
          <div style={{
            position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.2), transparent 70%)',
            zIndex: 0, animation: 'pcfGlow 3s ease-in-out infinite',
          }} />
        )}

        {/* Live badge */}
        {isLive && (
          <div style={{
            position: 'absolute', top: '12px', left: '12px', zIndex: 3,
            padding: '3px 10px', borderRadius: '8px',
            background: 'rgba(245,158,11,0.9)',
            fontSize: '0.62rem', fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#fff', animation: 'pcfPulse 1.5s ease-in-out infinite',
            }} />
            EN VIVO
          </div>
        )}

        {/* Avatar positioned on banner bottom */}
        <div style={{
          position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 3,
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: avatarUrl
              ? `url(${avatarUrl}) center/cover`
              : `linear-gradient(135deg, ${themeColor}, var(--secondary))`,
            border: '3px solid #1a1a2e',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '1.6rem',
            overflow: 'hidden', flexShrink: 0,
            transition: 'transform 0.2s',
          }}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {!avatarUrl && getInitial(displayName)}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '48px 20px 20px', textAlign: 'center' }}>
        {/* Display name + badges */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '6px', marginBottom: '2px', flexWrap: 'wrap',
        }}>
          <h3 style={{
            margin: 0, fontSize: '1.15rem', fontWeight: 700,
            color: 'var(--text)',
          }}>
            {displayName}
          </h3>

          {isVerified && (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-label="Verificado" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
              <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {isVtubers && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="VTuber Oficial">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}

          {isFeatured && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ffd700' }}>
              ★
            </span>
          )}
        </div>

        {/* Username */}
        <p style={{
          margin: '0 0 4px', fontSize: '0.78rem', color: 'var(--text-muted)',
        }}>
          @{profile.username}
        </p>

        {/* Oshi mark / fan name */}
        {(vtuber?.oshiMark || vtuber?.fanName) && (
          <p style={{
            margin: '0 0 8px', fontSize: '0.72rem', color: themeColor, fontWeight: 600,
          }}>
            {vtuber?.oshiMark && <span style={{ marginRight: '6px' }}>{vtuber.oshiMark}</span>}
            {vtuber?.fanName && <span>✨ {vtuber.fanName}</span>}
          </p>
        )}

        {/* Description */}
        {vtuber?.description && (
          <p style={{
            margin: '0 auto 16px',
            fontSize: '0.82rem', lineHeight: 1.6,
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '320px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {vtuber.description}
          </p>
        )}

        {/* ── Note / Status Message ── */}
        {profile.note && (
          <div style={{
            margin: '0 auto 14px',
            maxWidth: '320px',
            padding: '10px 14px',
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.1)',
            borderRadius: '10px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.82rem', lineHeight: 1.5,
              color: 'rgba(255,255,255,0.7)',
              fontStyle: 'italic',
              wordBreak: 'break-word',
            }}>
              &ldquo;{profile.note}&rdquo;
            </p>
            {profile.noteUpdatedAt && (
              <div style={{
                fontSize: '0.62rem', color: 'var(--text-muted)',
                marginTop: '6px', opacity: 0.6,
              }}>
                {new Date(profile.noteUpdatedAt).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Stats row ── */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '0',
          marginBottom: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          {[
            { value: profile._count.followers, label: 'Seguidores', icon: '👥' },
            { value: profile._count.following, label: 'Siguiendo', icon: '👤' },
            { value: profile.level || 0, label: 'Nivel', icon: '⭐' },
            { value: profile.xp || 0, label: 'XP', icon: '✨' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '10px 4px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                fontSize: '1rem', fontWeight: 800,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px',
                fontWeight: 500,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Follow button ── */}
        <button
          onClick={handleFollow}
          disabled={followLoading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 28px', borderRadius: '12px',
            border: isFollowed ? '1px solid rgba(255,255,255,0.12)' : 'none',
            background: isFollowed
              ? 'rgba(255,255,255,0.06)'
              : `linear-gradient(135deg, ${themeColor}, var(--secondary))`,
            color: isFollowed ? 'var(--text-muted)' : '#fff',
            fontSize: '0.85rem', fontWeight: 700,
            cursor: followLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: '14px',
            opacity: followLoading ? 0.6 : 1,
          }}
          onMouseOver={e => {
            if (!followLoading) {
              if (isFollowed) {
                e.currentTarget.style.background = 'rgba(245,158,11,0.12)';
                e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
              } else {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3)`;
              }
            }
          }}
          onMouseOut={e => {
            if (!followLoading) {
              e.currentTarget.style.background = isFollowed ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${themeColor}, var(--secondary))`;
              e.currentTarget.style.borderColor = isFollowed ? 'rgba(255,255,255,0.12)' : 'none';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {followLoading ? (
            <span style={{
              width: '14px', height: '14px', borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff',
              animation: 'pcfPulse 0.6s linear infinite',
              display: 'inline-block',
            }} />
          ) : isFollowed ? '✓ Siguiendo' : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg> Seguir</>
          )}
        </button>

        {/* ── Social links row ── */}
        {socialLinks.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '8px',
            marginBottom: '14px', flexWrap: 'wrap',
          }}>
            {socialLinks.map(link => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title={link.label}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: `${link.color}15`,
                  border: `1px solid ${link.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: link.color, fontSize: '0.65rem', fontWeight: 700,
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = `${link.color}25`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = `${link.color}15`;
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Simple icon letter */}
                {link.label === 'Twitch' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
                )}
                {link.label === 'YouTube' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                )}
                {link.label === 'X' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                )}
                {link.label === 'Discord' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.0371 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                )}
              </a>
            ))}
          </div>
        )}

        {/* ── View profile link ── */}
        <Link
          href={`/profile/${profile.id}`}
          onClick={onClose}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600,
            textDecoration: 'none', transition: 'color 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.color = 'var(--secondary)'; }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--primary)'; }}
        >
          Ver perfil completo
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </>
  );
}
