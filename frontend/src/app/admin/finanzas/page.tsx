'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { BarChart, Server, Users, Rocket, Clock, FileText, Award, Check } from '@/components/ui/Icons';

interface RevenueSplit {
  serversAndInfra: number;
  creatorCommissions: number;
  founderAndInnovation: number;
}

interface FinancialSummary {
  grossRevenue: number;
  totalTransactions: number;
  revenueSplit: RevenueSplit;
  payoutSummary: {
    pendingAmount: number;
    pendingCount: number;
    paidAmount: number;
    paidCount: number;
  };
  topCreators: Array<{
    id: string;
    code: string;
    totalEarnings: number;
    currentBalance: number;
    salesCount: number;
    user: {
      id: string;
      username: string;
      displayName?: string | null;
      avatarUrl?: string | null;
      role: string;
    };
  }>;
}

interface PayoutItem {
  id: string;
  amount: number;
  paypalEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  adminNotes?: string | null;
  txId?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    role: string;
  };
}

export default function AdminFinanzasPage() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'creators'>('pending');

  // Process Payout Modal
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null);
  const [actionType, setActionType] = useState<'MARK_PAID' | 'REJECT'>('MARK_PAID');
  const [adminNotes, setAdminNotes] = useState('');
  const [txId, setTxId] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, payRes] = await Promise.all([
        apiFetch<{ status: string; data: FinancialSummary }>('/creators/admin/summary'),
        apiFetch<{ status: string; data: { payouts: PayoutItem[] } }>('/creators/admin/payouts'),
      ]);

      if (sumRes?.data) setSummary(sumRes.data);
      if (payRes?.data?.payouts) setPayouts(payRes.data.payouts);
    } catch (err: any) {
      showToast(err?.message || 'Error al cargar datos financieros', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    setProcessing(true);
    try {
      const res = await apiFetch<any>(`/creators/admin/payouts/${selectedPayout.id}/process`, {
        method: 'POST',
        body: JSON.stringify({
          action: actionType,
          adminNotes: adminNotes.trim() || undefined,
          txId: txId.trim() || undefined,
        }),
      });

      showToast(res.message || 'Retiro procesado correctamente', 'success');
      setSelectedPayout(null);
      setAdminNotes('');
      setTxId('');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al procesar el retiro', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const pendingPayouts = payouts.filter(p => p.status === 'PENDING' || p.status === 'APPROVED');
  const historyPayouts = payouts.filter(p => p.status === 'PAID' || p.status === 'REJECTED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart size={24} color="#10b981" /> Centro Financiero & Economía de Creadores (35 / 35 / 30)
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#a0a0a0', margin: '4px 0 0' }}>
          Gestión de ingresos por Pases Estelares, suscripciones, liquidación a VTubers y creadores, y balance de infraestructura.
        </p>
      </div>

      {/* METRICS SPLIT CARDS (35% Servidores, 35% Creadoras, 30% Fundador) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Bruto */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            Ingresos Brutos Totales
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '6px' }}>
            ${summary?.grossRevenue.toFixed(2) || '0.00'}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            {summary?.totalTransactions || 0} compras procesadas
          </div>
        </div>

        {/* 35% Servidores & Infraestructura */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Server size={13} color="#38bdf8" /> 35% Servidores & Hosting</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', marginTop: '6px' }}>
            ${summary?.revenueSplit.serversAndInfra.toFixed(2) || '0.00'}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            Fondo para Render, PostgreSQL y Cloudflare
          </div>
        </div>

        {/* 35% Creadoras */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Users size={13} color="#34d399" /> 35% Economía de Creadores</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', marginTop: '6px' }}>
            ${summary?.revenueSplit.creatorCommissions.toFixed(2) || '0.00'}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            ${summary?.payoutSummary.pendingAmount.toFixed(2) || '0.00'} pendientes de pago
          </div>
        </div>

        {/* 30% Fundador & Personal */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Rocket size={13} color="#fbbf24" /> 30% Desarrollo & Plataforma</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', marginTop: '6px' }}>
            ${summary?.revenueSplit.founderAndInnovation.toFixed(2) || '0.00'}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            Innovación, mejoras y beneficio neto
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'pending' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
            color: activeTab === 'pending' ? '#fbbf24' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={15} color="#fbbf24" /> Solicitudes Pendientes</span>
          {pendingPayouts.length > 0 && (
            <span style={{
              background: '#f59e0b',
              color: '#000',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 900,
            }}>
              {pendingPayouts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'history' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: activeTab === 'history' ? '#fff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Historial de Liquidaciones
        </button>

        <button
          onClick={() => setActiveTab('creators')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'creators' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'creators' ? '#34d399' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Ranking de Creadores
        </button>
      </div>

      {/* Tab 1: Pending Payouts */}
      {activeTab === 'pending' && (
        <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>
            Retiros por Revisar y Pagar
          </h2>

          {pendingPayouts.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '10px' }}>Creadora</th>
                    <th style={{ padding: '10px' }}>Cuenta PayPal</th>
                    <th style={{ padding: '10px' }}>Monto Solicitado</th>
                    <th style={{ padding: '10px' }}>Fecha</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayouts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>
                          {p.user.displayName || p.user.username}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          @{p.user.username} ({p.user.role})
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#38bdf8' }}>
                        {p.paypalEmail}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 900, color: '#34d399', fontSize: '0.95rem' }}>
                        ${p.amount.toFixed(2)} USD
                      </td>
                      <td style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.75rem' }}>
                        {new Date(p.requestedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedPayout(p);
                              setActionType('MARK_PAID');
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                          >
                            ✓ Pagar & Marcar
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayout(p);
                              setActionType('REJECT');
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#f87171',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              No hay solicitudes de retiro pendientes en este momento.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payout History */}
      {activeTab === 'history' && (
        <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>
            Historial de Retiros Procesados
          </h2>
          {historyPayouts.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '10px' }}>Creadora</th>
                    <th style={{ padding: '10px' }}>PayPal</th>
                    <th style={{ padding: '10px' }}>Monto</th>
                    <th style={{ padding: '10px' }}>Estado</th>
                    <th style={{ padding: '10px' }}>Detalles / Tx</th>
                    <th style={{ padding: '10px' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {historyPayouts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{p.user.displayName || p.user.username}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>@{p.user.username}</div>
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', color: '#94a3b8' }}>{p.paypalEmail}</td>
                      <td style={{ padding: '10px', fontWeight: 800, color: '#fff' }}>${p.amount.toFixed(2)} USD</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: p.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: p.status === 'PAID' ? '#34d399' : '#f87171',
                        }}>
                          {p.status === 'PAID' ? 'PAGADO' : 'RECHAZADO'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        {p.txId && <div>Tx: <code style={{ color: '#fbbf24' }}>{p.txId}</code></div>}
                        {p.adminNotes && <div>Nota: {p.adminNotes}</div>}
                      </td>
                      <td style={{ padding: '10px', fontSize: '0.72rem', color: '#64748b' }}>
                        {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              No hay retiros procesados en el historial aún.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Top Creators */}
      {activeTab === 'creators' && (
        <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>
            Creadoras con Mayor Tracción
          </h2>
          {summary?.topCreators && summary.topCreators.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {summary.topCreators.map((c, idx) => (
                <div
                  key={c.id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: idx === 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    color: idx === 0 ? '#fbbf24' : '#fff',
                  }}>
                    #{idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.user.displayName || c.user.username}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontFamily: 'monospace' }}>
                      Código: {c.code}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                      {c.salesCount} ventas generadas
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, color: '#10b981', fontSize: '0.95rem' }}>
                      ${c.totalEarnings.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>USD total</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              Aún no hay creadoras registradas con ventas.
            </div>
          )}
        </div>
      )}

      {/* Modal to Process Payout */}
      {selectedPayout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPayout(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#161622',
              borderRadius: '20px',
              border: actionType === 'MARK_PAID' ? '1px solid #10b981' : '1px solid #ef4444',
              padding: '24px',
              color: '#fff',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>
              {actionType === 'MARK_PAID' ? '✓ Confirmar Pago de Liquidación' : '✕ Rechazar Solicitud de Retiro'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px' }}>
              {actionType === 'MARK_PAID'
                ? `Estás marcando como pagado el monto de $${selectedPayout.amount.toFixed(2)} USD a ${selectedPayout.paypalEmail}.`
                : `Al rechazar, el monto de $${selectedPayout.amount.toFixed(2)} USD volverá automáticamente al saldo disponible de la creadora.`}
            </p>

            <form onSubmit={handleProcessSubmit}>
              {actionType === 'MARK_PAID' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                    ID de Transacción de PayPal (Opcional):
                  </label>
                  <input
                    type="text"
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="Ej: PAYID-XXXXX"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                  Notas para la creadora:
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionType === 'MARK_PAID' ? 'Pago enviado correctamente vía PayPal.' : 'Motivo del rechazo...'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: actionType === 'MARK_PAID'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: processing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {processing ? 'Guardando...' : actionType === 'MARK_PAID' ? 'Confirmar Pago' : 'Rechazar Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

