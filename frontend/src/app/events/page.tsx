'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string | null;
  maxAttendees?: number | null;
  coverUrl?: string | null;
  status: string;
  creator: {
    id: string;
    username: string;
    vtuberProfile?: { displayName: string; avatarUrl: string | null } | null;
  };
  _count: { attendees: number };
  isAttending?: boolean;
}

function EventCard({ event }: { event: EventItem }) {
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    UPCOMING: { label: 'Próximo', color: 'var(--accent)', bg: 'rgba(0,212,255,0.1)' },
    ONGOING: { label: 'En vivo', color: 'var(--success)', bg: 'rgba(0,230,118,0.1)' },
    FINISHED: { label: 'Finalizado', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' },
    CANCELLED: { label: 'Cancelado', color: 'var(--error)', bg: 'rgba(255,77,79,0.1)' },
  };

  const cfg = statusConfig[event.status] || statusConfig.UPCOMING;

  return (
    <Link
      href={`/events/${event.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        className="glass"
        style={{
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
          e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }}
      >
        {/* Gradient accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, var(--primary), var(--secondary))`,
            opacity: event.status === 'UPCOMING' ? 1 : 0.3,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.title}
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: cfg.bg,
                  color: cfg.color,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {cfg.label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>{eventDate.toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}</span>
              {event.location && <span>{event.location}</span>}
            </div>
          </div>
        </div>

        <p style={{
          color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6,
          marginBottom: '16px', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.description}
        </p>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '16px', borderTop: '1px solid var(--glass-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: event.creator.vtuberProfile?.avatarUrl
                ? `url(${event.creator.vtuberProfile.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '0.75rem',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {!event.creator.vtuberProfile?.avatarUrl && (event.creator.vtuberProfile?.displayName || event.creator.username).charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              por <strong style={{ color: 'var(--text)' }}>
                {event.creator.vtuberProfile?.displayName || event.creator.username}
              </strong>
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
            {event._count.attendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''} asistentes
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventsContent() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter ? `/events?status=${filter}` : '/events';
      const data = await apiFetch(url);
      setEvents(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const filters = [
    { value: '', label: 'Todos' },
    { value: 'UPCOMING', label: 'Proximos' },
    { value: 'ONGOING', label: 'En vivo' },
    { value: 'FINISHED', label: 'Finalizados' },
  ];

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', animation: 'fadeIn 0.5s ease' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px' }}>
            <span className="gradient-text">Eventos</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Descubre y participa en eventos de la comunidad
          </p>
        </div>
        {user && (
          <Link href="/events/create" className="btn" style={{
            padding: '12px 24px', borderRadius: '12px', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          }}>
            Crear Evento
          </Link>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.02)', padding: '6px',
        borderRadius: '14px', border: '1px solid var(--glass-border)',
        width: 'fit-content',
      }}>
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: filter === f.value
                ? 'rgba(138,43,226,0.2)'
                : 'transparent',
              color: filter === f.value ? 'var(--text)' : 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: filter === f.value ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              if (filter !== f.value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e) => {
              if (filter !== f.value) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <div className="glass" style={{
          padding: '60px 40px', textAlign: 'center', borderRadius: '20px',
          border: '1px solid rgba(255,77,79,0.2)',
          background: 'rgba(255,77,79,0.03)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', fontWeight: 700, color: 'var(--error)' }}>!</div>
          <p style={{ color: 'var(--error)', fontSize: '1.05rem', marginBottom: '8px', fontWeight: 600 }}>
            Error al cargar eventos
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {error}
          </p>
          <button onClick={fetchEvents} className="btn" style={{
            padding: '12px 28px', borderRadius: '12px',
            display: 'inline-flex',
          }}>
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '60px', gap: '12px', color: 'var(--text-muted)',
        }}>
          <span style={{
            width: '24px', height: '24px',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          Cargando eventos...
        </div>
      ) : events.length === 0 ? (
        <div className="glass" style={{
          padding: '60px 40px', textAlign: 'center', borderRadius: '20px',
          border: '1px solid var(--glass-border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', fontWeight: 300, color: 'var(--text-muted)' }}>--</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '4px' }}>
            No hay eventos {filter ? 'con este estado' : 'aún'}.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {filter
              ? 'Intenta con otro filtro'
              : 'Sé el primero en crear un evento'}
          </p>
          {user && !filter && (
            <Link href="/events/create" className="btn" style={{
              padding: '12px 28px', borderRadius: '12px',
              display: 'inline-flex',
            }}>
              ✦ Crear el primer evento
            </Link>
          )}
          {filter && (
            <button onClick={() => setFilter('')} className="btn btn-outline" style={{
              padding: '12px 28px', borderRadius: '12px',
            }}>
              Ver todos
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((event, i) => (
            <div key={event.id} style={{
              opacity: 0,
              animation: `fadeInUp 0.5s ease ${i * 0.08}s forwards`,
            }}>
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{
          display: 'inline-block', width: '24px', height: '24px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          marginBottom: '12px',
        }} />
        <p>Cargando eventos...</p>
      </div>
    }>
      <EventsContent />
    </ClientOnly>
  );
}
