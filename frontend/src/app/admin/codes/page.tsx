'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface RoleCode {
  id: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  generatedBy: { id: string; username: string } | null;
  usedBy: { id: string; username: string } | null;
}

const roleColors: Record<string, string> = {
  VTUBER: '#ff007f',
  MODERATOR: '#2196f3',
  ADMIN: '#8a2be2',
};

const statusColors: Record<string, string> = {
  ACTIVE: '#00e676',
  USED: '#9e9e9e',
  EXPIRED: '#ff9800',
  REVOKED: '#f44336',
};

export default function AdminCodesPage() {
  const { showToast } = useToast();
  const [codes, setCodes] = useState<RoleCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [form, setForm] = useState({ name: '', role: 'VTUBER' });

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterRole) params.set('role', filterRole);
      if (filterStatus) params.set('status', filterStatus);
      const res = await apiFetch(`/admin/codes?${params}`);
      setCodes(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al cargar códigos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, [page, filterRole, filterStatus]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setGenerating(true);
    try {
      const res = await apiFetch('/admin/codes/generate', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setNewCode(res.rawCode);
      showToast(`✅ Código "${res.name}" generado exitosamente`, 'success');
      setForm({ name: '', role: 'VTUBER' });
      fetchCodes();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!window.confirm(`¿Revocar el código "${name}"? Ya no podrá ser usado.`)) return;
    try {
      await apiFetch(`/admin/codes/${id}`, { method: 'DELETE' });
      showToast(`Código "${name}" revocado 🔴`, 'success');
      fetchCodes();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>🔐 Códigos de Invitación</h1>
          <p style={{ color: 'var(--text-muted)' }}>Genera y administra códigos únicos para roles especiales</p>
        </div>
        <button onClick={() => { setShowGenerate(true); setNewCode(''); }} className="btn" style={{ padding: '12px 24px', fontSize: '0.9rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          ✨ Generar Código
        </button>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => { if (!newCode) setShowGenerate(false); }}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            {newCode ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>¡Código Generado!</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Este código solo se muestra una vez. Cópialo ahora.</p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px', border: '2px dashed rgba(255,0,127,0.3)' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '3px', color: '#ff007f', wordBreak: 'break-all' }}>{newCode}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {form.name} · {form.role}
                  </div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(newCode); showToast('Código copiado 📋', 'success'); }} className="btn" style={{ width: '100%', padding: '12px', marginBottom: '8px' }}>
                  📋 Copiar Código
                </button>
                <button onClick={() => { setShowGenerate(false); setNewCode(''); }} className="btn" style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>✨ Nuevo Código</h2>
                  <button onClick={() => setShowGenerate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                </div>
                <form onSubmit={handleGenerate}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Nombre personalizado</label>
                      <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: VTuber-Kira, Moderador-Juan" required />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Este nombre te ayudará a identificar el código</p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rol</label>
                      <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                        <option value="VTUBER">🎤 VTuber</option>
                        <option value="MODERATOR">🛡️ Moderador</option>
                        <option value="ADMIN">👑 Admin</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowGenerate(false)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
                    <button type="submit" className="btn" disabled={generating || !form.name.trim()}>
                      {generating ? 'Generando...' : '🔐 Generar Código'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Rol</label>
            <select className="input" value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} style={{ marginTop: '6px', minWidth: '130px' }}>
              <option value="">Todos</option>
              <option value="VTUBER">🎤 VTuber</option>
              <option value="MODERATOR">🛡️ Moderador</option>
              <option value="ADMIN">👑 Admin</option>
            </select>
          </div>
          <div>
            <label className="form-label">Estado</label>
            <select className="input" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ marginTop: '6px', minWidth: '130px' }}>
              <option value="">Todos</option>
              <option value="ACTIVE">✅ Activo</option>
              <option value="USED">✓ Usado</option>
              <option value="EXPIRED">⏰ Expirado</option>
              <option value="REVOKED">🔴 Revocado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Codes List */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando códigos...</div>
        ) : codes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔐</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No hay códigos todavía</p>
            <p style={{ fontSize: '0.9rem' }}>Genera tu primer código para VTubers, Moderadores o Admins</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Nombre', 'Rol', 'Estado', 'Generado por', 'Usado por', 'Creado', 'Expira', 'Acción'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map(code => (
                    <tr key={code.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{code.name}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: `${roleColors[code.role] || '#666'}22`, color: roleColors[code.role] || '#666' }}>
                          {code.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: statusColors[code.status] || '#666' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColors[code.status] || '#666' }} />
                          {code.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{code.generatedBy?.username || '-'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{code.usedBy ? `@${code.usedBy.username}` : '-'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(code.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 16px', color: code.expiresAt && new Date(code.expiresAt) < new Date() ? '#ff9800' : 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {code.status === 'ACTIVE' && (
                          <button onClick={() => handleRevoke(code.id, code.name)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>
                            Revocar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page <= 1 ? 0.5 : 1 }}>← Anterior</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Página {page} de {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page >= totalPages ? 0.5 : 1 }}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expiration info */}
      <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', marginTop: '20px', background: 'rgba(255,152,0,0.05)', border: '1px solid rgba(255,152,0,0.15)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ⏰ Los códigos expiran automáticamente después de <strong>30 días</strong> si no son canjeados. 
          Puedes revocar un código activo en cualquier momento.
        </p>
      </div>
    </div>
  );
}
