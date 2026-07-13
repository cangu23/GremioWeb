'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  creator: { id: string; username: string } | null;
  _count: { attendees: number };
}

interface AdminEventsResponse {
  data: AdminEvent[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminEventsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [editData, setEditData] = useState({ title: '', description: '', location: '', status: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiFetch(`/admin/events?${params}`);
      setData(res);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchData(); };

  const openEdit = (event: AdminEvent) => {
    setSelectedEvent(event);
    setEditData({ title: event.title, description: event.description || '', location: event.location || '', status: event.status });
  };

  const saveEvent = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/events/${selectedEvent.id}`, { method: 'PATCH', body: JSON.stringify(editData) });
      showToast('Evento actualizado', 'success');
      setSelectedEvent(null);
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id: string) => {
    if (!window.confirm('¿Eliminar este evento permanentemente?')) return;
    try {
      await apiFetch(`/admin/events/${id}`, { method: 'DELETE' });
      showToast('Evento eliminado', 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const cancelEvent = async (id: string) => {
    if (!window.confirm('¿Cancelar este evento?')) return;
    try {
      await apiFetch(`/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) });
      showToast('Evento cancelado', 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await apiFetch(`/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify({ isFeatured: !current }) });
      showToast(`Evento ${current ? 'no destacado' : 'destacado'}`, 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const statusStyles: Record<string, { bg: string; color: string }> = {
    UPCOMING: { bg: 'rgba(0,230,118,0.15)', color: '#00e676' },
    ONGOING: { bg: 'rgba(33,150,243,0.15)', color: '#2196f3' },
    COMPLETED: { bg: 'rgba(158,158,158,0.15)', color: '#9e9e9e' },
    CANCELLED: { bg: 'rgba(244,67,54,0.15)', color: '#f44336' },
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Eventos</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Administración de eventos</p>

      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">Buscar</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Título del evento..." style={{ marginTop: '6px' }} />
          </div>
          <div>
            <label className="form-label">Estado</label>
            <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ marginTop: '6px', minWidth: '140px' }}>
              <option value="">Todos</option>
              <option value="UPCOMING">Próximos</option>
              <option value="ONGOING">En curso</option>
              <option value="COMPLETED">Completados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
          <button type="submit" className="btn" style={{ padding: '10px 24px' }}>Buscar</button>
        </form>
      </div>

      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando eventos...</div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron eventos</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Título', 'Creador', 'Fecha', 'Estado', 'Asistentes', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((event: AdminEvent) => {
                    const st = statusStyles[event.status] || { bg: 'rgba(158,158,158,0.15)', color: '#9e9e9e' };
                    return (
                      <tr key={event.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: '0.9rem' }}>{event.title}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{event.creator?.username}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {new Date(event.date).toLocaleDateString('es-ES')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: st.bg, color: st.color }}>
                            {event.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{event._count?.attendees || 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button onClick={() => openEdit(event)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(138,43,226,0.2)', color: '#8a2be2', border: '1px solid rgba(138,43,226,0.3)' }}>Editar</button>
                            <button onClick={() => toggleFeatured(event.id, event.isFeatured)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,0,127,0.2)', color: '#ff007f', border: '1px solid rgba(255,0,127,0.3)' }}>
                              {event.isFeatured ? 'Quitar destacado' : 'Destacar'}
                            </button>
                            {event.status !== 'CANCELLED' && (
                              <button onClick={() => cancelEvent(event.id)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,152,0,0.2)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)' }}>Cancelar</button>
                            )}
                            <button onClick={() => deleteEvent(event.id)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {selectedEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setSelectedEvent(null)}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Editar Evento</h2>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="input" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="input" style={{ minHeight: '100px', resize: 'vertical' }} value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <input className="input" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="input" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                  <option value="UPCOMING">Próximo</option>
                  <option value="ONGOING">En curso</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEvent(null)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
              <button onClick={saveEvent} className="btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
