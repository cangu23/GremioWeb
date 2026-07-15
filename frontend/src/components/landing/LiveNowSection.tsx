'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';

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
  user: {
    id: string;
    username: string;
    role: string;
  };
}

function getEmbedUrl(url: string): { type: 'twitch' | 'youtube' | 'kick' | null; channel: string | null; embedUrl: string | null } {
  if (!url) return { type: null, channel: null, embedUrl: null };

  // Twitch: https://twitch.tv/channelname
  const twitchMatch = url.match(/(?:twitch\.tv\/)([a-zA-Z0-9_]+)/);
  if (twitchMatch) {
    return {
      type: 'twitch',
      channel: twitchMatch[1],
      embedUrl: `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=true&muted=true`,
    };
  }

  // YouTube: https://youtube.com/watch?v=ID or https://youtube.com/@channel/live
  const ytChannelMatch = url.match(/(?:youtube\.com\/@)([a-zA-Z0-9_]+)/);
  if (ytChannelMatch) {
    return {
      type: 'youtube',
      channel: ytChannelMatch[1],
      embedUrl: `https://www.youtube.com/embed/live_stream?channel=${ytChannelMatch[1]}&autoplay=1&muted=1`,
    };
  }

  // YouTube video ID
  const ytVideoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytVideoMatch) {
    return {
      type: 'youtube',
      channel: ytVideoMatch[1],
      embedUrl: `https://www.youtube.com/embed/${ytVideoMatch[1]}?autoplay=1&muted=1`,
    };
  }

  return { type: null, channel: null, embedUrl: null };
}

