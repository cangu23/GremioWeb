'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface PetRequestItem {
  id: string;
  petName: string;
  description?: string;
  referenceUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  image1Url?: string;
  image2Url?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  reviewer?: {
    id: string;
    username: string;
    displayName?: string;
  };
}

const statusColors: Record<string, string> = {
  PENDING: '#ff9800',
  APPROVED: '#00e676',
  REJECTED: '#f44336',
};

export default function AdminPetRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<PetRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<PetRequestItem | null>(null);
  const [modalMode, setModalMode] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [image1Url, setImage1Url] = useState('');
  const [image2Url, setImage2Url] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterStatus && filterStatus !== 'ALL') params.set('status', filterStatus);
      const res = await apiFetch(`/admin/pet-requests?${params}`);
      setRequests(res.requests || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setPendingCount(res.pendingCount || 0);
    } catch (err: any) {
      showToast(err?.message || 'Error al cargar solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFileUpload = async (file: File, target: 'image1' | 'image2') => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_URL}/uploads/image`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();
      if (data.url) {
        if (target === 'image1') setImage1Url(data.url);
        else setImage2Url(data.url);
        showToast('Imagen/GIF subido con éxito ✨', 'success');
      } else {
        showToast(data.message || 'Error al subir la imagen', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al subir archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;
    if (!image1Url.trim()) {
      showToast('Ingresa al menos 1 imagen o GIF para la mascota', 'error');
      return;
    }

    setProcessing(true);
    try {
      await apiFetch(`/admin/pet-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          image1Url: image1Url.trim(),
          image2Url: image2Url.trim() || undefined,
          adminNote: adminNote.trim() || undefined,
        }),
      });
      showToast(`✅ Mascota aprobada y asignada a @${selectedRequest.user.username}!`, 'success');
      setSelectedRequest(null);
      setModalMode(null);
      resetModalFields();
      fetchRequests();
    } catch (err: any) {
      showToast(err?.message || 'Error al aprobar solicitud', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      await apiFetch(`/admin/pet-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          adminNote: adminNote.trim() || undefined,
        }),
      });
      showToast('Solicitud rechazada 📋', 'success');
      setSelectedRequest(null);
      setModalMode(null);
      resetModalFields();
      fetchRequests();
    } catch (err: any) {
      showToast(err?.message || 'Error al rechazar solicitud', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const resetModalFields = () => {
    setImage1Url('');
    setImage2Url('');
    setAdminNote('');
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🐾 Solicitudes de Mascotas
            {pendingCount > 0 && (
              <span style={{ fontSize: '0.8rem', padding: '2px 10px', borderRadius: '12px', background: '#ff9800', color: '#000', fontWeight: 800 }}>
                {pendingCount} Pendiente{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Revisa las peticiones de los usuarios y sube 1 o 2 imágenes/GIFs para crear su mascota acompañante.
          </p>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => { setFilterStatus(st); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filterStatus === st ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: filterStatus === st ? '#fff' : 'var(--text-muted)',
                fontWeight: filterStatus === st ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {st === 'PENDING' ? '⏳ Pendientes' : st === 'APPROVED' ? '✅ Aprobadas' : st === 'REJECTED' ? '❌ Rechazadas' : '🌐 Todas'}
            </button>
          ))}
        </div>
      </div>

      {/* REQUESTS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Cargando solicitudes de mascotas...
        </div>
      ) : requests.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '40px', borderRadius: '16px', color: 'var(--text-muted)' }}>
          No hay solicitudes {filterStatus === 'PENDING' ? 'pendientes' : ''} en este momento.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {requests.map((req) => (
            <div
              key={req.id}
              className="glass"
              style={{
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                border: `1px solid ${statusColors[req.status]}40`,
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div>
                {/* USER & STATUS HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={req.user.avatarUrl || '/default-avatar.png'}
                      alt={req.user.username}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                        {req.user.displayName || req.user.username}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        @{req.user.username}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: `${statusColors[req.status]}20`,
                      color: statusColors[req.status],
                      border: `1px solid ${statusColors[req.status]}50`,
                    }}
                  >
                    {req.status}
                  </span>
                </div>

                {/* PET REQUEST DETAILS */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>
                    🐾 {req.petName}
                  </div>
                  {req.description && (
                    <p style={{ fontSize: '0.85rem', color: '#e4e4e7', margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>
                      {req.description}
                    </p>
                  )}
                  {req.referenceUrl && (
                    <a
                      href={req.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.78rem', color: '#60a5fa', textDecoration: 'underline' }}
                    >
                      🔗 Ver Imagen de Referencia
                    </a>
                  )}
                </div>

                {/* APPROVED IMAGES PREVIEW */}
                {req.status === 'APPROVED' && req.image1Url && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                    <img
                      src={req.image1Url}
                      alt="Pet 1"
                      style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {req.image2Url && (
                      <img
                        src={req.image2Url}
                        alt="Pet 2"
                        style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    )}
                  </div>
                )}

                {req.adminNote && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
                    Nota: {req.adminNote}
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              {req.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setModalMode('APPROVE');
                      resetModalFields();
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      background: '#00e676',
                      border: 'none',
                      color: '#000',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✨ Subir GIF & Aprobar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setModalMode('REJECT');
                      resetModalFields();
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(244, 67, 54, 0.15)',
                      border: '1px solid rgba(244, 67, 54, 0.4)',
                      color: '#f44336',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* APPROVE / REJECT MODAL */}
      {selectedRequest && modalMode && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
          onClick={() => { setSelectedRequest(null); setModalMode(null); }}
        >
          <div
            className="glass"
            style={{
              width: '100%', maxWidth: '540px', borderRadius: '20px',
              padding: '24px', background: '#120f24', border: '1px solid rgba(255,255,255,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              {modalMode === 'APPROVE' ? `✨ Subir Mascota para "${selectedRequest.petName}"` : `Rechazar Solicitud`}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Usuario: <strong>@{selectedRequest.user.username}</strong>
            </p>

            {modalMode === 'APPROVE' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* IMAGE 1 / GIF 1 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    Imagen o GIF #1 (Principal / Reposo) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="https://ejemplo.com/mascota1.gif"
                      value={image1Url}
                      onChange={(e) => setImage1Url(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
                    />
                    <label
                      style={{
                        padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)',
                        color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                      }}
                    >
                      {uploading ? '...' : '📁 Subir File'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'image1');
                        }}
                      />
                    </label>
                  </div>
                  {image1Url && (
                    <div style={{ marginTop: '8px' }}>
                      <img src={image1Url} alt="Preview 1" style={{ height: '60px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(0,0,0,0.5)' }} />
                    </div>
                  )}
                </div>

                {/* IMAGE 2 / GIF 2 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    Imagen o GIF #2 (Animación / Acción) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Opcional)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="https://ejemplo.com/mascota2.gif"
                      value={image2Url}
                      onChange={(e) => setImage2Url(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
                    />
                    <label
                      style={{
                        padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)',
                        color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                      }}
                    >
                      {uploading ? '...' : '📁 Subir File'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'image2');
                        }}
                      />
                    </label>
                  </div>
                  {image2Url && (
                    <div style={{ marginTop: '8px' }}>
                      <img src={image2Url} alt="Preview 2" style={{ height: '60px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(0,0,0,0.5)' }} />
                    </div>
                  )}
                </div>

                {/* ADMIN NOTE */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    Mensaje / Nota para el usuario (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="¡Disfruta a tu nueva mascota!"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={handleApproveSubmit}
                    disabled={processing || uploading}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#00e676', border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {processing ? 'Guardando...' : '✅ Aprobar & Asignar Mascota'}
                  </button>
                  <button
                    onClick={() => { setSelectedRequest(null); setModalMode(null); }}
                    style={{ padding: '12px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    Razón de rechazo
                  </label>
                  <textarea
                    placeholder="Explica al usuario por qué la solicitud no pudo procesarse..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleRejectSubmit}
                    disabled={processing}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f44336', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {processing ? 'Rechazando...' : 'Rechazar Solicitud'}
                  </button>
                  <button
                    onClick={() => { setSelectedRequest(null); setModalMode(null); }}
                    style={{ padding: '12px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    Cancelar
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
