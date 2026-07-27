'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import UserAvatar from '@/components/ui/UserAvatar';
import Link from 'next/link';

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

interface StardustStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StardustStatsModal({ isOpen, onClose }: StardustStatsModalProps) {
  const [data, setData] = useState<StardustData | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'history' | 'transfer'>('overview');
  const [mounted, setMounted] = useState(false);

  // Transfer state
  const [transferTarget, setTransferTarget] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Gift Plan state
  const [giftTarget, setGiftTarget] = useState('');
  const [selectedGiftPlan, setSelectedGiftPlan] = useState<'ASTRO' | 'NOVA' | 'STELLAR'>('ASTRO');
  const [giftSubmitting, setGiftSubmitting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStardustData = useCallback(async () => {
    setLoading(true);
    try {
      const [stardustRes, missionsRes] = await Promise.all([
        apiFetch('/ecosystem/stardust').catch(() => null),
        apiFetch('/ecosystem/missions').catch(() => null),
      ]);

      if (stardustRes?.data) {
        setData(stardustRes.data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('stardust-updated'));
        }
      }
      if (missionsRes?.data) {
        setMissions(missionsRes.data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStardustData();
    }
  }, [isOpen, fetchStardustData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const handleTransferStardust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget.trim() || !transferAmount) return;
    const amount = Number(transferAmount);
    if (amount <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    setTransferSubmitting(true);
    try {
      const res = await apiFetch('/ecosystem/stardust/transfer', {
        method: 'POST',
        body: JSON.stringify({
          targetUser: transferTarget.trim(),
          amount,
          message: transferMessage.trim(),
        }),
      });

      showToast(res.message || '¡Polvo Estelar transferido con éxito!', 'success');
      setTransferTarget('');
      setTransferAmount('');
      setTransferMessage('');
      fetchStardustData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error en la transferencia', 'error');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleGiftPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftTarget.trim()) {
      showToast('Ingresa el nombre de usuario a quien regalarás el plan', 'error');
      return;
    }

    setGiftSubmitting(true);
    try {
      const res = await apiFetch('/ecosystem/stardust/gift-plan', {
        method: 'POST',
        body: JSON.stringify({
          targetUser: giftTarget.trim(),
          plan: selectedGiftPlan,
        }),
      });

      showToast(res.message || '¡Suscripción Premium regalada con éxito!', 'success');
      setGiftTarget('');
      fetchStardustData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al regalar el plan', 'error');
    } finally {
      setGiftSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const multiplier = data?.multiplier || 1;
  const balance = data?.stardust || 0;
  const userPlan = data?.plan || 'FREE';
  const userRole = data?.role || 'USER';
  const isEligibleToGift =
    userPlan === 'ASTRO' ||
    userPlan === 'NOVA' ||
    userPlan === 'STELLAR' ||
    userRole === 'VTUBER' ||
    userRole === 'MAID' ||
    userRole === 'ADMIN';

  const pendingMissions = missions.filter((m) => m.isCompleted && !m.isClaimed);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94vw',
          maxWidth: '680px',
          maxHeight: '88vh',
          background: 'linear-gradient(145deg, #181730, #100f24)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.8), 0 0 30px rgba(245,158,11,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInUp 0.25s ease-out',
        }}
      >
        {/* ===== HEADER ===== */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(139,92,246,0.05))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {user ? (
              <UserAvatar
                src={user.avatarUrl || user.vtuberProfile?.avatarUrl}
                alt={user.displayName || user.username}
                size={44}
                user={user}
              />
            ) : (
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              }}>
                ⭐
              </div>
            )}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Estadísticas de Stardust
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {user ? `@${user.username} • Puntos estelares, misiones y regalos` : 'Tus puntos estelares, misiones y regalos'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* ===== TABS NAV ===== */}
        <div style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0 20px',
          background: 'rgba(0, 0, 0, 0.25)',
          overflowX: 'auto',
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              color: activeTab === 'overview' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'overview' ? 800 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '2px solid #f59e0b' : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              color: activeTab === 'missions' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'missions' ? 800 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'missions' ? '2px solid #f59e0b' : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            Misiones
            {pendingMissions.length > 0 && (
              <span style={{
                marginLeft: '4px',
                padding: '2px 6px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#000',
                fontSize: '0.68rem',
                fontWeight: 800,
              }}>
                {pendingMissions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              color: activeTab === 'transfer' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'transfer' ? 800 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'transfer' ? '2px solid #f59e0b' : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            🎁 Transferir & Regalar
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              color: activeTab === 'history' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'history' ? 800 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'history' ? '2px solid #f59e0b' : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            Historial
          </button>
        </div>

        {/* ===== CONTENT BODY ===== */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Cargando estadísticas estelares...
            </div>
          ) : (
            <>
              {/* === OVERVIEW TAB === */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(139,92,246,0.1))',
                    border: '1px solid rgba(245,158,11,0.35)',
                    boxShadow: '0 12px 35px rgba(245,158,11,0.15)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px',
                  }}>
                    {/* Ambient shimmer background line */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0, left: '-100%',
                        width: '100%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        animation: 'stardustShimmer 4s infinite',
                        pointerEvents: 'none',
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
                      {user && (
                        <UserAvatar
                          src={user.avatarUrl || user.vtuberProfile?.avatarUrl}
                          alt={user.displayName || user.username}
                          size={54}
                          user={user}
                        />
                      )}
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                          {user ? `${user.displayName || user.username} • Saldo Actual` : 'Saldo de Stardust Actual'}
                        </span>
                        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ animation: 'stardustFloat 3s ease-in-out infinite alternate', display: 'inline-block' }}>⭐</span>
                          {balance.toLocaleString()}
                          <span style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: 700 }}>Stardust</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', zIndex: 1 }}>
                      <span style={{
                        padding: '5px 12px',
                        borderRadius: '12px',
                        background: multiplier > 1 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)',
                        border: `1px solid ${multiplier > 1 ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.12)'}`,
                        color: multiplier > 1 ? '#f59e0b' : 'var(--text-muted)',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        display: 'inline-block',
                        boxShadow: multiplier > 1 ? '0 0 12px rgba(245,158,11,0.3)' : 'none',
                      }}>
                        Multiplicador ×{multiplier.toFixed(1)} {multiplier > 1 ? '✨ ACTIVO' : ''}
                      </span>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px', margin: 0 }}>
                        {multiplier > 1 ? `Tu plan ${data?.plan} otorga +${Math.round((multiplier - 1) * 100)}% extra` : 'Obtén Premium para aumentar tus ganancias'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
                      Accesos Rápidos Estelares
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      <button onClick={() => setActiveTab('transfer')} className="glass" style={shortcutCardStyle}>
                        <span style={{ fontSize: '1.4rem' }}>🎁</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Regalar</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enviar Puntos/Plan</span>
                      </button>

                      <Link href="/shop" onClick={onClose} className="glass" style={shortcutCardStyle}>
                        <span style={{ fontSize: '1.4rem' }}>🛍️</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Tienda</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gastar Stardust</span>
                      </Link>

                      <Link href="/roulette" onClick={onClose} className="glass" style={shortcutCardStyle}>
                        <span style={{ fontSize: '1.4rem' }}>🎰</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Ruleta</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Girar y Ganar</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* === MISSIONS TAB === */}
              {activeTab === 'missions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {missions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                      No hay misiones activas por ahora.
                    </p>
                  ) : (
                    missions.map((m) => {
                      const percent = Math.min(100, Math.round((m.currentCount / m.targetCount) * 100));
                      return (
                        <div
                          key={m.id}
                          className="glass"
                          style={{
                            padding: '16px',
                            borderRadius: '14px',
                            borderColor: m.isClaimed ? 'rgba(0,230,118,0.2)' : m.isCompleted ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)',
                            background: m.isClaimed ? 'rgba(0,230,118,0.03)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{m.title}</h4>
                                <span style={{
                                  fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px',
                                  background: m.type === 'DAILY' ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.2)',
                                  color: m.type === 'DAILY' ? 'var(--primary)' : '#f59e0b', fontWeight: 700,
                                }}>
                                  {m.type === 'DAILY' ? 'Diaria' : 'Semanal'}
                                </span>
                              </div>
                              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.description}</p>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>
                                +{m.stardustReward} ⭐
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${percent}%`, height: '100%',
                                background: m.isCompleted ? '#00e676' : 'var(--primary)',
                                transition: 'width 0.4s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '45px', textAlign: 'right' }}>
                              {m.currentCount}/{m.targetCount}
                            </span>

                            {m.isCompleted && !m.isClaimed && (
                              <button
                                onClick={() => handleClaimMission(m.id)}
                                disabled={claimingId === m.id}
                                className="btn"
                                style={{ padding: '4px 12px', fontSize: '0.75rem', height: '28px' }}
                              >
                                {claimingId === m.id ? '...' : 'Reclamar'}
                              </button>
                            )}

                            {m.isClaimed && (
                              <span style={{ fontSize: '0.72rem', color: '#00e676', fontWeight: 700 }}>
                                ✓ Reclamado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* === TRANSFER & GIFT TAB === */}
              {activeTab === 'transfer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Section A: Transfer Stardust */}
                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
                      <span>🪙</span> Regalar & Transferir Polvo Estelar (Puntos)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Envía Stardust directamente a otro usuario con animación y notificación en tiempo real.
                    </p>

                    {/* Preset Amount Chips */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        Montos Rápidos
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {[
                          { amount: 50, icon: '🍬', label: 'Caramelito' },
                          { amount: 100, icon: '☕', label: 'Café' },
                          { amount: 250, icon: '🍰', label: 'Pastel' },
                          { amount: 500, icon: '✨', label: 'Varita' },
                          { amount: 1000, icon: '💎', label: 'Gemas' },
                          { amount: 5000, icon: '👑', label: 'Corona' },
                        ].map((p) => (
                          <button
                            key={p.amount}
                            type="button"
                            onClick={() => setTransferAmount(String(p.amount))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '10px',
                              border: transferAmount === String(p.amount) ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                              background: transferAmount === String(p.amount) ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              color: transferAmount === String(p.amount) ? '#fbbf24' : '#fff',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>{p.icon}</span> ⭐ {p.amount}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleTransferStardust} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Usuario Destinatario
                          </label>
                          <input
                            type="text"
                            placeholder="ej: @usuario o correo"
                            value={transferTarget}
                            onChange={(e) => setTransferTarget(e.target.value)}
                            className="input"
                            style={{ width: '100%', fontSize: '0.88rem' }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Cantidad (Max ⭐ {balance.toLocaleString()})
                          </label>
                          <input
                            type="number"
                            placeholder="ej: 100"
                            min="1"
                            max={balance}
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="input"
                            style={{ width: '100%', fontSize: '0.88rem' }}
                            required
                          />
                        </div>
                      </div>

                      {/* Quick Messages */}
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Mensaje Opcional
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                          {['¡Excelente contenido! 👏', '¡Un regalito estelar! 🎁', '¡Para un café! ☕', '¡Sigue así, crack! 🚀'].map((msg) => (
                            <button
                              key={msg}
                              type="button"
                              onClick={() => setTransferMessage(msg)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                border: transferMessage === msg ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
                                background: transferMessage === msg ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                color: transferMessage === msg ? '#fbbf24' : '#9ca3af',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                            >
                              {msg}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="¡Gracias por tu ayuda en el gremio!"
                          value={transferMessage}
                          onChange={(e) => setTransferMessage(e.target.value)}
                          className="input"
                          style={{ width: '100%', fontSize: '0.88rem' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={transferSubmitting || !transferTarget.trim() || !transferAmount}
                        className="btn"
                        style={{
                          alignSelf: 'flex-start',
                          padding: '10px 24px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                          cursor: 'pointer',
                        }}
                      >
                        {transferSubmitting ? 'Enviando...' : '🚀 Regalar Stardust'}
                      </button>
                    </form>
                  </div>

                  {/* Section B: Gift Premium Plan */}
                  <div className="glass" style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(56,189,248,0.06))',
                    borderColor: 'rgba(139,92,246,0.3)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎁</span> Regalar Suscripción Premium
                      </h3>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        background: isEligibleToGift ? 'rgba(0,230,118,0.2)' : 'rgba(239,68,68,0.2)',
                        color: isEligibleToGift ? '#00e676' : '#ef4444',
                        fontWeight: 700,
                      }}>
                        {isEligibleToGift ? '✓ Función Desbloqueada' : '🔒 Requiere Plan $2.99 / $5.99'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Exclusivo para suscriptores Astro o Nova Pro: Regala 10 días de suscripción Premium a un amigo usando tu acumulado de Stardust.
                    </p>

                    <form onSubmit={handleGiftPlan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Plan Cards Selector */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <div
                          onClick={() => setSelectedGiftPlan('ASTRO')}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '12px',
                            background: selectedGiftPlan === 'ASTRO' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)',
                            border: selectedGiftPlan === 'ASTRO' ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38BDF8' }}>Astro ($2.99)</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFF', marginTop: '4px' }}>15,000 🪙</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stardust</div>
                        </div>

                        <div
                          onClick={() => setSelectedGiftPlan('NOVA')}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '12px',
                            background: selectedGiftPlan === 'NOVA' ? 'rgba(192,132,252,0.2)' : 'rgba(255,255,255,0.03)',
                            border: selectedGiftPlan === 'NOVA' ? '2px solid #C084FC' : '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#C084FC' }}>Nova Pro ($5.99)</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFF', marginTop: '4px' }}>35,000 🪙</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stardust</div>
                        </div>

                        <div
                          onClick={() => setSelectedGiftPlan('STELLAR')}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '12px',
                            background: selectedGiftPlan === 'STELLAR' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.03)',
                            border: selectedGiftPlan === 'STELLAR' ? '2px solid #FBBF24' : '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FBBF24' }}>Stellar ($12.99)</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFF', marginTop: '4px' }}>80,000 🪙</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stardust</div>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Usuario Destinatario del Regalo
                        </label>
                        <input
                          type="text"
                          placeholder="ej: @amigo o correo"
                          value={giftTarget}
                          onChange={(e) => setGiftTarget(e.target.value)}
                          className="input"
                          style={{ width: '100%', fontSize: '0.88rem' }}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={giftSubmitting || !isEligibleToGift || !giftTarget.trim()}
                        className="btn"
                        style={{
                          alignSelf: 'flex-start',
                          padding: '10px 24px',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                          color: '#FFF',
                          opacity: !isEligibleToGift ? 0.5 : 1,
                        }}
                      >
                        {giftSubmitting ? 'Procesando Regalo...' : `🎁 Regalar Plan ${selectedGiftPlan}`}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* === HISTORY TAB === */}
              {activeTab === 'history' && (
                <div>
                  {!data?.history || data.history.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                      No tienes transacciones de Stardust aún.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {data.history.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 500 }}>{t.reason}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {new Date(t.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: t.type === 'EARNED' ? '#00e676' : '#ff4d6a',
                          }}>
                            {t.type === 'EARNED' ? `+${t.amount} ⭐` : `-${t.amount} ⭐`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const shortcutCardStyle: React.CSSProperties = {
  padding: '14px 10px',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  textAlign: 'center',
  gap: '2px',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
};
