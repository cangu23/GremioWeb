'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface AdminLog {
  id: string;
  action: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; username: string } | null;
}

interface AdminLogsResponse {
  data: AdminLog[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const actionStyles: Record<string, { bg: string; color: string }> = {
  BAN_USER: { bg: 'rgba(244,67,54,0.15)', color: '#f44336' },
  SUSPEND_USER: { bg: 'rgba(255,152,0,0.15)', color: '#ff9800' },
  RESTORE_USER: { bg: 'rgba(0,230,118,0.15)', color: '#00e676' },
  UPDATE_USER: { bg: 'rgba(138,43,226,0.15)', color: '#8a2be2' },
  DELETE_USER: { bg: 'rgba(244,67,54,0.15)', color: '#f44336' },
  UPDATE_VTUBER: { bg: 'rgba(255,0,127,0.15)', color: '#ff007f' },
  CANCEL_EVENT: { bg: 'rgba(255,152,0,0.15)', color: '#ff9800' },
  FEATURE_EVENT: { bg: 'rgba(33,150,243,0.15)', color: '#2196f3' },
  DELETE_EVENT: { bg: 'rgba(244,67,54,0.15)', color: '#f44336' },
  SUSPEND_GUILD: { bg: 'rgba(255,152,0,0.15)', color: '#ff9800' },
  UNSUSPEND_GUILD: { bg: 'rgba(0,230,118,0.15)', color: '#00e676' },
  DELETE_GUILD: { bg: 'rgba(244,67,54,0.15)', color: '#f44336' },
  HIDE_POST: { bg: 'rgba(255,152,0,0.15)', color: '#ff9800' },
  UNHIDE_POST: { bg: 'rgba(0,230,118,0.15)', color: '#00e676' },
  RESTORE_POST: { bg: 'rgba(0,230,118,0.15)', color: '#00e676' },
  DELETE_POST: { bg: 'rgba(244,67,54,0.15)', color: '#f44336' },
  HIDE_COMMENT: { bg: 'rgba(255,152,0,0.15)', color: '#ff9800' },
  UNHIDE_COMMENT: { bg: 'rgba(0,230,118,0.15)', color: '#00e676' },
  DELETE_COMMENT: { bg: 'rgba(244,67,54,0.15)', color: '#f44336' },
  RESOLVE_REPORT: { bg: 'rgba(0,230,118,0.15)', color: '#00e676' },
};

const actionLabels: Record<string, string> = {
  BAN_USER: 'Usuario baneado',
  SUSPEND_USER: 'Usuario suspendido',
  RESTORE_USER: 'Usuario restaurado',
  UPDATE_USER: 'Usuario actualizado',
  DELETE_USER: 'Usuario eliminado',
  UPDATE_VTUBER: 'VTuber actualizado',
  CANCEL_EVENT: 'Evento cancelado',
  FEATURE_EVENT: 'Evento destacado',
  DELETE_EVENT: 'Evento eliminado',
  SUSPEND_GUILD: 'Gremio suspendido',
  UNSUSPEND_GUILD: 'Gremio restaurado',
  DELETE_GUILD: 'Gremio eliminado',
  HIDE_POST: 'Publicación oculta',
  UNHIDE_POST: 'Publicación visible',
  RESTORE_POST: 'Publicación restaurada',
  DELETE_POST: 'Publicación eliminada',
  HIDE_COMMENT: 'Comentario oculto',
  UNHIDE_COMMENT: 'Comentario visible',
  DELETE_COMMENT: 'Comentario eliminado',
  RESOLVE_REPORT: 'Reporte resuelto',
  PIN_POST: 'Publicación fijada',
  UNPIN_POST: 'Publicación desfijada',
  FEATURE_POST: 'Publicación destacada',
  UNFEATURE_POST: 'Publicación no destacada',
};

export default function AdminLogsPage() {
  const [data, setData] = useState<AdminLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/admin/logs?page=${page}&limit=30`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>📋 Auditoría</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Registro de todas las acciones administrativas</p>

      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando logs...</div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay registros de auditoría</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Acción', 'Administrador', 'IP', 'Detalle', 'Fecha'].map(h => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log: AdminLog) => {
                    const st = actionStyles[log.action] || { bg: 'rgba(158,158,158,0.15)', color: '#9e9e9e' };
                    let                      detailDisplay = log.detail || '';
                    if (log.detail) {
                      try {
                        const parsed = JSON.parse(log.detail);
                        detailDisplay = parsed.changes?.join(', ') || parsed.targetUsername || JSON.stringify(parsed);
                      } catch {}
                    }
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                            {actionLabels[log.action] || log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          @{log.user?.username || 'Sistema'}
                        </td>
                        <td style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {log.ip || '-'}
                        </td>
                        <td style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {detailDisplay}
                        </td>
                        <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString('es-ES')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.meta.totalPages > 1 && (
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page <= 1 ? 0.5 : 1 }}>
                  ← Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Página {data.meta.page} de {data.meta.totalPages} ({data.meta.total} registros)
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
