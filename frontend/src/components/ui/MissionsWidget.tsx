'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';

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

function ScrollIcon({ size = 18, color = 'var(--primary)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.7 0 3-1.3 3-3z"/>
      <path d="M15 2H6a2 2 0 0 0-2 2v2"/>
    </svg>
  );
}

function SparklesIcon({ size = 14, color = '#000' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    </svg>
  );
}

export default function MissionsWidget() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stardust, setStardust] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
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
      console.error('Error loading missions widget data:', err);
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

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '24px',
    }}>
      {/* HEADER WITH STARDUST BALANCE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <ScrollIcon size={20} color="#38bdf8" />
            Misiones Diarias
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted, #a1a1aa)' }}>
            Completa retos para ganar XP y Stardust
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.25))',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          boxShadow: '0 0 15px rgba(251, 191, 36, 0.2)',
        }}>
          <StarIcon size={15} color="#fbbf24" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fbbf24' }}>
            {stardust} Stardust
          </span>
          {multiplier > 1 && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#fbbf24', color: '#000', padding: '1px 6px', borderRadius: '6px' }}>
              ×{multiplier}
            </span>
          )}
        </div>
      </div>

      {/* MISSIONS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {missions.map((m) => {
          const isClaimed = !!m.claimedAt;
          const isReady = m.completed && !isClaimed;
          const pct = Math.min(100, Math.round((m.currentProgress / m.goal) * 100));

          // Clean title of unicode emojis if present
          const cleanTitle = m.title.replace(/^[\u1F00-\u1F9FF\u2600-\u26FF\u2700-\u27BF]\s*/, '');

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: isReady ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255,255,255,0.02)',
                border: isReady ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isClaimed ? '#71717a' : '#fff' }}>
                    {cleanTitle}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    +{m.stardustReward} <StarIcon size={11} color="#fbbf24" /> | +{m.xpReward} XP
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: isClaimed
                        ? '#4b5563'
                        : isReady
                        ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                        : 'linear-gradient(90deg, #38bdf8, #818cf8)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #a1a1aa)', minWidth: '32px' }}>
                    {m.currentProgress}/{m.goal}
                  </span>
                </div>
              </div>

              <div>
                {isClaimed ? (
                  <span style={{ fontSize: '0.78rem', color: '#71717a', fontWeight: 600, padding: '6px 12px' }}>
                    Reclamado ✓
                  </span>
                ) : isReady ? (
                  <button
                    disabled={claimingId === m.id}
                    onClick={() => handleClaim(m.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      color: '#000',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: '0 0 12px rgba(251, 191, 36, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <SparklesIcon size={13} color="#000" />
                    Reclamar
                  </button>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#71717a', padding: '6px 12px' }}>
                    En progreso
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
