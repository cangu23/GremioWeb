'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';

function CreateEventForm() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{
          display: 'inline-block', width: '24px', height: '24px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          marginBottom: '12px',
        }} />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Solo VTUBER, MAID y ADMIN pueden crear eventos
  if (user.role !== 'VTUBER' && user.role !== 'MAID' && user.role !== 'ADMIN') {
    router.push('/events');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const eventDate = new Date(`${date}T${time}`);
      const event = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          date: eventDate.toISOString(),
          location: location || undefined,
          maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
        }),
      });
      router.push(`/events/${event.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el evento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }} className="animate-float">📅</div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
            Crear Evento
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Organiza un evento para la comunidad VTuber
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,77,79,0.1)',
            border: '1px solid rgba(255,77,79,0.2)',
            color: 'var(--error)',
            padding: '14px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease',
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="glass" style={{
          padding: '36px',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
          }} />

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Título del evento *</label>
              <input
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Ej: Stream de debut"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción *</label>
              <textarea
                className="input"
                style={{ minHeight: '120px', resize: 'vertical', lineHeight: 1.6 }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                placeholder="Describe de qué tratará el evento..."
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label className="form-label">Fecha *</label>
                <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label className="form-label">Hora *</label>
                <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ubicación / Link</label>
              <input
                className="input"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ej: https://twitch.tv/tuusuario"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                URL del stream, Discord, o lugar físico
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Máximo de asistentes</label>
              <input
                type="number"
                className="input"
                value={maxAttendees}
                onChange={e => setMaxAttendees(e.target.value)}
                min="1"
                placeholder="Sin límite"
              />
            </div>

            <button type="submit" className="btn" style={{
              width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            }} disabled={saving}>
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{
                    width: '18px', height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  Creando evento...
                </span>
              ) : '✦ Crear Evento'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{
          display: 'inline-block', width: '24px', height: '24px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          marginBottom: '12px',
        }} />
        <p>Cargando...</p>
      </div>
    }>
      <CreateEventForm />
    </ClientOnly>
  );
}
