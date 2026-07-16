'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/lib/ToastContext';
import { Star, Users, Heart, MessageCircle, Image as IconImage, BookOpen, Link2, Calendar, Globe, Twitch, Youtube, Twitter, Discord, Music, Sparkles, Telescope, Info, ZoomIn, Gamepad, Palette, Mic, Headphones, MessageSquare } from '@/components/ui/Icons';

/* ─────────── Types ─────────── */

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

interface VTuberProfileData {
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
  themeColor: string | null;
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
}

interface ProfileData {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  provider: string;
  createdAt: string;
  xp: number;
  level: number;
  vtuberProfile: VTuberProfileData | null;
  _count: { followers: number; following: number };
  isFollowedByMe: boolean;
}

/* ─────────── Helpers ─────────── */

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

function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
}

function ContentTypeIcon({ type, size = 16 }: { type: string | null; size?: number }) {
  const props = { size, color: 'var(--primary)', strokeWidth: 2 };
  if (!type) return <Sparkles {...props} />;
  switch (type.toLowerCase()) {
    case 'gaming': return <Gamepad {...props} />;
    case 'music': return <Music {...props} />;
    case 'art': return <Palette {...props} />;
    case 'singing': return <Mic {...props} />;
    case 'asmr': return <Headphones {...props} />;
    case 'chatting':
    case 'just-chatting':
    case 'vtuber':
    default: return <MessageSquare {...props} />;
  }
}

/* ─────────── Section Title ─────────── */

function SectionTitle({ icon, children, count }: { icon: React.ReactNode; children: React.ReactNode; count?: string | number }) {
  return (
    <h3 style={{
      fontSize: '0.85rem', fontWeight: 700, marginBottom: '14px',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      color: 'var(--text-muted)',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      {children}
      {count !== undefined && (
        <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.7 }}>
          ({count})
        </span>
      )}
    </h3>
  );
}

/* ─────────── Main Content ─────────── */

function VtuberPublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [showLore, setShowLore] = useState(false);

  // Modals
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState(5);
  const [donateMessage, setDonateMessage] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState('');
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [mediaPostsLoading, setMediaPostsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch(`/social/profile/${id}`);
      setProfile(data);
      setIsFollowed(data.isFollowedByMe);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar perfil');
    }
  }, [id]);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await apiFetch(`/posts/user/${id}?limit=5`, {});
      setPosts(data);
    } catch { /* silent */ }
    finally { setPostsLoading(false); }
  }, [id]);

  const fetchMediaPosts = useCallback(async () => {
    try {
      const data = await apiFetch(`/posts/user/${id}?limit=50`, {});
      setMediaPosts(data.filter((p: Post) => p.mediaUrl));
    } catch { /* silent */ }
    finally { setMediaPostsLoading(false); }
  }, [id]);

  useEffect(() => { fetchProfile(); fetchPosts(); fetchMediaPosts(); }, [fetchProfile, fetchPosts, fetchMediaPosts]);

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
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error al seguir', 'error'); }
    finally { setFollowLoading(false); }
  };

  const handleDonate = async () => {
    if (!currentUser) { router.push('/login'); return; }
    setDonateLoading(true);
    try {
      await apiFetch('/payments/donate', {
        method: 'POST',
        body: JSON.stringify({ recipientId: String(id), amount: donateAmount, message: donateMessage || undefined }),
      });              setDonateSuccess(`¡Donaste $${donateAmount} USD!`);
      setShowDonate(false);
      setTimeout(() => setDonateSuccess(''), 5000);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error al donar', 'error'); }
    finally { setDonateLoading(false); }
  };

  const loadFollowers = async () => {
    setShowFollowers(true);
    try { const data = await apiFetch(`/social/followers/${id}`); setFollowers(data); } catch { /* silent */ }
  };

  const loadFollowing = async () => {
    setShowFollowing(true);
    try { const data = await apiFetch(`/social/following/${id}`); setFollowing(data); } catch { /* silent */ }
  };

  /* ─── Derived data ─── */

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}><Telescope size={48} color="var(--text-muted)" strokeWidth={1.5} /></div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Perfil no encontrado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error}</p>
        <Link href="/vtubers" className="btn" style={{ padding: '12px 28px' }}>
          ← Volver al Directorio
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(255,255,255,0.08)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Cargando perfil VTuber...</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const vtuber = profile.vtuberProfile;
  const avatarUrl = vtuber?.avatarUrl;
  const bannerUrl = vtuber?.bannerUrl;
  const displayName = vtuber?.displayName || profile.username;
  const themeColor = vtuber?.themeColor || 'var(--primary)';
  const languagesList = parseLanguages(vtuber?.languages || null);

  const isLive = vtuber?.isLive || false;

  const socialLinks = [
    { url: vtuber?.twitchUrl, label: 'Twitch', icon: <Twitch size={18} color="#9146FF" strokeWidth={2} />, color: '#9146FF', bg: 'rgba(145,65,255,0.15)' },
    { url: vtuber?.youtubeUrl, label: 'YouTube', icon: <Youtube size={18} color="#FF0000" strokeWidth={2} />, color: '#FF0000', bg: 'rgba(255,0,0,0.12)' },
    { url: vtuber?.kickUrl, label: 'Kick', icon: <Sparkles size={18} color="#53fc18" strokeWidth={2.5} />, color: '#53fc18', bg: 'rgba(83,252,24,0.12)' },
    { url: vtuber?.tiktokUrl, label: 'TikTok', icon: <Music size={18} color="#00f2ea" strokeWidth={2} />, color: '#00f2ea', bg: 'rgba(0,242,234,0.12)' },
    { url: vtuber?.twitterUrl, label: 'Twitter/X', icon: <Twitter size={18} color="#1DA1F2" strokeWidth={2} />, color: '#1DA1F2', bg: 'rgba(29,161,242,0.12)' },
    { url: vtuber?.discordUrl, label: 'Discord', icon: <Discord size={18} color="#5865F2" strokeWidth={2} />, color: '#5865F2', bg: 'rgba(88,101,242,0.12)' },
    { url: vtuber?.websiteUrl, label: 'Sitio Web', icon: <Globe size={18} color="var(--primary)" strokeWidth={2} />, color: 'var(--primary)', bg: 'rgba(138,43,226,0.1)' },
  ].filter(s => s.url);

  return (
    <>        {/* Back navigation */}
        <div className="container" style={{ padding: '12px 20px', marginBottom: 0 }}>
          <Link href="/vtubers" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)',
            textDecoration: 'none', padding: '6px 14px',
            borderRadius: '10px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Directorio de VTubers
          </Link>
        </div>

        {/* Non-VTuber profile notice */}
        {!vtuber && (
          <div className="container" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
            <div style={{
              padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
              background: 'rgba(255,152,0,0.08)',
              border: '1px solid rgba(255,152,0,0.2)',
              display: 'flex', alignItems: 'center', gap: '12px',
              flexWrap: 'wrap',
            }}>
              <span style={{ display: 'flex' }}><Info size={22} color="#ff9800" /></span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Este usuario no tiene perfil VTuber</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '8px' }}>
                  Puedes ver su perfil general aquí abajo.
                </span>
              </div>
              <Link href={`/profile/${profile.id}`} className="btn" style={{
                padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600,
                borderRadius: '10px',
                background: 'rgba(255,152,0,0.15)', color: '#ff9800',
                border: '1px solid rgba(255,152,0,0.3)',
              }}>
                Ver perfil general
              </Link>
            </div>
          </div>
        )}

        {/* ═══════════════════ HERO BANNER ═══════════════════ */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(220px, 32vw, 400px)',
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

        {/* Badges top-right */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, display: 'flex', gap: '8px' }}>
          {vtuber?.isVerified && (
            <div style={{
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
          {isLive && (
            <div style={{
              padding: '6px 14px', borderRadius: '20px',
              background: 'rgba(233,30,99,0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(233,30,99,0.4)',
              fontSize: '0.8rem', fontWeight: 700, color: '#e91e63',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e91e63', animation: 'vtuber-pulse-dot 1.5s ease infinite' }} />
              EN VIVO
            </div>
          )}
          {vtuber?.isFeatured && !isLive && (
            <div style={{
              padding: '6px 14px', borderRadius: '20px',
              background: 'rgba(255,215,0,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,215,0,0.3)',
              fontSize: '0.8rem', fontWeight: 600, color: '#ffd700',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Star size={12} color="#ffd700" fill="#ffd700" strokeWidth={2.5} /> Destacado
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{
          position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 2, textAlign: 'center',
        }}>
          <div style={{
            width: 'clamp(110px, 16vw, 150px)',
            height: 'clamp(110px, 16vw, 150px)',
            borderRadius: '50%',
            background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            border: '4px solid var(--background)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 40px rgba(138,43,226,0.15)',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: 'white', fontWeight: 'bold',
            overflow: 'hidden', position: 'relative',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 60px rgba(138,43,226,0.3), 0 0 60px rgba(138,43,226,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.4), 0 0 40px rgba(138,43,226,0.15)';
            }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={0} height={0} sizes="100vw" unoptimized
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}

            {/* Live ring pulse */}
            {isLive && (
              <div style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                border: '3px solid rgba(233,30,99,0.5)',
                animation: 'vtuber-live-ring 2s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════ PROFILE HEADER ═══════════════════ */}
      <div className="container" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
        {/* Name + badges */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '10px', flexWrap: 'wrap', marginBottom: '4px',
          }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              {displayName}
              {vtuber?.isApproved && (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="VTuber Oficial">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
              {vtuber?.isVerified && (
                <svg width="26" height="26" viewBox="0 0 24 24" aria-label="Verificado">
                  <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
                  <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </h1>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '6px' }}>
            @{profile.username}
          </p>

          {/* Oshi mark + fan name */}
          {(vtuber?.oshiMark || vtuber?.fanName) && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '10px' }}>
              {vtuber?.oshiMark && <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>{vtuber.oshiMark}</span>}
              {vtuber?.fanName && <span>Fans: <strong style={{ color: 'var(--primary)' }}>{vtuber.fanName}</strong></span>}
            </p>
          )}

          {/* Content type badge */}
          {vtuber?.contentType && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 18px', borderRadius: '20px',
              background: 'rgba(138,43,226,0.1)',
              border: '1px solid rgba(138,43,226,0.25)',
              fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600,
            }}>
              <ContentTypeIcon type={vtuber.contentType} size={16} /> {vtuber.contentType.charAt(0).toUpperCase() + vtuber.contentType.slice(1)}
            </span>
          )}
        </div>

        {/* ═══════ STATS ROW ═══════ */}
        <div style={{
          maxWidth: '600px', margin: '0 auto 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
        }}>
          <button onClick={loadFollowers} style={{
            background: 'none', border: 'none', borderRight: '1px solid var(--glass-border)',
            color: 'var(--text)', cursor: 'pointer',
            textAlign: 'center', padding: '20px 8px',
            transition: 'all 0.2s',
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

        {/* ═══════ ACTION BUTTONS ═══════ */}
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
                    e.currentTarget.style.background = 'rgba(245,158,11,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
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

              {/* Watch Stream button — only if live */}
              {isLive && (
                <a
                  href={vtuber?.twitchUrl || vtuber?.youtubeUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    padding: '14px 28px', fontSize: '1rem', fontWeight: 700,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #e91e63, #ff6b9d)',
                    color: '#fff', border: 'none',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    animation: 'vtuber-live-glow 2s ease-in-out infinite',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'vtuber-pulse-dot 1.5s ease infinite' }} />
                  Ver Stream
                </a>
              )}

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
                }}
              >                      <Heart size={18} /> Donar
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
                }}
              >
                <MessageCircle size={18} /> Mensaje
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

        {/* ═══════════════════ CONTENT GRID ═══════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 380px) 1fr',
          gap: '24px',
          alignItems: 'start',
        }}>
          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Description */}
            {vtuber?.description && (
              <div className="glass" style={{
                padding: '24px', borderRadius: '16px',
                borderLeft: `3px solid ${themeColor}`,
              }}>
                <SectionTitle icon={<BookOpen size={16} />}>Descripción</SectionTitle>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
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
                    <BookOpen size={16} /> Lore / Historia
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
                <SectionTitle icon={<Link2 size={16} />}>Redes Sociales</SectionTitle>
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
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.6 }}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Stream Info */}
            {(vtuber?.streamSchedule || languagesList.length > 0) && (
              <div className="glass" style={{ padding: '24px', borderRadius: '16px', borderLeft: `3px solid ${themeColor}` }}>
                <SectionTitle icon={<Calendar size={16} />}>Información de Stream</SectionTitle>
                {vtuber?.streamSchedule && (
                  <div style={{ marginBottom: languagesList.length > 0 ? '16px' : 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Horario
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>
                      {vtuber.streamSchedule}
                    </p>
                  </div>
                )}
                {languagesList.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Idiomas
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {languagesList.map((lang) => (
                        <span key={lang} style={{
                          padding: '4px 14px', borderRadius: '20px',
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

            {/* Platforms / Links quick view */}
            {(vtuber?.twitchUrl || vtuber?.youtubeUrl) && (
              <div className="glass" style={{ padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                <SectionTitle icon={<Twitch size={16} color="var(--primary)" />}>Plataformas</SectionTitle>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {vtuber?.twitchUrl && (
                    <a href={vtuber.twitchUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: '10px 20px', borderRadius: '12px',
                        background: 'rgba(145,65,255,0.15)', color: '#9146FF',
                        fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(145,65,255,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(145,65,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Twitch size={16} color="#9146FF" /> Twitch
                    </a>
                  )}
                  {vtuber?.youtubeUrl && (
                    <a href={vtuber.youtubeUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: '10px 20px', borderRadius: '12px',
                        background: 'rgba(255,0,0,0.12)', color: '#FF0000',
                        fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Youtube size={16} color="#FF0000" /> YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN — POSTS FEED ═══ */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h3 style={{
                fontSize: '1.15rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                📝 Publicaciones
              </h3>
              <Link href={`/feed?user=${profile.id}`} style={{
                fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600,
              }}>
                Ver todas →
              </Link>
            </div>

            {postsLoading ? (
              <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                <span style={{
                  width: '20px', height: '20px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }} />
              </div>
            ) : posts.length === 0 ? (
              <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
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
                      e.currentTarget.style.boxShadow = 'none';
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

                    <p style={{
                      fontSize: '0.9rem', lineHeight: 1.6,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      marginBottom: post.mediaUrl ? '10px' : 0,
                    }}>
                      {post.content.length > 280
                        ? post.content.slice(0, 280) + '...'
                        : post.content}
                    </p>

                    {post.mediaUrl && (
                      <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                        <Image src={post.mediaUrl} alt="" width={0} height={0} sizes="100vw" unoptimized
                          style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}

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

                    <div style={{
                      display: 'flex', gap: '16px', borderTop: '1px solid var(--glass-border)',
                      paddingTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={14} color="var(--text-muted)" /> {post._count.likes}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={14} color="var(--text-muted)" /> {post._count.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════ GALLERY ═══════════════════ */}
        {(mediaPosts.length > 0 || mediaPostsLoading) && (
          <div style={{ marginTop: '40px' }}>
            <SectionTitle icon={<IconImage size={16} />}>
              Galería
            </SectionTitle>

            {mediaPostsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <span style={{
                  width: '20px', height: '20px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }} />
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}>
                {mediaPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setGalleryImage(post.mediaUrl!)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid var(--glass-border)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(138,43,226,0.25)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      const overlay = e.currentTarget.querySelector('.g-overlay') as HTMLElement;
                      if (overlay) overlay.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      const overlay = e.currentTarget.querySelector('.g-overlay') as HTMLElement;
                      if (overlay) overlay.style.opacity = '0';
                    }}
                  >
                    <Image src={post.mediaUrl!} alt="" fill
                      sizes="(max-width: 768px) 50vw, 25vw" unoptimized
                      style={{ objectFit: 'cover' }} />
                    <div className="g-overlay" style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '1.2rem', fontWeight: 600,
                      pointerEvents: 'none',
                    }}>
                      <ZoomIn size={22} color="white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════ GALLERY LIGHTBOX ═══════════════════ */}
      {galleryImage && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px', cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setGalleryImage(null)}
        >
          <Image
            src={galleryImage}
            alt="Galería"
            width={0}
            height={0}
            sizes="90vw"
            unoptimized
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              borderRadius: '12px', objectFit: 'contain',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              animation: 'scaleIn 0.25s ease',
            }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setGalleryImage(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(0,0,0,0.5)', border: 'none',
              color: 'white', fontSize: '1.5rem', cursor: 'pointer',
              width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════════════════ DONATE MODAL ═══════════════════ */}
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Heart size={22} color="#ffd700" fill="#ffd700" /> Donar a {displayName}</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Apoya a tu VTuber favorito con una donación
            </p>

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

            <div className="form-group">
              <label className="form-label">Mensaje (opcional)</label>
              <textarea className="input"
                value={donateMessage}
                onChange={e => setDonateMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>

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

      {/* ═══════════════════ FOLLOWERS MODAL ═══════════════════ */}
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
              <Users size={20} /> Seguidores <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>({profile._count.followers})</span>
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
                          <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
                          <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* ═══════════════════ FOLLOWING MODAL ═══════════════════ */}
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
              <Users size={20} /> Siguiendo <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>({profile._count.following})</span>
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

      {/* ═══════════════════ ANIMATIONS ═══════════════════ */}
      <style>{`
        @keyframes vtuber-pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes vtuber-live-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.2; }
        }
        @keyframes vtuber-live-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(233,30,99,0.3); }
          50% { box-shadow: 0 0 40px rgba(233,30,99,0.5); }
        }
      `}</style>
    </>
  );
}

/* ═══════════════════════ PAGE EXPORT ═══════════════════════ */

export default function VtuberProfilePage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(255,255,255,0.08)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
      </div>
    }>
      <VtuberPublicProfile />
    </ClientOnly>
  );
}
