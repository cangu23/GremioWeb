'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import { ShimmerBlock } from '@/components/ui/Skeleton';

interface LeaderboardEntry {
  id: string;
  username: string;
  xp: number;
  level: number;
  avatarUrl: string | null;
  displayName: string | null;
  rank: number;
}

function LeaderboardContent() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await apiFetch('/gamification/leaderboard?limit=50', {});
        setEntries(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error');
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

  return (
    <>
      <h1 style={{ marginBottom: '10px', fontSize: '2.5rem' }}>Clasificación Estelar</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
        Los creadores y miembros con más experiencia y actividad en Gremio Estelar
      </p>

      {entries.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          Aún no hay suficientes datos para mostrar la clasificación.
        </div>
      ) : (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--muted)', fontWeight: 500 }}>#</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--muted)', fontWeight: 500 }}>Usuario</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontWeight: 500 }}>Nivel</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--muted)', fontWeight: 500 }}>XP</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--muted)', fontWeight: 500 }}>Progreso</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const nextLevelXp = getXpForNextLevel(entry.level);
                  const prevLevelXp = getXpForNextLevel(entry.level - 1);
                  const progress = nextLevelXp - prevLevelXp > 0
                    ? Math.min(100, Math.round(((entry.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100))
                    : 100;

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
                            <div>{entry.displayName || entry.username}</div>
                            {entry.displayName && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>@{entry.username}</div>
                            )}
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
                            fontWeight: 700,
                          }}
                        >
                          {entry.level}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>
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
