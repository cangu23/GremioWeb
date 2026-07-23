'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useSocketMedia } from '@/lib/hooks/useSocketMedia';
import { refreshStickersCache } from '@/lib/content-renderer';

interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  type: 'emoji' | 'sticker';
  addedBy: { id: string; username: string };
  createdAt: string;
}

const CATEGORIES = ['general', 'anime', 'meme', 'hearts', 'reaction', 'celebration', 'sad', 'angry', 'love'];

export default function StickersAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'emoji' | 'sticker'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  // New sticker form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formType, setFormType] = useState<'emoji' | 'sticker'>('sticker');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Image preview & upload
  const [previewError, setPreviewError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAndWait } = useSocketMedia();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadAndWait(file, '/uploads/sticker');
      setFormImageUrl(url);
      setPreviewError(false);
      if (!formName.trim()) {
        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setFormName(base.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    loadStickers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, router]);

  const loadStickers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);
      if (categoryFilter) params.set('category', categoryFilter);
      const data = await apiFetch(`/admin/stickers?${params}`);
      setStickers(data?.data || []);
    } catch {
      setStickers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') loadStickers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, categoryFilter, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formImageUrl.trim()) {
      setError('Nombre e imagen son requeridos');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiFetch('/admin/stickers', {
        method: 'POST',
        body: JSON.stringify({
          name: formName.trim().toLowerCase().replace(/\s+/g, '_'),
          imageUrl: formImageUrl.trim(),
          category: formCategory,
          type: formType,
        }),
      });
      setShowForm(false);
      setFormName('');
      setFormImageUrl('');
      setFormCategory('general');
      setFormType('sticker');
      refreshStickersCache();
      loadStickers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear sticker');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    try {
      await apiFetch(`/admin/stickers/${id}`, { method: 'DELETE' });
      setStickers(prev => prev.filter(s => s.id !== id));
      refreshStickersCache();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const filtered = stickers.filter(s => {
    if (filter !== 'all' && s.type !== filter) return false;
    if (categoryFilter && s.category !== categoryFilter) return false;
    return true;
  });

  if (isLoading) return <div className="container" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>;
  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>Stickers y Emojis</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Gestiona los stickers y emojis personalizados de la plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn"
          style={{
            padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem',
            background: showForm ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Nuevo Sticker'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Agregar Sticker / Emoji</h3>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', background: 'rgba(255,77,79,0.1)', color: 'var(--error)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nombre <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(ej: pepe_dance)</span></label>
                <input className="input" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="pepe_dance" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo</label>
                <select className="input" value={formType} onChange={e => setFormType(e.target.value as 'emoji' | 'sticker')}
                  style={{ cursor: 'pointer' }}>
                  <option value="sticker">Sticker (96×96px)</option>
                  <option value="emoji">Emoji (32×32px)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label className="form-label">Imagen / GIF del Emoji o Sticker</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="input"
                    value={formImageUrl}
                    onChange={e => { setFormImageUrl(e.target.value); setPreviewError(false); }}
                    placeholder="URL o sube una imagen / GIF desde tu equipo..."
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      padding: '10px 16px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
                      cursor: uploading ? 'wait' : 'pointer',
                      fontSize: '0.85rem', whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      opacity: uploading ? 0.6 : 1,
                    }}
                    title="Subir archivo desde tu computadora"
                  >
                    {uploading ? 'Subiendo...' : '📁 Subir Archivo'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Categoría</label>
                <select className="input" value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  style={{ cursor: 'pointer' }}>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              {/* Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {formImageUrl && !previewError ? (
                  <div style={{
                    width: formType === 'emoji' ? '32px' : '96px',
                    height: formType === 'emoji' ? '32px' : '96px',
                    borderRadius: '12px', overflow: 'hidden',
                    background: 'rgba(0,0,0,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--glass-border)',
                  }}>
                    <img src={formImageUrl} alt="preview"
                      onError={() => setPreviewError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ) : formImageUrl && previewError ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--error)' }}>Vista previa no disponible</div>
                ) : null}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formType === 'emoji' ? '32×32px — se usa en texto' : '96×96px — se usa como sticker'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn" disabled={saving}
                style={{ padding: '12px 24px', borderRadius: '10px' }}>
                {saving ? 'Guardando...' : 'Agregar Sticker'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '12px 24px', borderRadius: '10px', background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', 'emoji', 'sticker'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: filter === f ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>
            {f === 'all' ? 'Todos' : f === 'emoji' ? '😊 Emojis' : '🏷️ Stickers'}
          </button>
        ))}
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.85rem',
            cursor: 'pointer', marginLeft: '8px',
          }}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {filtered.length} sticker{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stickers Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando stickers...</div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '60px', borderRadius: '16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏷️</div>
          <p style={{ color: 'var(--text-muted)' }}>No hay stickers aún. ¡Crea el primero!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '14px',
        }}>
          {filtered.map(sticker => (
            <div key={sticker.id} className="glass"
              style={{
                padding: '16px', borderRadius: '14px', textAlign: 'center',
                transition: 'all 0.2s',
                border: '1px solid var(--glass-border)',
                position: 'relative',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: sticker.type === 'emoji' ? '40px' : '80px',
                height: sticker.type === 'emoji' ? '40px' : '80px',
                margin: '0 auto 12px',
                borderRadius: '12px', overflow: 'hidden',
                background: 'rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src={sticker.imageUrl} alt={sticker.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                :{sticker.name}:
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px',
                  background: sticker.type === 'emoji' ? 'rgba(0,212,255,0.1)' : 'rgba(138,43,226,0.1)',
                  color: sticker.type === 'emoji' ? 'var(--accent)' : 'var(--primary)',
                }}>
                  {sticker.type}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}>
                  {sticker.category}
                </span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                por @{sticker.addedBy?.username || '?'}
              </div>
              <button
                onClick={() => handleDelete(sticker.id, sticker.name)}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '24px', height: '24px', borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                  background: 'rgba(255,77,79,0.15)', color: '#f44336',
                  fontSize: '0.7rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                  lineHeight: 1,
                }}
                className="delete-btn"
                title="Eliminar sticker"
              >✕</button>
              <style jsx>{`
                div:hover .delete-btn { opacity: 1; }
              `}</style>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
