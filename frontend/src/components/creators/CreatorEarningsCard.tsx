'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { Crown, DollarSign, Copy, TrendingUp, Clock } from '@/components/ui/Icons';

interface SaleItem {
  id: string;
  grossAmount: number;
  commission: number;
  productType: string;
  createdAt: string;
  buyer: {
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

interface PayoutItem {
  id: string;
  amount: number;
  paypalEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  requestedAt: string;
  processedAt?: string | null;
  adminNotes?: string | null;
}

interface CreatorDashboardData {
  code: string | null;
  status: string;
  totalEarnings: number;
  currentBalance: number;
  paidBalance: number;
  commissionRate: number;
  minPayout: number;
  recentSales: SaleItem[];
  payouts: PayoutItem[];
}

export default function CreatorEarningsCard() {
  const { showToast } = useToast();
  const [data, setData] = useState<CreatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCode, setEditingCode] = useState(false);
  const [desiredCode, setDesiredCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);

  // Payout Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutEmail, setPayoutEmail] = useState('');
  const [payoutAmount, setPayoutAmount] = useState<number>(10);
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const formatUsd = (val: number | null | undefined): string => {
    return Number(val ?? 0).toFixed(2);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await apiFetch<{ status: string; data: CreatorDashboardData }>('/creators/my-dashboard');
      if (res?.data) {
        setData(res.data);
        setDesiredCode(res.data.code || '');
        setPayoutAmount(Math.max(10, Math.floor(res.data.currentBalance * 100) / 100));
      }
    } catch (err: any) {
      console.error('Error fetching creator dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyLink = () => {
    if (!data?.code) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gremioweb.com';
    const link = `${origin}/pass?ref=${data.code}`;
    navigator.clipboard.writeText(link).then(() => {
      showToast('¡Enlace de referido copiado al portapapeles!', 'success');
    }).catch(() => {
      showToast(link, 'info');
    });
  };

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desiredCode.trim()) return;
    setSavingCode(true);
    try {
      const res = await apiFetch<any>('/creators/my-code', {
        method: 'POST',
        body: JSON.stringify({ desiredCode: desiredCode.trim() }),
      });
      showToast(`¡Código actualizado a "${res.data.code}"!`, 'success');
      setEditingCode(false);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar código de creador', 'error');
    } finally {
      setSavingCode(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutEmail.trim() || !payoutEmail.includes('@')) {
      showToast('Ingresa un correo electrónico de PayPal válido', 'error');
      return;
    }
    if (payoutAmount < (data?.minPayout || 10)) {
      showToast(`El retiro mínimo es de $${data?.minPayout || 10} USD`, 'error');
      return;
    }

    setSubmittingPayout(true);
    try {
      const res = await apiFetch<any>('/creators/payout', {
        method: 'POST',
        body: JSON.stringify({
          amount: payoutAmount,
          paypalEmail: payoutEmail.trim(),
        }),
      });
      showToast(res.message || '¡Solicitud de retiro enviada para revisión!', 'success');
      setShowPayoutModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al solicitar retiro', 'error');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Cargando panel de creadora...</p>
      </div>
    );
  }

  const currentBalance = data?.currentBalance ?? 0;
  const totalEarnings = data?.totalEarnings ?? 0;
  const canWithdraw = currentBalance >= (data?.minPayout ?? 10);

  return (
    <div
      className="glass-card"
      style={{
        border: '1px solid rgba(16, 185, 129, 0.35)',
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(0, 0, 0, 0.35) 100%)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '32px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Crown size={22} color="#34d399" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              Panel de Creador & Ganancias
            </h2>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
            }}>
              35% COMISIÓN ACTIVA
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
            Gana el 35% de cada Pase Estelar o membresía adquirida con tu código o enlace directo de la comunidad.
          </p>
        </div>

        {/* Action Button: Retiro */}
        <button
          onClick={() => setShowPayoutModal(true)}
          disabled={!canWithdraw}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: canWithdraw
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'rgba(255, 255, 255, 0.08)',
            color: canWithdraw ? '#fff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: canWithdraw ? 'pointer' : 'not-allowed',
            boxShadow: canWithdraw ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <DollarSign size={16} />
          <span>{canWithdraw ? 'Solicitar Retiro' : `Mínimo $${data?.minPayout || 10} USD`}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Saldo Disponible */}
        <div style={{
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
            Saldo Disponible
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
            ${formatUsd(currentBalance)}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
            Listo para retirar vía PayPal
          </div>
        </div>

        {/* Total Histórico */}
        <div style={{
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            Ganancias Totales
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
            ${formatUsd(totalEarnings)}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
            Acumulado histórico
          </div>
        </div>

        {/* Código de Creador Activo */}
        <div style={{
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
              Tu Código de Creador
            </div>
            {!editingCode && (
              <button
                type="button"
                onClick={() => setEditingCode(true)}
                style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline' }}
              >
                Editar
              </button>
            )}
          </div>

          {editingCode ? (
            <form onSubmit={handleSaveCode} style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={desiredCode}
                onChange={(e) => setDesiredCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                maxLength={20}
                placeholder="NUEVO_CODIGO"
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid #fbbf24',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                }}
              />
              <button
                type="submit"
                disabled={savingCode}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#fbbf24',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {savingCode ? '...' : 'OK'}
              </button>
              <button
                type="button"
                onClick={() => setEditingCode(false)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </form>
          ) : (
            <>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace', marginTop: '4px' }}>
                {data?.code || 'SIN_CODIGO'}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  marginTop: '6px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  color: '#fbbf24',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Copy size={12} /> Copiar enlace con tu código
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recent Sales & Payout History */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Ventas Recientes */}
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={15} color="#34d399" /> Ventas con tu Código</span>
          </div>
          {data?.recentSales && data.recentSales.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff' }}>
                      @{sale.buyer?.username || 'Fan'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {sale.productType === 'SEASON_PASS' ? 'Pase Estelar VIP' : sale.productType}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>
                      +${formatUsd(sale.commission)} USD
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '0.8rem' }}>
              Aún no hay compras con tu código. ¡Comparte tu enlace de Pase Estelar para empezar a generar ingresos!
            </div>
          )}
        </div>

        {/* Historial de Retiros */}
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={15} color="#38bdf8" /> Solicitudes de Retiro</span>
          </div>
          {data?.payouts && data.payouts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {data.payouts.map((payout) => {
                const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
                  PENDING: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', label: 'En Revisión' },
                  APPROVED: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', label: 'Aprobado' },
                  PAID: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', label: 'Pagado' },
                  REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', label: 'Rechazado' },
                };
                const st = statusStyles[payout.status] || statusStyles.PENDING;

                return (
                  <div
                    key={payout.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#fff' }}>
                        ${formatUsd(payout.amount)} USD
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {payout.paypalEmail}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: st.bg,
                          color: st.color,
                        }}
                      >
                        {st.label}
                      </span>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '0.8rem' }}>
              No has solicitado retiros todavía. Mínimo de retiro: ${data?.minPayout || 10} USD.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Retiro PayPal */}
      {showPayoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPayoutModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#161622',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '24px',
              color: '#fff',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>
              Solicitar Retiro de Saldo
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
              Transfiere tus ganancias acumuladas directamente a tu cuenta de PayPal en USD.
            </p>

            <form onSubmit={handleRequestPayout}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                  Correo de PayPal para recibir el pago:
                </label>
                <input
                  type="email"
                  value={payoutEmail}
                  onChange={(e) => setPayoutEmail(e.target.value)}
                  placeholder="tu-paypal@ejemplo.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                  Monto a retirar ($ USD):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.01"
                    min={data?.minPayout || 10}
                    max={currentBalance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    required
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(Math.floor(currentBalance * 100) / 100)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Máx
                  </button>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                  Saldo disponible: ${formatUsd(currentBalance)} USD (Mínimo: ${data?.minPayout || 10} USD)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: submittingPayout ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingPayout ? 'Enviando...' : 'Confirmar Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

