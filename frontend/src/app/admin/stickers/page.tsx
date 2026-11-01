'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useSocketMedia } from '@/lib/hooks/useSocketMedia';
import { refreshStickersCache } from '@/lib/content-renderer';
import { hasAnyRole } from '@gremio-estelar/shared';

interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  type: 'emoji' | 'sticker';
  minPlan?: string;
  addedBy?: { id: string; username: string };
  createdAt: string;
}

const CATEGORIES = [
  'general',
  'anime',
  'meme',
  'hearts',
  'reaction',
  'celebration',
  'sad',
  'angry',
  'love',
  'kawaii',
  'gaming',
];

export default function StickersAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Data & loading
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<'all' | 'emoji' | 'sticker'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Single delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New item form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formType, setFormType] = useState<'emoji' | 'sticker'>('sticker');
  const [formMinPlan, setFormMinPlan] = useState<'FREE' | 'ASTRO' | 'NOVA' | 'STELLAR'>('FREE');
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
    if (!isLoading && !hasAnyRole(user?.role, ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'OWNER'])) {
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
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('limit', '100');

      const data = await apiFetch(`/admin/stickers?${params}`);
      setStickers(data?.data || []);
      setSelectedIds(new Set());
    } catch {
      setStickers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAnyRole(user?.role, ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'OWNER'])) {
      loadStickers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter, user]);

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
          minPlan: formMinPlan,
        }),
      });
      setShowForm(false);
      setFormName('');
      setFormImageUrl('');
      setFormCategory('general');
      setFormType('sticker');
      setFormMinPlan('FREE');
      refreshStickersCache();
      loadStickers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  // Delete single sticker or emoji
  const handleDeleteSingle = async (id: string, name: string, type: 'emoji' | 'sticker') => {
    const label = type === 'emoji' ? 'el emoji' : 'el sticker';
    if (!confirm(`¿Eliminar ${label} ":${name}:"? Ya no aparecerá en el chat ni comentarios.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await apiFetch(`/admin/stickers/${id}`, { method: 'DELETE' });
      setStickers(prev => prev.filter(s => s.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refreshStickersCache();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  // Delete multiple selected items
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Estás seguro de eliminar los ${selectedIds.size} elementos seleccionados permanentemente?`)) {
      return;
    }

    setIsDeletingBulk(true);
    try {
      await apiFetch('/admin/stickers/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      setStickers(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      refreshStickersCache();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar seleccionados');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)));
    }
  };

  // Client-side instant search filter
  const filtered = useMemo(() => {
    return stickers.filter(s => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (categoryFilter && s.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stickers, typeFilter, categoryFilter, searchQuery]);

  const emojiCount = useMemo(() => stickers.filter(s => s.type === 'emoji').length, [stickers]);
  const stickerCount = useMemo(() => stickers.filter(s => s.type === 'sticker').length, [stickers]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Cargando panel de administración...
      </div>
    );
  }
  if (!user || !hasAnyRole(user.role, ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'OWNER'])) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🎨</span> Gestión de Emojis y Stickers
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Agrega o quita los emojis y stickers personalizados de la plataforma en tiempo real.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeletingBulk}
              className="btn"
              style={{
                padding: '11px 20px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700,
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                color: '#ef4444', cursor: isDeletingBulk ? 'wait' : 'pointer',
              }}
            >
              {isDeletingBulk ? 'Eliminando...' : `🗑️ Quitar seleccionados (${selectedIds.size})`}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn"
            style={{
              padding: '11px 22px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700,
              background: showForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: showForm ? '1px solid rgba(255,255,255,0.1)' : 'none',
              cursor: 'pointer',
            }}
          >
            {showForm ? '✕ Cerrar Formulario' : '+ Agregar Nuevo'}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass" style={{ padding: '24px', borderRadius: '18px', marginBottom: '28px', border: '1px solid rgba(138,43,226,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              {formType === 'emoji' ? '😊 Agregar Nuevo Emoji' : '🏷️ Agregar Nuevo Sticker'}
            </h3>
            {/* Toggle Tipo */}
            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={() => setFormType('emoji')}
                style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none',
                  background: formType === 'emoji' ? 'var(--accent)' : 'transparent',
                  color: formType === 'emoji' ? '#000' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                }}
              >
                😊 Emoji (32×32)
              </button>
              <button
                type="button"
                onClick={() => setFormType('sticker')}
                style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none',
                  background: formType === 'sticker' ? 'var(--primary)' : 'transparent',
                  color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                }}
              >
                🏷️ Sticker (96×96)
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Nombre del código <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(se usará como :{formName || 'nombre'}:)</span>
                </label>
                <input
                  className="input"
                  value={formName}
                  onChange={e => setFormName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ej: maid_heart o pepe_dance"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Categoría</label>
                <select
                  className="input"
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Exclusividad por Plan</label>
                <select
                  className="input"
                  value={formMinPlan}
                  onChange={e => setFormMinPlan(e.target.value as any)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="FREE">Gratis (Todos los usuarios)</option>
                  <option value="ASTRO">Astro VIP</option>
                  <option value="NOVA">Nova VIP</option>
                  <option value="STELLAR">Stellar Elite</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Archivo de Imagen (WebP, PNG, GIF o JPEG)
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    className="input"
                    value={formImageUrl}
                    onChange={e => { setFormImageUrl(e.target.value); setPreviewError(false); }}
                    placeholder="Pega una URL directa o sube un archivo desde tu equipo..."
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn"
                    style={{
                      padding: '10px 18px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text)', cursor: uploading ? 'wait' : 'pointer',
                      fontSize: '0.85rem', whiteSpace: 'nowrap',
                    }}
                  >
                    {uploading ? '⏳ Subiendo...' : '📁 Subir Archivo'}
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
            </div>

            {/* Live Preview Box */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '14px',
              borderRadius: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '18px',
            }}>
              <div style={{
                width: formType === 'emoji' ? '40px' : '88px',
                height: formType === 'emoji' ? '40px' : '88px',
                borderRadius: '10px', overflow: 'hidden',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 10%, transparent 11%) 0 0/12px 12px, #18181b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                {formImageUrl && !previewError ? (
                  <img
                    src={formImageUrl}
                    alt="preview"
                    onError={() => setPreviewError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.2rem', opacity: 0.4 }}>{formType === 'emoji' ? '😊' : '🏷️'}</span>
                )}
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                  Código en texto: <code style={{ color: 'var(--secondary)', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px' }}>:{formName || 'nombre'}:</code>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {formType === 'emoji' ? 'Se mostrará alineado dentro del texto (32×32px)' : 'Se mostrará como sticker grande en chats y comentarios (96×96px)'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                className="btn"
                disabled={saving || uploading}
                style={{
                  padding: '12px 28px', borderRadius: '10px', fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                }}
              >
                {saving ? 'Guardando...' : formType === 'emoji' ? 'Guardar Emoji' : 'Guardar Sticker'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '12px 24px', borderRadius: '10px', background: 'none',
                  border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass" style={{
        padding: '16px', borderRadius: '16px', marginBottom: '22px',
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Type tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTypeFilter('all')}
            style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 700,
              background: typeFilter === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: typeFilter === 'all' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Todos ({stickers.length})
          </button>
          <button
            onClick={() => setTypeFilter('emoji')}
            style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 700,
              background: typeFilter === 'emoji' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: typeFilter === 'emoji' ? '#000' : 'var(--text-muted)',
            }}
          >
            😊 Emojis ({emojiCount})
          </button>
          <button
            onClick={() => setTypeFilter('sticker')}
            style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 700,
              background: typeFilter === 'sticker' ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
              color: typeFilter === 'sticker' ? '#fff' : 'var(--text-muted)',
            }}
          >
            🏷️ Stickers ({stickerCount})
          </button>
        </div>

        {/* Search & Category */}
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px', maxWidth: '520px' }}>
          <input
            className="input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Buscar por :nombre: o categoría..."
            style={{ flex: 1, padding: '9px 14px', fontSize: '0.86rem', borderRadius: '10px' }}
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontSize: '0.85rem',
              cursor: 'pointer', minWidth: '130px',
            }}
          >
            <option value="">Categorías</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk actions banner if items exist */}
      {filtered.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px', padding: '0 4px', fontSize: '0.82rem', color: 'var(--text-muted)',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontWeight: 600 }}>Seleccionar todos ({filtered.length})</span>
          </label>
          <span>Mostrando {filtered.length} de {stickers.length}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="glass" style={{ textAlign: 'center', padding: '60px', borderRadius: '16px', color: 'var(--text-muted)' }}>
          Cargando catálogo...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '60px', borderRadius: '16px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
            {typeFilter === 'emoji' ? '😊' : '🏷️'}
          </div>
          <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>No se encontraron elementos</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 16px' }}>
            {searchQuery ? `No hay resultados para "${searchQuery}"` : 'Aún no se ha subido ningún emoji o sticker en esta sección.'}
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn--gradient" style={{ padding: '10px 20px', borderRadius: '10px' }}>
            + Agregar ahora
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '14px',
        }}>
          {filtered.map(item => {
            const isSelected = selectedIds.has(item.id);
            const isDeleting = deletingId === item.id;
            const isEmoji = item.type === 'emoji';

            return (
              <div
                key={item.id}
                className="glass"
                style={{
                  padding: '14px', borderRadius: '14px', textAlign: 'center',
                  position: 'relative',
                  border: isSelected
                    ? '1.5px solid var(--primary)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected ? 'rgba(138,43,226,0.12)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.2s ease',
                  opacity: isDeleting ? 0.4 : 1,
                }}
              >
                {/* Select Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(item.id)}
                  aria-label={`Seleccionar ${item.name}`}
                  style={{
                    position: 'absolute', top: '10px', left: '10px',
                    width: '18px', height: '18px', cursor: 'pointer',
                    accentColor: 'var(--primary)',
                  }}
                />

                {/* Always-visible Delete Button with tooltip */}
                <button
                  type="button"
                  onClick={() => handleDeleteSingle(item.id, item.name, item.type)}
                  disabled={isDeleting}
                  aria-label={`Quitar ${item.name}`}
                  title={`Eliminar ${isEmoji ? 'emoji' : 'sticker'} :${item.name}:`}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    padding: '4px 8px', borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                    fontSize: '0.72rem', fontWeight: 700,
                    cursor: isDeleting ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '3px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                  }}
                >
                  <span>🗑️</span>
                  <span>Quitar</span>
                </button>

                {/* Preview Image Box (Checkerboard transparency) */}
                <div style={{
                  width: isEmoji ? '42px' : '84px',
                  height: isEmoji ? '42px' : '84px',
                  margin: '18px auto 10px',
                  borderRadius: '12px', overflow: 'hidden',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.08) 10%, transparent 11%) 0 0/10px 10px, rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>

                {/* Name */}
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text)' }}>
                  :{item.name}:
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.66rem', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                    background: isEmoji ? 'rgba(0,212,255,0.15)' : 'rgba(138,43,226,0.15)',
                    color: isEmoji ? 'var(--accent)' : 'var(--primary)',
                  }}>
                    {isEmoji ? 'Emoji' : 'Sticker'}
                  </span>
                  <span style={{
                    fontSize: '0.66rem', padding: '2px 7px', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                  }}>
                    {item.category}
                  </span>
                  {item.minPlan && item.minPlan !== 'FREE' && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px',
                      background: 'rgba(234,179,8,0.15)', color: '#eab308',
                    }}>
                      ⭐ {item.minPlan}
                    </span>
                  )}
                </div>

                {/* Author */}
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  @{item.addedBy?.username || 'admin'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
