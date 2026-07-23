'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, ArrowRight } from '@/components/ui/Icons';

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
  user: { id: string; username: string; role: string };
}

function getEmbedUrl(url: string): string | null {
  if (!url || !url.trim()) return null;
  const clean = url.trim().replace(/^@/, '');
  const twitchMatch = clean.match(/(?:twitch\.tv\/)?([a-zA-Z0-9_]{2,25})/i);
  if (twitchMatch && (clean.includes('twitch') || !clean.includes('http'))) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const parentParams = `parent=${encodeURIComponent(host)}&parent=localhost&parent=127.0.0.1`;
    return `https://player.twitch.tv/?channel=${twitchMatch[1].toLowerCase()}&${parentParams}&autoplay=true&muted=true`;
  }
  const ytChannelMatch = url.match(/(?:youtube\.com\/@)([a-zA-Z0-9_]+)/);
  if (ytChannelMatch) return `https://www.youtube.com/embed/live_stream?channel=${ytChannelMatch[1]}&autoplay=1&muted=1`;
  const ytVideoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytVideoMatch) return `https://www.youtube.com/embed/${ytVideoMatch[1]}?autoplay=1&muted=1`;
  return null;
}

export default function LiveNowSection() {
  const [liveVtubers, setLiveVtubers] = useState<LiveVTuber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<'prev' | 'next' | null>(null);

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
        setLiveVtubers(data);
      } catch { /* ignore */ }
    }, 60000);
    return () => clearInterval(interval);
  }, [visible]);

  const goNext = useCallback(() => setActiveIndex((p) => (p < liveVtubers.length - 1 ? p + 1 : 0)), [liveVtubers.length]);
  const goPrev = useCallback(() => setActiveIndex((p) => (p > 0 ? p - 1 : liveVtubers.length - 1)), [liveVtubers.length]);

  useEffect(() => {
    if (!visible) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') goPrev(); if (e.key === 'ArrowRight') goNext(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [visible, goPrev, goNext]);

  if (loading) return (
    <section className="section" ref={sectionRef}>
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ width: 22, height: 22, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      </div>
    </section>
  );
  if (liveVtubers.length === 0) return null;

  const activeLive = liveVtubers[activeIndex];

  return (
    <section ref={sectionRef} className="section" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container">
        <div style={{
          textAlign: 'center', marginBottom: '28px',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 16px', borderRadius: '20px',
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
            fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)',
            marginBottom: '12px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            EN VIVO
          </div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Transmitiendo Ahora
          </h2>
          <p className="section-subtitle" style={{ marginTop: '8px', marginBottom: 0 }}>
            {liveVtubers.length === 1 ? '1 VTuber está transmitiendo' : `${liveVtubers.length} VTubers están transmitiendo`}
          </p>
        </div>

        {/* Carousel */}
        <div style={{
          maxWidth: '620px', margin: '0 auto', position: 'relative',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s',
        }}>
          {/* Navigation */}
          {liveVtubers.length > 1 && (
            <>
              {['prev', 'next'].map((dir) => (
                <button
                  key={dir}
                  onClick={dir === 'prev' ? goPrev : goNext}
                  onMouseEnter={() => setHoveredNav(dir as 'prev' | 'next')}
                  onMouseLeave={() => setHoveredNav(null)}
                  style={{
                    position: 'absolute', top: '50%',
                    [dir === 'prev' ? 'left' : 'right']: '-16px',
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: hoveredNav === dir ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                    border: hoveredNav === dir ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--glass-border)',
                    color: hoveredNav === dir ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    transform: `translateY(-50%) scale(${hoveredNav === dir ? 1.1 : 1})`,
                  }}
                  aria-label={dir === 'prev' ? 'Anterior' : 'Siguiente'}
                >{dir === 'prev' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}</button>
              ))}
            </>
          )}

          {/* Active stream card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            {/* Embed area */}
            <div style={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%',
              background: '#000',
            }}>
              {activeLive.twitchUrl || activeLive.youtubeUrl ? (
                <iframe
                  src={getEmbedUrl(activeLive.twitchUrl || activeLive.youtubeUrl || '') || undefined}
                  title={activeLive.displayName}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%', border: 'none',
                  }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: '12px',
                  background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'rgba(139,92,246,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: 'var(--primary)',
                      boxShadow: '0 0 20px rgba(139,92,246,0.3)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Transmitiendo en otra plataforma
                  </span>
                </div>
              )}

              {/* LIVE badge */}
              <div style={{
                position: 'absolute', top: '10px', left: '10px',
                padding: '4px 10px', borderRadius: '6px',
                background: 'var(--primary)',
                fontSize: '0.68rem', fontWeight: 700, color: 'white',
                letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: '0 2px 10px rgba(139,92,246,0.3)',
              }}>
                <span style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: '#fff',
                  animation: 'pulse 1s ease-in-out infinite',
                }} />
                LIVE
              </div>
            </div>

            {/* Info footer */}
            <div style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '10px',
            }}>
              <Link
                href={`/profile/${activeLive.userId}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  textDecoration: 'none', color: 'var(--text)', minWidth: 0, flex: 1,
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: activeLive.avatarUrl
                    ? `url(${activeLive.avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '0.8rem',
                  overflow: 'hidden',
                }}>
                  {!activeLive.avatarUrl && activeLive.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeLive.displayName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                    EN VIVO
                  </div>
                </div>
              </Link>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {activeLive.twitchUrl && (
                  <a href={activeLive.twitchUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '0.75rem',
                      fontWeight: 600, background: 'var(--primary)', color: 'white',
                      textDecoration: 'none', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                    Ver Stream
                  </a>
                )}
                {!activeLive.twitchUrl && activeLive.youtubeUrl && (
                  <a href={activeLive.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '0.75rem',
                      fontWeight: 600, background: 'var(--primary)', color: 'white',
                      textDecoration: 'none', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-hover)'; }}>
                    Ver Stream
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Dots navigation */}
          {liveVtubers.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
              {liveVtubers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    width: idx === activeIndex ? '24px' : '5px',
                    height: '5px', borderRadius: '3px', border: 'none', padding: 0,
                    background: idx === activeIndex ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  aria-label={`Stream ${idx + 1}`}
                />
              ))}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px', fontVariantNumeric: 'tabular-nums' }}>
                {activeIndex + 1}/{liveVtubers.length}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '24px', opacity: visible ? 1 : 0, transition: 'all 0.5s ease 0.5s' }}>
          <Link href="/vtubers" className="btn btn--outline btn--sm">
            Explorar todos los VTubers
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </section>
  );
}
