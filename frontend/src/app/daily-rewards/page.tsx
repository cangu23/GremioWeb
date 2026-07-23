'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';

interface RewardDay {
  day: number;
  xp: number;
  label: string;
  bonus?: boolean;
}

interface RewardStatus {
  canClaim: boolean;
  claimedToday?: boolean;
  currentDay: number;
  lastClaimedDay?: number | null;
  nextRewardAt: string | null;
  rewards: RewardDay[];
  history: Array<{ day: number; xpAwarded: number; bonus: boolean; claimedAt: string }>;
  totalClaims: number;
}

function RewardsContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<{ day: number; xpAwarded: number; bonus: boolean; label: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchStatus();
    }
  }, [user, isLoading, router]);

  const fetchStatus = async () => {
    try {
      const data = await apiFetch('/daily-rewards/status', {});
      setStatus(data);
    } catch {}
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const result = await apiFetch('/daily-rewards/claim', { method: 'POST' });
      setClaimed(result);
      showToast(`+${result.xpAwarded} XP — ${result.bonus ? '¡BONUS!' : `Día ${result.day}`}`, 'success');
      fetchStatus();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al reclamar', 'error');
    } finally {
      setClaiming(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!status?.nextRewardAt) return;
    const interval = setInterval(() => {
      const diff = new Date(status.nextRewardAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('¡Disponible!');
        fetchStatus();
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [status?.nextRewardAt]);

  if (isLoading || !user) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px', maxWidth: '700px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Recompensas Diarias</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Reclama tu recompensa cada 24 horas. ¡Mantén tu racha para obtener mejores premios!
        </p>
      </div>

      {/* Current reward card */}
      {claimed ? (
        <div className="glass" style={{
          padding: '40px', textAlign: 'center', marginBottom: '32px',
          borderColor: claimed.bonus ? 'rgba(245,158,11,0.3)' : 'rgba(139,92,246,0.2)',
          animation: 'fadeInUp 0.5s ease',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
            background: claimed.bonus
              ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))'
              : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.05))',
            border: `2px solid ${claimed.bonus ? 'rgba(245,158,11,0.3)' : 'rgba(139,92,246,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={claimed.bonus ? '#F59E0B' : '#8B5CF6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
            ¡Recompensa reclamada!
          </h2>
          <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>
            +{claimed.xpAwarded} XP • {claimed.bonus ? '🎉 BONUS' : `Día ${claimed.day}`}
          </p>
          {status && !status.canClaim && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px' }}>
              Próxima recompensa en: {timeLeft}
            </p>
          )}
          {status?.canClaim && (
            <button onClick={handleClaim} className="btn" style={{ marginTop: '16px', padding: '12px 32px' }}>
              Reclamar siguiente
            </button>
          )}
        </div>
      ) : (
        <div className="glass" style={{
          padding: '40px', textAlign: 'center', marginBottom: '32px',
          borderColor: status?.canClaim ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
            background: status?.canClaim
              ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))'
              : 'rgba(255,255,255,0.03)',
            border: `2px solid ${status?.canClaim ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={status?.canClaim ? '#8B5CF6' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
            {status?.canClaim ? '¡Recompensa disponible!' : 'Recompensa de hoy reclamada'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            {status?.canClaim
              ? `Reclama tu recompensa del día ${status.currentDay}`
              : `Has reclamado el Día ${status?.currentDay || 1} hoy. Próxima recompensa en: ${timeLeft}`}
          </p>
          {status?.canClaim && (
            <button onClick={handleClaim} disabled={claiming} className="btn" style={{ padding: '12px 32px', fontSize: '1rem' }}>
              {claiming ? 'Reclamando...' : `Reclamar (Día ${status.currentDay})`}
            </button>
          )}
          {!status?.canClaim && status && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Vuelve en {timeLeft} para tu próxima recompensa
            </p>
          )}
        </div>
      )}

      {/* Weekly rewards grid */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Recompensas de la semana</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {(status?.rewards || []).map((reward) => {
            const isClaimed = status?.history.some(h => h.day === reward.day);
            const isCurrent = status?.currentDay === reward.day;
            const isPast = (status?.history.some(h => h.day === reward.day));
            return (
              <div key={reward.day} className="glass" style={{
                padding: '16px', textAlign: 'center', borderRadius: '12px',
                borderColor: isCurrent && status?.canClaim
                  ? 'rgba(139,92,246,0.3)'
                  : isClaimed
                    ? 'rgba(0,230,118,0.15)'
                    : 'rgba(255,255,255,0.04)',
                opacity: isPast ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {isCurrent && status?.canClaim && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  }} />
                )}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 8px',
                  background: isClaimed
                    ? 'rgba(0,230,118,0.1)'
                    : reward.bonus
                      ? 'rgba(245,158,11,0.1)'
                      : 'rgba(139,92,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem',
                }}>
                  {isClaimed ? '✓' : reward.bonus ? '⭐' : reward.day}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  {reward.bonus ? '🎉 BONUS' : `Día ${reward.day}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: reward.bonus ? '#F59E0B' : 'var(--text-muted)' }}>
                  +{reward.xp} XP
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      {status && (
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Estadísticas</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total reclamados</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{status.totalClaims}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Racha actual</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Día {status.currentDay}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semana completa</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {status.history.filter(h => h.bonus).length > 0 ? '✓' : '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyRewardsPage() {
  return (
    <ClientOnly>
      <RewardsContent />
    </ClientOnly>
  );
}
