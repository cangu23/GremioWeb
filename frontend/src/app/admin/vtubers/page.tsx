'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { hasAnyRole } from '@gremio-estelar/shared';

interface AdminVtuber {
  id: string;
  displayName: string;
  description: string | null;
  lore: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isVerified: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  isHidden: boolean;
  isLive: boolean;
  contentType: string | null;
  themeColor: string | null;
  fanName: string | null;
  oshiMark: string | null;
  streamSchedule: string | null;
  languages: string | null;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  kickUrl: string | null;
  tiktokUrl: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  user: { id: string; username: string; role?: string } | null;
}

interface AdminVtubersResponse {
  data: AdminVtuber[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminVtubersPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  // Editar/verificar/aprobar/destacar/ocultar son acciones ADMIN-only en el
  // backend (PATCH /admin/vtubers/:id exige authorize(ADMIN)). Los moderadores
  // y staff solo pueden VER la lista; si intentaran una acción recibirían 403.
  const canAdmin = hasAnyRole(user?.role, ['ADMIN', 'OWNER', 'SYSADMIN']); // SYSADMIN pasa por god-mode
  const [data, setData] = useState<AdminVtubersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = useRef('');
  searchRef.current = search;
  const [filterVerified, setFilterVerified] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [page, setPage] = useState(1);
  const [unapprovedData, setUnapprovedData] = useState<AdminVtuber[]>([]);
  const [loadingUnapproved, setLoadingUnapproved] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [quickApprovalError, setQuickApprovalError] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AdminVtuber | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [editTab, setEditTab] = useState<'basico' | 'redes' | 'stream'>('basico');
  const [editData, setEditData] = useState({
    displayName: '', description: '', lore: '',
    avatarUrl: '', bannerUrl: '',
    contentType: '', themeColor: '', fanName: '', oshiMark: '',
    streamSchedule: '', languages: '',
    twitchUrl: '', youtubeUrl: '', kickUrl: '', tiktokUrl: '',
    twitterUrl: '', discordUrl: '', websiteUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (searchRef.current) params.set('search', searchRef.current);
      if (filterVerified) params.set('isVerified', filterVerified);
      if (filterApproved) params.set('isApproved', filterApproved);
      const res = await apiFetch(`/admin/vtubers?${params}`);
      setData(res);
    } catch (err: unknown) {
      setFetchError(true);
      showToast(err instanceof Error ? err.message : 'Error de conexión', 'error');
    }
    finally { setLoading(false); }
  }, [page, filterVerified, filterApproved, showToast]);



