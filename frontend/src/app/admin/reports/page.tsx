'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface AdminReport {
  id: string;
  targetType: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; username: string } | null;
}

interface AdminReportsResponse {
  data: AdminReport[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'rgba(255,152,0,0.15)', color: '#ff9800' },
  IN_REVIEW: { bg: 'rgba(33,150,243,0.15)', color: '#2196f3' },
  RESOLVED: { bg: 'rgba(0,230,118,0.15)', color: '#00e676' },
  DISMISSED: { bg: 'rgba(158,158,158,0.15)', color: '#9e9e9e' },
};

const targetIcons: Record<string, string> = {
  USER: 'US',
  POST: 'PO',
  COMMENT: 'CM',
  EVENT: 'EV',
  GUILD: 'GL',
};

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiFetch(`/admin/reports?${params}`);
      setData(res);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const resolveReport = async (id: string, status: string) => {
    try {
      await apiFetch(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolution: `Resuelto por un administrador` }),
      });
      showToast(`Reporte ${status === 'RESOLVED' ? 'resuelto' : 'descartado'}`, 'success');
      fetchData();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Reportes</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Sistema de moderación de contenido</p>

      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Estado</label>
            <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ marginTop: '6px', minWidth: '180px' }}>
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="IN_REVIEW">En revisión</option>
              <option value="RESOLVED">Resueltos</option>
              <option value="DISMISSED">Descartados</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando reportes...</div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {statusFilter === 'PENDING' ? 'No hay reportes pendientes' : 'No se encontraron reportes'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Tipo', 'Reportado por', 'Motivo', 'Descripción', 'Estado', 'Fecha', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((report: AdminReport) => {
                    const st = statusStyles[report.status] || statusStyles.PENDING;
                    return (
                      <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>{targetIcons[report.targetType] || '📌'}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{report.targetType}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{report.reporter?.username}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500 }}>{report.reason}</td>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {report.description || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: st.bg, color: st.color }}>
                            {report.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {new Date(report.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {report.status === 'PENDING' && (
                              <>
                                <button onClick={() => resolveReport(report.id, 'IN_REVIEW')}
                                  className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(33,150,243,0.2)', color: '#2196f3', border: '1px solid rgba(33,150,243,0.3)' }}>
                                  Revisar
                                </button>
                                <button onClick={() => resolveReport(report.id, 'DISMISSED')}
                                  className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(158,158,158,0.2)', color: '#9e9e9e', border: '1px solid rgba(158,158,158,0.3)' }}>
                                  Descartar
                                </button>
                              </>
                            )}
                            {(report.status === 'PENDING' || report.status === 'IN_REVIEW') && (
                              <button onClick={() => resolveReport(report.id, 'RESOLVED')}
                                className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(0,230,118,0.2)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}>
                                Resolver
                              </button>
                            )}
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
    </div>
  );
}
