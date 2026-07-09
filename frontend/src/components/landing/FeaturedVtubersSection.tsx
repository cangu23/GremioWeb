'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface FeaturedPost {
  id: string;
  content: string;
  mediaUrl: string | null;
  createdAt: string;
  _count: { comments: number; likes: number };
  hashtags: string[];
}

interface FeaturedVTuber {
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
  twitterUrl: string | null;
  user: {
    id: string;
    username: string;
    role: string;
    _count: { followers: number; following: number };
  };
  posts: FeaturedPost[];
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

export default function FeaturedVtubersSection() {
  const [vtubers, setVtubers] = useState<FeaturedVTuber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVtuber, setSelectedVtuber] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await apiFetch('/vtubers/featured', {});
        setVtubers(data);
        if (data.length > 0) {
          setSelectedVtuber(data[0].id);
        }
      } catch {
        // Silently fail — section just won't render
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
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

  if (loading) {
    return (
      <section className="section" ref={sectionRef}>
        <div className="container">
          <h2 className="section-title">VTubers Destacados</h2>
          <p className="section-subtitle">Conoce a los creadores más brillantes de nuestra comunidad</p>
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

  if (vtubers.length === 0) return null;

  const activeVtuber = vtubers.find((v) => v.id === selectedVtuber) || vtubers[0];

  return (
    <section
      ref={sectionRef}
      className="section"
      id="featured-vtubers"
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,0,127,0.02) 50%, transparent 100%)',
      }}
    >
      {/* Decorative background */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(138,43,226,0.06), transparent 70%)',
        pointerEvents: 'none', zIndex: -1,
      }} />

      <div className="container">
        <h2 className="section-title" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          ⭐ VTubers Destacados
        </h2>
        <p className="section-subtitle" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          Conoce a los creadores más brillantes de nuestra comunidad y descubre sus últimas publicaciones
        </p>

        {/* VTuber selector tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '40px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
        }}>
          {vtubers.map((vtuber) => (
            <button
              key={vtuber.id}
              onClick={() => setSelectedVtuber(vtuber.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px 10px 12px',
                borderRadius: '50px',
                border: selectedVtuber === vtuber.id
                  ? '2px solid var(--primary)'
                  : '1px solid var(--glass-border)',
                background: selectedVtuber === vtuber.id
                  ? 'rgba(138,43,226,0.12)'
                  : 'var(--card-bg)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(12px)',
                boxShadow: selectedVtuber === vtuber.id
                  ? '0 0 20px rgba(138,43,226,0.2)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedVtuber !== vtuber.id) {
                  e.currentTarget.style.background = 'rgba(138,43,226,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedVtuber !== vtuber.id) {
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
              }}>
                {!vtuber.avatarUrl && vtuber.displayName.charAt(0).toUpperCase()}
              </div>
              <span>{vtuber.displayName}</span>
              {vtuber.isLive && (
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#ff4444', animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              )}
              {vtuber.isVerified && (
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Active VTuber content */}
        {activeVtuber && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 360px) 1fr',
            gap: '28px',
            alignItems: 'start',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
          }}>
            {/* Profile card */}
            <div className="glass" style={{
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'sticky',
              top: '100px',
            }}>
              {/* Banner */}
              <div style={{
                height: '120px',
                background: activeVtuber.bannerUrl
                  ? `url(${activeVtuber.bannerUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                position: 'relative',
              }}>
                {/* Avatar on banner */}
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80px', height: '80px', borderRadius: '50%',
                  border: '3px solid var(--background)',
                  background: activeVtuber.avatarUrl
                    ? `url(${activeVtuber.avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '1.5rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}>
                  {!activeVtuber.avatarUrl && activeVtuber.displayName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Profile info */}
              <div style={{ padding: '40px 20px 20px', textAlign: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', marginBottom: '4px',
                }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                    {activeVtuber.displayName}
                  </h3>
                  {activeVtuber.isVerified && (
                    <span style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>✓</span>
                  )}
                </div>
                <p style={{
                  fontSize: '0.85rem', color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}>
                  @{activeVtuber.user.username}
                </p>

                {activeVtuber.description && (
                  <p style={{
                    fontSize: '0.9rem', color: 'var(--text-muted)',
                    lineHeight: 1.6, marginBottom: '20px',
                  }}>
                    {activeVtuber.description.length > 120
                      ? activeVtuber.description.slice(0, 120) + '...'
                      : activeVtuber.description}
                  </p>
                )}

                {/* Stats */}
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: '24px',
                  marginBottom: '20px', padding: '12px 0',
                  borderTop: '1px solid var(--glass-border)',
                  borderBottom: '1px solid var(--glass-border)',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {activeVtuber.user._count.followers}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Seguidores
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {activeVtuber.posts.length}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Publicaciones
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <Link
                    href={`/profile/${activeVtuber.userId}`}
                    className="btn"
                    style={{
                      padding: '12px', borderRadius: '12px', fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    }}
                  >
                    ✦ Ver Perfil Completo
                  </Link>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {activeVtuber.twitchUrl && (
                      <a
                        href={activeVtuber.twitchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(100,65,165,0.2)', color: '#9146FF',
                          fontSize: '1.1rem', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(100,65,165,0.3)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(100,65,165,0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <span>📺</span>
                      </a>
                    )}
                    {activeVtuber.youtubeUrl && (
                      <a
                        href={activeVtuber.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255,0,0,0.15)', color: '#FF0000',
                          fontSize: '1.1rem', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,0,0,0.25)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,0,0,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <span>▶️</span>
                      </a>
                    )}
                    {activeVtuber.twitterUrl && (
                      <a
                        href={activeVtuber.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(29,161,242,0.15)', color: '#1DA1F2',
                          fontSize: '1.1rem', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(29,161,242,0.25)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(29,161,242,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <span>🐦</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Posts feed */}
            <div>
              {activeVtuber.posts.length === 0 ? (
                <div className="glass" style={{
                  padding: '40px', textAlign: 'center', borderRadius: '20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                }}>
                  <span style={{ fontSize: '2rem' }}>📝</span>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                    Este VTuber aún no ha publicado nada
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📰 Últimas Publicaciones
                    </h3>
                    <Link
                      href={`/profile/${activeVtuber.userId}`}
                      style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}
                    >
                      Ver todas →
                    </Link>
                  </div>

                  {activeVtuber.posts.map((post, idx) => (
                    <div
                      key={post.id}
                      className="glass"
                      style={{
                        borderRadius: '16px',
                        padding: '20px',
                        transition: 'all 0.3s ease',
                        animation: visible ? `fadeInUp 0.5s ease ${0.4 + idx * 0.1}s forwards` : 'none',
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
                        marginBottom: '12px',
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: activeVtuber.avatarUrl
                            ? `url(${activeVtuber.avatarUrl}) center/cover`
                            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 'bold', fontSize: '0.75rem',
                          overflow: 'hidden', flexShrink: 0,
                        }}>
                          {!activeVtuber.avatarUrl && activeVtuber.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {activeVtuber.displayName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            @{activeVtuber.user.username} · {formatTimeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Post content */}
                      <p style={{
                        fontSize: '0.9rem', lineHeight: 1.6,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        marginBottom: post.mediaUrl ? '12px' : 0,
                      }}>
                        {post.content.length > 280
                          ? post.content.slice(0, 280) + '...'
                          : post.content}
                      </p>

                      {/* Media */}
                      {post.mediaUrl && (
                        <div style={{
                          borderRadius: '12px', overflow: 'hidden', marginBottom: '12px',
                        }}>
                          <img
                            src={post.mediaUrl}
                            alt=""
                            style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      {/* Hashtags */}
                      {post.hashtags.length > 0 && (
                        <div style={{
                          display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px',
                        }}>
                          {post.hashtags.map((tag) => (
                            <Link
                              key={tag}
                              href={`/feed?tag=${tag}`}
                              style={{
                                fontSize: '0.78rem', color: 'var(--primary)',
                                textDecoration: 'none', fontWeight: 500,
                              }}
                            >
                              #{tag}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Post stats */}
                      <div style={{
                        display: 'flex', gap: '16px', borderTop: '1px solid var(--glass-border)',
                        paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)',
                      }}>
                        <span>❤️ {post._count.likes}</span>
                        <span>💬 {post._count.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View all CTA */}
        <div style={{
          textAlign: 'center', marginTop: '48px',
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
            🎭 Explorar todos los VTubers
          </Link>
        </div>
      </div>
    </section>
  );
}
