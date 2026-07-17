'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  xp: number;
  level: number;
  vtuberProfile?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
    isApproved: boolean;
    isFeatured: boolean;
    isHidden: boolean;
  } | null;
  _count: {
    posts: number;
    comments: number;
    likes: number;
    followers: number;
    following: number;
  };
}

interface PaginatedResponse {
  data: User[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const statusColors: Record<string, string> = {
  ACTIVE: '#00e676',
  SUSPENDED: '#ff9800',
  BANNED: '#f44336',
  PENDING: '#9e9e9e',
};

const roleColors: Record<string, string> = {
  ADMIN: '#8a2be2',
  MODERATOR: '#2196f3',
  VTUBER: '#ff007f',
  MAID: '#d4a030',
  USER: '#4caf50',
};

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editData, setEditData] = useState({ username: '', email: '', role: '', status: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (roleFilter) params.set('role', roleFilter);
      const res = await apiFetch(`/admin/users?${params}`);
      setData(res);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, statusFilter, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setEditData({ username: user.username, email: user.email, role: user.role, status: user.status });
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload: any = {};
      if (editData.username !== selectedUser.username) payload.username = editData.username;
      if (editData.role !== selectedUser.role) payload.role = editData.role;
      if (editData.status !== selectedUser.status) payload.status = editData.status;
      await apiFetch(`/admin/users/${selectedUser.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      showToast('Usuario actualizado', 'success');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmAction = async (userId: string, action: string, label: string) => {
    if (!window.confirm(`¿Estás seguro de ${label} a este usuario?`)) return;
    try {
      if (action === 'delete') {
        await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/admin/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: action === 'restore' ? 'ACTIVE' : action.toUpperCase() }),
        });
      }
      showToast(`Usuario ${label}do`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Usuarios</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Gestión completa de usuarios de la plataforma</p>

      {/* Search & Filters */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">Buscar</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Usuario o email..." style={{ marginTop: '6px' }} />
          </div>
          <div>
            <label className="form-label">Estado</label>
            <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ marginTop: '6px', minWidth: '140px' }}>
              <option value="">Todos</option>
              <option value="ACTIVE">Activo</option>
              <option value="SUSPENDED">Suspendido</option>
              <option value="BANNED">Baneado</option>
              <option value="PENDING">Pendiente</option>
            </select>
          </div>
          <div>
            <label className="form-label">Rol</label>
            <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ marginTop: '6px', minWidth: '140px' }}>
              <option value="">Todos</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderador</option>
              <option value="VTUBER">VTuber</option>
              <option value="MAID">Maid</option>
              <option value="USER">Usuario</option>
            </select>
          </div>
          <button type="submit" className="btn" style={{ padding: '10px 24px' }}>Buscar</button>
        </form>
      </div>

      {/* Users Table */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando usuarios...</div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron usuarios</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Usuario', 'Email', 'Rol', 'Estado', 'Nivel', 'Posts', 'Seguidores', 'Registro', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%',
                            background: user.vtuberProfile?.avatarUrl
                              ? `url(${user.vtuberProfile.avatarUrl}) center/cover`
                              : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden',
                          }}>
                            {!user.vtuberProfile?.avatarUrl && user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {user.username}
                              {user.vtuberProfile?.isVerified && (
                                <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Verificado">
                                  <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                                  <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {user.role === 'MAID' && (
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#d4a030', background: 'rgba(212,160,48,0.15)', padding: '1px 6px', borderRadius: '4px' }}>MAID</span>
                              )}
                            </div>
                            {user.vtuberProfile?.displayName && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {user.vtuberProfile.displayName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: `${roleColors[user.role] || '#666'}22`, color: roleColors[user.role] || '#666' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: statusColors[user.status] || '#666' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColors[user.status] || '#666' }} />
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{user.level}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user._count?.posts || 0}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user._count?.followers || 0}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => openEdit(user)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(138,43,226,0.2)', color: '#8a2be2', border: '1px solid rgba(138,43,226,0.3)' }}>Editar</button>
                          {user.status === 'ACTIVE' && (
                            <button onClick={() => confirmAction(user.id, 'suspend', 'suspender')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,152,0,0.2)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)' }}>Suspender</button>
                          )}
                          {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                            <button onClick={() => confirmAction(user.id, 'restore', 'restaurar')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(0,230,118,0.2)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}>Restaurar</button>
                          )}
                          {user.status !== 'BANNED' && (
                            <button onClick={() => confirmAction(user.id, 'ban', 'banear')} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>Banear</button>
                          )}
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
                  Página {data.meta.page} de {data.meta.totalPages} ({data.meta.total} usuarios)
                </span>
                <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page >= data.meta.totalPages} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page >= data.meta.totalPages ? 0.5 : 1 }}>
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setSelectedUser(null)}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Editar Usuario</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nombre de usuario</label>
                <input className="input" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="input" value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })}>
                  <option value="USER">Usuario</option>              <option value="VTUBER">VTuber</option>
              <option value="MAID">Maid</option>
              <option value="MODERATOR">Moderador</option>
              <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="input" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                  <option value="ACTIVE">Activo</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="BANNED">Baneado</option>
                  <option value="PENDING">Pendiente</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedUser(null)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
              <button onClick={saveUser} className="btn" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
