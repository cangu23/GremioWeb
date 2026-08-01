'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface CustomPlanConfig {
  id: string;
  name: string;
  price: string;
  multiplier: number;
  uploadLimitMb: number;
  storeDiscountPct: number;
  monthlyStardustBonus: number;
  allowGifs: boolean;
  allowCustomPets: boolean;
  allowVideoBanners: boolean;
  color: string;
}

const DEFAULT_PLANS: CustomPlanConfig[] = [
  { id: 'FREE', name: 'Plan Gratis (Aventurero)', price: '$0 / mes', multiplier: 1.0, uploadLimitMb: 5, storeDiscountPct: 0, monthlyStardustBonus: 0, allowGifs: false, allowCustomPets: false, allowVideoBanners: false, color: '#a0a0a0' },
  { id: 'ASTRO', name: 'Plan Astro ⭐', price: '$4.99 / mes (15,000 ⭐)', multiplier: 1.2, uploadLimitMb: 15, storeDiscountPct: 10, monthlyStardustBonus: 200, allowGifs: true, allowCustomPets: false, allowVideoBanners: false, color: '#818cf8' },
  { id: 'NOVA', name: 'Plan Nova 🌟', price: '$9.99 / mes (35,000 ⭐)', multiplier: 1.5, uploadLimitMb: 50, storeDiscountPct: 15, monthlyStardustBonus: 500, allowGifs: true, allowCustomPets: false, allowVideoBanners: false, color: '#38bdf8' },
  { id: 'STELLAR', name: 'Plan Stellar ✨', price: '$19.99 / mes (80,000 ⭐)', multiplier: 2.0, uploadLimitMb: 200, storeDiscountPct: 25, monthlyStardustBonus: 1000, allowGifs: true, allowCustomPets: true, allowVideoBanners: true, color: '#ffd700' },
];

export default function PlanBuilderPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<CustomPlanConfig[]>(DEFAULT_PLANS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/admin/settings').then(res => {
      if (res?.settings?.plans_config) {
        try {
          const parsed = JSON.parse(res.settings.plans_config);
          if (Array.isArray(parsed) && parsed.length > 0) setPlans(parsed);
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const handleSavePlans = async () => {
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          settings: {
            plans_config: JSON.stringify(plans),
          },
        }),
      });
      showToast('¡Configuración de Planes Premium guardada con éxito! 💳', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al guardar planes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updatePlanField = (index: number, field: keyof CustomPlanConfig, value: any) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: value };
    setPlans(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            💳 Constructor Visual de Planes Premium (Plan Builder)
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#a0a0a0', margin: '4px 0 0' }}>
            Configura precios, multiplicadores de Stardust, espacio de subida y ventajas de cada membresía.
          </p>
        </div>

        <button
          onClick={handleSavePlans}
          disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #ffd700, #f59e0b)',
            border: 'none', color: '#000', fontWeight: 900, fontSize: '0.85rem',
            cursor: saving ? 'wait' : 'pointer', boxShadow: '0 0 16px rgba(255, 215, 0, 0.4)'
          }}
        >
          {saving ? 'GUARDANDO...' : '💾 GUARDAR PLANES'}
        </button>
      </div>

      {/* Grid of Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
        {plans.map((p, idx) => (
          <div
            key={p.id}
            style={{
              background: '#0d0d12',
              border: `1px solid ${p.color}55`,
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: `0 4px 20px ${p.color}15`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: p.color }}>{p.name}</span>
              <span style={{ fontSize: '0.72rem', background: `${p.color}22`, border: `1px solid ${p.color}44`, color: p.color, padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                x{p.multiplier.toFixed(1)} Stardust
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#a0a0a0', display: 'block', marginBottom: '4px' }}>Precio & Costo:</label>
              <input
                type="text"
                value={p.price}
                onChange={e => updatePlanField(idx, 'price', e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.82rem', borderRadius: '6px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.70rem', color: '#a0a0a0', display: 'block', marginBottom: '2px' }}>Multiplicador Stardust:</label>
                <input
                  type="number"
                  step="0.1"
                  value={p.multiplier}
                  onChange={e => updatePlanField(idx, 'multiplier', Number(e.target.value))}
                  style={{ width: '100%', padding: '6px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.80rem', borderRadius: '6px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.70rem', color: '#a0a0a0', display: 'block', marginBottom: '2px' }}>Descuento Tienda %:</label>
                <input
                  type="number"
                  value={p.storeDiscountPct}
                  onChange={e => updatePlanField(idx, 'storeDiscountPct', Number(e.target.value))}
                  style={{ width: '100%', padding: '6px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.80rem', borderRadius: '6px', outline: 'none' }}
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', fontSize: '0.78rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: p.allowGifs ? '#34d399' : '#71717a' }}>
                <input
                  type="checkbox"
                  checked={p.allowGifs}
                  onChange={e => updatePlanField(idx, 'allowGifs', e.target.checked)}
                />
                🎞️ Permitir GIFs Animadas
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: p.allowCustomPets ? '#fbbf24' : '#71717a' }}>
                <input
                  type="checkbox"
                  checked={p.allowCustomPets}
                  onChange={e => updatePlanField(idx, 'allowCustomPets', e.target.checked)}
                />
                🐾 Solicitud de Mascota Personalizada
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: p.allowVideoBanners ? '#38bdf8' : '#71717a' }}>
                <input
                  type="checkbox"
                  checked={p.allowVideoBanners}
                  onChange={e => updatePlanField(idx, 'allowVideoBanners', e.target.checked)}
                />
                🎬 Banner en Vídeo Animado
              </label>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
