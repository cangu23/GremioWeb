'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';
import { compressImage } from '@/lib/compress-image';

/* ─── Types ─── */
interface MaidUser {
  id: string;
  username: string;
  role: string;
  status: string;
  vtuberProfile?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
    isApproved: boolean;
    isFeatured: boolean;
    isHidden: boolean;
    streamSchedule: string | null;
    description: string | null;
    twitchUrl: string | null;
    youtubeUrl: string | null;
  } | null;
  _count: { followers: number; following: number; posts: number };
}

interface CafeSettings {
  cafe_schedule: string;
  cafe_description: string;
  cafe_tagline: string;
  cafe_welcome_message: string;
  cafe_color_primary: string;
  cafe_color_secondary: string;
  cafe_color_accent: string;
  cafe_discord_url: string;
  cafe_twitter_url: string;
  cafe_twitch_url: string;
  cafe_vrchat_world: string;
  cafe_timezone: string;
  cafe_logo_url: string;
  cafe_banner_url: string;
}

/* ─── Event config ─── */
const EVENT_DAYS = [4, 5, 6, 0];
const EVENT_NAMES = ['Ceremonia de Té', 'Noche de Karaoke', 'Cat Café Day', 'Lounge Estelar'];
const EVENT_COLORS = ['#4caf50', '#e040fb', '#ff9800', '#64b5f6'];
const EVENT_DESC = [
  'Tés premium japoneses con nuestras maids',
  'Canta tus canciones favoritas en VRChat',
  'Día temático con orejas de gato y bebidas cremosas',
  'Música ambiente y conversaciones acogedoras',
];

const THEME = { gold: '#d4a030', cream: '#f5e6d3', brown: '#8B6914', muted: 'var(--text-muted)' };

/* ─── Setting field definitions ─── */
type SettingField = {
  key: keyof CafeSettings;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'url' | 'image';
  placeholder?: string;
  section: 'general' | 'appearance' | 'social' | 'schedule' | 'images';
};

const SETTING_FIELDS: SettingField[] = [
  // General
  { key: 'cafe_description', label: 'Descripción del Café', type: 'textarea', placeholder: 'Descripción larga del café...', section: 'general' },
  { key: 'cafe_tagline', label: 'Frase principal', type: 'text', placeholder: 'Frase corta que aparece en el hero...', section: 'general' },
  { key: 'cafe_welcome_message', label: 'Mensaje de bienvenida', type: 'textarea', placeholder: 'Mensaje que ven los visitantes...', section: 'general' },
  { key: 'cafe_vrchat_world', label: 'Mundo VRChat', type: 'text', placeholder: 'Nombre del mundo en VRChat...', section: 'general' },
  { key: 'cafe_timezone', label: 'Zona Horaria', type: 'text', placeholder: 'UTC-3', section: 'general' },
  // Schedule
  { key: 'cafe_schedule', label: 'Horario del Café', type: 'textarea', placeholder: 'Ej: Abierto todos los días — Horario: 18:00 - 23:00 VRChat', section: 'schedule' },
  // Images
  { key: 'cafe_logo_url', label: 'Logo del Café', type: 'image', section: 'images' },
  { key: 'cafe_banner_url', label: 'Banner del Café', type: 'image', section: 'images' },
  // Appearance
  { key: 'cafe_color_primary', label: 'Color Principal', type: 'color', section: 'appearance' },
  { key: 'cafe_color_secondary', label: 'Color Secundario', type: 'color', section: 'appearance' },
  { key: 'cafe_color_accent', label: 'Color Acento', type: 'color', section: 'appearance' },
  // Social
  { key: 'cafe_discord_url', label: 'Enlace Discord', type: 'url', placeholder: 'https://discord.gg/...', section: 'social' },
  { key: 'cafe_twitter_url', label: 'Enlace Twitter/X', type: 'url', placeholder: 'https://twitter.com/...', section: 'social' },
  { key: 'cafe_twitch_url', label: 'Enlace Twitch', type: 'url', placeholder: 'https://twitch.tv/...', section: 'social' },
];

const SECTION_LABELS: Record<string, string> = {
  general: 'Información General',
  schedule: 'Horario',
  images: 'Imágenes',
  appearance: 'Apariencia & Colores',
  social: 'Redes Sociales',
};

