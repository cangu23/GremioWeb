'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface AdminComment {
  id: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
  user: { id: string; username: string; vtuberProfile?: { displayName: string; avatarUrl: string | null } | null } | null;
  post: { id: string; content: string };
}

interface AdminCommentsResponse {
  data: AdminComment[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminCommentsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminCommentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hideFilter, setHideFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (hideFilter) params.set('isHidden', hideFilter);
      const res = await apiFetch(`/admin/comments?${params}`);
      setData(res);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setLoading(false); }
  }, [page, search, hideFilter, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, hideFilter]);

  const toggleHidden = async (id: string, current: boolean) => {
    try {
      await apiFetch(`/admin/comments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isHidden: !current }),
      });
      showToast(`Comentario ${current ? 'restaurado' : 'oculto'}`, 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const deleteComment = async (id: string, username: string) => {
    if (!window.confirm(`¿Eliminar este comentario de @${username} permanentemente?`)) return;
    try {
      await apiFetch(`/admin/comments/${id}`, { method: 'DELETE' });
      showToast('Comentario eliminado', 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Comentarios</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Moderación de comentarios en publicaciones</p>

      {/* Filters */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">Buscar en contenido</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Texto del comentario..." style={{ marginTop: '6px' }}
              onKeyDown={e => e.key === 'Enter' && fetchData()} />
          </div>
          <div>
            <label className="form-label">Visibilidad</label>
            <select className="input" value={hideFilter} onChange={e => setHideFilter(e.target.value)} style={{ marginTop: '6px', minWidth: '140px' }}>
              <option value="">Todos</option>
              <option value="true">Ocultos</option>
              <option value="false">Visibles</option>
            </select>
          </div>
          <button onClick={fetchData} className="btn" style={{ padding: '10px 24px' }}>Buscar</button>
        </div>
      </div>

      {/* Comments Table */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando comentarios...</div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {search || hideFilter ? 'No se encontraron comentarios con esos filtros' : 'No hay comentarios aún'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Comentario', 'Autor', 'Publicación', 'Creado', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((comment: AdminComment) => (
                    <tr key={comment.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', opacity: comment.isHidden ? 0.6 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                        {comment.content}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        @{comment.user?.username || 'Eliminado'}
                        {comment.user?.vtuberProfile?.displayName && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.6, marginLeft: '4px' }}>
                            ({comment.user.vtuberProfile.displayName})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        {comment.post?.content || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(comment.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {comment.isHidden ? (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(244,67,54,0.15)', color: '#f44336' }}>OCULTO</span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(0,230,118,0.15)', color: '#00e676' }}>VISIBLE</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => toggleHidden(comment.id, comment.isHidden)}
                            className="btn" style={{
                              padding: '4px 10px', fontSize: '0.75rem',
                              background: comment.isHidden ? 'rgba(0,230,118,0.2)' : 'rgba(255,152,0,0.2)',
                              color: comment.isHidden ? '#00e676' : '#ff9800',
                              border: `1px solid ${comment.isHidden ? '#00e67633' : '#ff980033'}`
                            }}>
                            {comment.isHidden ? 'Mostrar' : 'Ocultar'}
                          </button>
                          <button onClick={() => deleteComment(comment.id, comment.user?.username || '?')}
                            className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.meta.totalPages > 1 && (
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page <= 1 ? 0.5 : 1 }}>
                  ← Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Página {data.meta.page} de {data.meta.totalPages} ({data.meta.total} comentarios)
                </span>
                <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page >= data.meta.totalPages} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page >= data.meta.totalPages ? 0.5 : 1 }}>
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
