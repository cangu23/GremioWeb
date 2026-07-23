'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';
import ClientOnly from '@/lib/ClientOnly';

interface RewardInfo {
  type: string;
  amount: number;
  label: string;
}

interface PassLevelItem {
  level: number;
  freeReward: RewardInfo | null;
  premiumReward: RewardInfo | null;
  isClaimed: boolean;
  isUnlocked: boolean;
}

interface PassData {
  season: {
    name: string;
    theme: string;
    number: number;
    startsAt: string;
    endsAt: string;
  };
  userPass: {
    level: number;
    xp: number;
    isPremium: boolean;
    claimedLevels: number[];
  };
  levels: PassLevelItem[];
}

function StarIcon({ size = 14, color = '#fbbf24' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SparkleSvg({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    </svg>
  );
}

function LockSvg({ size = 14, color = '#71717a' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function StellarPassPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);

  const loadPass = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/ecosystem/pass');
      if (res?.data) setData(res.data);
    } catch (err) {
      console.error('Error loading Stellar Pass:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPass();
  }, [user]);

  const handleClaim = async (levelNumber: number) => {
    setClaimingLevel(levelNumber);
    try {
      const res = await apiFetch('/ecosystem/pass/claim', {
        method: 'POST',
        body: JSON.stringify({ level: levelNumber }),
      });
      showToast(res.data?.message || '¡Recompensa reclamada!', 'success');
      await loadPass();
    } catch (err: any) {
      showToast(err?.message || 'Error al reclamar nivel', 'error');
    } finally {
      setClaimingLevel(null);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#fff' }}>
        <h2>Inicia sesión para acceder al Pase Estelar</h2>
        <Link href="/login" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Ir a Iniciar Sesión</Link>
      </div>
    );
  }

  // Clean season name of unicode emojis if present
  const cleanSeasonName = data?.season?.name ? data.season.name.replace(/\s*⭐\s*/g, '') : 'Pase Estelar';

  return (
    <ClientOnly>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px', color: '#fff' }}>
        {/* HERO BANNER */}
        <div style={{
          position: 'relative',
          padding: '40px 32px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(147, 51, 234, 0.25), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '999px',
              background: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.4)',
              color: '#fbbf24', fontSize: '0.78rem', fontWeight: 800, marginBottom: '12px',
            }}>
              <StarIcon size={12} color="#fbbf24" /> TEMPORADA ACTIVA
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {cleanSeasonName} <StarIcon size={24} color="#fbbf24" />
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted, #a1a1aa)', fontSize: '0.95rem' }}>
              Progresa con tus misiones y publicaciones diarias para desbloquear recompensas exclusivas.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: '16px',
              background: data?.userPass.isPremium
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.35))'
                : 'rgba(255,255,255,0.06)',
              border: data?.userPass.isPremium ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #a1a1aa)', textTransform: 'uppercase', fontWeight: 700 }}>
                Estado del Pase
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: data?.userPass.isPremium ? '#fbbf24' : '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {data?.userPass.isPremium ? (
                  <>
                    <SparkleSvg size={16} color="#fbbf24" />
                    <span>Pase Premium Activo</span>
                  </>
                ) : (
                  'Pase Gratuito'
                )}
              </div>
            </div>
            {!data?.userPass.isPremium && (
              <div style={{ marginTop: '8px' }}>
                <Link href="/premium" style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'underline' }}>
                  Obtén un plan para activar recompensas Premium →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* PROGRESS TRACKER HEADER */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '16px 24px', marginBottom: '32px',
        }}>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #a1a1aa)' }}>Nivel Actual</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>
              Nivel {data?.userPass.level || 1}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #a1a1aa)' }}>Recompensas Reclamadas</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
              {data?.userPass.claimedLevels.length || 0} / {data?.levels.length || 10}
            </div>
          </div>
        </div>

        {/* REWARDS TRACK GRID */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando pase...</div>
          ) : (
            data?.levels.map((lvl) => {
              const isCurrent = data.userPass.level === lvl.level;

              // Clean reward labels of unicode emojis
              const cleanFreeLabel = lvl.freeReward?.label ? lvl.freeReward.label.replace(/\s*⭐\s*/g, '') : 'Sin recompensa';
              const cleanPremLabel = lvl.premiumReward?.label ? lvl.premiumReward.label.replace(/\s*[⭐✨🌟🌸]\s*/g, '') : 'Sin recompensa';

              return (
                <div
                  key={lvl.level}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    background: isCurrent
                      ? 'rgba(56, 189, 248, 0.08)'
                      : lvl.isUnlocked
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(0,0,0,0.3)',
                    border: isCurrent
                      ? '1px solid rgba(56, 189, 248, 0.4)'
                      : lvl.isUnlocked
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid rgba(255,255,255,0.03)',
                    opacity: lvl.isUnlocked ? 1 : 0.6,
                  }}
                >
                  {/* LEVEL BADGE */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: lvl.isUnlocked ? 'linear-gradient(135deg, #38bdf8, #818cf8)' : '#333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1.1rem', color: lvl.isUnlocked ? '#fff' : '#666',
                    flexShrink: 0,
                    boxShadow: lvl.isUnlocked ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
                  }}>
                    {lvl.level}
                  </div>

                  {/* REWARDS DETAILS */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* FREE TRACK */}
                    <div style={{
                      padding: '12px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase' }}>
                        Pase Gratuito
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{cleanFreeLabel}</span>
                        {lvl.freeReward?.type === 'stardust' && <StarIcon size={14} color="#fbbf24" />}
                      </div>
                    </div>

                    {/* PREMIUM TRACK */}
                    <div style={{
                      padding: '12px', borderRadius: '12px',
                      background: data.userPass.isPremium ? 'rgba(251, 191, 36, 0.06)' : 'rgba(0,0,0,0.2)',
                      border: data.userPass.isPremium ? '1px solid rgba(251, 191, 36, 0.25)' : '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <SparkleSvg size={12} color="#fbbf24" />
                        <span>Recompensa Premium</span>
                        {!data.userPass.isPremium && <LockSvg size={12} color="#fbbf24" />}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: data.userPass.isPremium ? '#fbbf24' : '#71717a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{cleanPremLabel}</span>
                        {lvl.premiumReward?.type === 'stardust' && <StarIcon size={14} color="#fbbf24" />}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div style={{ minWidth: '130px', textAlign: 'right' }}>
                    {lvl.isClaimed ? (
                      <span style={{ fontSize: '0.82rem', color: '#71717a', fontWeight: 600 }}>Reclamado ✓</span>
                    ) : lvl.isUnlocked ? (
                      <button
                        disabled={claimingLevel === lvl.level}
                        onClick={() => handleClaim(lvl.level)}
                        style={{
                          padding: '10px 18px', borderRadius: '10px', border: 'none',
                          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          color: '#000', fontWeight: 800, fontSize: '0.85rem',
                          cursor: 'pointer', boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)',
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        <SparkleSvg size={14} color="#000" />
                        Reclamar
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#52525b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <LockSvg size={13} color="#52525b" /> Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
