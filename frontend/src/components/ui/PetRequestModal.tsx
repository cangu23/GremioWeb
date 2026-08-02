'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';

interface PetRequest {
  id: string;
  petName: string;
  description?: string;
  referenceUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  image1Url?: string;
  image2Url?: string;
  createdAt: string;
}

interface PetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PetRequestModal({ isOpen, onClose }: PetRequestModalProps) {
  const [petName, setPetName] = useState('');
  const [description, setDescription] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<PetRequest[]>([]);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<'REQUEST' | 'HISTORY'>('REQUEST');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMyRequests();
    }
  }, [isOpen]);

  const fetchMyRequests = async () => {
    try {
      setFetching(true);
      const res = await apiFetch('/ecosystem/pet-requests/my');
      if (res?.data) {
        setMyRequests(res.data);
      }
    } catch (err) {
      console.error('Error fetching pet requests:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName.trim()) {
      setError('Por favor ingresa el nombre de la mascota');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await apiFetch('/ecosystem/pet-requests', {
        method: 'POST',
        body: JSON.stringify({
          petName: petName.trim(),
          description: description.trim() || undefined,
          referenceUrl: referenceUrl.trim() || undefined,
        }),
      });

      if (res?.success) {
        setSuccessMsg('¡Tu solicitud ha sido enviada con éxito! El equipo de administración subirá la imagen/GIF de tu mascota pronto.');
        setPetName('');
        setDescription('');
        setReferenceUrl('');
        fetchMyRequests();
      } else {
        setError(res?.message || 'Error al enviar la solicitud.');
      }
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const hasPending = myRequests.some((r) => r.status === 'PENDING');

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '24px',
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(25, 20, 45, 0.98), rgba(15, 12, 30, 0.99))',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#a1a1aa',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            fontSize: '1.2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '2.8rem',
              marginBottom: '4px',
              filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.5))',
            }}
          >
            🐾
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Mascotas Acompañantes Personalizadas
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Envía tu solicitud y el Staff creará imágenes/GIFs animados para lucir en tu perfil.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '4px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => setActiveTab('REQUEST')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'REQUEST' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: activeTab === 'REQUEST' ? '#fff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            ✍️ Solicitar Mascota
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'HISTORY' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: activeTab === 'HISTORY' ? '#fff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📜 Mis Solicitudes {myRequests.length > 0 && `(${myRequests.length})`}
          </button>
        </div>

        {/* ERROR / SUCCESS ALERTS */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#4ade80',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        {/* TAB 1: FORM TO SUBMIT */}
        {activeTab === 'REQUEST' && (
          !hasPending ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Nombre de la Mascota <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Kuro el Gato Neón, Sparky, Dragoncito"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Descripción / Detalles del Diseño
                </label>
                <textarea
                  placeholder="Describe cómo te gustaría que luzca la mascota (colores, estilo, animaciones, etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Enlace / Imagen de Referencia <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Opcional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.gif"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? 'Enviando Solicitud...' : '✨ Enviar Solicitud de Mascota'}
              </button>
            </form>
          ) : (
            <div
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>
                ⏳ Tienes una solicitud de mascota en proceso
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
                El equipo de administración la está revisando y subirá las imágenes/GIFs pronto.
              </p>
              <button
                onClick={() => setActiveTab('HISTORY')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                📜 Ver Estado de mi Solicitud
              </button>
            </div>
          )
        )}

        {/* TAB 2: MY REQUESTS HISTORY */}
        {activeTab === 'HISTORY' && (
          <div>
            {fetching ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                Cargando solicitudes...
              </div>
            ) : myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Aún no has enviado ninguna solicitud de mascota.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                        🐾 {req.petName}
                      </span>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background:
                            req.status === 'APPROVED'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : req.status === 'REJECTED'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            req.status === 'APPROVED'
                              ? '#4ade80'
                              : req.status === 'REJECTED'
                              ? '#f87171'
                              : '#fbbf24',
                          border:
                            req.status === 'APPROVED'
                              ? '1px solid rgba(34, 197, 94, 0.4)'
                              : req.status === 'REJECTED'
                              ? '1px solid rgba(239, 68, 68, 0.4)'
                              : '1px solid rgba(245, 158, 11, 0.4)',
                        }}
                      >
                        {req.status === 'APPROVED'
                          ? 'APROBADA'
                          : req.status === 'REJECTED'
                          ? 'RECHAZADA'
                          : 'PENDIENTE'}
                      </span>
                    </div>

                    {req.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                        {req.description}
                      </p>
                    )}

                    {req.status === 'APPROVED' && req.image1Url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                        <img
                          src={req.image1Url}
                          alt="Pet 1"
                          style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}
                        />
                        {req.image2Url && (
                          <img
                            src={req.image2Url}
                            alt="Pet 2"
                            style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}
                          />
                        )}
                        <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 700 }}>
                          ¡Equipada en tu perfil! ✨
                        </span>
                      </div>
                    )}

                    {req.adminNote && (
                      <div style={{ fontSize: '0.78rem', color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: '8px', marginTop: '4px' }}>
                        Nota admin: {req.adminNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
