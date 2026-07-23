'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';
import ClientOnly from '@/lib/ClientOnly';

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

export default function PremiumPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Record<string, PlanInfo>>({});
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [loadingPlan, setLoadingPlan] = useState(false);

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

  const handleActivate = async (planKey: string) => {
    if (!user) {
      showToast('Debes iniciar sesión para activar un plan', 'info');
      return;
    }
    setLoadingPlan(true);
    try {
      if (planKey === 'FREE') {
        await apiFetch('/ecosystem/plan/cancel', { method: 'POST' });
        setCurrentPlan('FREE');
        showToast('Has vuelto al plan Explorer gratuito', 'info');
      } else {
        const res = await apiFetch('/ecosystem/plan/activate', {
          method: 'POST',
          body: JSON.stringify({ plan: planKey }),
        });
        setCurrentPlan(planKey);
        showToast(res.data?.message || `¡Plan ${planKey} activado con éxito!`, 'success');
      }
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar el plan', 'error');
    } finally {
      setLoadingPlan(false);
    }
  };

  const CARD_THEMES: Record<string, { border: string; glow: string; badgeBg: string; gradient: string }> = {
    FREE: {
      border: '1px solid rgba(255,255,255,0.1)',
      glow: 'none',
      badgeBg: '#4b5563',
      gradient: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
    },
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

  return (
    <ClientOnly>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px', color: '#fff' }}>
        {/* HERO BANNER */}
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          borderRadius: '24px',
          background: 'radial-gradient(circle at 50% 30%, rgba(138, 43, 226, 0.25) 0%, rgba(10, 5, 25, 0.9) 70%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '48px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#fbbf24',
          }}>
            <span>✨ MEMBRESÍAS DE PLATAFORMA</span>
          </div>
          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 900,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #fff 30%, #c084fc 70%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
          }}>
            Potencia tu Experiencia en Gremio Estelar
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted, #a1a1aa)',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Nuestra filosofía: <strong style={{ color: '#fff' }}>El usuario gratuito disfruta todo el contenido</strong>. Los planes Premium multiplican tu Stardust, potencian tus niveles y desbloquean prestigio visual épico.
          </p>
        </div>

        {/* PLAN CARDS GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginBottom: '64px',
        }}>
          {['FREE', 'ASTRO', 'NOVA', 'STELLAR'].map((key) => {
            const plan = plans[key];
            const theme = CARD_THEMES[key];
            const isCurrent = currentPlan === key;

            return (
              <div
                key={key}
                style={{
                  borderRadius: '20px',
                  background: theme.gradient,
                  border: theme.border,
                  boxShadow: theme.glow,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                {key === 'STELLAR' && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#000',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '999px',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                    textTransform: 'uppercase',
                  }}>
                    Popular ✨
                  </div>
                )}

                <div>
                  <div style={{
                    display: 'inline-flex',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: theme.badgeBg,
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: '16px',
                  }}>
                    {plan?.name || key}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>
                      {key === 'FREE' ? 'Gratis' : `$${plan?.price || '0'}`}
                    </span>
                    {key !== 'FREE' && (
                      <span style={{ color: 'var(--text-muted, #a1a1aa)', fontSize: '0.9rem' }}>/mes</span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #a1a1aa)', marginBottom: '24px', minHeight: '40px' }}>
                    {plan?.description || 'Plan de plataforma'}
                  </p>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', marginBottom: '12px' }}>
                      BENEFICIOS DESTACADOS:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {plan?.benefits?.map((b, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem', color: '#e4e4e7' }}>
                          <span style={{ color: plan?.badgeColor || '#38bdf8', fontWeight: 900 }}>✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  disabled={loadingPlan || isCurrent}
                  onClick={() => handleActivate(key)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: isCurrent ? 'default' : 'pointer',
                    background: isCurrent
                      ? 'rgba(255,255,255,0.1)'
                      : key === 'STELLAR'
                      ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                      : key === 'NOVA'
                      ? 'linear-gradient(135deg, #c084fc, #9333ea)'
                      : key === 'ASTRO'
                      ? 'linear-gradient(135deg, #38bdf8, #0284c7)'
                      : 'rgba(255,255,255,0.15)',
                    color: isCurrent ? '#a1a1aa' : key === 'STELLAR' ? '#000' : '#fff',
                    boxShadow: isCurrent ? 'none' : '0 4px 14px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isCurrent ? 'Plan Actual' : key === 'FREE' ? 'Elegir Gratuito' : `Activar Plan ${key}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* COMPARISON TABLE */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '32px',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
            Comparativa Completa de Beneficios
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Característica</th>
                  <th style={{ padding: '12px 16px', color: '#888' }}>FREE</th>
                  <th style={{ padding: '12px 16px', color: '#38bdf8' }}>ASTRO</th>
                  <th style={{ padding: '12px 16px', color: '#c084fc' }}>NOVA</th>
                  <th style={{ padding: '12px 16px', color: '#fbbf24' }}>STELLAR</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Multiplicador de Stardust (Moneda)', free: '×1.0', astro: '×1.2 (+20%)', nova: '×1.5 (+50%)', stellar: '×2.0 (+100%)' },
                  { feature: 'Multiplicador de Experiencia (XP)', free: '×1.0', astro: '×1.5', nova: '×2.0', stellar: '×3.0' },
                  { feature: 'Límite de imágenes por día', free: '20', astro: '100', nova: '100', stellar: '500' },
                  { feature: 'Badge de Plan exclusivo', free: '—', astro: '⭐ Azul', nova: '✨ Morado', stellar: '🌟 Dorado Animado' },
                  { feature: 'Borde de avatar personalizado', free: 'Estático', astro: 'Azul neón', nova: 'Morado pulsante', stellar: 'Dorado animado' },
                  { feature: 'Personalización de Banner', free: 'Color Base', astro: 'Gradiente / Imagen', nova: 'Banner GIF Animado', stellar: 'Video / Animado' },
                  { feature: 'Música en el Perfil', free: '—', astro: '—', nova: '✅', stellar: '✅' },
                  { feature: 'Efectos de Partículas en Perfil', free: '—', astro: '—', nova: '—', stellar: '✅ Cósmicas' },
                  { feature: 'Mascota Virtual Acompañante', free: '—', astro: '—', nova: '—', stellar: '✅' },
                  { feature: 'Publicaciones y chats', free: 'Ilimitados', astro: 'Ilimitados', nova: 'Ilimitados', stellar: 'Ilimitados' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{row.feature}</td>
                    <td style={{ padding: '14px 16px', color: '#a1a1aa' }}>{row.free}</td>
                    <td style={{ padding: '14px 16px', color: '#38bdf8' }}>{row.astro}</td>
                    <td style={{ padding: '14px 16px', color: '#c084fc' }}>{row.nova}</td>
                    <td style={{ padding: '14px 16px', color: '#fbbf24', fontWeight: 700 }}>{row.stellar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
