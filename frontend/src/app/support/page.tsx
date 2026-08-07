'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import ClientOnly from '@/lib/ClientOnly';
import KofiWidget from '@/components/ui/KofiWidget';

interface PlanInfo {
  name: string;
  price: number;
  description: string;
  stardustMultiplier: number;
  xpMultiplier: number;
  maxImagesPerDay: number;
  badgeColor: string;
  benefits: string[];
}

const PLAN_KEYS = ['ASTRO', 'NOVA', 'STELLAR'] as const;

const PLAN_THEMES: Record<string, { border: string; glow: string; badgeBg: string; gradient: string }> = {
  ASTRO: {
    border: '1px solid rgba(56, 189, 248, 0.4)',
    glow: '0 0 25px rgba(56, 189, 248, 0.15)',
    badgeBg: '#0284c7',
    gradient: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(2, 132, 199, 0.15) 100%)',
  },
  NOVA: {
    border: '1px solid rgba(192, 132, 252, 0.5)',
    glow: '0 0 30px rgba(192, 132, 252, 0.2)',
    badgeBg: '#9333ea',
    gradient: 'linear-gradient(180deg, rgba(192, 132, 252, 0.1) 0%, rgba(147, 51, 234, 0.2) 100%)',
  },
  STELLAR: {
    border: '1px solid rgba(251, 191, 36, 0.6)',
    glow: '0 0 35px rgba(251, 191, 36, 0.25)',
    badgeBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    gradient: 'linear-gradient(180deg, rgba(251, 191, 36, 0.12) 0%, rgba(217, 119, 6, 0.22) 100%)',
  },
};

function SupportContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Record<string, PlanInfo>>({});
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingVerified, setLoadingVerified] = useState(false);

  const handleBuyVerified = async () => {
    if (!user) {
      showToast('Debes iniciar sesión para comprar la verificación', 'info');
      return;
    }
    setLoadingVerified(true);
    try {
      showToast('Abriendo pasarela segura de PayPal...', 'info');
      const res = await apiFetch('/payments/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: 1.5, type: 'VERIFICATION' }),
      });
      if (res?.approveUrl) window.location.href = res.approveUrl;
      else showToast('No se pudo generar la pasarela de PayPal.', 'error');
    } catch (err: any) {
      showToast(err?.message || 'Error al conectar con PayPal', 'error');
    } finally {
      setLoadingVerified(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansRes, myPlanRes] = await Promise.all([
          apiFetch('/ecosystem/plans').catch(() => null),
          user ? apiFetch('/ecosystem/plan').catch(() => null) : null,
        ]);
        if (plansRes?.data) setPlans(plansRes.data);
        if (myPlanRes?.data?.plan) setCurrentPlan(myPlanRes.data.plan);
      } catch (err) {
        console.error('Error loading plans:', err);
      }
    };
    loadData();
  }, [user]);

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      showToast('Debes iniciar sesión para suscribirte', 'info');
      return;
    }
    const priceMap: Record<string, number> = { ASTRO: 2.99, NOVA: 5.99, STELLAR: 12.99 };
    const price = plans[planKey]?.price || priceMap[planKey] || 5.99;

    setLoadingPlan(planKey);
    try {
      showToast('Abriendo pasarela segura de PayPal...', 'info');
      const res = await apiFetch('/payments/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: price,
          type: 'PLAN_SUSCRIPTION',
          planKey,
        }),
      });
      if (res?.approveUrl) {
        window.location.href = res.approveUrl;
      } else {
        showToast('No se pudo generar la pasarela de PayPal.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al conectar con PayPal', 'error');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '10px', fontSize: '2.5rem' }}>Apoya a la Comunidad 💜</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '8px', maxWidth: '620px', margin: '0 auto' }}>
          Conviértete en miembro Premium y obtén beneficios exclusivos mientras apoyas
          a los VTubers de Gremio Estelar. El pago se procesa de forma segura con PayPal.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '24px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          marginBottom: '40px',
        }}
      >
        {PLAN_KEYS.map((key) => {
          const plan = plans[key];
          const theme = PLAN_THEMES[key];
          const isCurrent = currentPlan === key;
          const isLoading = loadingPlan === key;

          return (
            <div
              key={key}
              className="glass"
              style={{
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                border: isCurrent ? `2px solid ${theme.badgeBg}` : theme.border,
                boxShadow: isCurrent ? theme.glow : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: theme.badgeBg,
                }}
              />
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '3px',
                    borderRadius: '2px',
                    background: theme.badgeBg,
                    margin: '0 auto 12px',
                  }}
                />
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{plan?.name || key}</h3>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>${plan?.price ?? priceByKey(key)}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>/mes</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '8px' }}>{plan?.description}</p>
              </div>
              <div style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(plan?.benefits || []).slice(0, 6).map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--success)' }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe(key)}
                className="btn"
                disabled={isCurrent || !!loadingPlan}
                style={{
                  marginTop: '24px',
                  padding: '12px',
                  width: '100%',
                  background: isCurrent
                    ? 'transparent'
                    : key === 'STELLAR'
                    ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                    : key === 'NOVA'
                    ? 'linear-gradient(135deg, #c084fc, #9333ea)'
                    : 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  border: isCurrent ? `1px solid ${theme.badgeBg}` : 'none',
                  color: isCurrent ? 'var(--muted)' : key === 'STELLAR' ? '#000' : '#fff',
                  fontWeight: 700,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isCurrent ? 'default' : 'pointer',
                }}
              >
                {isCurrent
                  ? 'Plan actual ✓'
                  : isLoading
                  ? 'Abriendo PayPal...'
                  : `Suscribirme con PayPal — $${plan?.price ?? priceByKey(key)}/mes`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Insignia de Verificación — $1.50/mes (incluida en STELLAR) */}
      <div className="glass" style={{ padding: '24px', borderRadius: '20px', marginBottom: '24px', border: '1px solid rgba(29,155,240,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1', minWidth: '260px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: 'radial-gradient(circle at 30% 30%, #1d9bf0, #0b6bc0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.15)"/>
                <polyline points="7.5 12.5 10.5 15.5 16.5 8.5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#fff' }}>🔵 Insignia de Verificación</h3>
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.88rem' }}>
                Insignia azul oficial para cualquier usuario. {currentPlan === 'STELLAR' ? '✨ Ya incluida en tu Plan Stellar Elite.' : 'También incluida gratis con el Plan Stellar Elite.'}
              </p>
            </div>
          </div>
          {currentPlan === 'STELLAR' ? (
            <span style={{ color: '#00e676', fontWeight: 800 }}>✓ Verificado activo</span>
          ) : (
            <button
              onClick={handleBuyVerified}
              className="btn"
              disabled={loadingVerified}
              style={{ background: 'linear-gradient(135deg, #1d9bf0, #0b6bc0)', color: '#fff', fontWeight: 800, padding: '12px 22px' }}
            >
              {loadingVerified ? 'Abriendo PayPal...' : '🔵 Verificar mi cuenta — $1.50/mes'}
            </button>
          )}
        </div>
      </div>

      <div className="glass" style={{ padding: '28px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#fff' }}>Apoyar mediante Ko-fi ☕</h3>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
              ¿Prefieres invitar un café rápido al proyecto o a un creador? Puedes hacer una donación directa por Ko-fi.
            </p>
          </div>
          <KofiWidget kofiId="B0B5WM9E1" label="Invitar un café en Ko-fi ☕" />
        </div>
      </div>
    </>
  );
}

function priceByKey(key: string): number {
  return { ASTRO: 2.99, NOVA: 5.99, STELLAR: 12.99 }[key] || 5.99;
}

export default function SupportPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px', maxWidth: '900px' }}>
      <ClientOnly
        fallback={
          <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
            Cargando...
          </div>
        }
      >
        <SupportContent />
      </ClientOnly>
    </div>
  );
}
