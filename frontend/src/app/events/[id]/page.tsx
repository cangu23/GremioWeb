'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string | null;
  maxAttendees?: number | null;
  coverUrl?: string | null;
  status: string;
  createdAt: string;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    vtuberProfile?: { displayName: string; avatarUrl: string | null } | null;
  };
  _count: { attendees: number };
  isAttending: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  UPCOMING: { label: 'Próximo', color: 'var(--accent)', bg: 'rgba(0,212,255,0.15)' },
  ONGOING: { label: 'En vivo', color: 'var(--success)', bg: 'rgba(0,230,118,0.15)' },
  FINISHED: { label: 'Finalizado', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.08)' },
  CANCELLED: { label: 'Cancelado', color: 'var(--error)', bg: 'rgba(255,77,79,0.15)' },
};

function EventDetailContent() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvent = async () => {
    try {
      const data = await apiFetch(`/events/${id}`);
      setEvent(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvent(); }, [id]);

  const handleAttend = async () => {
    if (!user) { router.push('/login'); return; }
    setActionLoading(true);
    try {
      if (event?.isAttending) {
        await apiFetch(`/events/${id}/unattend`, { method: 'POST' });
      } else {
        await apiFetch(`/events/${id}/attend`, { method: 'POST' });
      }
      await fetchEvent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;
    setActionLoading(true);
    try {
      await apiFetch(`/events/${id}`, { method: 'DELETE' });
      router.push('/events');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{
          display: 'inline-block', width: '24px', height: '24px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          marginBottom: '12px',
        }} />
        <p>Cargando evento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', marginBottom: '16px' }}>Error: {error}</p>
        <Link href="/events" className="btn" style={{ padding: '10px 20px', borderRadius: '10px' }}>
          ← Volver a eventos
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Evento no encontrado.</p>
        <Link href="/events" className="btn" style={{ padding: '10px 20px', borderRadius: '10px' }}>
          ← Volver a eventos
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isCreator = user?.id === event.creatorId;
  const isPast = eventDate < new Date();
  const cfg = statusConfig[event.status] || statusConfig.UPCOMING;

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', animation: 'fadeIn 0.5s ease' }}>
      <Link href="/events" style={{
        color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-flex',
        alignItems: 'center', gap: '6px', marginBottom: '24px',
        transition: 'color 0.2s',
      }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        ← Volver a eventos
      </Link>

      <div className="glass" style={{
        padding: '40px', maxWidth: '740px', margin: '0 auto',
        borderRadius: '24px', border: '1px solid var(--glass-border)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Gradient accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, var(--primary), var(--secondary), var(--accent))',
        }} />

        {/* Glow decorations */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.08), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: '24px', flexWrap: 'wrap', gap: '16px',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '2rem', fontWeight: 800, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {event.title}
                </h1>
                <span style={{
                  fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px',
                  background: cfg.bg, color: cfg.color, fontWeight: 700, flexShrink: 0,
                }}>
                  {cfg.label}
                </span>
              </div>
            </div>
            {isCreator && (
              <button onClick={handleDelete} className="btn" style={{
                padding: '10px 18px', fontSize: '0.85rem', borderRadius: '10px',
                background: 'rgba(255,77,79,0.1)', color: 'var(--error)',
                border: '1px solid rgba(255,77,79,0.2)',
              }} disabled={actionLoading}>
                🗑️ Eliminar
              </button>
            )}
          </div>

          {/* Date & Location */}
          <div style={{
            display: 'flex', gap: '20px', marginBottom: '28px',
            flexWrap: 'wrap', fontSize: '0.95rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.2rem' }}>📅</span>
              <span>{eventDate.toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}</span>
            </div>
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '1.2rem' }}>📍</span>
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Creator */}
          <Link href={`/profile/${event.creator.id}`} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
            borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
            marginBottom: '28px', textDecoration: 'none', color: 'var(--text)',
            transition: 'all 0.2s ease', border: '1px solid transparent',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(138,43,226,0.05)';
              e.currentTarget.style.borderColor = 'rgba(138,43,226,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'transparent';
            }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
              flexShrink: 0,
            }}>
              {(event.creator.vtuberProfile?.displayName || event.creator.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>
                {event.creator.vtuberProfile?.displayName || event.creator.username}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                @{event.creator.username} — Organizador
              </div>
            </div>
          </Link>

          {/* Description */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📝 Descripción
            </h3>
            <div style={{
              color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap',
              fontSize: '0.95rem',
            }}>
              {event.description}
            </div>
          </div>

          {/* Attend section */}
          <div style={{
            padding: '20px 24px', borderRadius: '14px',
            background: event.isAttending ? 'rgba(138,43,226,0.05)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${event.isAttending ? 'rgba(138,43,226,0.15)' : 'var(--glass-border)'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '16px',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                🎟️ {event._count.attendees} {event._count.attendees === 1 ? 'asistente' : 'asistentes'}
              </div>
              {event.maxAttendees && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Capacidad máxima: {event.maxAttendees}
                </div>
              )}
            </div>
            {!isCreator && !isPast && event.status !== 'CANCELLED' && (
              <button
                onClick={handleAttend}
                disabled={actionLoading}
                className="btn"
                style={{
                  padding: '12px 28px', borderRadius: '12px', fontWeight: 700,
                  background: event.isAttending
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  border: event.isAttending ? '1px solid var(--glass-border)' : 'none',
                  color: event.isAttending ? 'var(--text)' : '#fff',
                  transition: 'all 0.2s ease',
                }}
              >
                {actionLoading ? (
                  <span style={{
                    display: 'inline-block', width: '18px', height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                ) : event.isAttending ? '✕ Cancelar inscripción' : '✓ Inscribirme'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{
          display: 'inline-block', width: '24px', height: '24px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          marginBottom: '12px',
        }} />
        <p>Cargando evento...</p>
      </div>
    }>
      <EventDetailContent />
    </ClientOnly>
  );
}
