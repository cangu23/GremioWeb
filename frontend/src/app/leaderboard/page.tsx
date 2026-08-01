'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import { ShimmerBlock } from '@/components/ui/Skeleton';
import RoleBadge from '@/components/ui/RoleBadge';
import { getPrimaryRole } from '@gremio-estelar/shared';

interface LeaderboardEntry {
  id: string;
  username: string;
  xp: number;
  level: number;
  avatarUrl: string | null;
  displayName: string | null;
  rank: number;
  role?: string;
  displayedRole?: string | null;
  isVerified?: boolean;
}

function LeaderboardContent() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await apiFetch('/gamification/leaderboard?limit=50', {});
        setEntries(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar clasificación');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="glass" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '16px' }}>
          <ShimmerBlock width="30px" height="14px" borderRadius="4px" />
          <ShimmerBlock width="100px" height="14px" borderRadius="4px" />
          <div style={{ flex: 1 }} />
          <ShimmerBlock width="40px" height="14px" borderRadius="4px" />
          <ShimmerBlock width="80px" height="14px" borderRadius="4px" />
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} style={{
            padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: '16px',
            animation: `fadeInUp 0.4s ease-out ${i * 0.04}s both`,
          }}>
            <ShimmerBlock width="24px" height="20px" borderRadius="4px" />
            <ShimmerBlock width="40px" height="40px" borderRadius="50%" />
            <ShimmerBlock width="120px" height="14px" borderRadius="4px" />
            <div style={{ flex: 1 }} />
            <ShimmerBlock width="40px" height="22px" borderRadius="10px" />
            <ShimmerBlock width="70px" height="14px" borderRadius="4px" />
            <ShimmerBlock width="120px" height="8px" borderRadius="4px" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="container" style={{ padding: '40px', color: 'var(--error)' }}>Error: {error}</div>;
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span style={{ fontSize: '1.4rem' }} title="Primer Lugar (Oro)">🥇</span>;
    if (rank === 2) return <span style={{ fontSize: '1.4rem' }} title="Segundo Lugar (Plata)">🥈</span>;
    if (rank === 3) return <span style={{ fontSize: '1.4rem' }} title="Tercer Lugar (Bronce)">🥉</span>;
    return <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>#{rank}</span>;
  };

  const getXpForNextLevel = (level: number) => {
    const thresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5200, 6600, 8200, 10000, 12000];
    return thresholds[Math.min(level, thresholds.length - 1)] || thresholds[thresholds.length - 1];
  };

  const top3 = entries.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>🏆 Clasificación Estelar</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
          Los creadores y aventureros con mayor nivel de experiencia y actividad en el Gremio
        </p>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px',
          marginBottom: '32px', alignItems: 'flex-end'
        }}>
          {/* #2 Silver */}
          {second && (
            <div className="glass" style={{
              padding: '20px', borderRadius: '16px', textAlign: 'center', position: 'relative',
              border: '1px solid rgba(192, 192, 192, 0.4)', background: 'linear-gradient(180deg, rgba(192,192,192,0.1), rgba(255,255,255,0.02))'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🥈</div>
              <Link href={`/profile/${second.id}`} style={{ textDecoration: 'none', color: '#fff' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 10px',
                  background: second.avatarUrl ? `url(${second.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  border: '2px solid #c0c0c0', boxShadow: '0 0 12px rgba(192,192,192,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem'
                }}>
                  {!second.avatarUrl && second.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>{second.displayName || second.username}</span>
                  {second.isVerified && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#1d9bf0"><circle cx="12" cy="12" r="10" fill="#1d9bf0"/><polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none"/></svg>
                  )}
                </div>
              </Link>
              <div style={{ marginTop: '6px' }}>
                <RoleBadge role={getPrimaryRole(second.role, second.displayedRole)} size="sm" />
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.85rem', fontWeight: 800, color: '#c0c0c0' }}>
                Nivel {second.level} · {second.xp.toLocaleString()} XP
              </div>
            </div>
          )}

          {/* #1 Gold */}
          {first && (
            <div className="glass" style={{
              padding: '24px 20px', borderRadius: '20px', textAlign: 'center', position: 'relative',
              border: '2px solid rgba(251, 191, 36, 0.6)', background: 'linear-gradient(180deg, rgba(251,191,36,0.18), rgba(255,255,255,0.03))',
              boxShadow: '0 0 30px rgba(251,191,36,0.25)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👑 🥇</div>
              <Link href={`/profile/${first.id}`} style={{ textDecoration: 'none', color: '#fff' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px',
                  background: first.avatarUrl ? `url(${first.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  border: '3px solid #fbbf24', boxShadow: '0 0 20px rgba(251,191,36,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.8rem'
                }}>
                  {!first.avatarUrl && first.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>{first.displayName || first.username}</span>
                  {first.isVerified && (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#1d9bf0"><circle cx="12" cy="12" r="10" fill="#1d9bf0"/><polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none"/></svg>
                  )}
                </div>
              </Link>
              <div style={{ marginTop: '6px' }}>
                <RoleBadge role={getPrimaryRole(first.role, first.displayedRole)} size="md" />
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24' }}>
                Nivel {first.level} · {first.xp.toLocaleString()} XP
              </div>
            </div>
          )}

          {/* #3 Bronze */}
          {third && (
            <div className="glass" style={{
              padding: '20px', borderRadius: '16px', textAlign: 'center', position: 'relative',
              border: '1px solid rgba(205, 127, 50, 0.4)', background: 'linear-gradient(180deg, rgba(205,127,50,0.1), rgba(255,255,255,0.02))'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🥉</div>
              <Link href={`/profile/${third.id}`} style={{ textDecoration: 'none', color: '#fff' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 10px',
                  background: third.avatarUrl ? `url(${third.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  border: '2px solid #cd7f32', boxShadow: '0 0 12px rgba(205,127,50,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem'
                }}>
                  {!third.avatarUrl && third.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>{third.displayName || third.username}</span>
                  {third.isVerified && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#1d9bf0"><circle cx="12" cy="12" r="10" fill="#1d9bf0"/><polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none"/></svg>
                  )}
                </div>
              </Link>
              <div style={{ marginTop: '6px' }}>
                <RoleBadge role={getPrimaryRole(third.role, third.displayedRole)} size="sm" />
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.85rem', fontWeight: 800, color: '#cd7f32' }}>
                Nivel {third.level} · {third.xp.toLocaleString()} XP
              </div>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          Aún no hay suficientes datos para mostrar la clasificación.
        </div>
      ) : (
        <div className="glass" style={{ overflow: 'hidden', borderRadius: '16px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>Aventurero</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>Nivel</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--muted)', fontWeight: 600 }}>Experiencia XP</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--muted)', fontWeight: 600 }}>Progreso al Sig. Nivel</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const nextLevelXp = getXpForNextLevel(entry.level);
                  const prevLevelXp = getXpForNextLevel(entry.level - 1);
                  const progress = nextLevelXp - prevLevelXp > 0
                    ? Math.min(100, Math.round(((entry.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100))
                    : 100;
                  const primaryRole = getPrimaryRole(entry.role, entry.displayedRole);

                  return (
                    <tr
                      key={entry.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
                        {getRankBadge(entry.rank)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <Link
                          href={`/profile/${entry.id}`}
                          style={{
                            color: 'var(--text)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: entry.avatarUrl
                                ? `url(${entry.avatarUrl}) center/cover`
                                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '1rem',
                              fontWeight: 700,
                            }}
                          >
                            {!entry.avatarUrl && entry.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700 }}>{entry.displayName || entry.username}</span>
                              {entry.isVerified && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0"><circle cx="12" cy="12" r="10" fill="#1d9bf0"/><polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none"/></svg>
                              )}
                              {primaryRole !== 'USER' && (
                                <RoleBadge role={primaryRole} size="sm" />
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{entry.username}</div>
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                          }}
                        >
                          {entry.level}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700 }}>
                        {entry.xp.toLocaleString()} XP
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', minWidth: '150px' }}>
                        <div
                          style={{
                            width: '120px',
                            height: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginLeft: 'auto',
                          }}
                        >
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                              borderRadius: '4px',
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                          {progress}% → Lv.{entry.level + 1}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default function LeaderboardPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px' }}>
      <ClientOnly
        fallback={
          <div className="container" style={{ paddingTop: '20px' }}>
            <div className="glass" style={{ overflow: 'hidden' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <ShimmerBlock width="24px" height="20px" borderRadius="4px" />
                  <ShimmerBlock width="40px" height="40px" borderRadius="50%" />
                  <ShimmerBlock width="120px" height="14px" borderRadius="4px" />
                  <div style={{ flex: 1 }} />
                  <ShimmerBlock width="40px" height="22px" borderRadius="10px" />
                  <ShimmerBlock width="70px" height="14px" borderRadius="4px" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <LeaderboardContent />
      </ClientOnly>
    </div>
  );
}
