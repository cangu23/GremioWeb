'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: 'GremioWeb Estelar',
    site_description: 'Plataforma comunitaria de VTubers, Creadores y Gremios Anime',
    discord_client_id: '',
    twitch_client_id: '',
    kick_api_key: '',
    stardust_daily_reward: '50',
    referral_reward: '50',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/admin/settings').then(res => {
      if (res?.settings) {
        setSettings(prev => ({ ...prev, ...res.settings }));
      }
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ settings }),
      });
      showToast('¡Configuración Global guardada con éxito! ⚙️', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al guardar ajustes', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          ⚙️ Configuración Global del Sistema (System Settings)
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#a0a0a0', margin: '4px 0 0' }}>
          Ajustes visuales del sitio, integraciones OAuth (Discord, Twitch, Kick) y valores por defecto de economía.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
        
        {/* Section 1: General */}
        <div style={{ background: '#0d0d12', border: '1px solid #1a1a20', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24', margin: 0 }}>🌐 General & Marca</h2>
          
          <div>
            <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '4px' }}>Nombre del Sitio:</label>
            <input
              type="text"
              value={settings.site_title || ''}
              onChange={e => setSettings({ ...settings, site_title: e.target.value })}
              style={{ width: '100%', padding: '10px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '4px' }}>Descripción de la Plataforma:</label>
            <textarea
              rows={2}
              value={settings.site_description || ''}
              onChange={e => setSettings({ ...settings, site_description: e.target.value })}
              style={{ width: '100%', padding: '10px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Section 2: Economy */}
        <div style={{ background: '#0d0d12', border: '1px solid #1a1a20', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffd700', margin: 0 }}>💰 Economía & Stardust</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '4px' }}>Recompensa Racha Diaria (⭐):</label>
              <input
                type="number"
                value={settings.stardust_daily_reward || '50'}
                onChange={e => setSettings({ ...settings, stardust_daily_reward: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#a0a0a0', display: 'block', marginBottom: '4px' }}>Recompensa Referido (⭐):</label>
              <input
                type="number"
                value={settings.referral_reward || '50'}
                onChange={e => setSettings({ ...settings, referral_reward: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
            border: 'none',
            color: '#000',
            fontWeight: 900,
            fontSize: '0.88rem',
            cursor: saving ? 'wait' : 'pointer',
            boxShadow: '0 0 16px rgba(251, 191, 36, 0.4)',
          }}
        >
          {saving ? 'GUARDANDO...' : '💾 GUARDAR CONFIGURACIÓN GLOBAL'}
        </button>

      </form>

    </div>
  );
}
