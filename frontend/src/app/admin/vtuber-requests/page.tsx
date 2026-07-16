'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { VTUBER_SURVEY_QUESTIONS, type SurveyAnswers } from '@gremio-estelar/shared';

interface VtuberRequest {
  id: string;
  status: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  lore: string | null;
  notes: string | null;
  surveyAnswers: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    vtuberProfile: { id: string; displayName: string; avatarUrl: string | null; isApproved: boolean; isVerified: boolean } | null;
  };
  reviewedBy: { id: string; username: string } | null;
  reviewedAt: string | null;
}

const statusColors: Record<string, string> = {
  PENDING: '#ff9800',
  APPROVED: '#00e676',
  REJECTED: '#f44336',
};

export default function AdminVtuberRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<VtuberRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<VtuberRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [approvedCode, setApprovedCode] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterStatus) params.set('status', filterStatus);
      const res = await apiFetch(`/admin/vtuber-requests?${params}`);
      setRequests(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, showToast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('¿Aprobar esta solicitud? Se generará un código único para el usuario.')) return;
    setProcessing(true);
    try {
      const res = await apiFetch(`/admin/vtuber-requests/${id}/approve`, { method: 'POST' });
      setApprovedCode(res.rawCode);
      showToast(`✅ Solicitud aprobada. Código: ${res.rawCode}`, 'success');
      fetchRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('¿Rechazar esta solicitud?')) return;
    setProcessing(true);
    try {
      await apiFetch(`/admin/vtuber-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes: rejectNotes || undefined }),
      });
      showToast('Solicitud rechazada 📋', 'success');
      setSelectedRequest(null);
      setRejectNotes('');
      fetchRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Solicitudes VTuber</h1>
          <p style={{ color: 'var(--text-muted)' }}>Revisa y aprueba las solicitudes de nuevos VTubers oficiales</p>
        </div>
      </div>

      {/* Approved Code Modal */}
      {approvedCode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setApprovedCode('')}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '480px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '12px', fontWeight: 300, color: 'var(--success)' }}>✓</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Solicitud Aprobada!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              El usuario recibirá una notificación con su código único.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '2px dashed rgba(0,230,118,0.3)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Código generado:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '3px', color: '#00e676', wordBreak: 'break-all' }}>{approvedCode}</div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(approvedCode); showToast('Codigo copiado', 'success'); }} className="btn" style={{ width: '100%', padding: '12px', marginBottom: '8px' }}>
              Copiar Codigo
            </button>
            <button onClick={() => setApprovedCode('')} className="btn" style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Estado</label>
            <select className="input" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ marginTop: '6px', minWidth: '150px' }}>
              <option value="PENDING">Pendientes</option>
              <option value="">Todas</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando solicitudes...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px', fontWeight: 300, color: 'var(--text-muted)' }}>--</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No hay solicitudes {filterStatus === 'PENDING' ? 'pendientes' : ''}</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Solicitante', 'Nombre VTuber', 'Email', 'Estado', 'Fecha', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      onClick={() => setSelectedRequest(req)}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                            {req.user.username.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>@{req.user.username}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{req.displayName}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{req.user.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: `${statusColors[req.status] || '#666'}22`, color: statusColors[req.status] || '#666' }}>
                          {req.status === 'PENDING' ? 'Pendiente' : req.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(req.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        {req.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => handleApprove(req.id)} className="btn" style={{ padding: '4px 12px', fontSize: '0.75rem', background: 'rgba(0,230,118,0.2)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }} disabled={processing}>
                              Aprobar
                            </button>
                            <button onClick={() => setSelectedRequest(req)} className="btn" style={{ padding: '4px 12px', fontSize: '0.75rem', background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page <= 1 ? 0.5 : 1 }}>←</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: page >= totalPages ? 0.5 : 1 }}>→</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail/Reject Modal */}
      {selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => { setSelectedRequest(null); setRejectNotes(''); }}>
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Detalle de Solicitud</h2>
              <button onClick={() => { setSelectedRequest(null); setRejectNotes(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Usuario</div>
                <div style={{ fontWeight: 500 }}>@{selectedRequest.user.username}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Nombre VTuber</div>
                <div style={{ fontWeight: 500 }}>{selectedRequest.displayName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Email</div>
                <div style={{ fontWeight: 500 }}>{selectedRequest.user.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Descripción</div>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{selectedRequest.description || 'Sin descripción'}</div>
              </div>
              {selectedRequest.lore && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Lore / Historia</div>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.5, fontStyle: 'italic' }}>{selectedRequest.lore}</div>
                </div>
              )}

              {/* Survey Answers */}
              {selectedRequest.surveyAnswers && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Respuestas del Cuestionario
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      try {
                        const answers: SurveyAnswers = JSON.parse(selectedRequest.surveyAnswers);
                        return VTUBER_SURVEY_QUESTIONS.filter((q) => answers[q.id]).map((q) => (
                            <div key={q.id} style={{
                              background: 'rgba(138,43,226,0.05)',
                              borderRadius: '10px', padding: '12px 14px',
                              border: '1px solid rgba(138,43,226,0.1)',
                            }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                {q.question}
                              </div>
                              <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#fff', whiteSpace: 'pre-wrap' }}>
                                {answers[q.id]}
                              </div>
                            </div>
                          ));
                      } catch {
                        return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Error al cargar respuestas</div>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Revisado por</div>
                  <div style={{ fontSize: '0.9rem' }}>@{selectedRequest.reviewedBy.username}</div>
                </div>
              )}
            </div>

            {/* Reject form */}
            {selectedRequest.status === 'PENDING' && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Notas de rechazo (opcional)</label>
                  <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Motivo del rechazo..." />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setSelectedRequest(null); setRejectNotes(''); }} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
                  <button onClick={() => handleApprove(selectedRequest.id)} className="btn" disabled={processing} style={{ background: 'rgba(0,230,118,0.2)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}>
                    {processing ? '...' : 'Aprobar'}
                  </button>
                  <button onClick={() => handleReject(selectedRequest.id)} className="btn" disabled={processing} style={{ background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}>
                    {processing ? '...' : 'Rechazar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
