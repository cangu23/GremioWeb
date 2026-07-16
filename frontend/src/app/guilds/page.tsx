'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
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
  tags?: string | null;
  creator: { id: string; username: string; vtuberProfile?: { displayName: string; avatarUrl: string | null } | null };
  _count: { members: number };
  isMember: boolean;
  myRole: string | null;
}

function GuildCard({ guild }: { guild: GuildItem }) {
  const tags = guild.tags ? guild.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <Link href={`/guilds/${guild.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        className="glass"
        style={{
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
          e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }}
      >
        {/* Gradient accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: guild.logoUrl
              ? `url(${guild.logoUrl}) center/cover`
              : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', color: 'white', fontWeight: 'bold', flexShrink: 0,
          }}>
            {!guild.logoUrl && guild.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {guild.name}
              </h3>
              {guild.isMember && (
                <span style={{
                  fontSize: '0.7rem', padding: '2px 10px', borderRadius: '20px',
                  background: 'rgba(138,43,226,0.15)', color: 'var(--primary)',
                  fontWeight: 600, flexShrink: 0,
                }}>
                  MIEMBRO
                </span>
              )}
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.7rem', padding: '2px 10px', borderRadius: '10px',
                    background: 'rgba(138,43,226,0.1)', color: 'var(--primary)',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <p style={{
          color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6,
          marginBottom: '16px', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {guild.description}
        </p>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '16px', borderTop: '1px solid var(--glass-border)',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            👥 {guild._count.members} {guild._count.members === 1 ? 'miembro' : 'miembros'}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            por <strong style={{ color: 'var(--text)' }}>
              {guild.creator.vtuberProfile?.displayName || guild.creator.username}
            </strong>
          </span>
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

  const fetchGuilds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/guilds');
      setGuilds(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los gremios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', animation: 'fadeIn 0.5s ease' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px' }}>
            🏰 <span className="gradient-text">Gremios</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Encuentra tu comunidad o crea la tuya propia
          </p>
        </div>
        {user && (
          <Link href="/guilds/create" className="btn" style={{
            padding: '12px 24px', borderRadius: '12px', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
          }}>
            ✦ Crear Gremio
          </Link>
        )}
      </div>

      {/* Content */}
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
          <button onClick={fetchGuilds} className="btn" style={{
            padding: '12px 28px', borderRadius: '12px',
            display: 'inline-flex',
          }}>
            🔄 Reintentar
          </button>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SkeletonGuildCard />
          <SkeletonGuildCard />
          <SkeletonGuildCard />
          <SkeletonGuildCard />
        </div>
      ) : guilds.length === 0 ? (
        <div className="glass" style={{
          padding: '60px 40px', textAlign: 'center', borderRadius: '20px',
          border: '1px solid var(--glass-border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏗️</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '4px' }}>
            No hay gremios aún.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Sé el primero en crear uno
          </p>
          {user && (
            <Link href="/guilds/create" className="btn" style={{
              padding: '12px 28px', borderRadius: '12px',
              display: 'inline-flex',
            }}>
              ✦ Crear el primer gremio
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {guilds.map((guild, i) => (
            <div key={guild.id} style={{
              opacity: 0,
              animation: `fadeInUp 0.5s ease ${i * 0.08}s forwards`,
            }}>
              <GuildCard guild={guild} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
