'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  user: {
    id: string;
    username: string;
    role: string;
  };
}

function getEmbedUrl(url: string): { type: 'twitch' | 'youtube' | 'kick' | null; channel: string | null; embedUrl: string | null } {
  if (!url) return { type: null, channel: null, embedUrl: null };

  const twitchMatch = url.match(/(?:twitch\.tv\/)([a-zA-Z0-9_]+)/);
  if (twitchMatch) {
    return {
      type: 'twitch',
      channel: twitchMatch[1],
      embedUrl: `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=true&muted=true`,
    };
  }

  const ytChannelMatch = url.match(/(?:youtube\.com\/@)([a-zA-Z0-9_]+)/);
  if (ytChannelMatch) {
    return {
      type: 'youtube',
      channel: ytChannelMatch[1],
      embedUrl: `https://www.youtube.com/embed/live_stream?channel=${ytChannelMatch[1]}&autoplay=1&muted=1`,
    };
  }

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

interface StreamCardProps {
  vtuber: LiveVTuber;
  isActive: boolean;
  index: number;
  total: number;
  onClick: () => void;
}

function StreamCard({ vtuber, isActive, index, total, onClick }: StreamCardProps) {
  const embed = getEmbedUrl(vtuber.twitchUrl || vtuber.youtubeUrl || '');
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate offset for non-active cards
  const getCardStyle = (): React.CSSProperties => {
    if (isActive) {
      return {
        zIndex: 10,
        transform: 'translateX(0) scale(1)',
        opacity: 1,
        pointerEvents: 'auto' as const,
        cursor: 'default',
      };
    }

    // Cards to the left slide out to the left
    // Cards to the right slide out to the right
    const direction = index > 0 ? 1 : -1;
    return {
      zIndex: 5 - Math.abs(index),
      transform: `translateX(${direction * 60}px) scale(0.85)`,
      opacity: 0.4,
      pointerEvents: 'auto' as const,
      cursor: 'pointer',
    };
  };

  return (
    <div
      ref={cardRef}
      onClick={isActive ? undefined : onClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        ...getCardStyle(),
      }}
    >
      <div className="glass" style={{
        borderRadius: '20px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isActive ? '1px solid rgba(255,68,68,0.3)' : '1px solid var(--glass-border)',
        boxShadow: isActive ? '0 8px 40px rgba(255,68,68,0.15), 0 0 60px rgba(255,68,68,0.05)' : '0 4px 20px rgba(0,0,0,0.2)',
      }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(138,43,226,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
          }
        }}
      >
        {/* Embed / Thumbnail area */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: embed.embedUrl ? '#000' : 'linear-gradient(135deg, #1a1040, #302b63)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {embed.embedUrl && isActive ? (
            <iframe
              src={embed.embedUrl}
              title={`${vtuber.displayName} en vivo`}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                border: 'none',
              }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            /* Static thumbnail for non-active cards or when no embed */
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '8px',
            }}>
              {vtuber.bannerUrl ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `url(${vtuber.bannerUrl}) center/cover`,
                  filter: 'brightness(0.4)',
                }} />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(138,43,226,0.2), rgba(255,68,68,0.1))',
                }} />
              )}
              <span style={{ fontSize: '2.5rem', position: 'relative', zIndex: 1 }}>🔴</span>
              <span style={{
                color: '#ff4444', fontWeight: 700, fontSize: '0.9rem',
                position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#ff4444',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                EN VIVO
              </span>
            </div>
          )}

          {/* Live badge overlay */}
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            padding: '4px 10px', borderRadius: '8px',
            background: 'rgba(255,68,68,0.9)',
            fontSize: '0.7rem', fontWeight: 700, color: 'white',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#fff',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            LIVE
          </div>
        </div>

        {/* Info footer */}
        <div style={{
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', flexShrink: 0,
        }}>
          {/* Streamer info */}
          <Link
            href={`/profile/${vtuber.userId}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              textDecoration: 'none', color: 'var(--text)', minWidth: 0,
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: vtuber.avatarUrl
                ? `url(${vtuber.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {!vtuber.avatarUrl && vtuber.displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: '4px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {vtuber.displayName}
                {vtuber.isVerified && (
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Verificado" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                    <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#ff4444', fontWeight: 600 }}>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#ff4444', display: 'inline-block',
                  marginRight: '5px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                EN VIVO
              </div>
            </div>
          </Link>

          {/* Action button */}
          {isActive && vtuber.twitchUrl && (
            <a
              href={vtuber.twitchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                padding: '8px 16px', borderRadius: '10px',
                fontSize: '0.8rem', fontWeight: 700,
                background: '#9146FF',
                color: 'white', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
            >
              <span>▶</span>
              Ver
            </a>
          )}
          {isActive && !vtuber.twitchUrl && vtuber.youtubeUrl && (
            <a
              href={vtuber.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                padding: '8px 16px', borderRadius: '10px',
                fontSize: '0.8rem', fontWeight: 700,
                background: '#FF0000',
                color: 'white', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
            >
              <span>▶</span>
              Ver
            </a>
          )}
          {isActive && !vtuber.twitchUrl && !vtuber.youtubeUrl && (
            <Link
              href={`/profile/${vtuber.userId}`}
              className="btn btn-outline"
              style={{
                padding: '8px 16px', borderRadius: '10px',
                fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              Perfil →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveNowSection() {
  const [liveVtubers, setLiveVtubers] = useState<LiveVTuber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Watch timer state
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [xpEarnedThisSession, setXpEarnedThisSession] = useState(0);
  const watchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastClaimRef = useRef<number>(0);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchLiveVtubers = async () => {
      try {
        const data = await apiFetch('/vtubers/live', {});
        setLiveVtubers(data);
        if (data.length > 0) {
          setActiveIndex(0);
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
        const prevCount = liveVtubers.length;
        setLiveVtubers(data);
        if (data.length === 0) {
          setActiveIndex(0);
        } else if (prevCount > 0 && data.length > 0) {
          // Keep current selection if still valid
          const currentLive = liveVtubers[activeIndex];
          if (currentLive) {
            const stillExists = data.find((v: LiveVTuber) => v.id === currentLive.id);
            if (!stillExists) {
              setActiveIndex(0);
            }
          }
        }
      } catch {
        // ignore
      }
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Watch timer: count seconds while visible and user is logged in
  useEffect(() => {
    if (!visible || !user) {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }
      return;
    }

    // Reset timer on mount
    setWatchSeconds(0);
    lastClaimRef.current = Date.now();

    watchIntervalRef.current = setInterval(() => {
      setWatchSeconds((prev) => {
        const newSeconds = prev + 1;

        // Claim XP every 10 minutes (600 seconds)
        if (newSeconds > 0 && newSeconds % 600 === 0) {
          claimStreamXp(newSeconds);
        }

        return newSeconds;
      });
    }, 1000);

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user]);

  const claimStreamXp = async (elapsedSeconds: number) => {
    const minutes = Math.floor(elapsedSeconds / 60);
    try {
      const res = await apiFetch('/gamification/stream-xp', {
        method: 'POST',
        body: JSON.stringify({ minutes }),
      });
      if (res.xpAwarded) {
        setXpEarnedThisSession((prev) => prev + res.xpAwarded);
        const displayName = activeLive?.displayName || 'stream';
        showToast(`+${res.xpAwarded} XP por ver ${displayName} por ${minutes} min! `, 'success');
      }
    } catch {
      // Rate limited or not logged in — silently ignore
    }
  };

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeLive = liveVtubers[activeIndex];

  const goNext = useCallback(() => {
    if (activeIndex < liveVtubers.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      setActiveIndex(0); // Loop back to start
    }
  }, [activeIndex, liveVtubers.length]);

  const goPrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    } else {
      setActiveIndex(liveVtubers.length - 1); // Loop to end
    }
  }, [activeIndex, liveVtubers.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, goPrev, goNext]);

  // Drag/swipe support
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 80) {
      if (diff > 0) {
        goPrev();
      } else {
        goNext();
      }
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goPrev();
      } else {
        goNext();
      }
    }
  };

  // Loading state
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

  // Don't render if nobody is live
  if (liveVtubers.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="section"
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,68,68,0.02) 50%, transparent 100%)',
      }}
    >
      {/* Decorative backgrounds */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,68,68,0.04), transparent 70%)',
        pointerEvents: 'none', zIndex: -1,
      }} />

      <div className="container">
        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', marginBottom: '6px',
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

        {/* ===== CAROUSEL ===== */}
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
        }}>
          {/* Main carousel area */}
          <div style={{ position: 'relative', padding: '40px 0' }}>
            {/* Arrow buttons */}
            {liveVtubers.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  style={{
                    position: 'absolute', left: '-50px', top: '45%',
                    transform: 'translateY(-50%)',
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text)', cursor: 'pointer',
                    fontSize: '1.2rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s',
                    zIndex: 20,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(138,43,226,0.2)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  aria-label="Anterior"
                >
                  ←
                </button>
                <button
                  onClick={goNext}
                  style={{
                    position: 'absolute', right: '-50px', top: '45%',
                    transform: 'translateY(-50%)',
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text)', cursor: 'pointer',
                    fontSize: '1.2rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s',
                    zIndex: 20,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(138,43,226,0.2)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  aria-label="Siguiente"
                >
                  →
                </button>
              </>
            )}

            {/* Cards container */}
            <div
              ref={carouselRef}
              style={{
                position: 'relative',
                minHeight: '380px',
                maxWidth: '580px',
                margin: '0 auto',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {liveVtubers.map((vtuber, idx) => {
                // Calculate position relative to active index
                let relativeIndex = idx - activeIndex;
                // Handle looping - show cards that are close
                if (Math.abs(relativeIndex) > liveVtubers.length / 2) {
                  relativeIndex = relativeIndex > 0
                    ? relativeIndex - liveVtubers.length
                    : relativeIndex + liveVtubers.length;
                }

                const isActive = idx === activeIndex;
                // Only render nearby cards (performance)
                if (Math.abs(relativeIndex) > 2) return null;

                return (
                  <StreamCard
                    key={vtuber.id}
                    vtuber={vtuber}
                    isActive={isActive}
                    index={relativeIndex}
                    total={liveVtubers.length}
                    onClick={() => setActiveIndex(idx)}
                  />
                );
              })}
            </div>
          </div>

          {/* Dots indicator */}
          {liveVtubers.length > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '8px',
              marginTop: '6px',
            }}>
              {liveVtubers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    width: idx === activeIndex ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: idx === activeIndex ? '#ff4444' : 'rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    padding: 0,
                  }}
                  aria-label={`Stream ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Stream counter */}
          <div style={{
            textAlign: 'center', marginTop: '10px',
            fontSize: '0.8rem', color: 'var(--text-muted)',
          }}>
            {activeIndex + 1} / {liveVtubers.length}
          </div>

          {/* Watch timer - only when logged in */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '12px', marginTop: '14px',
            }}>
              {/* Timer badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '20px',
                background: 'rgba(138,43,226,0.08)',
                border: '1px solid rgba(138,43,226,0.2)',
                fontSize: '0.85rem', color: 'var(--primary)',
                fontWeight: 600,
              }}>
                <span>⏱️</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: '44px' }}>
                  {formatTime(watchSeconds)}
                </span>
              </div>

              {/* XP earned badge */}
              {xpEarnedThisSession > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '20px',
                  background: 'rgba(0,230,118,0.08)',
                  border: '1px solid rgba(0,230,118,0.2)',
                  fontSize: '0.8rem', color: '#00e676',
                  fontWeight: 600,
                }}>
                  <span>✦</span>
                  <span>+{xpEarnedThisSession} XP hoy</span>
                </div>
              )}

              {/* Next reward hint */}
              {watchSeconds > 0 && (
                <div style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                }}>
                  +5 XP cada 10 min
                </div>
              )}
            </div>
          )}
        </div>

        {/* Arrow key hint */}
        <div style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '0.75rem', color: 'var(--text-muted)',
          opacity: 0.5,
        }}>
          ←  Desliza o usa las flechas del teclado  →
        </div>

        {/* View all CTA */}
        <div style={{
          textAlign: 'center', marginTop: '28px',
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

      {/* CSS keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
