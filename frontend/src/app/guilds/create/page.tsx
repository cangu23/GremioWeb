'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';

function CreateGuildForm() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tags, setTags] = useState('');
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

  if (!user) { router.push('/login'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const guild = await apiFetch('/guilds', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          logoUrl: logoUrl || undefined,
          tags: tags || undefined,
        }),
      });
      router.push(`/guilds/${guild.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el gremio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }} className="animate-float">🏰</div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
            Crear Gremio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Forma tu propia comunidad de VTubers
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,77,79,0.1)',
            border: '1px solid rgba(255,77,79,0.2)',
            color: 'var(--error)',
            padding: '14px 16px', borderRadius: '12px',
            marginBottom: '24px', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'fadeIn 0.3s ease',
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="glass" style={{
          padding: '36px', borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
          }} />

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre del gremio *</label>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Ej: Gremio de las Estrellas"
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
                placeholder="Describe el propósito de tu gremio..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Logo URL (opcional)</label>
              <input
                className="input"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
                type="url"
              />
              {logoUrl && (
                <div style={{
                  marginTop: '8px', width: '80px', height: '80px',
                  borderRadius: '12px', overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                }}>
                  <img
                    src={logoUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Pega un enlace directo a una imagen para usarla como logo del gremio
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Tags (separados por coma)</label>
              <input
                className="input"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Ej: gaming, música, arte"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Ayuda a otros a encontrar tu gremio
              </p>
            </div>

            <button type="submit" className="btn" style={{
              width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700,
              background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
            }} disabled={saving}>
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{
                    width: '18px', height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  Creando gremio...
                </span>
              ) : '✦ Crear Gremio'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateGuildPage() {
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
      <CreateGuildForm />
    </ClientOnly>
  );
}
