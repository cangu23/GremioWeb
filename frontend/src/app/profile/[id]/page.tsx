'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface SocialUser {
  id: string;
  username: string;
  vtuberProfile?: { displayName: string; avatarUrl: string | null; isVerified?: boolean } | null;
}

interface Post {
  id: string;
  content: string;
  mediaUrl: string | null;
  createdAt: string;
  _count: { comments: number; likes: number };
  hashtags: string[];
}

interface SocialProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  provider: string;
  createdAt: string;
  xp: number;
  level: number;
  vtuberProfile?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    description: string | null;
    lore: string | null;
    fanName: string | null;
    oshiMark: string | null;
    contentType: string | null;
    streamSchedule: string | null;
    languages: string | null;
    themeColor?: string | null;
    isLive: boolean;
    isVerified: boolean;
    isApproved: boolean;
    isFeatured: boolean;
    twitchUrl: string | null;
    youtubeUrl: string | null;
    kickUrl: string | null;
    tiktokUrl: string | null;
    twitterUrl: string | null;
    discordUrl: string | null;
    websiteUrl: string | null;
  } | null;
  _count: { followers: number; following: number };
  isFollowedByMe: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function ProfileContent() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState(5);
  const [donateMessage, setDonateMessage] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState('');
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch(`/social/profile/${id}`);
      setProfile(data);
      setIsFollowed(data.isFollowedByMe);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [id]);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await apiFetch(`/posts/user/${id}?limit=5`, {});
      setPosts(data);
    } catch {} finally {
      setPostsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  const handleFollow = async () => {
    if (!currentUser) { router.push('/login'); return; }
    setFollowLoading(true);
    try {
      if (isFollowed) {
        await apiFetch(`/social/unfollow/${id}`, { method: 'POST' });
        setIsFollowed(false);
        setProfile(prev => prev ? { ...prev, _count: { ...prev._count, followers: prev._count.followers - 1 } } : prev);
      } else {
        await apiFetch(`/social/follow/${id}`, { method: 'POST' });
        setIsFollowed(true);
        setProfile(prev => prev ? { ...prev, _count: { ...prev._count, followers: prev._count.followers + 1 } } : prev);
      }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setFollowLoading(false); }
  };

  const handleDonate = async () => {
    if (!currentUser) { router.push('/login'); return; }
    setDonateLoading(true);
    try {
      await apiFetch('/payments/donate', {
        method: 'POST',
        body: JSON.stringify({ recipientId: String(id), amount: donateAmount, message: donateMessage || undefined }),
      });
      setDonateSuccess(`¡Donaste $${donateAmount} USD a ${profile?.username}! 💝`);
      setShowDonate(false);
      setTimeout(() => setDonateSuccess(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setDonateLoading(false); }
  };

  const loadFollowers = async () => {
    setShowFollowers(true);
    try { const data = await apiFetch(`/social/followers/${id}`); setFollowers(data); } catch {}
  };
  const loadFollowing = async () => {
    setShowFollowing(true);
    try { const data = await apiFetch(`/social/following/${id}`); setFollowing(data); } catch {}
  };

  if (error) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}><p style={{ color: 'var(--error)' }}>Error: {error}</p></div>;
  if (!profile) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Cargando perfil...</p></div>;

  const isOwnProfile = currentUser?.id === profile.id;
  const vtuber = profile.vtuberProfile;
  const avatarUrl = vtuber?.avatarUrl;
  const bannerUrl = vtuber?.bannerUrl;
  const displayName = vtuber?.displayName || profile.username;
  const themeColor = vtuber?.themeColor || 'var(--primary)';

  // Parse languages
  let languagesList: string[] = [];
  try { if (vtuber?.languages) languagesList = JSON.parse(vtuber.languages); } catch {}

  // Social link configs
  const socialLinks = [
    { url: vtuber?.twitchUrl, label: 'Twitch', icon: 'TW', color: '#9146FF', bg: 'rgba(145,65,255,0.15)' },
    { url: vtuber?.youtubeUrl, label: 'YouTube', icon: 'YT', color: '#FF0000', bg: 'rgba(255,0,0,0.12)' },
    { url: vtuber?.kickUrl, label: 'Kick', icon: 'KC', color: '#53fc18', bg: 'rgba(83,252,24,0.12)' },
    { url: vtuber?.tiktokUrl, label: 'TikTok', icon: 'TK', color: '#00f2ea', bg: 'rgba(0,242,234,0.12)' },
    { url: vtuber?.twitterUrl, label: 'Twitter/X', icon: 'X', color: '#1DA1F2', bg: 'rgba(29,161,242,0.12)' },
    { url: vtuber?.discordUrl, label: 'Discord', icon: 'DC', color: '#5865F2', bg: 'rgba(88,101,242,0.12)' },
    { url: vtuber?.websiteUrl, label: 'Sitio Web', icon: 'WWW', color: 'var(--primary)', bg: 'rgba(138,43,226,0.1)' },
  ].filter(s => s.url);

  return (
    <>
      {/* ===== BANNER SECTION ===== */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(200px, 30vw, 360px)',
        background: bannerUrl
          ? `url(${bannerUrl}) center/cover`
          : 'linear-gradient(135deg, #1a1040, #302b63, #1a1040)',
        overflow: 'hidden',
      }}>
        {/* Decorative rings */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 'min(80vw, 500px)', height: 'min(80vw, 500px)',
          borderRadius: '50%',
          border: '1px solid rgba(138,43,226,0.08)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 'min(60vw, 380px)', height: 'min(60vw, 380px)',
          borderRadius: '50%',
          border: '1px solid rgba(138,43,226,0.06)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.3) 70%, var(--background) 100%)',
          zIndex: 1,
        }} />

        {/* Animated glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.12), transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Verified badge floating */}
        {vtuber?.isVerified && (
          <div style={{
            position: 'absolute', top: '20px', right: '20px', zIndex: 2,
            padding: '6px 14px', borderRadius: '20px',
            background: 'rgba(0,212,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,212,255,0.3)',
            fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            ✓ Verificado
          </div>
        )}

        {/* Avatar */}
        <div style={{
          position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 2, textAlign: 'center',
        }}>
          <div style={{
            width: 'clamp(100px, 15vw, 140px)',
            height: 'clamp(100px, 15vw, 140px)',
            borderRadius: '50%',
            background: avatarUrl
              ? 'transparent'
              : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            border: '4px solid var(--background)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 40px rgba(138,43,226,0.15)',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'white', fontWeight: 'bold',
            overflow: 'hidden', position: 'relative',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 12px 60px rgba(138,43,226,0.3), 0 0 60px rgba(138,43,226,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.4), 0 0 40px rgba(138,43,226,0.15)'; }}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={0}
                height={0}
                sizes="100vw"
                unoptimized
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>

      {/* ===== PROFILE HEADER ===== */}
      <div className="container" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Display name with badges */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '10px', flexWrap: 'wrap', marginBottom: '4px',
          }}>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {displayName}
              {vtuber?.isApproved && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="VTuber Oficial">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
            </h1>
            {vtuber?.isVerified && (
              <svg width="24" height="24" viewBox="0 0 24 24" aria-label="Verificado" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {vtuber?.isFeatured && (
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>FEATURED</span>
            )}
            {vtuber?.isLive && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '20px',
                background: 'rgba(255,68,68,0.12)',
                border: '1px solid rgba(255,68,68,0.3)',
                fontSize: '0.8rem', fontWeight: 600, color: '#ff4444',
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#ff4444',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                EN VIVO
              </span>
            )}
          </div>

          {/* Username */}
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '8px' }}>
            @{profile.username}
          </p>

          {/* Oshi mark & fan name */}
          {(vtuber?.oshiMark || vtuber?.fanName) && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
              {vtuber?.oshiMark && <span style={{ marginRight: '8px' }}>{vtuber.oshiMark}</span>}
              {vtuber?.fanName && <span>Fans: <strong style={{ color: 'var(--primary)' }}>{vtuber.fanName}</strong></span>}
            </p>
          )}

          {/* Content type badge */}
          {vtuber?.contentType && (
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: '20px',
              background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.2)',
              fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600,
              marginBottom: '12px',
            }}>
              {vtuber.contentType}
            </span>
          )}
        </div>

        {/* ===== STATS ROW ===== */}
        <div style={{
          maxWidth: '600px', margin: '0 auto 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
        }}>
          <button onClick={loadFollowers} style={{
            background: 'none', border: 'none', borderRight: '1px solid var(--glass-border)',
            color: 'var(--text)', cursor: 'pointer',
            textAlign: 'center', padding: '20px 8px',
            transition: 'all 0.2s', position: 'relative',
          }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {profile._count.followers}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Seguidores</div>
          </button>
          <button onClick={loadFollowing} style={{
            background: 'none', border: 'none', borderRight: '1px solid var(--glass-border)',
            color: 'var(--text)', cursor: 'pointer',
            textAlign: 'center', padding: '20px 8px',
            transition: 'all 0.2s',
          }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {profile._count.following}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Siguiendo</div>
          </button>
          <div style={{ textAlign: 'center', padding: '20px 8px', borderRight: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {profile.level || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Nivel</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 8px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {profile.xp || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>XP</div>
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        {donateSuccess && (
          <div style={{
            maxWidth: '600px', margin: '0 auto 20px',
            padding: '14px 20px', borderRadius: '12px',
            background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)',
            color: 'var(--success)', fontSize: '0.95rem', fontWeight: 600,
            textAlign: 'center',
          }}>
            {donateSuccess}
          </div>
        )}

        <div style={{
          display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
          marginBottom: '40px',
        }}>
          {!isOwnProfile ? (
            <>
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="btn"
                style={{
                  padding: '14px 36px', fontSize: '1rem', fontWeight: 700,
                  borderRadius: '14px',
                  background: isFollowed
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  border: isFollowed ? '1px solid var(--glass-border)' : 'none',
                  color: isFollowed ? 'var(--text-muted)' : '#fff',
                  minWidth: '160px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  if (isFollowed) {
                    e.currentTarget.style.background = 'rgba(255,68,68,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255,68,68,0.3)';
                    e.currentTarget.textContent = 'Dejar de seguir';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFollowed) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.textContent = 'Siguiendo';
                  }
                }}
              >
                {followLoading ? '...' : isFollowed ? 'Siguiendo' : '✦ Seguir'}
              </button>
              <button
                onClick={() => setShowDonate(true)}
                className="btn"
                style={{
                  padding: '14px 28px', fontSize: '1rem', fontWeight: 700,
                  borderRadius: '14px',
                  background: 'transparent',
                  border: '2px solid rgba(255,215,0,0.4)',
                  color: '#ffd700',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
                  e.currentTarget.style.borderColor = '#ffd700';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255,215,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,215,0,0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}                >
                Donar
              </button>
              <Link
                href={`/chat?user=${profile.id}`}
                className="btn"
                style={{
                  padding: '14px 28px', fontSize: '1rem', fontWeight: 700,
                  borderRadius: '14px',
                  background: 'transparent',
                  border: '2px solid rgba(0,212,255,0.3)',
                  color: 'var(--accent)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.1)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)';
                }}                >
                Mensaje
              </Link>
            </>
          ) : (
            <Link
              href="/vtuber-profile"
              className="btn"
              style={{
                padding: '14px 36px', fontSize: '1rem', fontWeight: 700,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              }}
            >
              ✎ Editar Perfil VTuber
            </Link>
          )}
        </div>

        {/* ===== MAIN CONTENT GRID ===== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 380px) 1fr',
          gap: '24px',
          alignItems: 'start',
        }}>
          {/* ===== LEFT COLUMN ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Description */}
            {vtuber?.description && (
              <div className="glass" style={{
                padding: '24px', borderRadius: '16px',
                borderLeft: `3px solid ${themeColor}`,
              }}>
                <h3 style={{
                  fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px',
                  textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  📝 Descripción
                </h3>
                <p style={{
                  fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {vtuber.description}
                </p>
              </div>
            )}

            {/* Lore */}
            {vtuber?.lore && (
              <div className="glass" style={{
                padding: '24px', borderRadius: '16px',
                borderLeft: `3px solid ${themeColor}`,
              }}>
                <button
                  onClick={() => setShowLore(!showLore)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer',
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '1rem', fontWeight: 700, padding: 0,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    📖 Lore / Historia
                  </span>
                  <span style={{
                    fontSize: '0.85rem', color: themeColor, fontWeight: 600,
                    transition: 'transform 0.3s',
                    transform: showLore ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    ▼
                  </span>
                </button>
                {showLore && (
                  <div style={{
                    marginTop: '16px', paddingTop: '16px',
                    borderTop: '1px solid var(--glass-border)',
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    <p style={{
                      fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text)',
                      whiteSpace: 'pre-wrap', fontStyle: 'italic',
                    }}>
                      {vtuber.lore}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="glass" style={{ padding: '24px', borderRadius: '16px', borderTop: `3px solid ${themeColor}` }}>
                <h3 style={{
                  fontSize: '1rem', fontWeight: 700, marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)',
                }}>
                  Redes Sociales
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderRadius: '12px',
                        background: link.bg, color: link.color,
                        textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.filter = 'brightness(1.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.filter = 'brightness(1)';
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                      <span>{link.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.6 }}>
                        ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Stream Info */}
            {(vtuber?.streamSchedule || languagesList.length > 0) && (
              <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
                <h3 style={{
                  fontSize: '1rem', fontWeight: 700, marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)',
                }}>
                  📡 Información de Stream
                </h3>
                {vtuber?.streamSchedule && (
                  <div style={{ marginBottom: languagesList.length > 0 ? '14px' : 0 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                      HORARIO
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                      {vtuber.streamSchedule}
                    </p>
                  </div>
                )}
                {languagesList.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                      IDIOMAS
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {languagesList.map((lang) => (
                        <span key={lang} style={{
                          padding: '4px 12px', borderRadius: '20px',
                          background: 'rgba(0,212,255,0.1)',
                          border: '1px solid rgba(0,212,255,0.2)',
                          fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500,
                        }}>
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN — POSTS FEED ===== */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h3 style={{
                fontSize: '1.15rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                Publicaciones
              </h3>
              <Link href={`/feed?user=${profile.id}`} style={{
                fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600,
              }}>
                Ver todas →
              </Link>
            </div>

            {postsLoading ? (
              <div className="glass" style={{
                padding: '40px', textAlign: 'center', borderRadius: '16px',
                display: 'flex', justifyContent: 'center',
              }}>
                <span style={{
                  width: '20px', height: '20px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            ) : posts.length === 0 ? (
              <div className="glass" style={{
                padding: '40px', textAlign: 'center', borderRadius: '16px',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {isOwnProfile
                    ? 'No has publicado nada aún. ¡Comparte algo con la comunidad!'
                    : `${displayName} aún no ha publicado nada.`}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {posts.map((post, idx) => (
                  <div
                    key={post.id}
                    className="glass"
                    style={{
                      borderRadius: '16px', padding: '20px',
                      transition: 'all 0.3s ease',
                      animation: `fadeInUp 0.5s ease ${idx * 0.08}s forwards`,
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
                      e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }}
                  >
                    {/* Post header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      marginBottom: '10px',
                    }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: avatarUrl
                          ? `url(${avatarUrl}) center/cover`
                          : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '0.7rem',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {!avatarUrl && displayName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>{displayName}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                          · {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <p style={{
                      fontSize: '0.9rem', lineHeight: 1.6,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      marginBottom: post.mediaUrl ? '10px' : 0,
                    }}>
                      {post.content.length > 280
                        ? post.content.slice(0, 280) + '...'
                        : post.content}
                    </p>

                    {/* Media */}
                    {post.mediaUrl && (
                      <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                        <Image src={post.mediaUrl} alt="" width={0} height={0} sizes="100vw" unoptimized style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* Hashtags */}
                    {post.hashtags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {post.hashtags.map((tag) => (
                          <Link key={tag} href={`/feed?tag=${tag}`} style={{
                            fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500,
                          }}>
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div style={{
                      display: 'flex', gap: '16px', borderTop: '1px solid var(--glass-border)',
                      paddingTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)',
                    }}>
                      <span>Likes {post._count.likes}</span>
                      <span>Comments {post._count.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== DONATE MODAL ===== */}
      {showDonate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000,
        }}
          onClick={() => setShowDonate(false)}>
          <div className="glass" style={{
            padding: '30px', width: '90%', maxWidth: '400px',
            borderRadius: '20px',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
              💝 Donar a {displayName}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Apoya a tu VTuber favorito con una donación
            </p>

            {/* Amount presets */}
            <div className="form-group">
              <label className="form-label">Monto (USD)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[1, 3, 5, 10, 20].map(a => (
                  <button key={a} onClick={() => setDonateAmount(a)}
                    style={{
                      padding: '10px 20px', borderRadius: '10px',
                      border: donateAmount === a ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                      background: donateAmount === a ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.05)',
                      color: 'var(--text)', cursor: 'pointer', fontWeight: 700,
                      transition: 'all 0.2s', fontSize: '0.95rem',
                    }}>
                    ${a}
                  </button>
                ))}
              </div>
              <input type="number" className="input"
                value={donateAmount}
                onChange={e => setDonateAmount(Math.max(1, Number(e.target.value)))}
                min={1} max={1000}
                style={{ width: '100%' }} />
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">Mensaje (opcional)</label>
              <textarea className="input"
                value={donateMessage}
                onChange={e => setDonateMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowDonate(false)} className="btn" style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)', color: 'var(--text)',
              }}>
                Cancelar
              </button>
              <button onClick={handleDonate} className="btn" style={{
                flex: 1, background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                color: '#000', fontWeight: 800,
              }} disabled={donateLoading}>
                {donateLoading ? 'Procesando...' : `💝 Donar $${donateAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOLLOWERS MODAL ===== */}
      {showFollowers && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000,
        }}
          onClick={() => setShowFollowers(false)}>
          <div className="glass" style={{
            padding: '24px', width: '90%', maxWidth: '420px',
            maxHeight: '60vh', overflow: 'auto', borderRadius: '20px',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👥 Seguidores <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>({profile._count.followers})</span>
            </h3>
            {followers.length === 0
              ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Sin seguidores aún.</p>
              : followers.map(f => (
                <Link key={f.id} href={`/profile/${f.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '12px',
                  color: 'var(--text)', textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => setShowFollowers(false)}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: f.vtuberProfile?.avatarUrl
                      ? `url(${f.vtuberProfile.avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
                    overflow: 'hidden',
                  }}>
                    {!f.vtuberProfile?.avatarUrl && (f.vtuberProfile?.displayName || f.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {f.vtuberProfile?.displayName || f.username}
                      {f.vtuberProfile?.isVerified && (
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Verificado">
                          <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                          <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{f.username}</div>
                  </div>
                </Link>
              ))}
            <button onClick={() => setShowFollowers(false)} className="btn" style={{
              width: '100%', marginTop: '16px', padding: '10px',
              background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
              border: '1px solid var(--glass-border)',
            }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ===== FOLLOWING MODAL ===== */}
      {showFollowing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000,
        }}
          onClick={() => setShowFollowing(false)}>
          <div className="glass" style={{
            padding: '24px', width: '90%', maxWidth: '420px',
            maxHeight: '60vh', overflow: 'auto', borderRadius: '20px',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👥 Siguiendo <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>({profile._count.following})</span>
            </h3>
            {following.length === 0
              ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No sigue a nadie aún.</p>
              : following.map(f => (
                <Link key={f.id} href={`/profile/${f.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '12px',
                  color: 'var(--text)', textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => setShowFollowing(false)}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: f.vtuberProfile?.avatarUrl
                      ? `url(${f.vtuberProfile.avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
                    overflow: 'hidden',
                  }}>
                    {!f.vtuberProfile?.avatarUrl && (f.vtuberProfile?.displayName || f.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.vtuberProfile?.displayName || f.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{f.username}</div>
                  </div>
                </Link>
              ))}
            <button onClick={() => setShowFollowing(false)} className="btn" style={{
              width: '100%', marginTop: '16px', padding: '10px',
              background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
              border: '1px solid var(--glass-border)',
            }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProfilePage() {
  return (
    <ClientOnly fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando perfil...</div>}>
      <ProfileContent />
    </ClientOnly>
  );
}