const SECTION_ICONS: Record<string, string> = {
  general: 'M12 8v4l3 3M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  schedule: 'M8 2v4M16 2v4M3 10h18M21 14a7 7 0 0 1-14 0',
  images: 'M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
  appearance: 'M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8l2-2M12.5 16.5l-2 2',
  social: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
};

/* ─── Component ─── */
export default function AdminHoshizoraMaidPage() {
  const { showToast } = useToast();

  // Maids
  const [maids, setMaids] = useState<MaidUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings
  const [settings, setSettings] = useState<CafeSettings>({} as CafeSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Active section
  const [activeSection, setActiveSection] = useState<string>('general');
  // Upload state
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchMaids = useCallback(async () => {
    try {
      const data = await apiFetch('/users/role/MAID');
      setMaids(Array.isArray(data) ? data : []);
    } catch {
      showToast('Error al cargar las maids', 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/settings');
      if (data?.settings) setSettings(data.settings);
    } catch { /* use defaults */ }
    finally { setSettingsLoading(false); }
  }, []);

  useEffect(() => { fetchMaids(); fetchSettings(); }, [fetchMaids, fetchSettings]);

  const handleSaveSetting = async (key: keyof CafeSettings) => {
    setSavingField(key);
    try {
      const payload = { settings: { [key]: settings[key] } };
      await apiFetch('/admin/settings', { method: 'PATCH', body: JSON.stringify(payload) });
      showToast('Ajuste actualizado', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally { setSavingField(null); }
  };

  const handleToggleFlag = async (profileId: string, field: string, currentValue: boolean, label: string) => {
    if (!window.confirm(`¿${currentValue ? 'Quitar' : 'Activar'} "${label}"?`)) return;
    try {
      await apiFetch(`/admin/vtubers/${profileId}`, { method: 'PATCH', body: JSON.stringify({ [field]: !currentValue }) });
      showToast(`Maid ${label.toLowerCase()} ${currentValue ? 'desactivado' : 'activado'}`, 'success');
      fetchMaids();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const getNextEvent = () => {
    const d = new Date();
    const today = d.getDay();
    let minDiff = 8, idx = -1;
    for (let i = 0; i < EVENT_DAYS.length; i++) {
      let diff = EVENT_DAYS[i] - today;
      if (diff <= 0) diff += 7;
      if (diff < minDiff) { minDiff = diff; idx = i; }
    }
    return { name: EVENT_NAMES[idx], color: EVENT_COLORS[idx], days: minDiff, desc: EVENT_DESC[idx] };
  };

  return (
    <div>
      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            Hoshizora Maid
          </h1>
          <p style={{ color: THEME.muted, margin: '4px 0 0' }}>
            Panel de gestión del café VR — {maids.length} maids · {Object.keys(settings).length} ajustes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/hoshizora-maid" style={{
            padding: '10px 20px', borderRadius: '10px',
            background: 'rgba(212,160,48,0.12)', color: '#d4a030',
            border: '1px solid rgba(212,160,48,0.25)',
            fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,160,48,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,160,48,0.12)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Ver página pública
          </Link>
        </div>
      </div>

      {/* ─── STATS ROW ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Maids', value: maids.length, color: '#d4a030' },
          { label: 'Verificadas', value: maids.filter(m => m.vtuberProfile?.isVerified).length, color: '#1d9bf0' },
          { label: 'Aprobadas', value: maids.filter(m => m.vtuberProfile?.isApproved).length, color: '#00e676' },
          { label: 'Con Twitch', value: maids.filter(m => m.vtuberProfile?.twitchUrl).length, color: '#9146FF' },
          { label: 'Con YouTube', value: maids.filter(m => m.vtuberProfile?.youtubeUrl).length, color: '#FF0000' },
          { label: 'Con Schedule', value: maids.filter(m => m.vtuberProfile?.streamSchedule).length, color: '#2196f3' },
        ].map((card) => (
          <div key={card.label} className="glass" style={{ padding: '12px', borderRadius: '12px', textAlign: 'center', border: `1px solid ${card.color}18` }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* ─── LAYOUT: Settings + Next Event ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start', marginBottom: '24px' }}>

        {/* ═══ SETTINGS PANEL ═══ */}
        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          {/* Section Tabs */}
          <div style={{ display: 'flex', gap: '2px', padding: '12px 16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
            {Object.entries(SECTION_LABELS).map(([id, label]) => (
              <button key={id} onClick={() => setActiveSection(id)}
                style={{
                  padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
                  background: activeSection === id ? 'rgba(212,160,48,0.1)' : 'transparent',
                  color: activeSection === id ? '#d4a030' : 'var(--text-muted)',
                  borderBottom: activeSection === id ? '2px solid #d4a030' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={SECTION_ICONS[id] || SECTION_ICONS.general} />
                </svg>
                {label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div style={{ padding: '20px' }}>
            {settingsLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando ajustes...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {SETTING_FIELDS
                  .filter(f => f.section === activeSection)
                  .map((field) => {
                    const val = settings[field.key] || '';
                    const isColor = field.type === 'color';
                    const isUrl = field.type === 'url';
                    return (
                      <div key={field.key} className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {field.label}
                            {isUrl && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>URL</span>}
                          </label>
                          <button
                            onClick={() => handleSaveSetting(field.key)}
                            disabled={savingField === field.key}
                            style={{
                              padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                              fontSize: '0.72rem', fontWeight: 600,
                              background: savingField === field.key ? 'rgba(212,160,48,0.08)' : 'rgba(212,160,48,0.12)',
                              color: '#d4a030', transition: 'all 0.2s',
                              opacity: savingField === field.key ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { if (!savingField) e.currentTarget.style.background = 'rgba(212,160,48,0.2)'; }}
                            onMouseLeave={e => { if (!savingField) e.currentTarget.style.background = 'rgba(212,160,48,0.12)'; }}
                          >
                            {savingField === field.key ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: 10, height: 10, border: '2px solid rgba(212,160,48,0.3)', borderTopColor: '#d4a030', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                                Guardando
                              </span>
                            ) : 'Guardar'}
                          </button>
                        </div>

                        {field.type === 'image' ? (
                          <div>
                            {/* Preview */}
                            {val ? (
                              <div style={{
                                position: 'relative',
                                width: '100%', maxWidth: field.key === 'cafe_banner_url' ? '100%' : '200px',
                                height: field.key === 'cafe_banner_url' ? '120px' : '100px',
                                borderRadius: '10px', overflow: 'hidden',
                                marginBottom: '10px',
                                background: '#0a0a0a',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}>
                                <img src={val} alt={field.label}
                                  style={{ width: '100%', height: '100%', objectFit: field.key === 'cafe_banner_url' ? 'cover' : 'contain' }}
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <button onClick={() => { setSettings(prev => ({ ...prev, [field.key]: '' })); }}
                                  style={{
                                    position: 'absolute', top: '6px', right: '6px',
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem',
                                  }}>✕</button>
                              </div>
                            ) : (
                              <div style={{
                                width: '100%', maxWidth: field.key === 'cafe_banner_url' ? '100%' : '200px',
                                height: field.key === 'cafe_banner_url' ? '120px' : '100px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '2px dashed rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '10px',
                                color: 'var(--text-muted)', fontSize: '0.82rem',
                              }}>
                                Sin imagen
                              </div>
                            )}
                            {/* Upload area */}
                            <label style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              padding: '10px 20px', borderRadius: '8px',
                              background: uploading === field.key ? 'rgba(212,160,48,0.08)' : 'rgba(212,160,48,0.1)',
                              border: `1px solid ${uploading === field.key ? 'rgba(212,160,48,0.2)' : 'rgba(212,160,48,0.2)'}`,
                              cursor: uploading === field.key ? 'wait' : 'pointer',
                              fontSize: '0.82rem', fontWeight: 600, color: '#d4a030',
                              transition: 'all 0.2s',
                              width: 'fit-content',
                            }}
                              onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = 'rgba(212,160,48,0.18)'; }}
                              onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = 'rgba(212,160,48,0.1)'; }}
                            >
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                style={{ display: 'none' }}
                                disabled={uploading === field.key}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploading(field.key);
                                  try {
                                    // Compress before upload
                                  const isBanner = field.key === 'cafe_banner_url';
                                  const compressedBlob = await compressImage(file, {
                                    maxWidth: isBanner ? 1920 : 512,
                                    maxHeight: isBanner ? 1080 : 512,
                                    quality: 0.8,
                                  });
                                  const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
                                  const formData = new FormData();
                                  formData.append('image', compressedFile);
                                  const type = isBanner ? 'banner' : 'logo';
                                  const res = await fetch(`/api/uploads/cafe?type=${type}`, {
                                    method: 'POST',
                                    body: formData,
                                  });
                                    const data = await res.json();
                                    if (data.url) {
                                      setSettings(prev => ({ ...prev, [field.key]: data.url }));
                                      const payload = { settings: { [field.key]: data.url } };
                                      await apiFetch('/admin/settings', { method: 'PATCH', body: JSON.stringify(payload) });
                                      showToast(`${field.label} actualizado`, 'success');
                                    } else {
                                      showToast('Error al subir imagen', 'error');
                                    }
                                  } catch {
                                    showToast('Error al conectar con el servidor', 'error');
                                  } finally {
                                    setUploading(null);
                                    if (e.target) e.target.value = '';
                                  }
                                }}
                              />
                              {uploading === field.key ? (
                                <><span style={{ width: 14, height: 14, border: '2px solid rgba(212,160,48,0.3)', borderTopColor: '#d4a030', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> Subiendo...</>
                              ) : (
                                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Subir imagen</>
                              )}
                            </label>
                            {/* URL manual */}
                            <div style={{ marginTop: '8px' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>O pega una URL:</span>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <input className="input" type="url" value={val}
                                  onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                                  placeholder="https://res.cloudinary.com/..."
                                  style={{ flex: 1, fontSize: '0.82rem' }} />
                                <button onClick={() => handleSaveSetting(field.key)} disabled={savingField === field.key}
                                  style={{
                                    padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                    fontSize: '0.75rem', fontWeight: 600,
                                    background: 'rgba(212,160,48,0.12)', color: '#d4a030',
                                    opacity: savingField === field.key ? 0.6 : 1,
                                  }}>
                                  {savingField === field.key ? '...' : 'Guardar URL'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : isColor ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={val || '#d4a030'}
                              onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                              style={{ width: '44px', height: '38px', borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                            <input className="input" value={val} onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder="#d4a030" style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }} />
                            {/* Color preview */}
                            <div style={{ width: '60px', height: '32px', borderRadius: '6px', background: val || '#d4a030', border: '1px solid rgba(255,255,255,0.1)' }} />
                          </div>
                        ) : field.type === 'textarea' ? (
                          <textarea className="input" value={val}
                            onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            style={{ width: '100%', minHeight: '70px', resize: 'vertical' }} />
                        ) : (
                          <input className="input" type={field.type === 'url' ? 'url' : 'text'} value={val}
                            onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder} style={{ width: '100%' }} />
                        )}
                      </div>
                    );
                  })}

                {/* Save All button */}
                <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={async () => {
                    const sectionFields = SETTING_FIELDS.filter(f => f.section === activeSection);
                    const sectionSettings: Record<string, string> = {};
                    for (const f of sectionFields) {
                      sectionSettings[f.key] = settings[f.key] || '';
                    }
                    setSavingField('__all__');
                    try {
                      await apiFetch('/admin/settings', { method: 'PATCH', body: JSON.stringify({ settings: sectionSettings }) });
                      showToast(`Sección "${SECTION_LABELS[activeSection]}" guardada`, 'success');
                    } catch (err: unknown) {
                      showToast(err instanceof Error ? err.message : 'Error', 'error');
                    } finally { setSavingField(null); }
                  }} disabled={savingField === '__all__'} className="btn" style={{
                    padding: '10px 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #d4a030, #8B6914)', color: '#fff', border: 'none',
                    opacity: savingField === '__all__' ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    {savingField === '__all__' ? (
                      <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> Guardando sección...</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 12 11 15 16 9"/></svg> Guardar Todo</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ SIDEBAR: Next Event + Preview ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Next Event */}
          <div className="glass" style={{ padding: '18px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(212,160,48,0.06), rgba(196,149,106,0.03))', border: '1px solid rgba(212,160,48,0.12)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: THEME.gold }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Próximo Evento
            </h3>
            {(() => {
              const next = getNextEvent();
              const daysText = next.days === 0 ? '¡Hoy!' : next.days === 1 ? 'Mañana' : `En ${next.days} días`;
              return (
                <>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: next.color, marginBottom: '2px' }}>{next.name}</div>
                  <div style={{ fontSize: '0.78rem', color: next.color, opacity: 0.7, marginBottom: '8px' }}>{next.desc}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 12px', borderRadius: '20px', background: `${next.color}18`, color: next.color, fontSize: '0.78rem', fontWeight: 700 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {daysText}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Color Preview */}
          <div className="glass" style={{ padding: '18px', borderRadius: '14px', border: '1px solid rgba(212,160,48,0.12)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: THEME.gold }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Vista Previa
            </h3>
            <div style={{
              padding: '14px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${settings.cafe_color_primary || '#d4a030'}11, ${settings.cafe_color_secondary || '#8B6914'}08)`,
              border: `1px solid ${(settings.cafe_color_primary || '#d4a030')}22`,
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: settings.cafe_color_primary || '#d4a030', marginBottom: '4px' }}>
                Hoshizora Maid Café
              </div>
              <div style={{ fontSize: '0.72rem', color: settings.cafe_color_secondary || '#8B6914', marginBottom: '8px' }}>
                {settings.cafe_tagline || 'Donde las estrellas se encuentran'}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: settings.cafe_color_primary || '#d4a030', flexShrink: 0 }} />
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: settings.cafe_color_secondary || '#8B6914', flexShrink: 0 }} />
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: settings.cafe_color_accent || '#f5e6d3', flexShrink: 0 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIDS TABLE ─── */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a030" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
        Maids Registradas
        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({maids.length})</span>
      </h2>
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando maids...</div>
        ) : maids.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No hay maids registradas aún</p>
            <Link href="/admin/users" className="btn" style={{ padding: '10px 24px', borderRadius: '10px', background: 'rgba(212,160,48,0.12)', color: '#d4a030', border: '1px solid rgba(212,160,48,0.25)', textDecoration: 'none' }}>
              Ir a Usuarios para asignar rol MAID
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Maid', 'Display Name', 'Estado', 'Seguidores', 'Twitch', 'Schedule', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {maids.map((maid) => {
                  const profile = maid.vtuberProfile;
                  return (
                    <tr key={maid.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: profile?.avatarUrl ? `url(${profile.avatarUrl}) center/cover` : 'linear-gradient(135deg, #d4a030, #8B6914)',
                            overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 'bold', fontSize: '0.75rem',
                          }}>
                            {!profile?.avatarUrl && (profile?.displayName?.[0] || maid.username[0]).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>@{maid.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#d4a030', fontWeight: 600, fontSize: '0.85rem' }}>{profile?.displayName || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {profile?.isVerified && <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, background: 'rgba(29,155,240,0.15)', color: '#1d9bf0' }}>✓</span>}
                          {profile?.isApproved && <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, background: 'rgba(0,230,118,0.15)', color: '#00e676' }}>Ap</span>}
                          {profile?.isFeatured && <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, background: 'rgba(255,0,127,0.15)', color: '#ff007f' }}>★</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.85rem' }}>{maid._count?.followers ?? 0}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {profile?.twitchUrl ? <span style={{ color: '#9146FF', fontSize: '0.82rem', fontWeight: 600 }}>Sí</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No</span>}
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {profile?.streamSchedule || '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          <Link href="/admin/vtubers" className="btn" style={{ padding: '3px 8px', fontSize: '0.7rem', background: 'rgba(138,43,226,0.15)', color: '#8a2be2', border: '1px solid rgba(138,43,226,0.2)', textDecoration: 'none', borderRadius: '6px' }}>Editar</Link>
                          {profile && (
                            <>
                              <button onClick={() => handleToggleFlag(profile.id, 'isVerified', !!profile.isVerified, 'Verificación')} className="btn" style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '6px', background: profile.isVerified ? 'rgba(255,152,0,0.15)' : '#1d9bf033', color: profile.isVerified ? '#ff9800' : '#1d9bf0', border: `1px solid ${profile.isVerified ? '#ff980033' : '#1d9bf033'}` }}>
                                {profile.isVerified ? '✕✓' : '✓'}
                              </button>
                              <button onClick={() => handleToggleFlag(profile.id, 'isApproved', !!profile.isApproved, 'Aprobación')} className="btn" style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '6px', background: 'rgba(33,150,243,0.15)', color: '#2196f3', border: '1px solid rgba(33,150,243,0.2)' }}>
                                {profile.isApproved ? 'Desap' : 'Apro'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
