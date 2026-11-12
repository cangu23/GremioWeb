'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import RequestsSubnav from '@/components/admin/RequestsSubnav';
import UserAvatar from '@/components/ui/UserAvatar';
import { APPLICATION_ROLES_CONFIG, type ApplicationRole } from '@gremio-estelar/shared';

interface RoleApplication {
  id: string;
  type: string;
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
    role?: string;
  };
  reviewedBy: { id: string; username: string } | null;
  reviewedAt: string | null;
}

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export default function AdminApplicationsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<RoleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<RoleApplication | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [approvedCode, setApprovedCode] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterRole) params.set('type', filterRole);
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);

      const res = await apiFetch(`/admin/applications?${params}`);
      setRequests(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al cargar postulaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filterRole, filterStatus, search, showToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('¿Aprobar esta postulación? Se asignará automáticamente el rol y se generará su código único.')) return;
    setProcessing(true);
    try {
      const res = await apiFetch(`/admin/applications/${id}/approve`, { method: 'POST' });
      setApprovedCode(res.rawCode || 'ROLES-ACTIVADOS');
      showToast('✦ Postulación aprobada exitosamente', 'success');
      setSelectedRequest(null);
      fetchApplications();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al aprobar', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('¿Rechazar esta postulación?')) return;
    setProcessing(true);
    try {
      await apiFetch(`/admin/applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes: rejectNotes || undefined }),
      });
      showToast('✦ Postulación rechazada con notas enviadas', 'info');
      setSelectedRequest(null);
      setRejectNotes('');
      fetchApplications();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al procesar rechazo', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleMeta = (type: string) => {
    const roleKey = type?.toUpperCase() as ApplicationRole;
    return APPLICATION_ROLES_CONFIG[roleKey] || {
      title: type,
      badge: `✦ ${type}`,
      color: '#38bdf8',
      symbol: '✦',
    };
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <RequestsSubnav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fbbf24' }}>★</span> Postulaciones de Roles del Gremio
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Revisa, evalúa los cuestionarios y retos personalizados, y aprueba a los nuevos aspirantes.
          </p>
        </div>
      </div>

      {/* Code Modal */}
      {approvedCode && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
          onClick={() => setApprovedCode('')}
        >
          <div className="glass" style={{ padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '480px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#10b981' }}>✓</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>¡Postulación Aprobada!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
              El rol ha sido asignado al usuario y se ha generado su código de acreditación.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '14px', padding: '16px', marginBottom: '20px', border: '1px dashed rgba(16, 185, 129, 0.5)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código de Activación:</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', color: '#10b981', wordBreak: 'break-all' }}>{approvedCode}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { navigator.clipboard.writeText(approvedCode); showToast('✦ Código copiado al portapapeles', 'success'); }}
                className="btn"
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem' }}
              >
                Copiar Código
              </button>
              <button
                onClick={() => setApprovedCode('')}
                className="btn btn--outline"
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass" style={{ padding: '18px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Rol / Vocación
          </label>
          <select
            className="input"
            value={filterRole}
            onChange={e => { setFilterRole(e.target.value); setPage(1); }}
            style={{ minWidth: '180px', padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">Todos los Roles</option>
            <option value="MODERATOR">✦ Centinela (Moderador)</option>
            <option value="ADMIN">★ Alto Mando (Admin)</option>
            <option value="VTUBER">✦ VTuber Oficial</option>
            <option value="STREAMER">✧ Streamer Oficial</option>
            <option value="ARTIST">✦ Artista Cósmico</option>
            <option value="CLIPPER">✧ Clipper & Editor</option>
            <option value="HELPER">✦ Guía Estelar</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Estado
          </label>
          <select
            className="input"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            style={{ minWidth: '140px', padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="PENDING">Pendientes</option>
            <option value="">Todas</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Buscar Aspirante
          </label>
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre o alias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchApplications(); } }}
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
          />
        </div>

        <button
          onClick={() => { setPage(1); fetchApplications(); }}
          className="btn"
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
        >
          Filtrar
        </button>
      </div>

      {/* Applications Table / Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>✦</div>
          <div>Cargando postulaciones estelares...</div>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-muted)' }}>✧</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            No se encontraron postulaciones
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {filterStatus === 'PENDING' ? 'No hay solicitudes pendientes en esta categoría.' : 'Intenta ajustar los filtros de búsqueda.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map(req => {
            const roleMeta = getRoleMeta(req.type);
            const statusColor = statusColors[req.status] || '#a1a1aa';
            const statusLabel = statusLabels[req.status] || req.status;

            return (
              <div
                key={req.id}
                className="glass"
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  border: selectedRequest?.id === req.id ? `1.5px solid ${roleMeta.color}` : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Left: Applicant info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                  <UserAvatar
                    src={req.avatarUrl}
                    alt={req.displayName}
                    userId={req.user.id}
                    size={46}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                        {req.displayName}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: `${roleMeta.color}22`,
                        color: roleMeta.color,
                        border: `1px solid ${roleMeta.color}55`,
                      }}>
                        {roleMeta.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      @{req.user.username} · {new Date(req.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: `${statusColor}18`,
                    color: statusColor,
                    border: `1px solid ${statusColor}44`,
                  }}>
                    {statusLabel}
                  </span>

                  <button
                    onClick={() => { setSelectedRequest(req); setRejectNotes(req.notes || ''); }}
                    className="btn btn--outline"
                    style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                  >
                    Examinar Postulación ✦
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '28px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn--outline"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn btn--outline"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* DETAIL INSPECTION MODAL */}
      {selectedRequest && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="glass"
            style={{
              width: '100%', maxWidth: '780px', maxHeight: '90vh',
              borderRadius: '24px', overflowY: 'auto',
              background: '#0d0d16', border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            {(() => {
              const roleMeta = getRoleMeta(selectedRequest.type);
              const config = APPLICATION_ROLES_CONFIG[selectedRequest.type?.toUpperCase() as ApplicationRole];

              let answers: Record<string, any> = {};
              try {
                if (selectedRequest.surveyAnswers) {
                  answers = JSON.parse(selectedRequest.surveyAnswers);
                }
              } catch {}

              return (
                <>
                  <div style={{
                    padding: '24px 28px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: roleMeta.color ? `${roleMeta.color}11` : 'transparent',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <UserAvatar
                        src={selectedRequest.avatarUrl}
                        alt={selectedRequest.displayName}
                        userId={selectedRequest.user.id}
                        size={52}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                            {selectedRequest.displayName}
                          </h2>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: `${roleMeta.color}22`,
                            color: roleMeta.color,
                            border: `1px solid ${roleMeta.color}55`,
                          }}>
                            {roleMeta.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Usuario: @{selectedRequest.user.username} · Email: {selectedRequest.user.email}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRequest(null)}
                      style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '1.4rem', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {/* Status & Date bar */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                      fontSize: '0.82rem',
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Fecha de postulación: </span>
                        <strong style={{ color: '#fff' }}>
                          {new Date(selectedRequest.createdAt).toLocaleString('es-ES')}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Estado actual: </span>
                        <strong style={{ color: statusColors[selectedRequest.status] || '#fff' }}>
                          {statusLabels[selectedRequest.status] || selectedRequest.status}
                        </strong>
                      </div>
                    </div>

                    {/* Section 1: Survey Questions */}
                    {config && (
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: roleMeta.color }}>✦</span> Cuestionario de Vocación
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {config.questions.map(q => {
                            const ans = answers[q.id] || '(Sin respuesta proporcionada)';
                            return (
                              <div
                                key={q.id}
                                style={{
                                  padding: '14px 16px', borderRadius: '14px',
                                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                }}
                              >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: roleMeta.color, marginBottom: '4px' }}>
                                  {q.label}
                                </div>
                                <div style={{ fontSize: '0.88rem', color: '#e4e4e7', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                  {ans}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section 2: Unique Role Challenge */}
                    {config && config.challenge && (
                      <div style={{
                        padding: '18px 20px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.4))',
                        border: `1px solid ${roleMeta.color}44`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.1rem', color: roleMeta.color }}>★</span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                            {config.challenge.title}
                          </h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 14px 0' }}>
                          {config.challenge.tagline}
                        </p>

                        {/* Scenario prompt if any */}
                        {config.challenge.promptScenario && (
                          <div style={{
                            padding: '12px 14px', borderRadius: '10px',
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                            fontSize: '0.82rem', color: '#a1a1aa', whiteSpace: 'pre-wrap', marginBottom: '14px',
                          }}>
                            <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>Escenario planteado:</strong>
                            {config.challenge.promptScenario}
                          </div>
                        )}

                        {/* Action choice answer if any */}
                        {answers.challenge_action && (
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                              Decisión Táctica Seleccionada:
                            </span>
                            <div style={{
                              padding: '8px 12px', borderRadius: '8px',
                              background: `${roleMeta.color}15`, border: `1px solid ${roleMeta.color}44`,
                              color: roleMeta.color, fontWeight: 700, fontSize: '0.85rem',
                            }}>
                              {answers.challenge_action}
                            </div>
                          </div>
                        )}

                        {/* Media link if any */}
                        {answers.challenge_media && (
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                              Muestra / Enlace Multimedia:
                            </span>
                            <a
                              href={answers.challenge_media}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px',
                                background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                                wordBreak: 'break-all',
                              }}
                            >
                              <span>Abrir Enlace Multimedia ↗</span>
                            </a>
                          </div>
                        )}

                        {/* Text justification */}
                        {answers.challenge_justification && (
                          <div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                              Resolución & Justificación del Aspirante:
                            </span>
                            <div style={{
                              padding: '14px', borderRadius: '10px',
                              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                              fontSize: '0.88rem', color: '#e4e4e7', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                            }}>
                              {answers.challenge_justification}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section 3: Review Notes & Decision */}
                    <div style={{
                      padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>
                        Resolución del Staff
                      </h4>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          Notas de Revisión o Motivo de Rechazo (se enviará como feedback al usuario):
                        </label>
                        <textarea
                          className="input"
                          rows={3}
                          placeholder="Escribe notas internas o feedback para el aspirante..."
                          value={rejectNotes}
                          onChange={e => setRejectNotes(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleReject(selectedRequest.id)}
                          disabled={processing}
                          className="btn"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444',
                            padding: '9px 18px',
                            fontSize: '0.85rem',
                          }}
                        >
                          ✕ Rechazar Postulación
                        </button>

                        <button
                          onClick={() => handleApprove(selectedRequest.id)}
                          disabled={processing || selectedRequest.status === 'APPROVED'}
                          className="btn"
                          style={{
                            background: '#10b981',
                            color: '#000',
                            fontWeight: 900,
                            padding: '9px 24px',
                            fontSize: '0.85rem',
                          }}
                        >
                          {processing ? 'Procesando...' : selectedRequest.status === 'APPROVED' ? '✓ Ya Aprobada' : '✦ Aprobar Postulación'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