export default function LiveNowSection() {
  const [liveVtubers, setLiveVtubers] = useState<LiveVTuber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLive, setSelectedLive] = useState<LiveVTuber | null>(null);
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchLiveVtubers = async () => {
      try {
        const data = await apiFetch('/vtubers/live', {});
        setLiveVtubers(data);
        if (data.length > 0) {
          setSelectedLive(data[0]);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchLiveVtubers();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch('/vtubers/live', {});
        setLiveVtubers(data);
        if (data.length > 0 && !selectedLive) {
          setSelectedLive(data[0]);
        } else if (data.length === 0) {
          setSelectedLive(null);
        } else if (selectedLive && !data.find((v: LiveVTuber) => v.id === selectedLive.id)) {
          setSelectedLive(data[0]);
        }
      } catch {
        // ignore
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [visible, selectedLive]);

  if (loading) {
    return (
      <section className="section" ref={sectionRef}>
        <div className="container">
          <h2 className="section-title">En Vivo Ahora</h2>
          <p className="section-subtitle">Descubre qué VTubers están transmitiendo en este momento</p>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <span style={{
              width: '24px', height: '24px',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        </div>
      </section>
    );
  }

  // Don't render the section at all if nobody is live
  if (liveVtubers.length === 0) return null;

  const activeLive = selectedLive || liveVtubers[0];
  const embed = getEmbedUrl(activeLive.twitchUrl || activeLive.youtubeUrl || '');

  return (
    <section
      ref={sectionRef}
      className="section"
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,68,68,0.02) 50%, transparent 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background */}
      <div style={{
        position: 'absolute', top: '10%', right: '5%',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,68,68,0.05), transparent 70%)',
        pointerEvents: 'none', zIndex: -1,
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '5%',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(138,43,226,0.04), transparent 70%)',
        pointerEvents: 'none', zIndex: -1,
      }} />

      <div className="container">
        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', marginBottom: '8px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#ff4444',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            En Vivo Ahora
          </h2>
        </div>
        <p className="section-subtitle" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          {liveVtubers.length === 1
            ? `1 VTuber está transmitiendo en este momento`
            : `${liveVtubers.length} VTubers están transmitiendo en este momento`}
        </p>

        {/* Live count badge */}
        <div style={{
          textAlign: 'center', marginBottom: '32px',
          opacity: visible ? 1 : 0,
          transition: 'all 0.6s ease 0.15s',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 18px', borderRadius: '20px',
            background: 'rgba(255,68,68,0.1)',
            border: '1px solid rgba(255,68,68,0.25)',
            fontSize: '0.85rem', fontWeight: 600, color: '#ff4444',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#ff4444',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            {liveVtubers.length} {liveVtubers.length === 1 ? 'stream' : 'streams'} activos
          </span>
        </div>

        {/* Live streamer selector */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '32px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
        }}>
          {(showAll ? liveVtubers : liveVtubers.slice(0, 4)).map((vtuber) => (
            <button
              key={vtuber.id}
              onClick={() => setSelectedLive(vtuber)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px 10px 12px',
                borderRadius: '50px',
                border: selectedLive?.id === vtuber.id
                  ? '2px solid #ff4444'
                  : '1px solid var(--glass-border)',
                background: selectedLive?.id === vtuber.id
                  ? 'rgba(255,68,68,0.1)'
                  : 'var(--card-bg)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(12px)',
                boxShadow: selectedLive?.id === vtuber.id
                  ? '0 0 20px rgba(255,68,68,0.15)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedLive?.id !== vtuber.id) {
                  e.currentTarget.style.background = 'rgba(255,68,68,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,68,68,0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLive?.id !== vtuber.id) {
                  e.currentTarget.style.background = 'var(--card-bg)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }
              }}
            >
              {/* Avatar */}  
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: vtuber.avatarUrl
                  ? `url(${vtuber.avatarUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: '0.85rem',
                overflow: 'hidden', flexShrink: 0,
                position: 'relative',
              }}>
                {!vtuber.avatarUrl && vtuber.displayName.charAt(0).toUpperCase()}
                {/* Live dot on avatar */}
                <span style={{
                  position: 'absolute', bottom: '-1px', right: '-1px',
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: '#ff4444',
                  border: '2px solid var(--card-bg)',
                }} />
              </div>
              <span>{vtuber.displayName}</span>
              {vtuber.isVerified && (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Verificado">
                  <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                  <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
          {liveVtubers.length > 4 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                padding: '10px 20px', borderRadius: '50px',
                border: '1px dashed var(--glass-border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              +{liveVtubers.length - 4} más
            </button>
          )}
        </div>

        {/* Stream embed area */}
        {activeLive && (
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
          }}>
            <div className="glass" style={{
              borderRadius: '20px',
              overflow: 'hidden',
              maxWidth: '900px',
              margin: '0 auto',
            }}>
              {/* Embed iframe */}
              {embed.embedUrl ? (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '56.25%', /* 16:9 aspect ratio */
                  background: '#000',
                }}>
                  <iframe
                    src={embed.embedUrl}
                    title={`${activeLive.displayName} en vivo`}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%', height: '100%',
                      border: 'none',
                    }}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                  {/* Mute indicator overlay */}
                  <div style={{
                    position: 'absolute', bottom: '12px', left: '12px',
                    padding: '4px 10px', borderRadius: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)',
                    pointerEvents: 'none',
                  }}>
                    🔇 Audio silenciado
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '56.25%',
                  background: 'linear-gradient(135deg, #1a1040, #302b63)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '3rem', marginBottom: '8px', display: 'block' }}>🔴</span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                      {activeLive.displayName} está en vivo
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Haz clic en el enlace para ver el stream
                    </p>
                  </div>
                </div>
              )}

              {/* Stream info footer */}
              <div style={{
                padding: '20px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '12px',
              }}>
                {/* Streamer info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link
                    href={`/profile/${activeLive.userId}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--text)' }}
                  >
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: activeLive.avatarUrl
                        ? `url(${activeLive.avatarUrl}) center/cover`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {!activeLive.avatarUrl && activeLive.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 700, fontSize: '1.05rem',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        {activeLive.displayName}
                        {activeLive.isVerified && (
                          <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Verificado">
                            <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                            <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.8rem', color: '#ff4444', fontWeight: 600,
                      }}>
                        <span style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: '#ff4444',
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                        EN VIVO
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeLive.twitchUrl && (
                    <a
                      href={activeLive.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        padding: '10px 20px', borderRadius: '12px',
                        fontSize: '0.9rem', fontWeight: 700,
                        background: '#9146FF',
                        color: 'white',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>▶</span>
                      Ver en Twitch
                    </a>
                  )}
                  {activeLive.youtubeUrl && !activeLive.twitchUrl && (
                    <a
                      href={activeLive.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        padding: '10px 20px', borderRadius: '12px',
                        fontSize: '0.9rem', fontWeight: 700,
                        background: '#FF0000',
                        color: 'white',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>▶</span>
                      Ver en YouTube
                    </a>
                  )}
                  <Link
                    href={`/profile/${activeLive.userId}`}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 18px', borderRadius: '12px',
                      fontSize: '0.9rem', whiteSpace: 'nowrap',
                    }}
                  >
                    Perfil →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View all CTA */}
        <div style={{
          textAlign: 'center', marginTop: '40px',
          opacity: visible ? 1 : 0,
          transition: 'all 0.6s ease 0.6s',
        }}>
          <Link
            href="/vtubers"
            className="btn btn-outline"
            style={{
              padding: '14px 32px', fontSize: '1rem', borderRadius: '14px',
              borderWidth: '2px',
            }}
          >
            Explorar todos los VTubers
          </Link>
        </div>
      </div>
    </section>
  );
}
