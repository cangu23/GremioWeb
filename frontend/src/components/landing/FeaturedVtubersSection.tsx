'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Heart, MessageCircle, Star } from '@/components/ui/Icons';

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

const GUREN_DEFAULT: FeaturedVTuber = {
  id: 'gurenvt-lead',
  userId: 'canguvt',
  displayName: 'Guren Tatsumaki',
  avatarUrl: '/images/guren-avatar.jpg',
  bannerUrl: '/images/guren-banner.jpg',
  description: 'Soy Christend Guren Tatsumaki クリステンド 紅蓮 竜巻, Emperador del Imperio CARMESI. Fundador, CEO y creador de Gremio Estelar.',
  isLive: false,
  isVerified: true,
  twitchUrl: 'https://www.twitch.tv/gurenvt_',
  youtubeUrl: null,
  twitterUrl: 'https://x.com/GremioEstelarES',
  user: {
    id: 'cmrjb3job00004z2osl1t64u5',
    username: 'canguvt',
    role: 'VTUBER',
    _count: { followers: 366, following: 42 },
  },
  posts: [
    {
      id: 'post-guren-1',
      content: 'Buenos días, criaturitas del Señor. El mundo les dice hola. ¡Hoy directo especial en VRChat y novedades del Gremio Estelar!',
      mediaUrl: null,
      createdAt: new Date().toISOString(),
      _count: { comments: 14, likes: 48 },
      hashtags: ['#ImperioCarmesí', '#VRChat', '#GremioEstelar'],
    },
  ],
};

