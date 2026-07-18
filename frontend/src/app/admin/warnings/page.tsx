'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface WarningData {
  id: string;
  reason: string;
  strike: number;
  autoBanned: boolean;
  user: string;
  issuedBy: string;
  createdAt: string;
}

interface WarningsResponse {
  data: WarningData[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminWarningsPage() {
  const { showToast } = useToast();

  const [warnings, setWarnings] = useState<WarningData[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Issue warning form
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [reason, setReason] = useState('');
  const [issuing, setIssuing] = useState(false);

  const fetchWarnings = async (p = 1) => {
    setLoading(true);
    try {
      const data: WarningsResponse = await apiFetch(`/warnings?page=${p}&limit=20`);
      setWarnings(data.data);
      setMeta(data.meta);
    } catch {
      showToast('Error al cargar advertencias', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings(page);
  }, [page]);

  const handleIssueWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !reason.trim()) return;
    setIssuing(true);
    try {
      const result = await apiFetch('/warnings/issue', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUserId.trim(), reason: reason.trim() }),
      });
      showToast(
        result.autoBanned
          ? `⚠️ Advertencia #${result.totalWarnings} — Usuario baneado automáticamente`
          : `Advertencia #${result.totalWarnings} enviada (${result.remainingWarnings} restantes)`,
        result.autoBanned ? 'error' : 'success'
      );
      setShowIssueForm(false);
      setTargetUserId('');
      setReason('');
      fetchWarnings(1);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al emitir advertencia', 'error');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Advertencias</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Sistema de 3 strikes: tras 3 advertencias, el usuario se banea automáticamente.
          </p>
        </div>
        <button
          onClick={() => setShowIssueForm(!showIssueForm)}
          className="btn"
          style={{
            background: showIssueForm ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
            color: showIssueForm ? 'var(--text)' : '#fff',
          }}
        >
          {showIssueForm ? 'Cancelar' : '+ Nueva Advertencia'}
        </button>
      </div>

      {/* Issue warning form */}
      {showIssueForm && (
        <form onSubmit={handleIssueWarning} className="glass" style={{ padding: '24px', marginBottom: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Emitir advertencia</h3>
          <div className="form-group">
            <label className="form-label">ID del Usuario</label>
            <input
              className="input"
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              placeholder="ID del usuario a advertir"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Razón</label>
            <textarea
              className="input"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe la razón de la advertencia..."
              rows={3}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={issuing || !targetUserId.trim() || !reason.trim()}>
            {issuing ? 'Enviando...' : 'Emitir Advertencia'}
          </button>
        </form>
      )}

      {/* Warnings table */}
      <div className="glass" style={{ overflow: 'hidden', borderRadius: '16px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : warnings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay advertencias registradas.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strike</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Razón</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emitido por</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {warnings.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{w.user}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                        background: w.strike >= 3 ? 'rgba(239,68,68,0.15)' : w.strike >= 2 ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
                        color: w.strike >= 3 ? '#ef4444' : w.strike >= 2 ? '#f59e0b' : '#8b5cf6',
                      }}>
                        #{w.strike}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {w.reason}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{w.issuedBy}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {new Date(w.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {w.autoBanned ? (
                        <span style={{ padding: '2px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                          BANEADO
                        </span>
                      ) : (
                        <span style={{ padding: '2px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                          Activo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                background: p === page ? 'var(--primary)' : 'transparent',
                color: p === page ? '#fff' : 'var(--text)',
                cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
