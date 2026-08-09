'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { isStaffRole, parseUserRoles } from '@gremio-estelar/shared';
import { normalizeUsername } from '@/lib/user-display';

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  plan?: string;
  stardust?: number;
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
  platformSubscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
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
  STAFF: '#10b981',
  BETA_TESTER: '#00bcd4',
  VTUBER: '#ff007f',
  STREAMER: '#38bdf8',
  MAID: '#d4a030',
  USER: '#4caf50',
};

const AVAILABLE_ROLES = [
  { id: 'ADMIN', label: '👑 Administrador', color: '#8a2be2' },
  { id: 'MODERATOR', label: '⚔️ Moderador', color: '#2196f3' },
  { id: 'STAFF', label: '🛡️ Staff', color: '#10b981' },
  { id: 'BETA_TESTER', label: '🧪 Beta Tester', color: '#00bcd4' },
  { id: 'VTUBER', label: '🌸 VTuber / Creador', color: '#ff007f' },
  { id: 'STREAMER', label: '🎥 Streamer / Creador', color: '#38bdf8' },
  { id: 'MAID', label: '☕ Maid Café Host', color: '#d4a030' },
  { id: 'USER', label: '👤 Usuario Normal', color: '#4caf50' },
];

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [editRoles, setEditRoles] = useState<string[]>(['USER']);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
    plan: 'FREE',
    stardust: 0,
    status: '',
    level: 1,
    isVerified: false,
  });
  const [saving, setSaving] = useState(false);

  // Premium plan grant
  const [premiumUser, setPremiumUser] = useState<User | null>(null);
  const [grantPlan, setGrantPlan] = useState<'ASTRO' | 'NOVA' | 'STELLAR'>('ASTRO');
  const [grantDays, setGrantDays] = useState(30);
  const [granting, setGranting] = useState(false);

  // Delete account (ADMIN only)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

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
      showToast(err.message || 'Error al cargar usuarios', 'error');
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
    const userRolesList = parseUserRoles(user.role);
    setEditRoles(userRolesList);
    // Normaliza planes legacy/desconocidos (p.ej. 'VIP', 'PREMIUM', 'ESTELAR'
    // del selector roto anterior) a FREE para que el select muestre algo válido.
    const validPlans = ['FREE', 'ASTRO', 'NOVA', 'STELLAR'];
    const planValue = user.plan && validPlans.includes(user.plan) ? user.plan : 'FREE';
    setEditData({
      username: user.username,
      email: user.email,
      plan: planValue,
      stardust: user.stardust || 0,
      status: user.status,
      level: user.level || 1,
      isVerified: !!user.vtuberProfile?.isVerified,
    });
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload: any = {};
      const targetRoleStr = editRoles.join(',');

      if (editData.username !== selectedUser.username) payload.username = editData.username;
      if (editData.email !== selectedUser.email) payload.email = editData.email;
      if (targetRoleStr !== selectedUser.role) payload.role = targetRoleStr;
      if (editData.plan !== (selectedUser.plan || 'FREE')) payload.plan = editData.plan;
      if (editData.stardust !== (selectedUser.stardust || 0)) payload.stardust = Number(editData.stardust);
      if (editData.status !== selectedUser.status) payload.status = editData.status;
      if (editData.level !== selectedUser.level) payload.level = Number(editData.level);
      if (editData.isVerified !== !!selectedUser.vtuberProfile?.isVerified) payload.isVerified = editData.isVerified;

      await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      showToast('Usuario y roles actualizados con éxito', 'success');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const grantPremium = async () => {
    if (!premiumUser) return;
    setGranting(true);
    try {
      const res = await apiFetch('/admin/grant-plan', {
        method: 'POST',
        body: JSON.stringify({ targetUser: premiumUser.id, plan: grantPlan, durationDays: grantDays }),
      });
      showToast(res.message || `Plan ${grantPlan} otorgado a @${premiumUser.username}`, 'success');
      setPremiumUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Error al otorgar el plan', 'error');
    } finally {
      setGranting(false);
    }
  };

  const hasPremium = (user: User) =>
    (!!user.plan && user.plan !== 'FREE') || user.platformSubscription?.status === 'ACTIVE';

  const revokePremium = async (user: User) => {
    if (!window.confirm(`¿Seguro que quieres quitar el plan premium de @${user.username}? Volverá al plan gratuito.`)) return;
    try {
      const res = await apiFetch('/admin/revoke-plan', {
        method: 'POST',
        body: JSON.stringify({ targetUser: user.id }),
      });
      showToast(res.message || `Plan retirado de @${user.username}`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Error al retirar el plan', 'error');
    }
  };

  const deleteAccount = async () => {
    if (!deleteTarget) return;
    if (normalizeUsername(deleteConfirmName) !== deleteTarget.username) {
      showToast('El nombre de usuario no coincide con la cuenta a eliminar', 'error');
      return;
    }
    setDeleting(true);
    try {
      await apiFetch(`/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      showToast(`Cuenta de @${deleteTarget.username} eliminada permanentemente`, 'success');
      setDeleteTarget(null);
      setDeleteConfirmName('');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar la cuenta', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleVerified = async (user: User) => {
    const nextState = !user.vtuberProfile?.isVerified;
    try {
      await apiFetch(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isVerified: nextState }),
      });
      showToast(nextState ? 'Usuario verificado 🔵' : 'Insignia de verificación removida', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar verificación', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestión de Usuarios</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Asigna múltiples roles, planes premium, verificaciones y administra usuarios.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label className="form-label">Buscar Usuario</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Username o email..." style={{ marginTop: '6px' }} />
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
              <option value="">Todos los Roles</option>
              {AVAILABLE_ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn" style={{ padding: '10px 24px' }}>Buscar</button>
        </form>
      </div>

      {/* Users Table Container */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando usuarios...</div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron usuarios</div>
        ) : (
          <>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuario / Email</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Roles Asignados</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Plan & Saldo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((user) => {
                    const isVer = !!user.vtuberProfile?.isVerified;
                    const rolesList = parseUserRoles(user.role);

                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        
                        {/* 1. Usuario / Email */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: (user.avatarUrl || user.vtuberProfile?.avatarUrl)
                                ? `url(${user.avatarUrl || user.vtuberProfile?.avatarUrl}) center/cover`
                                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden',
                            }}>
                              {!(user.avatarUrl || user.vtuberProfile?.avatarUrl) && user.username.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{user.username}</span>
                                {isVer && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Verificado" style={{ flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                                    <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Roles Asignados (Multi-Role Badges) */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {rolesList.map((r, idx) => (
                              <span key={idx} style={{
                                padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                                background: `${roleColors[r] || '#666'}22`, color: roleColors[r] || '#666',
                                border: `1px solid ${roleColors[r] || '#666'}44`, whiteSpace: 'nowrap',
                              }}>
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 3. Plan & Saldo */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: statusColors[user.status] || '#666', fontWeight: 700 }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusColors[user.status] || '#666' }} />
                              {user.status}
                              {user.plan && user.plan !== 'FREE' && (
                                <span style={{ color: '#d4a030', marginLeft: '6px' }}>💎 {user.plan}</span>
                              )}
                              {user.platformSubscription?.status === 'ACTIVE' && (
                                <span style={{ color: '#a78bfa', marginLeft: '6px', fontSize: '0.72rem' }}>
                                  ⏳ hasta {new Date(user.platformSubscription.currentPeriodEnd).toLocaleDateString()}
                                </span>
                              )}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e8c060' }}>
                              {user.stardust?.toLocaleString() || 0} ⭐ (Lvl {user.level})
                            </span>
                          </div>
                        </td>

                        {/* 4. Acciones */}
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openEdit(user)}
                              className="btn"
                              style={{
                                padding: '6px 14px', fontSize: '0.8rem',
                                background: 'linear-gradient(135deg, rgba(138,43,226,0.35), rgba(168,85,247,0.2))',
                                color: '#e9d5ff', border: '1px solid rgba(168,85,247,0.5)', fontWeight: 800,
                                borderRadius: '8px',
                              }}
                            >
                              ✏️ Editar Roles
                            </button>

                            <button
                              onClick={() => toggleVerified(user)}
                              title={isVer ? 'Remover Verificado' : 'Otorgar Verificado'}
                              style={{
                                padding: '6px 10px', fontSize: '0.78rem',
                                background: isVer ? 'rgba(29,155,240,0.2)' : 'rgba(255,255,255,0.05)',
                                color: isVer ? '#1d9bf0' : 'var(--text-muted)',
                                border: isVer ? '1px solid rgba(29,155,240,0.4)' : '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                              }}
                            >
                              {isVer ? '🔵 Verificado' : '⚪ Verificar'}
                            </button>

                            <button
                              onClick={() => { setGrantPlan('ASTRO'); setGrantDays(30); setPremiumUser(user); }}
                              title="Otorgar plan premium"
                              style={{
                                padding: '6px 10px', fontSize: '0.78rem',
                                background: 'rgba(212,160,48,0.15)', color: '#d4a030',
                                border: '1px solid rgba(212,160,48,0.4)',
                                borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                              }}
                            >
                              💎 Premium
                            </button>

                            {hasPremium(user) && (
                              <button
                                onClick={() => revokePremium(user)}
                                title="Quitar plan premium"
                                style={{
                                  padding: '6px 10px', fontSize: '0.78rem',
                                  background: 'rgba(239,68,68,0.12)', color: '#f87171',
                                  border: '1px solid rgba(239,68,68,0.35)',
                                  borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                                }}
                              >
                                🚫 Quitar
                              </button>
                            )}

                            <button
                              onClick={() => { setDeleteConfirmName(''); setDeleteTarget(user); }}
                              title={isStaffRole(user.role) ? 'No se puede eliminar a miembros del staff' : 'Eliminar cuenta permanentemente'}
                              disabled={isStaffRole(user.role)}
                              style={{
                                padding: '6px 10px', fontSize: '0.78rem',
                                background: isStaffRole(user.role) ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.12)',
                                color: isStaffRole(user.role) ? 'var(--text-muted)' : '#f87171',
                                border: isStaffRole(user.role) ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(239,68,68,0.35)',
                                borderRadius: '8px', cursor: isStaffRole(user.role) ? 'not-allowed' : 'pointer', fontWeight: 700,
                              }}
                            >
                              🗑️ Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Edit User Modal with Multi-Role Assignment */}
      {mounted && selectedUser && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px',
        }} onClick={() => setSelectedUser(null)}>
          <div className="glass" style={{
            padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '640px',
            border: '1px solid rgba(212,160,48,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            maxHeight: '90vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f5e6d3' }}>Editar Roles y Usuario</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Asigna múltiples roles, plan VIP, stardust y verificación de @{selectedUser.username}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              
              {/* Multi-Role Selector Checkboxes */}
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(212,160,48,0.2)' }}>
                <label className="form-label" style={{ color: '#e8c060', fontWeight: 800, marginBottom: '10px', display: 'block', fontSize: '0.9rem' }}>
                  🎯 Roles Asignados (Puedes marcar múltiples roles simultáneamente)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {AVAILABLE_ROLES.map(r => {
                    const isChecked = editRoles.includes(r.id);
                    return (
                      <label key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px',
                        borderRadius: '10px', background: isChecked ? `${r.color}22` : 'rgba(255,255,255,0.03)',
                        border: isChecked ? `1px solid ${r.color}66` : '1px solid rgba(255,255,255,0.08)',
                        color: isChecked ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: isChecked ? 700 : 500,
                        transition: 'all 0.15s ease',
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setEditRoles(prev => [...prev, r.id]);
                            } else {
                              setEditRoles(prev => prev.length > 1 ? prev.filter(x => x !== r.id) : prev);
                            }
                          }}
                          style={{ accentColor: r.color, width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>{r.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre de Usuario</label>
                  <input className="input" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#e8c060', fontWeight: 700 }}>Plan Premium VIP</label>
                  <select className="input" value={editData.plan} onChange={e => setEditData({ ...editData, plan: e.target.value })}>
                    <option value="FREE">Gratuito (FREE)</option>
                    <option value="ASTRO">💎 Astro — $2.99/mes</option>
                    <option value="NOVA">✨ Nova Pro — $5.99/mes</option>
                    <option value="STELLAR">🌟 Stellar Elite — $12.99/mes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Saldo de Stardust ⭐</label>
                  <input type="number" className="input" value={editData.stardust} onChange={e => setEditData({ ...editData, stardust: Number(e.target.value) })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Nivel de Usuario</label>
                  <input type="number" className="input" value={editData.level} onChange={e => setEditData({ ...editData, level: Number(e.target.value) })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado de la Cuenta</label>
                  <select className="input" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                    <option value="ACTIVE">🟢 Activo</option>
                    <option value="SUSPENDED">🟠 Suspendido</option>
                    <option value="BANNED">🔴 Baneado</option>
                    <option value="PENDING">⚪ Pendiente</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#f5e6d3', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={editData.isVerified}
                    onChange={e => setEditData({ ...editData, isVerified: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#1d9bf0', cursor: 'pointer' }}
                  />
                  <span>🔵 Usuario Verificado (Insignia Oficial)</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedUser(null)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
              <button onClick={saveUser} className="btn" disabled={saving} style={{ background: 'linear-gradient(135deg, #d4a030, #a0782c)', color: '#1a1410', fontWeight: 800 }}>
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Account Confirmation Modal */}
      {mounted && deleteTarget && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002, padding: '20px',
        }} onClick={() => setDeleteTarget(null)}>
          <div className="glass" style={{
            padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '480px',
            border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171' }}>🗑️ Eliminar Cuenta</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Esta acción es permanente e irreversible.</p>
              </div>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '16px', marginBottom: '20px', fontSize: '0.88rem', color: '#fca5a5', lineHeight: 1.6 }}>
              Se eliminará <strong>permanentemente</strong> la cuenta de <strong>@{deleteTarget.username}</strong> junto con todos sus
              posts, comentarios, likes, seguidores, amigos, mensajes, gremios, eventos, donaciones y saldo de ⭐.
              Esta acción <strong>no se puede deshacer</strong>.
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ color: '#f87171', fontWeight: 800 }}>
                Escribe <span style={{ color: '#fff' }}>@{deleteTarget.username}</span> para confirmar
              </label>
              <input
                className="input"
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder={`@${deleteTarget.username}`}
                autoFocus
                style={{ marginTop: '6px', borderColor: 'rgba(239,68,68,0.4)' }}
                onKeyDown={e => { if (e.key === 'Enter' && normalizeUsername(deleteConfirmName) === deleteTarget.username && !deleting) deleteAccount(); }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
              <button
                onClick={deleteAccount}
                className="btn"
                disabled={deleting || normalizeUsername(deleteConfirmName) !== deleteTarget.username}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', fontWeight: 800,
                  opacity: normalizeUsername(deleteConfirmName) === deleteTarget.username ? 1 : 0.5,
                  cursor: normalizeUsername(deleteConfirmName) === deleteTarget.username ? 'pointer' : 'not-allowed',
                }}
              >
                {deleting ? 'Eliminando...' : '🗑️ Eliminar permanentemente'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Grant Premium Plan Modal */}
      {mounted && premiumUser && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '20px',
        }} onClick={() => setPremiumUser(null)}>
          <div className="glass" style={{
            padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '480px',
            border: '1px solid rgba(212,160,48,0.4)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f5e6d3' }}>💎 Otorgar Plan Premium</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Activa un plan con expiración para @{premiumUser.username}</p>
              </div>
              <button onClick={() => setPremiumUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#e8c060', fontWeight: 800 }}>Plan a otorgar</label>
                <select
                  className="input"
                  value={grantPlan}
                  onChange={e => setGrantPlan(e.target.value as 'ASTRO' | 'NOVA' | 'STELLAR')}
                  style={{ marginTop: '6px' }}
                >
                  <option value="ASTRO">💎 Astro — $2.99/mes (×1.2 Stardust, ×1.5 XP)</option>
                  <option value="NOVA">✨ Nova Pro — $5.99/mes (×1.5 Stardust, ×2 XP)</option>
                  <option value="STELLAR">🌟 Stellar Elite — $12.99/mes (×2 Stardust, ×3 XP)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#e8c060', fontWeight: 800 }}>Duración</label>
                <select
                  className="input"
                  value={grantDays}
                  onChange={e => setGrantDays(Number(e.target.value))}
                  style={{ marginTop: '6px' }}
                >
                  <option value={7}>7 días</option>
                  <option value={15}>15 días</option>
                  <option value={30}>1 mes (30 días)</option>
                  <option value={90}>3 meses (90 días)</option>
                  <option value={365}>1 año (365 días)</option>
                  <option value={3650}>Permanente (10 años)</option>
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  El usuario recibirá una notificación y su plan expirará automáticamente al cumplirse el periodo.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPremiumUser(null)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
              <button
                onClick={grantPremium}
                className="btn"
                disabled={granting}
                style={{
                  background: 'linear-gradient(135deg, #d4a030, #a0782c)', color: '#1a1410', fontWeight: 800,
                }}
              >
                {granting ? 'Otorgando...' : `💎 Otorgar ${grantPlan}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
