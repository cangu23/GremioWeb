'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

export default function AdminEconomyPage() {
  const { showToast } = useToast();
  const [targetUser, setTargetUser] = useState('');
  const [amount, setAmount] = useState(500);
  const [reason, setReason] = useState('Recompensa del Staff');
  const [submitting, setSubmitting] = useState(false);

  // Premium plan grant
  const [planTarget, setPlanTarget] = useState('');
  const [grantPlan, setGrantPlan] = useState<'ASTRO' | 'NOVA' | 'STELLAR'>('ASTRO');
  const [grantDays, setGrantDays] = useState(30);
  const [granting, setGranting] = useState(false);

  const handleGrantStardust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser.trim()) {
      showToast('Ingresa un usuario o email', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/ecosystem/stardust/admin-grant', {
        method: 'POST',
        body: JSON.stringify({
          targetUser: targetUser.trim(),
          amount: Number(amount),
          reason: reason.trim() || 'Otorgado por Admin',
        }),
      });
      showToast(res.message || `Otorgados ${amount} ⭐ a ${targetUser}`, 'success');
      setTargetUser('');
      setAmount(500);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al otorgar stardust', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          💰 Consola de Economía & Stardust ⭐
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#a0a0a0', margin: '4px 0 0' }}>
          Otorgar Stardust ilimitado a usuarios, recompensas especiales y gestión del mercado.
        </p>
      </div>

      <div style={{ background: '#0d0d12', border: '1px solid #fbbf2455', borderRadius: '12px', padding: '24px', maxWidth: '540px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fbbf24', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👑 Otorgar Stardust ⭐ (ADMIN)
        </h2>

        <form onSubmit={handleGrantStardust} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '6px' }}>Usuario objetivo (Username o Email):</label>
            <input
              type="text"
              placeholder="Ej: sebastian o user@gremio.com"
              value={targetUser}
              onChange={e => setTargetUser(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '6px' }}>Cantidad ⭐:</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '6px' }}>Motivo / Razón:</label>
              <input
                type="text"
                placeholder="Ej: Recompensa evento o sorteo"
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              border: 'none',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.90rem',
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: '0 0 16px rgba(251, 191, 36, 0.4)',
            }}
          >
            {submitting ? 'OTORGANDO...' : '👑 OTORGAR STARDUST AHORA'}
          </button>
        </form>
      </div>

      {/* Grant Premium Plan */}
      <div style={{ background: '#0d0d12', border: '1px solid #d4a03055', borderRadius: '12px', padding: '24px', maxWidth: '540px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#d4a030', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💎 Otorgar Plan Premium (ADMIN)
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!planTarget.trim()) {
              showToast('Ingresa un usuario o email', 'error');
              return;
            }
            setGranting(true);
            try {
              const res = await apiFetch('/admin/grant-plan', {
                method: 'POST',
                body: JSON.stringify({
                  targetUser: planTarget.trim(),
                  plan: grantPlan,
                  durationDays: grantDays,
                }),
              });
              showToast(res.message || `Plan ${grantPlan} otorgado a ${planTarget}`, 'success');
              setPlanTarget('');
              setGrantDays(30);
            } catch (err: unknown) {
              showToast(err instanceof Error ? err.message : 'Error al otorgar el plan', 'error');
            } finally {
              setGranting(false);
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '6px' }}>Usuario objetivo (Username, Email o ID):</label>
            <input
              type="text"
              placeholder="Ej: sebastian o user@gremio.com"
              value={planTarget}
              onChange={e => setPlanTarget(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '6px' }}>Plan:</label>
              <select
                value={grantPlan}
                onChange={e => setGrantPlan(e.target.value as 'ASTRO' | 'NOVA' | 'STELLAR')}
                style={{ width: '100%', padding: '10px 14px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
              >
                <option value="ASTRO">💎 Astro — $2.99/mes</option>
                <option value="NOVA">✨ Nova Pro — $5.99/mes</option>
                <option value="STELLAR">🌟 Stellar Elite — $12.99/mes</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '6px' }}>Duración:</label>
              <select
                value={grantDays}
                onChange={e => setGrantDays(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
              >
                <option value={7}>7 días</option>
                <option value={15}>15 días</option>
                <option value={30}>1 mes (30 días)</option>
                <option value={90}>3 meses (90 días)</option>
                <option value={365}>1 año (365 días)</option>
                <option value={3650}>Permanente (10 años)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={granting}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #d4a030, #a0782c)',
              border: 'none',
              color: '#1a1410',
              fontWeight: 900,
              fontSize: '0.90rem',
              cursor: granting ? 'wait' : 'pointer',
              boxShadow: '0 0 16px rgba(212, 160, 48, 0.4)',
            }}
          >
            {granting ? 'OTORGANDO...' : '💎 OTORGAR PLAN PREMIUM'}
          </button>
        </form>
      </div>

    </div>
  );
}
