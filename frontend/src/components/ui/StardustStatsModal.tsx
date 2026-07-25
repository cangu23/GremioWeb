'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'history'>('overview');
  const { showToast } = useToast();

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
    if (isOpen) {
      fetchStardustData();
    }
  }, [isOpen, fetchStardustData]);

  // ESC key listener
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

  if (!isOpen) return null;

  const multiplier = data?.multiplier || 1;
  const balance = data?.stardust || 0;
  const pendingMissions = missions.filter(m => m.isCompleted && !m.isClaimed);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          background: '#16162a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
            }}>
              ⭐
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Estadísticas de Stardust
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Tus puntos estelares y progreso de misiones
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 24px',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              color: activeTab === 'overview' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'overview' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '2px solid #f59e0b' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              color: activeTab === 'missions' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'missions' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'missions' ? '2px solid #f59e0b' : '2px solid transparent',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            Misiones
            {pendingMissions.length > 0 && (
              <span style={{
                marginLeft: '6px',
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
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              color: activeTab === 'history' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'history' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'history' ? '2px solid #f59e0b' : '2px solid transparent',
              transition: 'all 0.2s',
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
                  {/* Balance Hero Card */}
                  <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(139,92,246,0.06))',
                    borderColor: 'rgba(245,158,11,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        Saldo Actual
                      </span>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⭐ {balance.toLocaleString()}
                        <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 600 }}>Stardust</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: multiplier > 1 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
                        border: `1px solid ${multiplier > 1 ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.12)'}`,
                        color: multiplier > 1 ? '#f59e0b' : 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-block',
                      }}>
                        Multiplicador ×{multiplier.toFixed(1)} {multiplier > 1 ? '✨ ACTIVE' : ''}
                      </span>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                        {multiplier > 1 ? `Plan ${data?.plan} otorga +${Math.round((multiplier - 1) * 100)}% extra` : 'Obtén Premium para aumentar tus ganancias'}
                      </p>
                    </div>
                  </div>

                  {/* QUICK SHORTCUTS GRID */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
                      Accesos Rápidos Estelares
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      <Link href="/shop" onClick={onClose} className="glass" style={shortcutCardStyle}>
                        <span style={{ fontSize: '1.4rem' }}>🛍️</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Tienda</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gastar Stardust</span>
                      </Link>

                      <Link href="/daily-rewards" onClick={onClose} className="glass" style={shortcutCardStyle}>
                        <span style={{ fontSize: '1.4rem' }}>🎁</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Diarias</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ganar XP / Star</span>
                      </Link>

                      <Link href="/pass" onClick={onClose} className="glass" style={shortcutCardStyle}>
                        <span style={{ fontSize: '1.4rem' }}>🚀</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Pase Estelar</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recompensas</span>
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
                    missions.map(m => {
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

                          {/* Progress bar & Claim button */}
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

              {/* === HISTORY TAB === */}
              {activeTab === 'history' && (
                <div>
                  {!data?.history || data.history.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                      No tienes transacciones de Stardust aún.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {data.history.map(t => (
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
    </div>
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
