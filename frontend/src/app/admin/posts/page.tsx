'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface AdminPost {
  id: string;
  content: string;
  isHidden: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  createdAt: string;
  user: { id: string; username: string } | null;
  _count: { comments: number; likes: number };
}

interface AdminPostsResponse {
  data: AdminPost[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminPostsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminPostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hideFilter, setHideFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (hideFilter) params.set('isHidden', hideFilter);
      const res = await apiFetch(`/admin/posts?${params}`);
      setData(res);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, hideFilter]);
  useEffect(() => { setPage(1); }, [search, hideFilter]);

  const actionPost = async (id: string, payload: Record<string, unknown>, label: string) => {
    try {
      await apiFetch(`/admin/posts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      showToast(`Publicacion ${label}`, 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('¿Eliminar esta publicación permanentemente?')) return;
    try {
      await apiFetch(`/admin/posts/${id}`, { method: 'DELETE' });
      showToast('Publicacion eliminada', 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  const restorePost = async (id: string) => {
    try {
      await apiFetch(`/admin/posts/${id}/restore`, { method: 'POST' });
      showToast('Publicacion restaurada', 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Publicaciones</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Moderación de contenido del feed</p>

      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">Buscar en contenido</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Texto de la publicación..." style={{ marginTop: '6px' }}
              onKeyDown={e => e.key === 'Enter' && fetchData()} />
          </div>
          <div>
            <label className="form-label">Visibilidad</label>
            <select className="input" value={hideFilter} onChange={e => setHideFilter(e.target.value)} style={{ marginTop: '6px', minWidth: '140px' }}>
              <option value="">Todas</option>
              <option value="true">Ocultas</option>
              <option value="false">Visibles</option>
            </select>
          </div>
          <button onClick={fetchData} className="btn" style={{ padding: '10px 24px' }}>Buscar</button>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando publicaciones...</div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron publicaciones</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Contenido', 'Autor', 'Likes', 'Comentarios', 'Creado', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((post: AdminPost) => (
                    <tr key={post.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', opacity: post.isHidden ? 0.6 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                        {post.content}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{post.user?.username}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{post._count?.likes || 0}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{post._count?.comments || 0}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(post.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {post.isHidden ? (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(244,67,54,0.15)', color: '#f44336' }}>OCULTA</span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(0,230,118,0.15)', color: '#00e676' }}>VISIBLE</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => actionPost(post.id, { isHidden: !post.isHidden }, post.isHidden ? 'restaurada' : 'oculta')}
                            className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: post.isHidden ? 'rgba(0,230,118,0.2)' : 'rgba(255,152,0,0.2)', color: post.isHidden ? '#00e676' : '#ff9800', border: `1px solid ${post.isHidden ? '#00e67633' : '#ff980033'}` }}>
                            {post.isHidden ? 'Mostrar' : 'Ocultar'}
                          </button>
                          <button onClick={() => actionPost(post.id, { isPinned: !post.isPinned }, post.isPinned ? 'desfijada' : 'fijada')}
                            className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: post.isPinned ? 'rgba(255,152,0,0.2)' : 'rgba(33,150,243,0.2)', color: post.isPinned ? '#ff9800' : '#2196f3', border: `1px solid ${post.isPinned ? '#ff980033' : '#2196f333'}` }}>
                            {post.isPinned ? 'Desfijar' : 'Fijar'}
                          </button>
                          <button onClick={() => actionPost(post.id, { isFeatured: !post.isFeatured }, post.isFeatured ? 'no destacada' : 'destacada')}
                            className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,0,127,0.2)', color: '#ff007f', border: '1px solid rgba(255,0,127,0.3)' }}>
                            {post.isFeatured ? 'Quitar destacado' : 'Destacar'}
                          </button>
                          {post.isHidden && (
                            <button onClick={() => restorePost(post.id)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(0,230,118,0.2)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}>Restaurar</button>
                          )}
                          <button onClick={() => deletePost(post.id)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>Eliminar</button>
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
    </div>
  );
}
