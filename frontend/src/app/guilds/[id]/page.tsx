'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface GuildMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    vtuberProfile?: { displayName: string; avatarUrl: string | null } | null;
  };
}

interface GuildDetail {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  tags?: string | null;
  creatorId: string;
  creator: { id: string; username: string; vtuberProfile?: { displayName: string; avatarUrl: string | null } | null };
  _count: { members: number };
  isMember: boolean;
  myRole: string | null;
  members: GuildMember[];
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  LEADER: { label: 'Líder', color: 'var(--secondary)', bg: 'rgba(255,0,127,0.1)' },
  OFFICER: { label: 'Oficial', color: 'var(--primary)', bg: 'rgba(138,43,226,0.1)' },
  MEMBER: { label: 'Miembro', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' },
};

function GuildDetailContent() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [guild, setGuild] = useState<GuildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGuild = async () => {
    try {
      const data = await apiFetch(`/guilds/${id}`);
      setGuild(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuild(); }, [id]);

  const handleJoin = async () => {
    if (!user) { router.push('/login'); return; }
    setActionLoading(true);
    try {
      await apiFetch(`/guilds/${id}/join`, { method: 'POST' });
      await fetchGuild();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setActionLoading(false); }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/guilds/${id}/leave`, { method: 'POST' });
      await fetchGuild();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setActionLoading(false); }
  };

  const handleKick = async (userId: string) => {
    if (!confirm('¿Expulsar a este miembro?')) return;
    try {
      await apiFetch(`/guilds/${id}/members/${userId}`, { method: 'DELETE' });
      await fetchGuild();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar el gremio para siempre? Esta acción no se puede deshacer.')) return;
    setActionLoading(true);
    try {
      await apiFetch(`/guilds/${id}`, { method: 'DELETE' });
      router.push('/guilds');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{
          display: 'inline-block', width: '24px', height: '24px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          marginBottom: '12px',
        }} />
        <p>Cargando gremio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', marginBottom: '16px' }}>Error: {error}</p>
        <Link href="/guilds" className="btn" style={{ padding: '10px 20px', borderRadius: '10px' }}>
          ← Volver a gremios
        </Link>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Gremio no encontrado.</p>
        <Link href="/guilds" className="btn" style={{ padding: '10px 20px', borderRadius: '10px' }}>
          ← Volver a gremios
        </Link>
      </div>
    );
  }

  const canManage = guild.myRole === 'LEADER' || guild.myRole === 'OFFICER';
  const tags = guild.tags ? guild.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const isCreator = user?.id === guild.creatorId;

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', animation: 'fadeIn 0.5s ease' }}>
      <Link href="/guilds" style={{
        color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-flex',
        alignItems: 'center', gap: '6px', marginBottom: '24px',
        transition: 'color 0.2s',
      }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        ← Volver a gremios
      </Link>

      <div className="glass" style={{
        padding: '40px', maxWidth: '740px', margin: '0 auto',
        borderRadius: '24px', border: '1px solid var(--glass-border)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Gradient accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, var(--secondary), var(--primary), var(--accent))',
        }} />

        {/* Glow decorations */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,0,127,0.06), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: '24px', flexWrap: 'wrap', gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '18px',
                background: guild.logoUrl
                  ? `url(${guild.logoUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', color: 'white', fontWeight: 'bold', flexShrink: 0,
              }}>
                {!guild.logoUrl && guild.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
                  {guild.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>👥 {guild._count.members} {guild._count.members === 1 ? 'miembro' : 'miembros'}</span>
                  {guild.isMember && (
                    <span style={{
                      padding: '2px 10px', borderRadius: '20px',
                      background: 'rgba(138,43,226,0.15)', color: 'var(--primary)',
                      fontWeight: 600, fontSize: '0.75rem',
                    }}>
                      ERES MIEMBRO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {guild.isMember ? (
                <>
                  {isCreator && (
                    <button onClick={handleDelete} className="btn" style={{
                      padding: '10px 18px', fontSize: '0.85rem', borderRadius: '10px',
                      background: 'rgba(255,77,79,0.1)', color: 'var(--error)',
                      border: '1px solid rgba(255,77,79,0.2)',
                    }} disabled={actionLoading}>
                      🗑️ Eliminar
                    </button>
                  )}
                  {guild.myRole !== 'LEADER' && (
                    <button onClick={handleLeave} className="btn" style={{
                      padding: '10px 18px', fontSize: '0.85rem', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.08)',
                    }} disabled={actionLoading}>
                      Salir del gremio
                    </button>
                  )}
                </>
              ) : (
                <button onClick={handleJoin} className="btn" style={{
                  padding: '12px 24px', borderRadius: '12px', fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                }} disabled={actionLoading}>
                  {actionLoading ? (
                    <span style={{
                      display: 'inline-block', width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                    }} />
                  ) : '✦ Unirse'}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '0.75rem', padding: '4px 12px', borderRadius: '10px',
                  background: 'rgba(138,43,226,0.12)', color: 'var(--primary)',
                  fontWeight: 500,
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Creator info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
            borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
            marginBottom: '24px', border: '1px solid transparent',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(138,43,226,0.05)';
              e.currentTarget.style.borderColor = 'rgba(138,43,226,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'transparent';
            }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '1rem',
              flexShrink: 0,
            }}>
              {(guild.creator.vtuberProfile?.displayName || guild.creator.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {guild.creator.vtuberProfile?.displayName || guild.creator.username}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                @{guild.creator.username} — Fundador
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📖 Descripción
            </h3>
            <p style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
              {guild.description}
            </p>
          </div>

          {/* Members */}
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              👥 Miembros ({guild.members.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {guild.members.map(member => {
                const rc = roleConfig[member.role] || roleConfig.MEMBER;
                return (
                  <div key={member.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}>
                    <Link href={`/profile/${member.user.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      textDecoration: 'none', color: 'var(--text)', flex: 1, minWidth: 0,
                    }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '0.85rem',
                        flexShrink: 0,
                      }}>
                        {(member.user.vtuberProfile?.displayName || member.user.username).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.user.vtuberProfile?.displayName || member.user.username}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          @{member.user.username}
                        </div>
                      </div>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px',
                        borderRadius: '20px', background: rc.bg, color: rc.color,
                      }}>
                        {rc.label}
                      </span>
                      {canManage && member.role !== 'LEADER' && (
                        <button onClick={() => handleKick(member.user.id)} style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)',
                          cursor: 'pointer', fontSize: '0.85rem', padding: '4px 8px',
                          borderRadius: '6px', transition: 'all 0.2s',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(255,77,79,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                          title="Expulsar miembro">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuildDetailPage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{
          display: 'inline-block', width: '24px', height: '24px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          marginBottom: '12px',
        }} />
        <p>Cargando gremio...</p>
      </div>
    }>
      <GuildDetailContent />
    </ClientOnly>
  );
}
