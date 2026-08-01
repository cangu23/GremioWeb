'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import BadgeList from '@/components/ui/BadgeList';

interface CustomBadgeConfig {
  id: string;
  name: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  color: string;
  description: string;
  isAnimated: boolean;
  isEventBadge: boolean;
  unlockCondition: string;
}

const DEFAULT_BADGES: CustomBadgeConfig[] = [
  { id: 'FOUNDER', name: 'Fundador 🏆', rarity: 'LEGENDARY', color: '#ffd700', description: 'Pioneros del inicio de GremioWeb', isAnimated: true, isEventBadge: false, unlockCondition: 'Cuenta creada en el primer mes' },
  { id: 'BETA_TESTER', name: 'Beta Tester 🧪', rarity: 'EPIC', color: '#00e5ff', description: 'Evaluador de funciones experimentales', isAnimated: false, isEventBadge: false, unlockCondition: 'Asignado por el Staff' },
  { id: 'DONATOR', name: 'Donador 💜', rarity: 'RARE', color: '#c084fc', description: 'Mecenas de la comunidad', isAnimated: false, isEventBadge: false, unlockCondition: 'Contribuciones y donaciones' },
  { id: 'VERIFIED', name: 'Verificado ⭐', rarity: 'EPIC', color: '#38bdf8', description: 'Identidad autenticada oficialmente', isAnimated: false, isEventBadge: false, unlockCondition: 'Verificación oficial' },
  { id: 'DEVELOPER', name: 'Desarrollador 🎖️', rarity: 'LEGENDARY', color: '#34d399', description: 'Creador del sistema', isAnimated: true, isEventBadge: false, unlockCondition: 'Equipo de desarrollo' },
  { id: 'LEGENDARY', name: 'Legendario 👑', rarity: 'LEGENDARY', color: '#fbbf24', description: 'Miembros de trayectoria estelar', isAnimated: true, isEventBadge: false, unlockCondition: 'Logros especiales' },
  { id: 'EARLY_100', name: 'Primeros 100 🎉', rarity: 'EPIC', color: '#f472b6', description: 'Primeros 100 aventureros', isAnimated: false, isEventBadge: true, unlockCondition: 'Registros iniciales' },
  { id: 'VETERAN_1YR', name: '1 Año 🎂', rarity: 'RARE', color: '#fb923c', description: '1 año en la comunidad', isAnimated: false, isEventBadge: false, unlockCondition: 'Antigüedad > 365 días' },
  { id: 'EVENT_WINNER', name: 'Campeón 🏅', rarity: 'LEGENDARY', color: '#eab308', description: 'Ganador de Torneo / Evento', isAnimated: true, isEventBadge: true, unlockCondition: 'Victoria en evento comunitario' },
];

export default function BadgeBuilderPage() {
  const { showToast } = useToast();
  const [badges, setBadges] = useState<CustomBadgeConfig[]>(DEFAULT_BADGES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/admin/settings').then(res => {
      if (res?.settings?.badges_config) {
        try {
          const parsed = JSON.parse(res.settings.badges_config);
          if (Array.isArray(parsed) && parsed.length > 0) setBadges(parsed);
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const handleSaveBadges = async () => {
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          settings: {
            badges_config: JSON.stringify(badges),
          },
        }),
      });
      showToast('¡Configuración de Badges guardada con éxito! 🏆', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al guardar badges', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏆 Constructor Visual de Badges / Insignias (Badge Builder)
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#a0a0a0', margin: '4px 0 0' }}>
            Gestiona reconocimientos acumulables, rarezas, condiciones de desbloqueo e insignias de eventos.
          </p>
        </div>

        <button
          onClick={handleSaveBadges}
          disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            border: 'none', color: '#fff', fontWeight: 900, fontSize: '0.85rem',
            cursor: saving ? 'wait' : 'pointer', boxShadow: '0 0 16px rgba(167, 139, 250, 0.4)'
          }}
        >
          {saving ? 'GUARDANDO...' : '💾 GUARDAR INSIGNIAS'}
        </button>
      </div>

      {/* Grid of Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {badges.map((b) => (
          <div
            key={b.id}
            style={{
              background: '#0d0d12',
              border: `1px solid ${b.color}55`,
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: `0 4px 18px ${b.color}15`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <BadgeList badges={[b.id]} size="md" />
              <span style={{ fontSize: '0.70rem', background: '#1a1a20', color: '#a0a0a0', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                {b.rarity}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.82rem', color: '#a0a0a0', marginTop: '2px' }}>{b.description}</div>
              <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: '4px' }}>Desbloqueo: <span style={{ color: '#fff' }}>{b.unlockCondition}</span></div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.70rem', fontWeight: 800 }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: b.isAnimated ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', color: b.isAnimated ? '#34d399' : '#71717a' }}>
                {b.isAnimated ? '✨ Animada' : 'Estática'}
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: b.isEventBadge ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', color: b.isEventBadge ? '#fbbf24' : '#71717a' }}>
                {b.isEventBadge ? '🎉 Evento Especial' : 'Permanente'}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
