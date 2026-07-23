'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import SkeletonVTuberCard from '@/components/vtubers/SkeletonVTuberCard';
import { Star, Sparkles, Users, FileText, Twitch, Youtube, Twitter, Gamepad, Music, Palette, Mic, Headphones, MessageSquare, Telescope, Rocket } from '@/components/ui/Icons';

/* ─────────── Types ─────────── */

interface VTuberUser {
  id: string;
  username: string;
  role: string;
  _count: { followers: number; following: number; posts: number };
}

interface VTuberProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  lore: string | null;
  isLive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  kickUrl: string | null;
  tiktokUrl: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  streamSchedule: string | null;
  languages: string | null;
  contentType: string | null;
  fanName: string | null;
  oshiMark: string | null;
  themeColor: string | null;
  user: VTuberUser;
}

interface DirectoryMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ─────────── Helpers ─────────── */

function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
}

const CONTENT_TYPES = [
  { value: '', label: 'Todo' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Música' },
  { value: 'art', label: 'Arte' },
  { value: 'singing', label: 'Canto' },
  { value: 'chatting', label: 'Charla' },
  { value: 'asmr', label: 'ASMR' },
];

function ContentTypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const props = { size, color: 'var(--primary)', strokeWidth: 2 };
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

/* ─────────── Stats Card ─────────── */

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div
      className="glass"
      style={{
        padding: '20px 24px',
        borderRadius: '16px',
        textAlign: 'center',
        flex: 1,
        minWidth: 140,
        transition: 'all 0.25s ease',
        border: '1px solid var(--glass-border)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

/* ─────────── VTuber Card ─────────── */

function VTuberCard({ v }: { v: VTuberProfile }) {
  const langs = parseLanguages(v.languages);
  const accentColor = v.themeColor || 'var(--primary)';

  return (
    <Link
      href={`/profile/${v.userId}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        className="glass"
        style={{
          padding: '20px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'all 0.25s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 12px 40px rgba(138,43,226,0.15)`;
          e.currentTarget.style.borderColor = accentColor;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }}
      >
        {/* Live badge or featured */}
        {v.isLive && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            padding: '4px 10px', borderRadius: '8px',
            background: '#e91e63', color: '#fff',
            fontSize: '0.7rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '5px',
            boxShadow: '0 2px 12px rgba(233,30,99,0.4)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'vtuber-pulse-dot 1.5s ease infinite' }} />
            EN VIVO
          </div>
        )}
        {!v.isLive && v.isFeatured && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            padding: '4px 10px', borderRadius: '8px',
            background: 'rgba(255,215,0,0.15)', color: '#ffd700',
            fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(255,215,0,0.3)',
          }}>
            <Star size={12} color="#ffd700" strokeWidth={2.5} /> Destacado
          </div>
        )}

        {/* Row: Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
            background: v.avatarUrl
              ? `url(${v.avatarUrl}) center/cover`
              : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            border: `2px solid ${v.isLive ? '#e91e63' : 'rgba(139,92,246,0.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
            position: 'relative',
            transition: 'border-color 0.3s',
          }}>
            {!v.avatarUrl && v.displayName.charAt(0).toUpperCase()}
            {v.isLive && (
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: 14, height: 14, borderRadius: '50%',
                background: '#e91e63',
                border: '2px solid var(--background)',
                boxShadow: '0 0 6px rgba(233,30,99,0.6)',
                animation: 'vtuber-pulse-dot 1.5s ease infinite',
              }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.displayName}
              </span>
              {v.isVerified && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-label="Verificado">
                  <circle cx="12" cy="12" r="10" fill="#8B5CF6" />
                  <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              @{v.user.username}
            </div>
          </div>
        </div>

        {/* Description */}
        {v.description && (
          <p style={{
            fontSize: '0.85rem', color: 'var(--text-secondary)',
            lineHeight: 1.6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            margin: 0,
          }}>
            {v.description}
          </p>
        )}

        {/* Tags row */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {v.contentType && (
            <span style={{
              padding: '3px 10px', borderRadius: '8px',
              fontSize: '0.72rem', fontWeight: 600,
              background: 'rgba(138,43,226,0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(138,43,226,0.2)',
            }}>
              <ContentTypeIcon type={v.contentType} size={12} /> {v.contentType.charAt(0).toUpperCase() + v.contentType.slice(1)}
            </span>
          )}
          {langs.slice(0, 2).map(lang => (
            <span key={lang} style={{
              padding: '3px 10px', borderRadius: '8px',
              fontSize: '0.72rem', fontWeight: 500,
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {lang}
            </span>
          ))}
          {langs.length > 2 && (
            <span style={{
              padding: '3px 10px', borderRadius: '8px',
              fontSize: '0.72rem', fontWeight: 500,
              color: 'var(--text-muted)',
            }}>
              +{langs.length - 2}
            </span>
          )}
        </div>

        {/* Stats + Social */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: 'auto', paddingTop: '4px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {v.user._count.followers}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> {v.user._count.posts}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {v.twitchUrl && <Twitch size={14} color="#9146FF" title="Twitch" />}
            {v.youtubeUrl && <Youtube size={14} color="#FF0000" title="YouTube" />}
            {v.twitterUrl && <Twitter size={14} color="#1DA1F2" title="Twitter/X" />}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────── Live VTuber Mini Card ─────────── */

function LiveMiniCard({ v }: { v: VTuberProfile }) {
  return (
    <Link
      href={`/profile/${v.userId}`}
      style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
    >
      <div
        className="glass"
        style={{
          padding: '12px 16px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: 240,
          transition: 'all 0.2s ease',
          border: '1px solid rgba(233,30,99,0.15)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#e91e63'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(233,30,99,0.15)'; }}
      >
        <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: v.avatarUrl
              ? `url(${v.avatarUrl}) center/cover`
              : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
          }}>
            {!v.avatarUrl && v.displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{
            position: 'absolute', bottom: '-2px', right: '-2px',
            width: 11, height: 11, borderRadius: '50%',
            background: '#e91e63',
            border: '2px solid var(--background, #0f0f15)',
            boxShadow: '0 0 4px rgba(233,30,99,0.5)',
            zIndex: 2,
          }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {v.displayName}
            {v.isVerified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#8B5CF6" />
                <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e91e63', display: 'inline-block' }} />
            En vivo
            {v.twitchUrl && ' · Twitch'}
            {v.youtubeUrl && !v.twitchUrl && ' · YouTube'}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────── Main Component ─────────── */

function VtubersContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Stats
  const [totalVtubers, setTotalVtubers] = useState(0);
  const [liveCount, setLiveCount] = useState(0);

  // Live VTubers
  const [liveVtubers, setLiveVtubers] = useState<VTuberProfile[]>([]);

  // Featured
  const [featuredVtubers, setFeaturedVtubers] = useState<VTuberProfile[]>([]);

  // Directory
  const [directory, setDirectory] = useState<VTuberProfile[]>([]);
  const [meta, setMeta] = useState<DirectoryMeta | null>(null);
  const [search, setSearch] = useState('');
  const [contentType, setContentType] = useState('');
  const [page, setPage] = useState(1);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Stats & live data — fetch once
  const fetchOverview = useCallback(async () => {
    try {
      const [liveData, featuredData, dirData] = await Promise.all([
        apiFetch('/vtubers/live', {}),
        apiFetch('/vtubers/featured', {}).catch(() => null),
        apiFetch('/vtubers?limit=1&page=1', {}),
      ]);

      setLiveVtubers(liveData || []);
      setLiveCount(liveData?.length || 0);
      setFeaturedVtubers(featuredData || []);
      setTotalVtubers(dirData?.meta?.total || 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Directory fetch with search/page/filters
  const fetchDirectory = useCallback(async (s: string, ct: string, p: number) => {
    setDirectoryLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' });
      if (s) params.set('search', s);
      if (ct) params.set('contentType', ct);
      const data = await apiFetch(`/vtubers?${params}`, {});
      setDirectory(data.data || []);
      setMeta(data.meta || null);
    } catch {
      // Keep existing data on error
    } finally {
      setDirectoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);
  useEffect(() => { fetchDirectory(search, contentType, page); }, [search, contentType, page, fetchDirectory]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, contentType]);

  /* ─── Derived ─── */
  const loggedIn = !!user;

  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        {/* Stats skeleton */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass" style={{ flex: 1, minWidth: 140, padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', margin: '0 auto 10px', animation: 'shimmer 2s infinite' }} />
              <div style={{ width: 50, height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: '6px', margin: '0 auto 6px', animation: 'shimmer 2s infinite' }} />
              <div style={{ width: 80, height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: '6px', margin: '0 auto', animation: 'shimmer 2s infinite' }} />
            </div>
          ))}
        </div>
        {/* Cards skeleton */}
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonVTuberCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}><Sparkles size={48} color="var(--text-muted)" strokeWidth={1.5} /></div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Algo salió mal</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No pudimos cargar los VTubers. Intenta de nuevo.</p>
        <button onClick={() => { setError(false); setLoading(true); fetchOverview(); }} className="btn" style={{ padding: '12px 28px' }}>
          Reintentar
        </button>
      </div>
    );
  }

  const hasLive = liveVtubers.length > 0;
  const hasFeatured = featuredVtubers.length > 0;

  return (
    <>
      {/* ═══════ HERO / STATS ═══════ */}
      <div style={{
        marginBottom: '36px',
        padding: '0 0 32px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '6px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ✦ Directorio de VTubers
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 500 }}>
            Explora, descubre y conecta con los creadores más brillantes del Gremio Estelar
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatCard icon={<Sparkles size={28} color="var(--primary)" />} value={totalVtubers} label="VTubers" />
          <StatCard icon={<span style={{ width: 16, height: 16, borderRadius: '50%', background: '#e91e63', display: 'inline-block' }} />} value={liveCount} label="En vivo ahora" />
          <StatCard icon={<Star size={28} color="#ffd700" fill="#ffd700" />} value={featuredVtubers.length} label="Destacados" />
          {!loggedIn && (
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <div
                className="glass"
                style={{
                  padding: '20px 28px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  flex: 1,
                  minWidth: 180,
                  background: 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(0,212,255,0.1))',
                  border: '1px solid rgba(138,43,226,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)'; }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}><Rocket size={28} color="var(--primary)" /></div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>¡Únete al gremio!</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crea tu perfil VTuber</div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ═══════ LIVE NOW ═══════ */}
      {hasLive && (
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#e91e63', animation: 'vtuber-pulse-dot 1.5s ease infinite',
            }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
              En vivo ahora
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {liveCount} {liveCount === 1 ? 'VTuber' : 'VTubers'} transmitiendo
            </span>
          </div>
          <div style={{
            display: 'flex', gap: '10px',
            overflowX: 'auto', paddingBottom: '8px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
            className="hide-scrollbar"
          >
            {liveVtubers.map(v => (
              <div key={v.id} style={{ scrollSnapAlign: 'start' }}>
                <LiveMiniCard v={v} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ FEATURED ═══════ */}
      {hasFeatured && (
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={22} color="#ffd700" fill="#ffd700" /> VTubers Destacados
          </h2>
          <div style={{
            display: 'grid', gap: '16px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}>
            {featuredVtubers.map(v => <VTuberCard key={v.id} v={v} />)}
          </div>
        </div>
      )}

      {/* ═══════ DIRECTORY ═══════ */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
              {hasFeatured ? 'Explorar más VTubers' : 'Directorio de VTubers'}
            </h2>
            {meta && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {meta.total} {meta.total === 1 ? 'VTuber encontrado' : 'VTubers encontrados'}
              </p>
            )}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="glass" style={{ padding: '16px 20px', borderRadius: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <svg
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="input"
                style={{ paddingLeft: '38px' }}
                placeholder="Buscar VTuber por nombre o descripción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input"
              value={contentType}
              onChange={e => setContentType(e.target.value)}
              style={{ minWidth: 150 }}
            >
              {CONTENT_TYPES.map(ct => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards grid */}
        {directoryLoading ? (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonVTuberCard key={i} />)}
          </div>
        ) : directory.length === 0 ? (
          <div className="glass" style={{ padding: '48px 20px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}><Telescope size={48} color="var(--text-muted)" strokeWidth={1.5} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              {search || contentType ? 'Sin resultados' : 'Aún no hay VTubers'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', maxWidth: 400, margin: '0 auto' }}>
              {search || contentType
                ? 'No encontramos VTubers con esos filtros. Intenta con otros términos.'
                : 'Sé el primero en crear tu perfil VTuber y únete al Gremio Estelar.'
              }
            </p>
            {(search || contentType) && (
              <button
                onClick={() => { setSearch(''); setContentType(''); }}
                className="btn"
                style={{ padding: '10px 24px', fontSize: '0.9rem' }}
              >
                Limpiar filtros
              </button>
            )}
            {!search && !contentType && !loggedIn && (
              <Link href="/register" className="btn" style={{ padding: '10px 24px', fontSize: '0.9rem', display: 'inline-block' }}>
                Crear perfil
              </Link>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {directory.map(v => <VTuberCard key={v.id} v={v} />)}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: '8px', marginTop: '28px', padding: '16px 0',
              }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn"
                  style={{
                    padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px',
                    opacity: page <= 1 ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Anterior
                </button>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 2px' }}>...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          style={{
                            width: 36, height: 36, borderRadius: '10px',
                            border: 'none', cursor: 'pointer',
                            background: p === page ? 'var(--primary)' : 'transparent',
                            color: p === page ? '#fff' : 'var(--text-muted)',
                            fontWeight: p === page ? 700 : 500,
                            fontSize: '0.85rem',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (p !== page) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { if (p !== page) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="btn"
                  style={{
                    padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px',
                    opacity: page >= meta.totalPages ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  Siguiente
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════ STYLES ═══════ */}
      <style>{`
        @keyframes vtuber-pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes vtuber-shimmer {
          0% { opacity: 0.06; }
          50% { opacity: 0.12; }
          100% { opacity: 0.06; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}

/* ─────────── Page Export ─────────── */

export default function VtubersPage() {
  return (
    <div className="container" style={{ paddingBottom: '60px', paddingTop: '24px' }}>
      <ClientOnly fallback={
        <div style={{ padding: '40px 0' }}>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonVTuberCard key={i} />)}
          </div>
        </div>
      }>
        <VtubersContent />
      </ClientOnly>
    </div>
  );
}
