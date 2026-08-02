'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import Image from 'next/image';
import { ShimmerBlock, SkeletonText } from '@/components/ui/Skeleton';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [achievements, gamification] = await Promise.all([
          apiFetch('/gamification/achievements', {}),
          user ? apiFetch('/gamification/me', {}).catch(() => null) : Promise.resolve(null),
        ]);
        setAllAchievements(achievements || []);
        setMyAchievements(gamification?.achievements || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar logros');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const earnedIds = useMemo(() => new Set(myAchievements.map(a => a.achievementId)), [myAchievements]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allAchievements.map(a => a.category).filter(Boolean)));
    return ['TODOS', ...cats];
  }, [allAchievements]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'TODOS') return allAchievements;
    return allAchievements.filter(a => a.category === selectedCategory);
  }, [allAchievements, selectedCategory]);

  const earnedCount = myAchievements.length;
  const totalCount = allAchievements.length;
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;
  const totalXpEarned = useMemo(() => {
    return myAchievements.reduce((acc, curr) => acc + (curr.achievement?.xpReward || 0), 0);
  }, [myAchievements]);

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="glass" style={{ padding: '24px', animation: `fadeInUp 0.4s ease-out ${i * 0.06}s both` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <ShimmerBlock width="48px" height="48px" borderRadius="12px" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShimmerBlock width="120px" height="18px" borderRadius="4px" />
                  <ShimmerBlock width="50px" height="14px" borderRadius="4px" />
                </div>
                <SkeletonText lines={2} />
                <ShimmerBlock width="60px" height="14px" borderRadius="4px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="container" style={{ padding: '40px', color: 'var(--error)' }}>Error: {error}</div>;
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      GENERAL: 'var(--primary)',
      XP: '#ffd700',
      NIVEL: '#ff6b9d',
      EVENTOS: '#00d4aa',
      GREMIOS: '#9b6bff',
      SOCIAL: '#ff8c42',
      RACHA: '#ff4500',
      RULETA: '#9333ea',
      ESPECIAL: '#ec4899',
      SPECIAL: '#ec4899',
    };
    return colors[category] || 'var(--primary)';
  };

  return (
    <>
      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '6px', fontSize: '2.4rem', fontWeight: 800 }}>Logros y Reconocimientos</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Desbloquea insignias especiales completando acciones en la comunidad.
        </p>
      </div>

      {/* STATS PROGRESS CARD */}
      <div
        className="glass"
        style={{
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(124,58,237,0.03))',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Progreso General
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px' }}>
              {earnedCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalCount} desbloqueados</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>XP Ganada por Logros</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffd700' }}>+{totalXpEarned} XP</div>
            </div>
            <div
              style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700, #ff8c42)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 800, color: '#000',
                boxShadow: '0 8px 20px rgba(255,215,0,0.3)',
              }}
            >
              🏆
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary), #00d4aa)',
              borderRadius: '10px',
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          {progressPercent}% completado
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: selectedCategory === cat ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
              background: selectedCategory === cat ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
              color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: selectedCategory === cat ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ACHIEVEMENTS GRID */}
      {filteredAchievements.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>
          No hay logros en esta categoría.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))' }}>
          {filteredAchievements.map((ach) => {
            const earned = earnedIds.has(ach.id);
            const userAch = myAchievements.find(a => a.achievementId === ach.id);
            const catColor = getCategoryColor(ach.category);

            return (
              <div
                key={ach.id}
                className="glass"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  opacity: earned ? 1 : 0.65,
                  borderColor: earned ? `${catColor}44` : 'rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  background: earned
                    ? `linear-gradient(135deg, ${catColor}10, transparent)`
                    : 'rgba(255,255,255,0.02)',
                }}
              >
                {earned && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(0, 230, 118, 0.15)',
                      border: '1px solid rgba(0, 230, 118, 0.3)',
                      color: '#00e676',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ✓ Desbloqueado
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: earned
                        ? `linear-gradient(135deg, ${catColor}, ${catColor}aa)`
                        : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      flexShrink: 0,
                      boxShadow: earned ? `0 6px 20px ${catColor}44` : 'none',
                    }}
                  >
                    {ach.iconUrl ? (
                      <Image src={ach.iconUrl} alt="" width={30} height={30} style={{ width: '30px', height: '30px' }} />
                    ) : (
                      getCategoryIcon(ach.category)
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: '#fff' }}>{ach.name}</h3>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: `${catColor}22`,
                          color: catColor,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {ach.category}
                      </span>
                    </div>

                    <p style={{ margin: '4px 0 8px', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      {ach.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      {ach.xpReward > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: 700 }}>
                          +{ach.xpReward} XP
                        </span>
                      )}

                      {earned && userAch && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {new Date(userAch.earnedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
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

function getCategoryIcon(category: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    GENERAL: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    XP: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    NIVEL: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 12 7 1 18"/><polyline points="23 13 12 2 1 13"/></svg>,
    EVENTOS: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    GREMIOS: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    SOCIAL: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };
  return icons[category] || <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>;
}

function SkeletonAchievementGrid() {
  return (
    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="glass" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <ShimmerBlock width="48px" height="48px" borderRadius="12px" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <ShimmerBlock width="120px" height="18px" borderRadius="4px" />
                <ShimmerBlock width="50px" height="14px" borderRadius="4px" />
              </div>
              <SkeletonText lines={2} />
              <ShimmerBlock width="60px" height="14px" borderRadius="4px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px' }}>
      <ClientOnly
        fallback={
          <div className="container" style={{ paddingTop: '20px' }}>
            <SkeletonAchievementGrid />
          </div>
        }
      >
        <AchievementsContent />
      </ClientOnly>
    </div>
  );
}
