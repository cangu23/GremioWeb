'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import StardustStatsModal from '@/components/ui/StardustStatsModal';
import SendStardustModal from '@/components/ui/SendStardustModal';

interface Transaction {
  id: string;
  type: 'EARNED' | 'SPENT';
  amount: number;
  reason: string;
  createdAt: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'DAILY' | 'WEEKLY';
  stardustReward: number;
  xpReward: number;
  actionRequired: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

interface StardustData {
  stardust: number;
  multiplier: number;
  plan: string;
  role: string;
  history: Transaction[];
}

function getTransactionMeta(reason: string) {
  const r = reason.toLowerCase();
  if (r.includes('ruleta') || r.includes('giro')) {
    return { icon: '🎰', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', color: '#c084fc', label: 'Ruleta' };
  }
  if (r.includes('transferencia') || r.includes('regalo') || r.includes('propina') || r.includes('café') || r.includes('enviada')) {
    return { icon: '🎁', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24', label: 'Regalo' };
  }
  if (r.includes('paypal') || r.includes('plan') || r.includes('bono')) {
    return { icon: '💳', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8', label: 'Suscripción' };
  }
  if (r.includes('misión') || r.includes('mission')) {
    return { icon: '🎯', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', color: '#34d399', label: 'Misión' };
  }
  if (r.includes('tienda') || r.includes('compra')) {
    return { icon: '🛍️', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)', color: '#fb7185', label: 'Tienda' };
  }
  return { icon: '⭐', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24', label: 'Stardust' };
}

function StardustContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<StardustData | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const fetchStardustData = useCallback(async () => {
    setLoading(true);
    try {
      const [stardustRes, missionsRes] = await Promise.all([
        apiFetch('/ecosystem/stardust').catch(() => null),
        apiFetch('/ecosystem/missions').catch(() => null),
      ]);

      if (stardustRes?.data) {
        setData(stardustRes.data);
      }
      if (missionsRes?.data) {
        setMissions(missionsRes.data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStardustData();
    }
  }, [user, fetchStardustData]);

  const handleClaimMission = async (missionId: string) => {
    setClaimingId(missionId);
    try {
      const res = await apiFetch(`/ecosystem/missions/${missionId}/claim`, { method: 'POST' });
      if (res?.data) {
        showToast(`¡Misión reclamada! +${res.data.stardustAwarded || 0} ⭐ Stardust`, 'success');
        fetchStardustData();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al reclamar misión', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Cargando estadísticas de Stardust...
      </div>
    );
  }

  const balance = data?.stardust || 0;
  const multiplier = data?.multiplier || 1;

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px', maxWidth: '950px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            ⭐ Estadísticas de Stardust
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Administra tu moneda estelar, transfiere puntos y regala suscripciones Premium.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn btn--primary"
          style={{ padding: '12px 24px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '14px' }}
        >
          🎁 Regalar y Transferir Stardust
        </button>
      </div>

      {/* BALANCE HERO CARD */}
      <div
        className="glass"
        style={{
          padding: '24px 28px',
          borderRadius: '24px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(139,92,246,0.12) 50%, rgba(15,23,42,0.95) 100%)',
          border: '1px solid rgba(245,158,11,0.4)',
          boxShadow: '0 16px 45px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Shimmer sweep effect overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            animation: 'stardustShimmer 4s infinite',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', zIndex: 1, minWidth: 0 }}>
          {user && (
            <UserAvatar
              src={user.avatarUrl || user.vtuberProfile?.avatarUrl}
              alt={user.displayName || user.username}
              size={60}
              user={user}
            />
          )}
          <div>
            <span style={{ fontSize: '0.78rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
              {user ? `${user.displayName || user.username} • SALDO ACTUAL` : 'SALDO DE STARDUST ACTUAL'}
            </span>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px', lineHeight: 1.1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              <span style={{ animation: 'stardustFloat 3s ease-in-out infinite alternate', display: 'inline-block', filter: 'drop-shadow(0 0 10px #fbbf24)' }}>⭐</span>
              {balance >= 99999990 || user?.role?.includes('ADMIN') ? '♾️ Infinito' : balance.toLocaleString()}
              <span style={{ fontSize: '1.05rem', color: '#fbbf24', fontWeight: 800, marginLeft: '2px' }}>Stardust</span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '6px',
          zIndex: 1,
          flexShrink: 0,
        }}>
          <div style={{
            padding: '7px 16px',
            borderRadius: '999px',
            background: multiplier > 1 ? 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.4))' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${multiplier > 1 ? '#fbbf24' : 'rgba(255,255,255,0.15)'}`,
            color: multiplier > 1 ? '#fbbf24' : 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: multiplier > 1 ? '0 0 16px rgba(245,158,11,0.35)' : 'none',
            whiteSpace: 'nowrap',
          }}>
            Multiplicador ×{multiplier.toFixed(1)} {multiplier > 1 ? '✨ ACTIVO' : ''}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap' }}>
            {multiplier > 1 ? `Tu plan ${data?.plan} otorga un +${Math.round((multiplier - 1) * 100)}% extra` : 'Aumenta tus ganancias pasando a Premium'}
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        <button onClick={() => setShowSendModal(true)} className="glass" style={{ ...actionCardStyle, cursor: 'pointer', textAlign: 'left', border: 'none', background: 'rgba(245,158,11,0.15)' }}>
          <span style={{ fontSize: '2rem' }}>🎁</span>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Regalar / Transferir</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Envía Polvo Estelar o regalos</div>
          </div>
        </button>

        <Link href="/shop" className="glass" style={actionCardStyle}>
          <span style={{ fontSize: '2rem' }}>🔭</span>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Observatorio Estelar</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Compra marcos, roles y títulos</div>
          </div>
        </Link>

        <Link href="/daily-rewards" className="glass" style={actionCardStyle}>
          <span style={{ fontSize: '2rem' }}>🎁</span>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Recompensas Diarias</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Reclama tu racha de login</div>
          </div>
        </Link>

        <Link href="/roulette" className="glass" style={actionCardStyle}>
          <span style={{ fontSize: '2rem' }}>🎰</span>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Ruleta Mística</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Prueba tu suerte diariamente</div>
          </div>
        </Link>
      </div>

      {/* TWO COLUMNS: MISSIONS & HISTORY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {/* MISSIONS COLUMN */}
        <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 Misiones Activas
          </h3>

          {missions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay misiones disponibles.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[...missions].sort((a, b) => {
                const aClaimed = !!a.isClaimed;
                const bClaimed = !!b.isClaimed;
                const aDone = a.isCompleted || (a.currentCount >= a.targetCount);
                const bDone = b.isCompleted || (b.currentCount >= b.targetCount);
                const getPriority = (claimed: boolean, done: boolean) => {
                  if (done && !claimed) return 0;
                  if (!done && !claimed) return 1;
                  return 2;
                };
                return getPriority(aClaimed, aDone) - getPriority(bClaimed, bDone);
              }).map((m) => {
                const percent = Math.min(100, Math.round((m.currentCount / m.targetCount) * 100));
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '16px', borderRadius: '14px',
                      background: m.isClaimed ? 'rgba(0,230,118,0.03)' : 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>{m.title}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f59e0b' }}>+{m.stardustReward} ⭐</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>{m.description}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: m.isCompleted ? '#00e676' : 'var(--primary)', transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.currentCount}/{m.targetCount}</span>

                      {m.isCompleted && !m.isClaimed && (
                        <button
                          onClick={() => handleClaimMission(m.id)}
                          disabled={claimingId === m.id}
                          className="btn"
                          style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                        >
                          {claimingId === m.id ? '...' : 'Reclamar'}
                        </button>
                      )}
                      {m.isClaimed && <span style={{ fontSize: '0.78rem', color: '#00e676', fontWeight: 700 }}>✓ Listo</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* HISTORY COLUMN */}
        <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📜 Historial Reciente
          </h3>

          {!data?.history || data.history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay movimientos registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.history.map((t) => {
                const isEarned = t.type === 'EARNED' || (t.amount > 0 && t.type !== 'SPENT');
                const absAmount = Math.abs(t.amount);
                const meta = getTransactionMeta(t.reason);
                const dateStr = new Date(t.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: meta.bg,
                          border: `1px solid ${meta.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.15rem',
                          flexShrink: 0,
                          boxShadow: `0 4px 12px ${meta.bg}`,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>
                          {t.reason}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.border}`,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {meta.label}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                            🕒 {dateStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: isEarned ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${isEarned ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                        color: isEarned ? '#34d399' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: `0 2px 10px ${isEarned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                        flexShrink: 0,
                      }}
                    >
                      <span>{isEarned ? '+' : '-'}</span>
                      <span>{absAmount.toLocaleString()}</span>
                      <span style={{ fontSize: '0.8rem' }}>⭐</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <StardustStatsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <SendStardustModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} onSuccess={() => fetchStardustData()} />
    </div>
  );
}

const actionCardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  textDecoration: 'none',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
};

export default function StardustPage() {
  return (
    <ClientOnly fallback={<div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>Cargando...</div>}>
      <StardustContent />
    </ClientOnly>
  );
}
