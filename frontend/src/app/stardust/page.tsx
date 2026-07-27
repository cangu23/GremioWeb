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
          padding: '32px',
          borderRadius: '24px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(139,92,246,0.1))',
          border: '1px solid rgba(245,158,11,0.35)',
          boxShadow: '0 16px 45px rgba(245,158,11,0.15)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
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
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            animation: 'stardustShimmer 4s infinite',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
          {user && (
            <UserAvatar
              src={user.avatarUrl || user.vtuberProfile?.avatarUrl}
              alt={user.displayName || user.username}
              size={64}
              user={user}
            />
          )}
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              {user ? `${user.displayName || user.username} • Saldo Actual` : 'Saldo de Stardust Actual'}
            </span>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ animation: 'stardustFloat 3s ease-in-out infinite alternate', display: 'inline-block' }}>⭐</span>
              {balance.toLocaleString()}
              <span style={{ fontSize: '1.1rem', color: '#f59e0b', fontWeight: 700 }}>Stardust</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', zIndex: 1 }}>
          <div style={{
            padding: '6px 14px', borderRadius: '14px',
            background: multiplier > 1 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${multiplier > 1 ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.12)'}`,
            color: multiplier > 1 ? '#f59e0b' : 'var(--text-muted)',
            fontSize: '0.9rem', fontWeight: 800, display: 'inline-block',
            boxShadow: multiplier > 1 ? '0 0 14px rgba(245,158,11,0.3)' : 'none',
          }}>
            Multiplicador ×{multiplier.toFixed(1)} {multiplier > 1 ? '✨ ACTIVO' : ''}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', margin: 0 }}>
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
          <span style={{ fontSize: '2rem' }}>🛍️</span>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Tienda Stardust</div>
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
              {missions.map((m) => {
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
              {data.history.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{t.reason}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(t.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: t.type === 'EARNED' ? '#00e676' : '#ff4d6a' }}>
                    {t.type === 'EARNED' ? `+${t.amount} ⭐` : `-${t.amount} ⭐`}
                  </div>
                </div>
              ))}
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