export default function FeaturedVtubersSection() {
  const [vtubers, setVtubers] = useState<FeaturedVTuber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVtuber, setSelectedVtuber] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const [vtData, stData] = await Promise.all([
          apiFetch('/vtubers/featured', {}).catch(() => []),
          apiFetch('/streamers/featured', {}).catch(() => []),
        ]);
        const combined: FeaturedVTuber[] = [
          ...(Array.isArray(vtData) ? vtData : []),
          ...(Array.isArray(stData) ? stData : []),
        ];
        if (combined.length > 0) {
          setVtubers(combined);
          setSelectedVtuber(combined[0].id);
        } else {
          setVtubers([GUREN_DEFAULT]);
          setSelectedVtuber(GUREN_DEFAULT.id);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
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
          <div
            style={{
              width: 22,
              height: 22,
              border: '2px solid rgba(255,255,255,0.08)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              display: 'inline-block',
            }}
          />
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
      id="talents"
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        {/* LeFolk Agency Section Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '36px' }}>
          <span className="landing-eyebrow" style={{ marginBottom: '14px' }}>
            TALENT & MEMBERS // 所属タレント
          </span>
          <h2 className="section-title" style={{ maxWidth: '720px' }}>
            Talentos y <span className="landing-gradient-text">Creadores del Gremio</span>
          </h2>
          <p className="section-subtitle" style={{ maxWidth: '640px' }}>
            Conoce a los creadores de contenido virtual que forman parte de nuestra red.
            Transmisiones, música, arte y directos diarios en español.
          </p>
        </div>

        {/* Agency Talent Roster Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '28px',
            flexWrap: 'wrap',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 0.2s',
          }}
        >
          {vtubers.map((v) => {
            const isSelected = selectedVtuber === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVtuber(v.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid rgba(139,92,246,0.4)' : '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.02)',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.84rem',
                  letterSpacing: '0.02em',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{v.displayName}</span>
                {v.isLive && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#ff4757',
                      boxShadow: '0 0 6px #ff4757',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Talent Profile Agency Card */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
            maxWidth: '740px',
            margin: '0 auto',
          }}
        >
          <div
            key={activeVtuber.id}
            style={{
              background: 'linear-gradient(165deg, rgba(24,24,32,0.85), rgba(16,16,22,0.95))',
              border: '1px solid rgba(139,92,246,0.22)',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
            }}
          >
            {/* Banner with Agency Watermark */}
            {activeVtuber.bannerUrl ? (
              <div
                style={{
                  width: '100%',
                  height: '180px',
                  background: `url(${activeVtuber.bannerUrl}) center/cover`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(16,16,22,0.95) 100%)',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100px',
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(56,189,248,0.08))',
                  position: 'relative',
                }}
              />
            )}

            <div style={{ padding: '24px 28px' }}>
              {/* Header with Avatar and Agency Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: activeVtuber.avatarUrl
                      ? `url(${activeVtuber.avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), var(--warm))',
                    border: '2px solid rgba(139,92,246,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    overflow: 'hidden',
                    boxShadow: '0 4px 18px rgba(139,92,246,0.3)',
                  }}
                >
                  {!activeVtuber.avatarUrl && activeVtuber.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', margin: 0 }}>
                      {activeVtuber.displayName}
                    </h3>
                    {activeVtuber.isVerified && (
                      <span title="Talento Verificado" style={{ color: '#8B5CF6', display: 'flex', alignItems: 'center' }}>
                        <Star size={16} color="#8B5CF6" fill="#8B5CF6" />
                      </span>
                    )}
                    {activeVtuber.isLive ? (
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          background: '#ff4757',
                          color: '#fff',
                          letterSpacing: '0.08em',
                        }}
                      >
                        ● ON AIR
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        OFFLINE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    @{activeVtuber.user.username} · {activeVtuber.user._count.followers} seguidores
                  </div>
                </div>
              </div>

              {/* Description / Character Lore */}
              {activeVtuber.description && (
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    marginBottom: '18px',
                  }}
                >
                  {activeVtuber.description}
                </p>
              )}

              {/* Social Channels Strip */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {activeVtuber.twitchUrl && (
                  <a
                    href={activeVtuber.twitchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: 'rgba(145,66,255,0.12)',
                      color: '#9146FF',
                      textDecoration: 'none',
                      border: '1px solid rgba(145,66,255,0.25)',
                    }}
                  >
                    Twitch
                  </a>
                )}
                {activeVtuber.youtubeUrl && (
                  <a
                    href={activeVtuber.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: 'rgba(255,0,0,0.1)',
                      color: '#ff4757',
                      textDecoration: 'none',
                      border: '1px solid rgba(255,0,0,0.2)',
                    }}
                  >
                    YouTube
                  </a>
                )}
                {activeVtuber.twitterUrl && (
                  <a
                    href={activeVtuber.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: 'rgba(29,161,242,0.1)',
                      color: '#1d9bf0',
                      textDecoration: 'none',
                      border: '1px solid rgba(29,161,242,0.2)',
                    }}
                  >
                    X (Twitter)
                  </a>
                )}
              </div>

              {/* Recent Community Posts */}
              {activeVtuber.posts && activeVtuber.posts.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div
                    style={{
                      paddingTop: '14px',
                      borderTop: '1px solid var(--glass-border)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '10px',
                    }}
                  >
                    TOPICS // Publicaciones Recientes
                  </div>
                  {activeVtuber.posts.slice(0, 2).map((post) => (
                    <div
                      key={post.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        marginBottom: '8px',
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                      }}
                    >
                      {post.content && post.content.trim() !== '' && (
                        <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {post.content}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          marginTop: '8px',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Heart size={12} color="var(--text-muted)" /> {post._count.likes}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageCircle size={12} color="var(--text-muted)" /> {post._count.comments}
                        </span>
                        <span>· {formatTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View full character profile link */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gremio Estelar // Virtual Talent
                </span>
                <Link
                  href={`/profile/${activeVtuber.userId}`}
                  className="btn btn--outline btn--sm"
                  style={{ fontWeight: 700 }}
                >
                  Ver Ficha Completa // PROFILE
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* View all VTubers CTA */}
        <div style={{ textAlign: 'center', marginTop: '28px', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.4s' }}>
          <Link href="/vtubers" className="btn btn--outline btn--sm" style={{ fontWeight: 700, padding: '9px 20px' }}>
            Explorar Todos los Talentos // ALL TALENTS
          </Link>
        </div>
      </div>
    </section>
  );
}
