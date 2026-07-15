'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

interface LiveVTuber {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  isLive: boolean;
  isVerified: boolean;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  kickUrl: string | null;
  tiktokUrl: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  user: { id: string; username: string; role: string };
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const twitchMatch = url.match(/(?:twitch\.tv\/)([a-zA-Z0-9_]+)/);
  if (twitchMatch) return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=true&muted=true`;
  const ytChannelMatch = url.match(/(?:youtube\.com\/@)([a-zA-Z0-9_]+)/);
  if (ytChannelMatch) return `https://www.youtube.com/embed/live_stream?channel=${ytChannelMatch[1]}&autoplay=1&muted=1`;
  const ytVideoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytVideoMatch) return `https://www.youtube.com/embed/${ytVideoMatch[1]}?autoplay=1&muted=1`;
  return null;
}

// ─── Floating particles for background decoration ───
const PARTICLE_DATA = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 8,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 4,
  duration: 3 + Math.random() * 4,
  opacity: 0.1 + Math.random() * 0.2,
}));

function FloatingParticles() {
  return (
    <>
      {PARTICLE_DATA.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(255,68,68,${p.opacity})`,
            pointerEvents: 'none',
            zIndex: 0,
            animation: `liveParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </>
  );
}

// ─── Stream Card ───
interface StreamCardProps {
  vtuber: LiveVTuber;
  isActive: boolean;
  relativeIndex: number;
  onClick: () => void;
  watchSeconds: number;
  formatTime: (s: number) => string;
}

function StreamCard({ vtuber, isActive, relativeIndex, onClick, watchSeconds, formatTime }: StreamCardProps) {
  const embedUrl = getEmbedUrl(vtuber.twitchUrl || vtuber.youtubeUrl || '');
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef({ x: 0, y: 0 });
  const isTilting = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Dynamic card style based on position
  const getBaseTransform = (): string => {
    if (isActive) return '';
    const dir = relativeIndex > 0 ? 1 : -1;
    const xOffset = dir * (60 + Math.abs(relativeIndex) * 20);
    const scale = Math.max(0.6, 0.92 - Math.abs(relativeIndex) * 0.06);
    const yOffset = Math.abs(relativeIndex) * 15;
    return `translateX(${xOffset}px) translateY(${yOffset}px) scale(${scale}) rotateY(${dir * 15}deg)`;
  };

  // 3D tilt effect - only for active card
  const handleTilt = useCallback((clientX: number, clientY: number) => {
    if (!cardRef.current || !isActive) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (clientX - centerX) / (rect.width / 2);
    const deltaY = (clientY - centerY) / (rect.height / 2);

    // Max tilt: 8 degrees
    const rotateX = -deltaY * 8;
    const rotateY = deltaX * 8;

    tiltRef.current = { x: rotateX, y: rotateY };
    isTilting.current = true;

    // Fast transition for responsive tilt
    if (cardRef.current) cardRef.current.style.transition = 'transform 0.08s linear';
    if (shineRef.current) shineRef.current.style.transition = 'opacity 0.08s linear';

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        const base = getBaseTransform();
        cardRef.current.style.transform = `${base} rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
      if (shineRef.current && isActive) {
        const intensity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        shineRef.current.style.opacity = String(Math.min(0.4, intensity * 0.3));
        shineRef.current.style.background = `radial-gradient(circle at ${50 + deltaX * 30}% ${50 + deltaY * 30}%, rgba(255,255,255,0.12), transparent 60%)`;
      }
      rafRef.current = null;
    });
  }, [isActive]);

  const resetTilt = useCallback(() => {
    isTilting.current = false;
    tiltRef.current = { x: 0, y: 0 };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        const base = getBaseTransform();
        cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        cardRef.current.style.transform = base;
        setTimeout(() => {
          if (cardRef.current) cardRef.current.style.transition = '';
        }, 500);
      }
      if (shineRef.current) {
        shineRef.current.style.transition = 'opacity 0.5s ease';
        shineRef.current.style.opacity = '0';
        setTimeout(() => {
          if (shineRef.current) shineRef.current.style.transition = '';
        }, 500);
      }
      rafRef.current = null;
    });
  }, []);

  const baseTransform = getBaseTransform();

  return (
    <div
      onClick={isActive ? undefined : onClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        perspective: '1200px',
        pointerEvents: isActive ? 'auto' : 'auto',
      }}
    >
      <div
        ref={cardRef}
        className="glass"
        style={{
          height: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: baseTransform,
          opacity: isActive ? 1 : Math.max(0.15, 0.5 - Math.abs(relativeIndex) * 0.15),
          transition: isActive && !isTilting.current ? 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
          border: isActive ? '1px solid rgba(255,68,68,0.3)' : '1px solid var(--glass-border)',
          boxShadow: isActive
            ? '0 8px 40px rgba(255,68,68,0.2), 0 0 80px rgba(255,68,68,0.06), inset 0 0 60px rgba(255,68,68,0.03)'
            : '0 4px 20px rgba(0,0,0,0.2)',
          cursor: isActive ? 'default' : 'pointer',
          filter: isActive ? 'brightness(1)' : 'brightness(0.6) saturate(0.6)',
          position: 'relative',
          transformStyle: 'preserve-3d',
          willChange: isActive ? 'transform' : undefined,
        }}
        onMouseMove={(e) => { if (isActive) handleTilt(e.clientX, e.clientY); }}
        onMouseLeave={() => { if (isActive) resetTilt(); }}
        onMouseEnter={(e) => {
          if (!isActive) {
            cardRef.current!.style.transform = getBaseTransform().replace(/scale\([^)]+\)/, 'scale(1.02)');
            cardRef.current!.style.boxShadow = '0 8px 30px rgba(138,43,226,0.2)';
          }
        }}
      >
        {/* Shine overlay for 3D effect */}
        {isActive && (
          <div
            ref={shineRef}
            style={{
              position: 'absolute', inset: 0, zIndex: 5,
              pointerEvents: 'none',
              opacity: 0,
              transition: 'opacity 0.15s ease',
              borderRadius: '20px',
            }}
          />
        )}


        {/* Embed / thumbnail area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%',
            background: embedUrl && isActive ? '#000' : 'linear-gradient(135deg, #1a1040, #302b63)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Animated background for non-active / no-embed */}
          {(!embedUrl || !isActive) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: vtuber.bannerUrl
                  ? `url(${vtuber.bannerUrl}) center/cover`
                  : undefined,
              }}
            >
              {vtuber.bannerUrl && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))',
                }} />
              )}
            </div>
          )}

          {/* Iframe embed (active only) */}
          {embedUrl && isActive ? (
            <iframe
              src={embedUrl}
              title={`${vtuber.displayName}`}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%', border: 'none',
              }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            /* Fallback content for non-active cards */
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '10px',
            }}>
              {/* Animated pulsing circle */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(255,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isActive ? 'none' : 'livePulse 2s ease-in-out infinite',
                position: 'relative', zIndex: 1,
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#ff4444',
                  boxShadow: '0 0 30px rgba(255,68,68,0.4)',
                  animation: 'livePulse 1.5s ease-in-out infinite',
                }} />
              </div>
              {isActive && (
                <span style={{
                  color: '#ff4444', fontWeight: 700, fontSize: '1.1rem',
                  position: 'relative', zIndex: 1,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#ff4444',
                    animation: 'livePulse 1.5s ease-in-out infinite',
                  }} />
                  EN VIVO
                </span>
              )}
            </div>
          )}

          {/* ─── Animated LIVE badge ─── */}
          <div style={{
            position: 'absolute', top: '12px', left: '12px',
            padding: '5px 12px', borderRadius: '8px',
            background: isActive
              ? 'linear-gradient(135deg, #ff4444, #ff0044)'
              : 'rgba(255,68,68,0.8)',
            fontSize: '0.72rem', fontWeight: 800, color: 'white',
            letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: isActive ? '0 0 20px rgba(255,68,68,0.4)' : 'none',
            animation: isActive ? 'livePulse 2s ease-in-out infinite' : 'none',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: '#fff',
              animation: 'livePulse 1s ease-in-out infinite',
            }} />
            LIVE
          </div>


        </div>

        {/* ─── Info footer ─── */}
        <div style={{
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', flexShrink: 0,
          background: isActive ? 'rgba(255,255,255,0.02)' : 'transparent',
        }}>
          <Link
            href={`/profile/${vtuber.userId}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              textDecoration: 'none', color: 'var(--text)', minWidth: 0, flex: 1,
            }}
          >
            {/* Avatar with ring */}
            <div style={{
              position: 'relative', width: '42px', height: '42px', flexShrink: 0,
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: vtuber.avatarUrl
                  ? `url(${vtuber.avatarUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
                overflow: 'hidden',
              }}>
                {!vtuber.avatarUrl && vtuber.displayName.charAt(0).toUpperCase()}
              </div>
              {isActive && (
                <div style={{
                  position: 'absolute', inset: -3, borderRadius: '50%',
                  border: '2px solid rgba(255,68,68,0.4)',
                  animation: 'livePulse 2s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: '4px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {vtuber.displayName}
                {vtuber.isVerified && (
                  <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                    <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.72rem', color: '#ff4444', fontWeight: 700,
              }}>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#ff4444',
                  animation: 'livePulse 1.5s ease-in-out infinite',
                }} />
                EN VIVO
              </div>
            </div>
          </Link>

          {/* Action buttons */}
          {isActive && (
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {/* Watch button (Twitch or YouTube) */}
              {vtuber.twitchUrl && (
                <a
                  href={vtuber.twitchUrl}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: '9px 16px', borderRadius: '10px', fontSize: '0.78rem',
                    fontWeight: 700, background: 'linear-gradient(135deg, #9146FF, #7c3aed)',
                    color: 'white', whiteSpace: 'nowrap', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(145,66,255,0.3)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(145,66,255,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(145,66,255,0.3)'; }}
                >
                  ▶ Twitch
                </a>
              )}
              {!vtuber.twitchUrl && vtuber.youtubeUrl && (
                <a
                  href={vtuber.youtubeUrl}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: '9px 16px', borderRadius: '10px', fontSize: '0.78rem',
                    fontWeight: 700, background: 'linear-gradient(135deg, #FF0000, #cc0000)',
                    color: 'white', whiteSpace: 'nowrap', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(255,0,0,0.3)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  ▶ YouTube
                </a>
              )}
              {/* Profile button - always visible */}
              <Link
                href={`/profile/${vtuber.userId}`}
                style={{
                  padding: '9px 14px', borderRadius: '10px', fontSize: '0.78rem',
                  fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
                  border: '1px solid var(--glass-border)', color: 'var(--text)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px',
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                Perfil →
              </Link>
            </div>
          )}
        </div>

        {/* XP progress bar (only on active when user logged in) */}
        {isActive && watchSeconds > 0 && (
          <div style={{
            height: '3px', background: 'rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${((watchSeconds % 600) / 600) * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), #ff4444)',
              borderRadius: '0 3px 3px 0',
              transition: 'width 1s linear',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───
export default function LiveNowSection() {
  const [liveVtubers, setLiveVtubers] = useState<LiveVTuber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [xpEarnedThisSession, setXpEarnedThisSession] = useState(0);
  const [hoveredNav, setHoveredNav] = useState<'prev' | 'next' | null>(null);

  const watchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/vtubers/live', {});
        setLiveVtubers(data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch('/vtubers/live', {});
        setLiveVtubers((prev) => {
          if (data.length === 0) setActiveIndex(0);
          else {
            const cur = prev[activeIndex];
            if (cur && !data.find((v: LiveVTuber) => v.id === cur.id)) setActiveIndex(0);
          }
          return data;
        });
      } catch { /* ignore */ }
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ─── Persist watch timer across page refreshes ───
  const STORAGE_KEY = 'gremio_watch_timer';

  // Load persisted data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && typeof data.seconds === 'number' && typeof data.xp === 'number') {
          // Calculate time passed since last visit (capped at 10 min to prevent abuse)
          const elapsedSinceSave = Math.min(
            Math.floor((Date.now() - (data.timestamp || Date.now())) / 1000),
            600
          );
          setWatchSeconds(data.seconds + elapsedSinceSave);
          setXpEarnedThisSession(data.xp);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Persist to localStorage whenever values change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        seconds: watchSeconds,
        xp: xpEarnedThisSession,
        timestamp: Date.now(),
      }));
    } catch { /* ignore */ }
  }, [watchSeconds, xpEarnedThisSession]);

  // Watch timer
  useEffect(() => {
    if (!visible || !user) {
      if (watchIntervalRef.current) { clearInterval(watchIntervalRef.current); watchIntervalRef.current = null; }
      return;
    }
    watchIntervalRef.current = setInterval(() => {
      setWatchSeconds((prev) => {
        const ns = prev + 1;
        if (ns > 0 && ns % 600 === 0) claimStreamXp(ns);
        return ns;
      });
    }, 1000);
    return () => { if (watchIntervalRef.current) { clearInterval(watchIntervalRef.current); watchIntervalRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user]);

  const claimStreamXp = async (elapsed: number) => {
    const mins = Math.floor(elapsed / 60);
    try {
      const res = await apiFetch('/gamification/stream-xp', { method: 'POST', body: JSON.stringify({ minutes: mins }) });
      if (res.xpAwarded) {
        setXpEarnedThisSession((p) => p + res.xpAwarded);
        showToast(`+${res.xpAwarded} XP por ver ${activeLive?.displayName || 'stream'} ${mins} min!`, 'success');
      }
    } catch { /* silent */ }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const goNext = useCallback(() => setActiveIndex((p) => (p < liveVtubers.length - 1 ? p + 1 : 0)), [liveVtubers.length]);
  const goPrev = useCallback(() => setActiveIndex((p) => (p > 0 ? p - 1 : liveVtubers.length - 1)), [liveVtubers.length]);

  useEffect(() => {
    if (!visible) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') goPrev(); if (e.key === 'ArrowRight') goNext(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [visible, goPrev, goNext]);

  const ds = useRef(0);
  const dragH = (e: React.MouseEvent) => { if (!isDragging) return; const d = e.clientX - dragStartX; if (Math.abs(d) > 80) { d > 0 ? goPrev() : goNext(); setIsDragging(false); } };

  if (loading) return (
    <section className="section" ref={sectionRef}>
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      </div>
    </section>
  );
  if (liveVtubers.length === 0) return null;

  const activeLive = liveVtubers[activeIndex];

  return (
    <section ref={sectionRef} className="section" style={{ position: 'relative', zIndex: 1, overflow: 'visible', background: 'transparent' }}>
      {/* Large ambient glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '60vw', height: '40vw', maxWidth: '700px', maxHeight: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,68,68,0.05) 0%, rgba(138,43,226,0.03) 40%, transparent 70%)',
        pointerEvents: 'none', zIndex: -1,
      }} />

      <div className="container">
        {/* Header */}
        <div style={{
          textAlign: 'center', marginBottom: '32px',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ff4444', animation: 'livePulse 1.5s ease-in-out infinite' }} />
            <h2 className="section-title" style={{ marginBottom: 0, background: 'linear-gradient(135deg, #fff, #ff6666)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              En Vivo Ahora
            </h2>
          </div>
          <p className="section-subtitle" style={{ transitionDelay: '0.1s', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
            {liveVtubers.length === 1 ? '1 VTuber está transmitiendo' : `${liveVtubers.length} VTubers están transmitiendo`}
          </p>
          <div style={{ transitionDelay: '0.15s', opacity: visible ? 1 : 0, transition: 'all 0.6s ease', marginTop: '12px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 18px', borderRadius: '20px',
              background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.25)',
              fontSize: '0.85rem', fontWeight: 600, color: '#ff4444',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff4444', animation: 'livePulse 1.5s ease-in-out infinite' }} />
              {liveVtubers.length} {liveVtubers.length === 1 ? 'stream' : 'streams'} activos
            </span>
          </div>
        </div>

        {/* ─── CAROUSEL ─── */}
        <div style={{
          maxWidth: '700px', margin: '0 auto', position: 'relative',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s',
        }}>
          <div style={{ position: 'relative', padding: '45px 20px' }}>
            {/* Floating particles */}
            <FloatingParticles />

            {/* Navigation arrows */}
            {liveVtubers.length > 1 && (
              <>
                {['prev', 'next'].map((dir) => (
                  <button
                    key={dir}
                    onClick={dir === 'prev' ? goPrev : goNext}
                    onMouseEnter={() => setHoveredNav(dir as 'prev' | 'next')}
                    onMouseLeave={() => setHoveredNav(null)}
                    style={{
                      position: 'absolute', top: '45%',
                      [dir === 'prev' ? 'left' : 'right']: '-20px',
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: hoveredNav === dir ? 'rgba(138,43,226,0.25)' : 'rgba(255,255,255,0.06)',
                      border: hoveredNav === dir ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                      color: hoveredNav === dir ? 'var(--primary)' : 'var(--text)',
                      cursor: 'pointer', fontSize: '1.3rem', fontWeight: 700, zIndex: 25,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(12px)',
                      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                      boxShadow: hoveredNav === dir ? '0 0 30px rgba(138,43,226,0.2)' : 'none',
                      transform: `translateY(-50%) scale(${hoveredNav === dir ? 1.15 : 1})`,
                    }}
                    aria-label={dir === 'prev' ? 'Anterior' : 'Siguiente'}
                  >{dir === 'prev' ? '←' : '→'}</button>
                ))}
              </>
            )}

            {/* Cards container */}
            <div
              style={{
                position: 'relative', minHeight: '400px', maxWidth: '580px', margin: '0 auto',
                cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none',
                transformStyle: 'preserve-3d',
              }}
              onMouseDown={(e) => { setIsDragging(true); setDragStartX(e.clientX); }}
              onMouseMove={dragH}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => { ds.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - ds.current; if (Math.abs(d) > 50) d > 0 ? goPrev() : goNext(); }}
            >
              {liveVtubers.map((v, idx) => {
                let ri = idx - activeIndex;
                if (Math.abs(ri) > liveVtubers.length / 2) ri = ri > 0 ? ri - liveVtubers.length : ri + liveVtubers.length;
                if (Math.abs(ri) > 2) return null;
                return (
                  <StreamCard
                    key={v.id}
                    vtuber={v}
                    isActive={idx === activeIndex}
                    relativeIndex={ri}
                    onClick={() => setActiveIndex(idx)}
                    watchSeconds={watchSeconds}
                    formatTime={formatTime}
                  />
                );
              })}
            </div>
          </div>

          {/* ─── Dots + Counter + Timer Bar ─── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
            {/* Dots */}
            {liveVtubers.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {liveVtubers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    style={{
                      width: idx === activeIndex ? '28px' : '6px',
                      height: '6px', borderRadius: '3px', border: 'none', padding: 0,
                      background: idx === activeIndex ? 'linear-gradient(90deg, #ff4444, #ff8800)' : 'rgba(255,255,255,0.12)',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                      boxShadow: idx === activeIndex ? '0 0 12px rgba(255,68,68,0.3)' : 'none',
                    }}
                    aria-label={`Stream ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Counter */}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', minWidth: '45px', textAlign: 'center' }}>
              {activeIndex + 1}/{liveVtubers.length}
            </span>
          </div>

          {/* Watch timer bar */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '14px', marginTop: '16px', flexWrap: 'wrap',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 18px', borderRadius: '20px',
                background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.15)',
                fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}>
                <span style={{ fontSize: '0.9rem' }}>⏱️</span>
                <span style={{ minWidth: '45px' }}>{formatTime(watchSeconds)}</span>
                {/* Tiny progress ring */}
                <svg width="16" height="16" viewBox="0 0 16 16" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(138,43,226,0.1)" strokeWidth="2" />
                  <circle cx="8" cy="8" r="6" fill="none" stroke="var(--primary)" strokeWidth="2"
                    strokeDasharray={`${((watchSeconds % 600) / 600) * 37.68} 37.68`}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s linear' }} />
                </svg>
              </div>

              {xpEarnedThisSession > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 16px', borderRadius: '20px',
                  background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)',
                  fontSize: '0.82rem', color: '#00e676', fontWeight: 700,
                  animation: 'fadeInUp 0.4s ease',
                }}>
                  <span>✦</span>
                  +{xpEarnedThisSession} XP
                </div>
              )}

              <span style={{
                fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.6,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span>🎯</span>
                +5 XP cada 10 min
              </span>
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        <div style={{
          textAlign: 'center', marginTop: '18px',
          fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.35,
          transition: 'opacity 0.3s',
        }}>
          ←  ←  Desliza o flechas del teclado  →  →
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '28px', opacity: visible ? 1 : 0, transition: 'all 0.6s ease 0.6s' }}>
          <Link href="/vtubers" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: '1rem', borderRadius: '14px', borderWidth: '2px' }}>
            Explorar todos los VTubers
          </Link>
        </div>
      </div>

      {/* ─── CSS Animations ─── */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes liveParticle {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translate(30px, -30px) scale(0.5); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