  const fetchUnapproved = async () => {
    setLoadingUnapproved(true);
    setQuickApprovalError(false);
    try {
      const res = await apiFetch('/admin/vtubers?isApproved=false&limit=10');
      setUnapprovedData(res.data || []);
    } catch {
      setQuickApprovalError(true);
    }
    finally { setLoadingUnapproved(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [page, filterVerified, filterApproved]);
  // Las secciones de verificación/aprobación rápida son ADMIN-only: no tiene
  // sentido que moderadores/staff consulten esos listados que no van a ver.
  useEffect(() => { if (canAdmin) { fetchUnapproved(); } }, [canAdmin]);
  useEffect(() => { setPage(1); }, [search, filterVerified, filterApproved]);

  const openEdit = (profile: AdminVtuber) => {
    setSelectedProfile(profile);
    setEditTab('basico');
    setEditData({
      displayName: profile.displayName,
      description: profile.description || '',
      lore: profile.lore || '',
      avatarUrl: profile.avatarUrl || '',
      bannerUrl: profile.bannerUrl || '',
      contentType: profile.contentType || '',
      themeColor: profile.themeColor || '',
      fanName: profile.fanName || '',
      oshiMark: profile.oshiMark || '',
      streamSchedule: profile.streamSchedule || '',
      languages: profile.languages || '',
      twitchUrl: profile.twitchUrl || '',
      youtubeUrl: profile.youtubeUrl || '',
      kickUrl: profile.kickUrl || '',
      tiktokUrl: profile.tiktokUrl || '',
      twitterUrl: profile.twitterUrl || '',
      discordUrl: profile.discordUrl || '',
      websiteUrl: profile.websiteUrl || '',
    });
  };

  const saveProfile = async () => {
    if (!selectedProfile) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/vtubers/${selectedProfile.id}`, { method: 'PATCH', body: JSON.stringify(editData) });
      showToast('Perfil actualizado', 'success');
      setSelectedProfile(null);
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setSaving(false); }
  };

  // Reload all lists after toggling
  const handleToggleFlag = async (id: string, field: string, currentValue: boolean, label: string) => {
    if (!window.confirm(`¿${currentValue ? 'Quitar' : 'Activar'} "${label}"?`)) return;
    try {
      await apiFetch(`/admin/vtubers/${id}`, { method: 'PATCH', body: JSON.stringify({ [field]: !currentValue }) });
      showToast(`VTuber ${label.toLowerCase()} ${currentValue ? 'desactivado' : 'activado'}`, 'success');
      fetchData();
      fetchUnapproved();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const handleDeleteProfile = async (id: string, displayName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el perfil VTuber de "${displayName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await apiFetch(`/admin/vtubers/${id}`, { method: 'DELETE' });
      showToast('Perfil VTuber eliminado correctamente', 'success');
      fetchData();
      fetchUnapproved();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  };

  const handleCleanupProfiles = async () => {
    if (!window.confirm('¿Depurar perfiles fantasma? Se eliminarán los registros huérfanos de VTuber asociados a usuarios con rol USER. Esta acción es segura y dejará la lista exclusivamente con VTubers reales.')) return;
    setCleaning(true);
    try {
      const res = await apiFetch<{ message: string }>('/admin/users/cleanup-profiles', { method: 'POST' });
      showToast(res.message || 'Depuración completada', 'success');
      fetchData();
      fetchUnapproved();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error en la depuración', 'error');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>VTubers Oficiales</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0, fontSize: '0.9rem' }}>Directorio y administración de perfiles VTuber en la plataforma</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/admin/vtuber-requests"
            className="btn"
            style={{
              padding: '9px 18px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899, #be185d)',
              color: '#ffffff', fontWeight: 600, fontSize: '0.85rem',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              textDecoration: 'none', border: 'none',
              boxShadow: '0 2px 10px rgba(236,72,153,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Bandeja de Solicitudes
          </Link>
          {canAdmin && (
            <button
              onClick={handleCleanupProfiles}
              disabled={cleaning}
              className="btn"
              style={{
                padding: '9px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                opacity: cleaning ? 0.6 : 1,
              }}
              title="Elimina fichas fantasma de usuarios comunes con rol USER"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              {cleaning ? 'Depurando...' : 'Depurar Huérfanos'}
            </button>
          )}
        </div>
      </div>

      {/* ===== QUICK APPROVAL SECTION ===== */}
      {canAdmin && !loadingUnapproved && unapprovedData.length > 0 && !quickApprovalError && (
        <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(33,150,243,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(33,150,243,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#2196f3' }}>Aprobación Rápida</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Estas solicitudes están pendientes de aprobación. Al aprobar, se les otorgará el rol VTuber.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unapprovedData.map((profile) => (
              <div key={profile.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: profile.avatarUrl
                    ? `url(${profile.avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  flexShrink: 0, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
                }}>
                  {!profile.avatarUrl && profile.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {profile.displayName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    @{profile.user?.username}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleFlag(profile.id, 'isApproved', false, 'Aprobación')}
                  className="btn"
                  style={{
                    padding: '8px 20px', fontSize: '0.85rem', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #00e676, #4caf50)',
                    color: 'white', fontWeight: 700, border: 'none',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 12px rgba(0,230,118,0.3)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,230,118,0.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,230,118,0.3)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="8 12 11 15 16 9"/>
                  </svg>
                  Aprobar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== FILTERS ===== */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">Buscar</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre o usuario..." style={{ marginTop: '6px' }} />
          </div>
          <div>
            <label className="form-label">Verificado</label>
            <select className="input" value={filterVerified} onChange={e => setFilterVerified(e.target.value)} style={{ marginTop: '6px', minWidth: '130px' }}>
              <option value="">Todos</option>
              <option value="true">Verificados</option>
              <option value="false">No verificados</option>
            </select>
          </div>
          <div>
            <label className="form-label">Aprobado</label>
            <select className="input" value={filterApproved} onChange={e => setFilterApproved(e.target.value)} style={{ marginTop: '6px', minWidth: '130px' }}>
              <option value="">Todos</option>
              <option value="true">Aprobados</option>
              <option value="false">Pendientes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando VTubers...</div>
        ) : fetchError ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ color: '#f44336', fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Error al cargar los VTubers
            </div>
            <button
              onClick={fetchData}
              className="btn"
              style={{
                padding: '10px 24px', fontSize: '0.9rem', borderRadius: '10px',
                background: 'rgba(138,43,226,0.15)', color: '#8a2be2',
                border: '1px solid rgba(138,43,226,0.3)', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.25)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.15)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Reintentar
            </button>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron VTubers</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Nombre', 'Usuario', 'Verificado', 'Aprobado', 'Destacado', 'Oculto', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((profile: AdminVtuber) => (
                    <tr key={profile.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px' }}>
                        <a
                          href={`/vtubers/${profile.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
                          title="Ver perfil público"
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: profile.avatarUrl ? `url(${profile.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{profile.displayName}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </div>
                          </div>
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{profile.user?.username}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: profile.isVerified ? '#00e676' : 'var(--text-muted)', fontSize: '1.2rem' }}>
                          {profile.isVerified ? '✓' : '✕'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: profile.isApproved ? '#00e676' : '#ff9800', fontSize: '1.2rem' }}>
                          {profile.isApproved ? '✓' : '...'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: profile.isFeatured ? '#ff007f' : 'var(--text-muted)', fontSize: '1.2rem' }}>
                          {profile.isFeatured ? '★' : '−'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: profile.isHidden ? '#f44336' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {profile.isHidden ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {!canAdmin && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Solo lectura</span>
                        )}
                        {canAdmin && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => openEdit(profile)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(138,43,226,0.2)', color: '#8a2be2', border: '1px solid rgba(138,43,226,0.3)' }}>Editar</button>
                          <button onClick={() => handleToggleFlag(profile.id, 'isVerified', profile.isVerified, 'Verificación')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: profile.isVerified ? 'rgba(255,152,0,0.2)' : '#1d9bf033', color: profile.isVerified ? '#ff9800' : '#1d9bf0', border: `1px solid ${profile.isVerified ? '#ff980033' : '#1d9bf033'}` }}>
                            {profile.isVerified ? 'Quitar ✓' : 'Verificar'}
                          </button>
                          <button onClick={() => handleToggleFlag(profile.id, 'isApproved', profile.isApproved, 'Aprobación')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(33,150,243,0.2)', color: '#2196f3', border: '1px solid rgba(33,150,243,0.3)' }}>
                            {profile.isApproved ? 'Desaprobar' : 'Aprobar'}
                          </button>
                          <button onClick={() => handleToggleFlag(profile.id, 'isFeatured', profile.isFeatured, 'Destacado')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,0,127,0.2)', color: '#ff007f', border: '1px solid rgba(255,0,127,0.3)' }}>
                            {profile.isFeatured ? 'Quitar destacado' : 'Destacar'}
                          </button>
                          <button onClick={() => handleToggleFlag(profile.id, 'isHidden', profile.isHidden, 'Ocultar')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>
                            {profile.isHidden ? 'Mostrar' : 'Ocultar'}
                          </button>
                          <button onClick={() => handleDeleteProfile(profile.id, profile.displayName)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.15)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }} title="Eliminar perfil permanentemente">
                            Eliminar
                          </button>
                        </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.meta.totalPages > 1 && (
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page <= 1 ? 0.5 : 1 }}>← Anterior</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Página {data.meta.page} de {data.meta.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page >= data.meta.totalPages} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page >= data.meta.totalPages ? 0.5 : 1 }}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>

      {mounted && selectedProfile && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px', overflowY: 'auto' }} onClick={() => setSelectedProfile(null)}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Editar Perfil VTuber</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  @{selectedProfile.user?.username} · {selectedProfile.user?.role || '—'}
                </p>
              </div>
              <button onClick={() => setSelectedProfile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              {([
                { id: 'basico', label: 'Info Básica', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z' },
                { id: 'stream', label: 'Stream & Horario', icon: 'M8 5v14l11-7z' },
                { id: 'redes', label: 'Redes Sociales', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
              ] as const).map((tab) => (
                <button key={tab.id} onClick={() => setEditTab(tab.id)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600,
                    background: editTab === tab.id ? 'rgba(138,43,226,0.2)' : 'transparent',
                    color: editTab === tab.id ? '#8a2be2' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {editTab === 'basico' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nombre de VTuber</label>
                    <input className="input" value={editData.displayName} onChange={e => setEditData({ ...editData, displayName: e.target.value })} placeholder="Nombre artístico" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Avatar URL</label>
                    <input className="input" value={editData.avatarUrl} onChange={e => setEditData({ ...editData, avatarUrl: e.target.value })} placeholder="https://..." />
                    {editData.avatarUrl && (
                      <div style={{ marginTop: '8px', width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={editData.avatarUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Banner URL</label>
                    <input className="input" value={editData.bannerUrl} onChange={e => setEditData({ ...editData, bannerUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea className="input" style={{ minHeight: '100px', resize: 'vertical' }} value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} placeholder="Biografía corta..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lore / Historia</label>
                    <textarea className="input" style={{ minHeight: '100px', resize: 'vertical' }} value={editData.lore} onChange={e => setEditData({ ...editData, lore: e.target.value })} placeholder="Historia de fondo del personaje..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Tipo de Contenido</label>
                      <select className="input" value={editData.contentType} onChange={e => setEditData({ ...editData, contentType: e.target.value })}>
                        <option value="">Seleccionar...</option>
                        <option value="gaming">Gaming</option>
                        <option value="music">Música</option>
                        <option value="art">Arte</option>
                        <option value="singing">Canto</option>
                        <option value="asmr">ASMR</option>
                        <option value="chatting">Charla / Just Chatting</option>
                        <option value="vtuber">VTuber General</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Color Temático</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={editData.themeColor || '#8a2be2'} onChange={e => setEditData({ ...editData, themeColor: e.target.value })}
                          style={{ width: '40px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                        <input className="input" value={editData.themeColor} onChange={e => setEditData({ ...editData, themeColor: e.target.value })} placeholder="#8a2be2" style={{ flex: 1 }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nombre de Fans</label>
                      <input className="input" value={editData.fanName} onChange={e => setEditData({ ...editData, fanName: e.target.value })} placeholder="Ej: Estelares" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Oshi Mark (Símbolo)</label>
                      <input className="input" value={editData.oshiMark} onChange={e => setEditData({ ...editData, oshiMark: e.target.value })} placeholder="Ej: ✦" maxLength={10} />
                    </div>
                  </div>
                </>
              )}

              {editTab === 'stream' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Horario de Stream</label>
                    <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={editData.streamSchedule} onChange={e => setEditData({ ...editData, streamSchedule: e.target.value })} placeholder="Ej: Lunes y Viernes 20:00 VRChat / Sábados 18:00 Twitch" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Idiomas</label>
                    <input className="input" value={editData.languages} onChange={e => setEditData({ ...editData, languages: e.target.value })} placeholder='Ej: ["Español","Inglés"] o separado por comas' />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>JSON array o lista separada por comas</span>
                  </div>
                </>
              )}

              {editTab === 'redes' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#9146FF' }}>Twitch</label>
                      <input className="input" value={editData.twitchUrl} onChange={e => setEditData({ ...editData, twitchUrl: e.target.value })} placeholder="https://twitch.tv/..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#FF0000' }}>YouTube</label>
                      <input className="input" value={editData.youtubeUrl} onChange={e => setEditData({ ...editData, youtubeUrl: e.target.value })} placeholder="https://youtube.com/@..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#53fc18' }}>Kick</label>
                      <input className="input" value={editData.kickUrl} onChange={e => setEditData({ ...editData, kickUrl: e.target.value })} placeholder="https://kick.com/..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#00f2ea' }}>TikTok</label>
                      <input className="input" value={editData.tiktokUrl} onChange={e => setEditData({ ...editData, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/@..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#1DA1F2' }}>Twitter / X</label>
                      <input className="input" value={editData.twitterUrl} onChange={e => setEditData({ ...editData, twitterUrl: e.target.value })} placeholder="https://x.com/..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#5865F2' }}>Discord</label>
                      <input className="input" value={editData.discordUrl} onChange={e => setEditData({ ...editData, discordUrl: e.target.value })} placeholder="https://discord.gg/..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sitio Web</label>
                      <input className="input" value={editData.websiteUrl} onChange={e => setEditData({ ...editData, websiteUrl: e.target.value })} placeholder="https://..." />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
              <button onClick={() => setSelectedProfile(null)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '10px' }}>Cancelar</button>
              <button onClick={saveProfile} className="btn" disabled={saving} style={{
                padding: '10px 28px', borderRadius: '10px', fontWeight: 700,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff', border: 'none',
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
