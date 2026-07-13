'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface AdminGuild {
  id: string;
  name: string;
  description: string | null;
  tags: string | null;
  isSuspended: boolean;
  createdAt: string;
  creator: { id: string; username: string } | null;
  _count: { members: number };
}

interface AdminGuildDetail extends AdminGuild {
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: { id: string; username: string };
  }>;
}

interface AdminGuildsResponse {
  data: AdminGuild[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminGuildsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminGuildsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedGuild, setSelectedGuild] = useState<AdminGuild | null>(null);
  const [editData, setEditData] = useState({ name: '', description: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<AdminGuildDetail | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await apiFetch(`/admin/guilds?${params}`);
      setData(res);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { setPage(1); }, [search]);

  const openDetail = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/guilds/${id}`);
      setDetail(res);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const openEdit = (guild: AdminGuild) => {
    setSelectedGuild(guild);
    setEditData({ name: guild.name, description: guild.description || '', tags: guild.tags || '' });
  };

  const saveGuild = async () => {
    if (!selectedGuild) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/guilds/${selectedGuild.id}`, { method: 'PATCH', body: JSON.stringify(editData) });
      showToast('Gremio actualizado', 'success');
      setSelectedGuild(null);
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const deleteGuild = async (id: string) => {
    if (!window.confirm('¿Eliminar este gremio permanentemente? Esto eliminará todos sus miembros.')) return;
    try {
      await apiFetch(`/admin/guilds/${id}`, { method: 'DELETE' });
      showToast('Gremio eliminado', 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const toggleSuspended = async (id: string, current: boolean) => {
    try {
      await apiFetch(`/admin/guilds/${id}`, { method: 'PATCH', body: JSON.stringify({ isSuspended: !current }) });
      showToast(`Gremio ${current ? 'restaurado' : 'suspendido'}`, 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Gremios</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Administración de gremios</p>

      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">Buscar</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre del gremio..." style={{ marginTop: '6px' }}
              onKeyDown={e => e.key === 'Enter' && fetchData()} />
          </div>
          <button onClick={fetchData} className="btn" style={{ padding: '10px 24px' }}>Buscar</button>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando gremios...</div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron gremios</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Nombre', 'Creador', 'Miembros', 'Creado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((guild: AdminGuild) => (
                    <tr key={guild.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', opacity: guild.isSuspended ? 0.5 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{guild.name} {guild.isSuspended && <span style={{ color: '#f44336', fontSize: '0.75rem', fontWeight: 600 }}>SUSPENDIDO</span>}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{guild.creator?.username}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{guild._count?.members || 0}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(guild.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => openEdit(guild)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(138,43,226,0.2)', color: '#8a2be2', border: '1px solid rgba(138,43,226,0.3)' }}>Editar</button>
                          <button onClick={() => openDetail(guild.id)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(33,150,243,0.2)', color: '#2196f3', border: '1px solid rgba(33,150,243,0.3)' }}>Miembros</button>
                          <button onClick={() => toggleSuspended(guild.id, guild.isSuspended)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: guild.isSuspended ? 'rgba(0,230,118,0.2)' : 'rgba(255,152,0,0.2)', color: guild.isSuspended ? '#00e676' : '#ff9800', border: `1px solid ${guild.isSuspended ? '#00e67633' : '#ff980033'}` }}>
                            {guild.isSuspended ? 'Restaurar' : 'Suspender'}
                          </button>
                          <button onClick={() => deleteGuild(guild.id)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>Eliminar</button>
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

      {/* Detail Modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setDetail(null)}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{detail.name} — Miembros</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {detail.members?.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>@{m.user?.username}</span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: m.role === 'LEADER' ? 'rgba(255,215,0,0.15)' : m.role === 'OFFICER' ? 'rgba(33,150,243,0.15)' : 'rgba(255,255,255,0.05)', color: m.role === 'LEADER' ? '#ffd700' : m.role === 'OFFICER' ? '#2196f3' : 'var(--text-muted)' }}>
                    {m.role}
                  </span>
                </div>
              ))}
              {(!detail.members || detail.members.length === 0) && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sin miembros</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedGuild && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setSelectedGuild(null)}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Editar Gremio</h2>
              <button onClick={() => setSelectedGuild(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="input" style={{ minHeight: '100px', resize: 'vertical' }} value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <input className="input" value={editData.tags} onChange={e => setEditData({ ...editData, tags: e.target.value })} placeholder="Tags separados por comas" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedGuild(null)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
              <button onClick={saveGuild} className="btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
