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
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <section className="section" ref={sectionRef}>
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 22, height: 22, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
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
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        <div className="section-accent-line" />
        <h2 className="section-title">VTubers Destacados</h2>
        <p className="section-subtitle">Conoce a los creadores más brillantes de nuestra comunidad</p>

        {/* Selector tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '4px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.5s ease 0.2s',
        }}>
          {vtubers.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVtuber(v.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: selectedVtuber === v.id ? 'var(--primary-subtle)' : 'transparent',
                color: selectedVtuber === v.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: selectedVtuber === v.id ? 600 : 500,
                fontSize: '0.82rem',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
              onMouseEnter={(e) => {
                if (selectedVtuber !== v.id) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedVtuber !== v.id) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {v.displayName}
              {v.isLive && (
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Active VTuber card */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
          maxWidth: '700px',
          margin: '0 auto',
        }}>
          <div
            key={activeVtuber.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            {/* Banner */}
            {activeVtuber.bannerUrl && (
              <div style={{
                width: '100%',
                height: '160px',
                background: `url(${activeVtuber.bannerUrl}) center/cover`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 50%, var(--bg-deep) 100%)',
                }} />
              </div>
            )}

            <div style={{ padding: activeVtuber.bannerUrl ? '16px 20px 20px' : '24px 20px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                  background: activeVtuber.avatarUrl
                    ? `url(${activeVtuber.avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, var(--primary), var(--warm))',
                  border: '2px solid rgba(139,92,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '1rem',
                  overflow: 'hidden',
                }}>
                  {!activeVtuber.avatarUrl && activeVtuber.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {activeVtuber.displayName}
                    </h3>
                    {activeVtuber.isVerified && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                    {activeVtuber.isLive && (
                      <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 700,
                        background: 'var(--primary)', color: '#fff',
                      }}>LIVE</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    @{activeVtuber.user.username} · {activeVtuber.user._count.followers} seguidores
                  </div>
                </div>
              </div>

              {/* Description */}
              {activeVtuber.description && (
                <p style={{
                  fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7,
                  marginBottom: '14px',
                }}>
                  {activeVtuber.description}
                </p>
              )}

              {/* Social links */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {activeVtuber.twitchUrl && (
                  <a href={activeVtuber.twitchUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem',
                      fontWeight: 600, background: 'rgba(145,66,255,0.1)', color: '#9146FF',
                      textDecoration: 'none', border: '1px solid rgba(145,66,255,0.2)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(145,66,255,0.2)'; }}>
                    Twitch
                  </a>
                )}
                {activeVtuber.youtubeUrl && (
                  <a href={activeVtuber.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem',
                      fontWeight: 600, background: 'rgba(255,0,0,0.08)', color: '#ff0000',
                      textDecoration: 'none', border: '1px solid rgba(255,0,0,0.15)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,0,0,0.15)'; }}>
                    YouTube
                  </a>
                )}
                {activeVtuber.twitterUrl && (
                  <a href={activeVtuber.twitterUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem',
                      fontWeight: 600, background: 'rgba(29,161,242,0.08)', color: '#1d9bf0',
                      textDecoration: 'none', border: '1px solid rgba(29,161,242,0.15)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(29,161,242,0.15)'; }}>
                    Twitter
                  </a>
                )}
              </div>

              {/* Recent posts */}
              {activeVtuber.posts && activeVtuber.posts.length > 0 && (
                <div>
                  <div style={{
                    paddingTop: '12px', borderTop: '1px solid var(--glass-border)',
                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px',
                  }}>
                    Publicaciones Recientes
                  </div>
                  {activeVtuber.posts.slice(0, 2).map((post) => (
                    <div key={post.id} style={{
                      padding: '10px 12px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      marginBottom: '6px',
                      fontSize: '0.82rem', color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                    }}>
                      <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {post.content}
                      </p>
                      <div style={{
                        display: 'flex', gap: '10px', marginTop: '6px',
                        fontSize: '0.7rem', color: 'var(--text-muted)',
                      }}>
                        <span>❤️ {post._count.likes}</span>
                        <span>💬 {post._count.comments}</span>
                        <span>· {formatTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View profile link */}
              <Link
                href={`/profile/${activeVtuber.userId}`}
                className="btn btn--outline btn--sm"
                style={{ marginTop: '14px', display: 'inline-flex' }}
              >
                Ver perfil completo
              </Link>
            </div>
          </div>
        </div>

        {/* View all CTA */}
        <div style={{ textAlign: 'center', marginTop: '20px', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.4s' }}>
          <Link href="/vtubers" className="btn btn--outline btn--sm">
            Conocer más VTubers
          </Link>
        </div>
      </div>


    </section>
  );
}
