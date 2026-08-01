'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import RoleBadge from '@/components/ui/RoleBadge';

interface ProfessionConfig {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  hasDedicatedPage: boolean;
  dedicatedPagePath?: string;
  allowTips: boolean;
  allowLiveAlerts: boolean;
  allowPortfolios: boolean;
  allowClips: boolean;
}

const DEFAULT_PROFESSIONS: ProfessionConfig[] = [
  { id: 'USER', name: 'Aventurero Estándar', category: 'General', color: '#a0a0a0', description: 'Miembro registrado común de la comunidad', hasDedicatedPage: false, allowTips: false, allowLiveAlerts: false, allowPortfolios: false, allowClips: false },
  { id: 'VTUBER', name: 'VTuber / Streamer', category: 'Creador Live', color: '#ec4899', description: 'Streamers con monitoreo live y alertas de transmisión', hasDedicatedPage: true, dedicatedPagePath: '/vtubers', allowTips: true, allowLiveAlerts: true, allowPortfolios: false, allowClips: true },
  { id: 'ARTIST', name: 'Artista / Ilustrador', category: 'Creador Arte', color: '#a78bfa', description: 'Diseñadores e ilustradores con catálogo de comisiones', hasDedicatedPage: true, dedicatedPagePath: '/artists', allowTips: true, allowLiveAlerts: false, allowPortfolios: true, allowClips: false },
  { id: 'CLIPPER', name: 'Clipper', category: 'Creador Vídeo', color: '#fbbf24', description: 'Creadores de recortes cortos y edits destacados', hasDedicatedPage: false, allowTips: false, allowLiveAlerts: false, allowPortfolios: false, allowClips: true },
  { id: 'MAID', name: 'Hoshizora Maid', category: 'Anfitrión Café', color: '#c084fc', description: 'Anfitriones del Maid Café espacio VRChat', hasDedicatedPage: true, dedicatedPagePath: '/hoshizora-maid', allowTips: true, allowLiveAlerts: false, allowPortfolios: false, allowClips: false },
  { id: 'PARTNER', name: 'Organización Aliada', category: 'Partner', color: '#38bdf8', description: 'Marcas, agrupaciones y comunidades aliadas', hasDedicatedPage: true, dedicatedPagePath: '/partners', allowTips: false, allowLiveAlerts: true, allowPortfolios: false, allowClips: false },
];

export default function ProfessionsBuilderPage() {
  const { showToast } = useToast();
  const [professions, setProfessions] = useState<ProfessionConfig[]>(DEFAULT_PROFESSIONS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/admin/settings').then(res => {
      if (res?.settings?.professions_config) {
        try {
          const parsed = JSON.parse(res.settings.professions_config);
          if (Array.isArray(parsed) && parsed.length > 0) setProfessions(parsed);
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const handleSaveProfessions = async () => {
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          settings: {
            professions_config: JSON.stringify(professions),
          },
        }),
      });
      showToast('¡Configuración de Profesiones Base guardada con éxito! 🎨', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al guardar profesiones', 'error');
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
            🎨 Constructor Visual de Profesiones Base (Base Roles)
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#a0a0a0', margin: '4px 0 0' }}>
            Gestiona la identidad principal de cada tipo de usuario (VTubers, Artistas, Clippers, Maids, Partners).
          </p>
        </div>

        <button
          onClick={handleSaveProfessions}
          disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
            border: 'none', color: '#fff', fontWeight: 900, fontSize: '0.85rem',
            cursor: saving ? 'wait' : 'pointer', boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
          }}
        >
          {saving ? 'GUARDANDO...' : '💾 GUARDAR PROFESIONES'}
        </button>
      </div>

      {/* Grid of Professions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {professions.map((prof) => (
          <div
            key={prof.id}
            style={{
              background: '#0d0d12',
              border: `1px solid ${prof.color}55`,
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: `0 4px 20px ${prof.color}15`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <RoleBadge role={prof.id} size="md" />
              <span style={{ fontSize: '0.70rem', background: '#1a1a20', color: prof.color, padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                {prof.category}
              </span>
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 800 }}>{prof.name}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#a0a0a0' }}>{prof.description}</p>
            </div>

            {prof.hasDedicatedPage && (
              <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700 }}>
                🌐 Catálogo Dedicado: <code>{prof.dedicatedPagePath}</code>
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.68rem', fontWeight: 800, marginTop: '4px' }}>
              {prof.allowLiveAlerts && <span style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', padding: '2px 6px', borderRadius: '4px' }}>🔴 Alertas Live</span>}
              {prof.allowTips && <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px' }}>💖 Donaciones</span>}
              {prof.allowPortfolios && <span style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px' }}>🎨 Portafolio</span>}
              {prof.allowClips && <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>🎬 Clips</span>}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
