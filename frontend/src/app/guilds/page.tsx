'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';
import SkeletonGuildCard from '@/components/guilds/SkeletonGuildCard';

interface GuildItem {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  tags?: string | null;
  creator: { id: string; username: string; vtuberProfile?: { displayName: string; avatarUrl: string | null } | null };
  _count: { members: number; channels?: number };
  isMember: boolean;
  myRole: string | null;
}

function GuildCard({ guild, viewMode }: { guild: GuildItem; viewMode: 'grid' | 'list' }) {
  const tags = guild.tags ? guild.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const creatorName = guild.creator.vtuberProfile?.displayName || guild.creator.username;

  if (viewMode === 'grid') {
    return (
      <Link href={`/guilds/${guild.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <div
          className="glass"
          style={{
            borderRadius: '20px',
            border: '1px solid var(--glass-border)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(138,43,226,0.25)';
            e.currentTarget.style.borderColor = 'rgba(138,43,226,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          {/* Cover Header */}
          <div style={{
            height: '95px',
            position: 'relative',
            background: guild.coverUrl
              ? `url(${guild.coverUrl}) center/cover`
              : 'linear-gradient(135deg, #2a1548, #4c1d95, #1e1b4b)',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,12,0.85) 100%)',
            }} />
            {guild.isMember && (
              <span style={{
                position: 'absolute', top: '12px', right: '12px',
                fontSize: '0.68rem', padding: '3px 10px', borderRadius: '20px',
                background: guild.myRole === 'LEADER' ? 'rgba(255,0,127,0.85)' : 'rgba(138,43,226,0.85)',
                color: '#fff', fontWeight: 800, letterSpacing: '0.04em',
                boxShadow: '0 2px 10px rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
              }}>
                {guild.myRole === 'LEADER' ? '👑 LÍDER' : 'MIEMBRO'}
              </span>
            )}
          </div>

          {/* Logo overlay & Content */}
          <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-30px', marginBottom: '12px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: guild.logoUrl
                  ? `url(${guild.logoUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.7rem', color: 'white', fontWeight: 'bold', flexShrink: 0,
                border: '3px solid var(--background, #0a0a0c)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}>
                {!guild.logoUrl && guild.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {guild.name}
            </h3>

            <p style={{
              color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.55,
              marginBottom: '14px', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              flex: 1,
            }}>
              {guild.description || 'Sin descripción disponible.'}
            </p>

            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {tags.slice(0, 3).map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.68rem', padding: '2px 8px', borderRadius: '8px',
                    background: 'rgba(138,43,226,0.12)', color: 'var(--primary)', fontWeight: 600,
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: '12px', borderTop: '1px solid var(--glass-border)',
              marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span>👥 {guild._count.members}</span>
                {guild._count.channels !== undefined && (
                  <span>💬 {guild._count.channels}</span>
                )}
              </div>
              <span style={{ fontSize: '0.78rem' }}>
                por <strong style={{ color: 'var(--text)' }}>{creatorName}</strong>
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // List View
  return (
    <Link href={`/guilds/${guild.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        className="glass"
        style={{
          padding: '20px 24px',
          borderRadius: '18px',
          border: '1px solid var(--glass-border)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
          e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }}
      >
        {/* Accent Bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
          background: 'linear-gradient(180deg, var(--secondary), var(--primary))',
        }} />

        <div style={{
          width: '54px', height: '54px', borderRadius: '14px',
          background: guild.logoUrl
            ? `url(${guild.logoUrl}) center/cover`
            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', color: 'white', fontWeight: 'bold', flexShrink: 0,
        }}>
          {!guild.logoUrl && guild.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              {guild.name}
            </h3>
            {guild.isMember && (
              <span style={{
                fontSize: '0.68rem', padding: '2px 9px', borderRadius: '20px',
                background: 'rgba(138,43,226,0.15)', color: 'var(--primary)',
                fontWeight: 700,
              }}>
                MIEMBRO
              </span>
            )}
          </div>
          <p style={{
            color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px',
          }}>
            {guild.description}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {tags.slice(0, 2).map(tag => (
                <span key={tag} style={{
                  fontSize: '0.68rem', padding: '2px 8px', borderRadius: '8px',
                  background: 'rgba(138,43,226,0.1)', color: 'var(--primary)',
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>👥 {guild._count.members} miembros</div>
            <div style={{ fontSize: '0.72rem' }}>por {creatorName}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function GuildsContent() {
  const { user } = useAuth();
  const [guilds, setGuilds] = useState<GuildItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'popular'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchGuilds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/guilds');
      setGuilds(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los gremios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  // Filtered & Sorted Guilds
  const filteredGuilds = useMemo(() => {
    return guilds.filter(g => {
      // Tab filter
      if (activeTab === 'mine' && !g.isMember) return false;
      
      // Tag filter
      if (selectedTag) {
        const tags = g.tags ? g.tags.split(',').map(t => t.trim().toLowerCase()) : [];
        if (!tags.includes(selectedTag.toLowerCase())) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchDesc = g.description.toLowerCase().includes(q);
        const matchTag = g.tags ? g.tags.toLowerCase().includes(q) : false;
        if (!matchName && !matchDesc && !matchTag) return false;
      }

      return true;
    }).sort((a, b) => {
      if (activeTab === 'popular') {
        return (b._count.members || 0) - (a._count.members || 0);
      }
      return 0;
    });
  }, [guilds, activeTab, selectedTag, searchQuery]);

  const totalMembersCount = useMemo(() => {
    return guilds.reduce((acc, g) => acc + (g._count.members || 0), 0);
  }, [guilds]);

  const myGuildsCount = useMemo(() => {
    return guilds.filter(g => g.isMember).length;
  }, [guilds]);

  const POPULAR_TAGS = ['VTuber', 'Gaming', 'Musica', 'Arte', 'Chill', 'Competitivo'];

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '50px', animation: 'fadeIn 0.4s ease' }}>
      {/* ===== HERO HEADER ===== */}
      <div className="glass" style={{
        padding: '32px 28px',
        borderRadius: '24px',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(138,43,226,0.12), rgba(0,212,255,0.06))',
        border: '1px solid rgba(138,43,226,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 12px', borderRadius: '20px',
              background: 'rgba(138,43,226,0.2)', border: '1px solid rgba(138,43,226,0.3)',
              color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em',
            }}>
              🏰 COMUNIDAD & GREMIOS
            </span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>
            Gremios Estelares
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', lineHeight: 1.6, margin: 0 }}>
            Únete a comunidades en vivo para chatear en canales, coordinar streams, compartir clips y subir de nivel con tu equipo.
          </p>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
            <div style={{
              padding: '6px 14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.82rem', fontWeight: 700, color: '#fff',
            }}>
              ✦ <strong style={{ color: 'var(--primary)' }}>{guilds.length}</strong> Gremios Activos
            </div>
            <div style={{
              padding: '6px 14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.82rem', fontWeight: 700, color: '#fff',
            }}>
              👥 <strong style={{ color: 'var(--accent)' }}>{totalMembersCount}</strong> Miembros Totales
            </div>
            {user && (
              <div style={{
                padding: '6px 14px', borderRadius: '12px',
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b',
              }}>
                ⭐ <strong style={{ color: '#fff' }}>{myGuildsCount}</strong> Mis Gremios
              </div>
            )}
          </div>
        </div>

        {user && (
          <Link
            href="/guilds/create"
            className="btn btn--primary"
            style={{
              padding: '14px 28px', borderRadius: '14px', fontWeight: 800,
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
              boxShadow: '0 8px 24px rgba(138,43,226,0.35)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            ✦ Crear Nuevo Gremio
          </Link>
        )}
      </div>

      {/* ===== CONTROLS BAR ===== */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px',
        }}>
          {/* Filter Tabs */}
          <div style={{
            display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px', padding: '4px', border: '1px solid var(--glass-border)',
          }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: activeTab === 'all' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'all' ? '#fff' : 'var(--text-muted)',
                fontWeight: activeTab === 'all' ? 700 : 500, fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              🌐 Todos ({guilds.length})
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('mine')}
                style={{
                  padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: activeTab === 'mine' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'mine' ? '#fff' : 'var(--text-muted)',
                  fontWeight: activeTab === 'mine' ? 700 : 500, fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                ⭐ Mis Gremios ({myGuildsCount})
              </button>
            )}
            <button
              onClick={() => setActiveTab('popular')}
              style={{
                padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: activeTab === 'popular' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'popular' ? '#fff' : 'var(--text-muted)',
                fontWeight: activeTab === 'popular' ? 700 : 500, fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              🔥 Populares
            </button>
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 14px', borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: viewMode === 'grid' ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.03)',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              田 Cuadrícula
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 14px', borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: viewMode === 'list' ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.03)',
                color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ☰ Lista
            </button>
          </div>
        </div>

        {/* Search & Tag Filter Pills */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar gremio por nombre, descripción o etiqueta..."
              style={{ paddingLeft: '16px', borderRadius: '12px', fontSize: '0.88rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedTag(null)}
              style={{
                padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: selectedTag === null ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                color: selectedTag === null ? '#fff' : 'var(--text-muted)',
                fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              Todos los tags
            </button>
            {POPULAR_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                style={{
                  padding: '6px 12px', borderRadius: '10px',
                  border: selectedTag === tag ? '1px solid var(--primary)' : '1px solid transparent',
                  background: selectedTag === tag ? 'rgba(138,43,226,0.25)' : 'rgba(255,255,255,0.03)',
                  color: selectedTag === tag ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CONTENT GRID / LIST ===== */}
      {error ? (
        <div className="glass" style={{
          padding: '60px 40px', textAlign: 'center', borderRadius: '20px',
          border: '1px solid rgba(255,77,79,0.2)',
          background: 'rgba(255,77,79,0.03)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <p style={{ color: 'var(--error)', fontSize: '1.05rem', marginBottom: '8px', fontWeight: 600 }}>
            Error al cargar gremios
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {error}
          </p>
          <button onClick={fetchGuilds} className="btn" style={{ padding: '12px 28px', borderRadius: '12px' }}>
            🔄 Reintentar
          </button>
        </div>
      ) : loading ? (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(290px, 1fr))' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: '18px',
        }}>
          <SkeletonGuildCard />
          <SkeletonGuildCard />
          <SkeletonGuildCard />
          <SkeletonGuildCard />
        </div>
      ) : filteredGuilds.length === 0 ? (
        <div className="glass" style={{
          padding: '60px 40px', textAlign: 'center', borderRadius: '24px',
          border: '1px solid var(--glass-border)',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🏰</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
            {searchQuery || selectedTag ? 'No se encontraron gremios con los filtros' : 'No hay gremios aún'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            {searchQuery || selectedTag ? 'Intenta modificar el término de búsqueda o quitar los filtros de etiquetas.' : 'Sé el primero en fundar una comunidad y conectar con otros creadores.'}
          </p>

          {(searchQuery || selectedTag) ? (
            <button
              onClick={() => { setSearchQuery(''); setSelectedTag(null); setActiveTab('all'); }}
              className="btn btn--outline"
              style={{ padding: '10px 24px', borderRadius: '12px' }}
            >
              Limpiar Filtros
            </button>
          ) : user ? (
            <Link href="/guilds/create" className="btn btn--primary" style={{ padding: '12px 28px', borderRadius: '12px' }}>
              ✦ Crear el primer gremio
            </Link>
          ) : null}
        </div>
      ) : (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(290px, 1fr))' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: '18px',
        }}>
          {filteredGuilds.map((guild, i) => (
            <div key={guild.id} style={{
              opacity: 0,
              animation: `fadeInUp 0.4s ease ${i * 0.05}s forwards`,
              height: viewMode === 'grid' ? '100%' : 'auto',
            }}>
              <GuildCard guild={guild} viewMode={viewMode} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GuildsPage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
          <SkeletonGuildCard />
          <SkeletonGuildCard />
          <SkeletonGuildCard />
        </div>
      </div>
    }>
      <GuildsContent />
    </ClientOnly>
  );
}
