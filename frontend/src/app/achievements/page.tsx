'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  xpReward: number;
  category: string;
}

interface UserAchievement {
  id: string;
  achievementId: string;
  earnedAt: string;
  achievement: Achievement;
}

function AchievementsContent() {
  const { user } = useAuth();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [achievements, gamification] = await Promise.all([
          apiFetch('/gamification/achievements', {}),
          user ? apiFetch('/gamification/me', {}).catch(() => null) : Promise.resolve(null),
        ]);
        setAllAchievements(achievements);
        setMyAchievements(gamification?.achievements || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando logros...</div>;
  }

  if (error) {
    return <div className="container" style={{ padding: '40px', color: 'var(--error)' }}>Error: {error}</div>;
  }

  const earnedIds = new Set(myAchievements.map(a => a.achievementId));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      GENERAL: 'var(--primary)',
      XP: '#ffd700',
      NIVEL: '#ff6b9d',
      EVENTOS: '#00d4aa',
      GREMIOS: '#9b6bff',
      SOCIAL: '#ff8c42',
    };
    return colors[category] || 'var(--primary)';
  };

  return (
    <>
      <h1 style={{ marginBottom: '10px', fontSize: '2.5rem' }}>Logros</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
        Desbloquea logros realizando acciones en la plataforma
      </p>

      {allAchievements.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          No hay logros disponibles todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {allAchievements.map((ach) => {
            const earned = earnedIds.has(ach.id);
            const userAch = myAchievements.find(a => a.achievementId === ach.id);
            const catColor = getCategoryColor(ach.category);

            return (
              <div
                key={ach.id}
                className="glass"
                style={{
                  padding: '24px',
                  opacity: earned ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {earned && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 4px 15px rgba(255,215,0,0.3)',
                    }}                    >
                    ✓
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: earned
                        ? `linear-gradient(135deg, ${catColor}, ${catColor}88)`
                        : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      flexShrink: 0,
                    }}
                  >
                    {ach.iconUrl ? (
                      <img src={ach.iconUrl} alt="" style={{ width: '28px', height: '28px' }} />
                    ) : (
                      getCategoryIcon(ach.category)
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{ach.name}</h3>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: `${catColor}22`,
                          color: catColor,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {ach.category}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                      {ach.description}
                    </p>
                    {ach.xpReward > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#ffd700' }}>
                        +{ach.xpReward} XP
                      </div>
                    )}
                    {earned && userAch && (
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success)' }}>
                        Desbloqueado {new Date(userAch.earnedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    GENERAL: 'GN',
    XP: 'XP',
    NIVEL: 'NL',
    EVENTOS: 'EV',
    GREMIOS: 'GR',
    SOCIAL: 'SC',
  };
  return icons[category] || '--';
}

export default function AchievementsPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px' }}>
      <ClientOnly
        fallback={
          <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
            Cargando logros...
          </div>
        }
      >
        <AchievementsContent />
      </ClientOnly>
    </div>
  );
}
