'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';

interface Mission {
  id: string;
  title: string;
  description: string;
  type: string;
  goal: number;
  action: string;
  xpReward: number;
  stardustReward: number;
  currentProgress: number;
  completed: boolean;
  claimedAt: string | null;
}

function StarIcon({ size = 14, color = '#fbbf24' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SparklesIcon({ size = 13, color = '#38bdf8' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    </svg>
  );
}

const ACTION_NAV_LINKS: Record<string, { label: string; href: string }> = {
  POST_CREATE: { label: 'Ir al Feed', href: '/feed' },
  COMMENT_CREATE: { label: 'Ver Posts', href: '/feed' },
  POST_LIKE: { label: 'Explorar Feed', href: '/feed' },
  VTUBER_VISIT: { label: 'Ver VTubers', href: '/vtubers' },
  EVENT_JOIN: { label: 'Ver Eventos', href: '/events' },
  DAILY_LOGIN: { label: 'Reclamar Día', href: '/daily-rewards' },
};

export default function StardustProgressBar() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stardust, setStardust] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [stardustRes, missionsRes] = await Promise.all([
        apiFetch('/ecosystem/stardust').catch(() => null),
        apiFetch('/ecosystem/missions').catch(() => null),
      ]);

      if (stardustRes?.data) {
        setStardust(stardustRes.data.stardust || 0);
        setMultiplier(stardustRes.data.multiplier || 1);
      }
      if (missionsRes?.data) {
        setMissions(missionsRes.data);
      }
    } catch (err) {
      console.error('Error loading progress bar data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleClaim = async (missionId: string) => {
    setClaimingId(missionId);
    try {
      const res = await apiFetch(`/ecosystem/missions/${missionId}/claim`, { method: 'POST' });
      showToast(res.data?.message || '¡Recompensa reclamada!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al reclamar misión', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  if (!user) return null;

  const totalCount = missions.length || 6;
  const completedCount = missions.filter(m => m.completed || !!m.claimedAt).length;
  const pct = Math.min(100, Math.round((completedCount / (totalCount || 1)) * 100));

  return (
    <>
      <div
        className="glass"
        style={{
          padding: '12px 18px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(138,43,226,0.05))',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '14px',
          transition: 'all 0.2s ease',
        }}
      >
        {/* LEFT: STARDUST BADGE & LEVEL PROGRESS */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
            fontSize: '0.82rem',
            fontWeight: 800,
            flexShrink: 0,
          }}>
            <StarIcon size={13} color="#fbbf24" />
            <span>{stardust} Stardust</span>
            {multiplier > 1 && (
              <span style={{ fontSize: '0.65rem', background: '#fbbf24', color: '#000', padding: '0 4px', borderRadius: '4px' }}>
                ×{multiplier}
              </span>
            )}
          </div>

          {/* COMPACT PROGRESS BAR */}
          <div style={{ flex: 1, minWidth: '120px', cursor: 'pointer' }} onClick={() => setShowModal(true)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-muted, #a1a1aa)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <SparklesIcon size={11} color="#38bdf8" /> Misiones Diarias
              </span>
              <span style={{ fontWeight: 700, color: completedCount === totalCount ? '#00e676' : '#38bdf8' }}>
                {completedCount}/{totalCount} completadas
              </span>
            </div>

            <div style={{
              height: '6px',
              width: '100%',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: completedCount === totalCount
                  ? 'linear-gradient(90deg, #00e676, #00c853)'
                  : 'linear-gradient(90deg, #38bdf8, #c084fc)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        {/* RIGHT: BUTTON TO OPEN MISSIONS MODAL & PASE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Ver Misiones
          </button>

          <Link
            href="/pass"
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Pase ⭐
          </Link>
        </div>
      </div>

      {/* MISSIONS DETAIL MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass"
            style={{
              width: '100%', maxWidth: '540px',
              padding: '24px', borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.95))',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              maxHeight: '85vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SparklesIcon size={18} color="#38bdf8" /> Misiones Diarias
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #a1a1aa)' }}>
                  Completa misiones para ganar Stardust ⭐ y avanzar en tu Pase Estelar
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: 'none', color: '#a1a1aa',
                  fontSize: '1.4rem', cursor: 'pointer', padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* MISSIONS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {missions.map((m) => {
                const isClaimed = !!m.claimedAt;
                const isReady = m.completed && !isClaimed;
                const pct = Math.min(100, Math.round((m.currentProgress / m.goal) * 100));
                const nav = ACTION_NAV_LINKS[m.action] || { label: 'Ir', href: '/feed' };

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '16px', borderRadius: '14px',
                      background: isReady ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: isReady ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isClaimed ? '#71717a' : '#fff' }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        +{m.stardustReward} <StarIcon size={12} color="#fbbf24" /> | +{m.xpReward} XP
                      </div>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #a1a1aa)', margin: '0 0 12px 0' }}>
                      {m.description}
                    </p>

                    {/* PROGRESS BAR & BUTTON */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '6px', width: '100%', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '4px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: isClaimed ? '#4b5563' : isReady ? '#fbbf24' : '#38bdf8', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#a1a1aa', fontWeight: 600 }}>
                          Progreso: {m.currentProgress} de {m.goal}
                        </span>
                      </div>

                      <div>
                        {isClaimed ? (
                          <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>Reclamado ✓</span>
                        ) : isReady ? (
                          <button
                            disabled={claimingId === m.id}
                            onClick={() => handleClaim(m.id)}
                            style={{
                              padding: '8px 16px', borderRadius: '10px', border: 'none',
                              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                              color: '#000', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer',
                              boxShadow: '0 0 12px rgba(251, 191, 36, 0.4)',
                            }}
                          >
                            Reclamar ✨
                          </button>
                        ) : (
                          <Link
                            href={nav.href}
                            onClick={() => setShowModal(false)}
                            style={{
                              padding: '6px 14px', borderRadius: '8px',
                              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                              color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                            }}
                          >
                            {nav.label} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
