'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface AdminVtuber {
  id: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  isHidden: boolean;
  user: { id: string; username: string } | null;
}

interface AdminVtubersResponse {
  data: AdminVtuber[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminVtubersPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminVtubersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<AdminVtuber | null>(null);
  const [editData, setEditData] = useState({ displayName: '', description: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterVerified) params.set('isVerified', filterVerified);
      if (filterApproved) params.set('isApproved', filterApproved);
      const res = await apiFetch(`/admin/vtubers?${params}`);
      setData(res);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, filterVerified, filterApproved]);
  useEffect(() => { setPage(1); }, [search, filterVerified, filterApproved]);

  const toggleFlag = async (id: string, field: string, currentValue: boolean, label: string) => {
    if (!window.confirm(`¿${currentValue ? 'Quitar' : 'Activar'} "${label}"?`)) return;
    try {
      await apiFetch(`/admin/vtubers/${id}`, { method: 'PATCH', body: JSON.stringify({ [field]: !currentValue }) });
      showToast(`VTuber ${label.toLowerCase()} ${currentValue ? 'desactivado' : 'activado'} ✅`, 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const openEdit = (profile: AdminVtuber) => {
    setSelectedProfile(profile);
    setEditData({
      displayName: profile.displayName,
      description: profile.description || '',
      avatarUrl: profile.avatarUrl || '',
    });
  };

  const saveProfile = async () => {
    if (!selectedProfile) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/vtubers/${selectedProfile.id}`, { method: 'PATCH', body: JSON.stringify(editData) });
      showToast('Perfil actualizado ✅', 'success');
      setSelectedProfile(null);
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>🎤 VTubers</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Gestión de perfiles VTuber</p>

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: profile.avatarUrl ? `url(${profile.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile.displayName}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{profile.user?.username}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: profile.isVerified ? '#00e676' : 'var(--text-muted)', fontSize: '1.2rem' }}>
                          {profile.isVerified ? '✅' : '❌'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: profile.isApproved ? '#00e676' : '#ff9800', fontSize: '1.2rem' }}>
                          {profile.isApproved ? '✅' : '⏳'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: profile.isFeatured ? '#ff007f' : 'var(--text-muted)', fontSize: '1.2rem' }}>
                          {profile.isFeatured ? '⭐' : '−'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: profile.isHidden ? '#f44336' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {profile.isHidden ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => openEdit(profile)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(138,43,226,0.2)', color: '#8a2be2', border: '1px solid rgba(138,43,226,0.3)' }}>Editar</button>
                          <button onClick={() => toggleFlag(profile.id, 'isVerified', profile.isVerified, 'Verificación')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: profile.isVerified ? 'rgba(255,152,0,0.2)' : 'rgba(0,230,118,0.2)', color: profile.isVerified ? '#ff9800' : '#00e676', border: `1px solid ${profile.isVerified ? '#ff980033' : '#00e67633'}` }}>
                            {profile.isVerified ? 'Quitar ✓' : 'Verificar'}
                          </button>
                          <button onClick={() => toggleFlag(profile.id, 'isApproved', profile.isApproved, 'Aprobación')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(33,150,243,0.2)', color: '#2196f3', border: '1px solid rgba(33,150,243,0.3)' }}>
                            {profile.isApproved ? 'Desaprobar' : 'Aprobar'}
                          </button>
                          <button onClick={() => toggleFlag(profile.id, 'isFeatured', profile.isFeatured, 'Destacado')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,0,127,0.2)', color: '#ff007f', border: '1px solid rgba(255,0,127,0.3)' }}>
                            {profile.isFeatured ? 'Quitar ⭐' : 'Destacar'}
                          </button>
                          <button onClick={() => toggleFlag(profile.id, 'isHidden', profile.isHidden, 'Ocultar')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>
                            {profile.isHidden ? 'Mostrar' : 'Ocultar'}
                          </button>
                        </div>
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

      {selectedProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setSelectedProfile(null)}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Editar Perfil VTuber</h2>
              <button onClick={() => setSelectedProfile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nombre de VTuber</label>
                <input className="input" value={editData.displayName} onChange={e => setEditData({ ...editData, displayName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Avatar URL</label>
                <input className="input" value={editData.avatarUrl} onChange={e => setEditData({ ...editData, avatarUrl: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="input" style={{ minHeight: '120px', resize: 'vertical' }} value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedProfile(null)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
              <button onClick={saveProfile} className="btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
