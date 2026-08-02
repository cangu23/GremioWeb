'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import { hasAnyRole } from '@gremio-estelar/shared';

interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string | null;
  category: string;
  isPinned: boolean;
  isPublished: boolean;
  views: number;
  createdAt: string;
  author: {
    username: string;
    displayName: string | null;
  };
}

const CATEGORY_OPTIONS = [
  { id: 'PLATFORM', label: '🚀 Plataforma' },
  { id: 'VTUBER', label: '🎙️ VTubers' },
  { id: 'COMMUNITY', label: '👥 Comunidad' },
  { id: 'EVENT', label: '🎉 Eventos' },
  { id: 'PATCH_NOTES', label: '⚡ Notas de Parche' },
];

function AdminNewsContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('PLATFORM');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/news?limit=50');
      setArticles(data.articles || []);
    } catch (err: unknown) {
      showToast('Error al cargar noticias', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isLoading && (!user || !hasAnyRole(user.role, ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'OWNER']))) {
      router.push('/dashboard');
      return;
    }
    if (user) {
      fetchArticles();
    }
  }, [user, isLoading, router, fetchArticles]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle('');
    setSummary('');
    setContent('');
    setCoverImage('');
    setCategory('PLATFORM');
    setIsPinned(false);
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (article: NewsArticle) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSummary(article.summary);
    setContent(article.content);
    setCoverImage(article.coverImage || '');
    setCategory(article.category);
    setIsPinned(article.isPinned);
    setIsPublished(article.isPublished);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      showToast('Por favor completa el título, resumen y contenido', 'error');
      return;
    }

    try {
      const payload = {
        title,
        summary,
        content,
        coverImage: coverImage.trim() || null,
        category,
        isPinned,
        isPublished,
      };

      if (editingArticle) {
        await apiFetch(`/news/${editingArticle.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Noticia actualizada correctamente', 'success');
      } else {
        await apiFetch('/news', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Noticia publicada correctamente', 'success');
      }

      setModalOpen(false);
      fetchArticles();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al guardar la noticia', 'error');
    }
  };

  const handleDelete = async (article: NewsArticle) => {
    if (!confirm(`¿Estás seguro de eliminar la noticia "${article.title}"?`)) return;

    try {
      await apiFetch(`/news/${article.id}`, { method: 'DELETE' });
      showToast('Noticia eliminada correctamente', 'success');
      fetchArticles();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  };

  const togglePin = async (article: NewsArticle) => {
    try {
      await apiFetch(`/news/${article.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPinned: !article.isPinned }),
      });
      showToast(article.isPinned ? 'Noticia desfijada' : 'Noticia fijada al inicio', 'success');
      fetchArticles();
    } catch {}
  };

  const togglePublish = async (article: NewsArticle) => {
    try {
      await apiFetch(`/news/${article.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });
      showToast(article.isPublished ? 'Noticia despublicada (borrador)' : 'Noticia publicada', 'success');
      fetchArticles();
    } catch {}
  };

  if (isLoading || !user) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF' }}>📰 Gestión de Noticias y Novedades</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Publica avisos, notas de parches y anuncios para la comunidad.</p>
        </div>

        <button onClick={openCreateModal} className="btn btn--primary" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700 }}>
          ➕ Redactar Nueva Noticia
        </button>
      </div>

      {/* Table List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <span style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
        </div>
      ) : articles.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Aún no hay noticias registradas. Haz clic en "Redactar Nueva Noticia".</p>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '14px 16px' }}>Portada / Título</th>
                  <th style={{ padding: '14px 16px' }}>Categoría</th>
                  <th style={{ padding: '14px 16px' }}>Estado</th>
                  <th style={{ padding: '14px 16px' }}>Vistas</th>
                  <th style={{ padding: '14px 16px' }}>Fecha</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((art) => (
                  <tr key={art.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          background: art.coverImage ? `url(${art.coverImage}) center/cover` : 'rgba(255,255,255,0.05)',
                          flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#FFF' }}>{art.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por {art.author.displayName || art.author.username}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}>
                        {art.category}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => togglePin(art)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: art.isPinned ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.05)',
                            color: art.isPinned ? '#FBBF24' : 'var(--text-muted)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {art.isPinned ? '📌 Fijado' : 'Fijar'}
                        </button>

                        <button
                          onClick={() => togglePublish(art)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: art.isPublished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: art.isPublished ? '#34D399' : '#F87171',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {art.isPublished ? 'Publicado' : 'Borrador'}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      👁️ {art.views}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(art.createdAt).toLocaleDateString('es-ES')}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(art)}
                          className="btn btn--ghost"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(art)}
                          className="btn btn--ghost"
                          style={{ padding: '4px 10px', fontSize: '0.8rem', color: '#EF4444' }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div className="glass" style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            padding: '28px',
            borderRadius: '20px',
            overflowY: 'auto',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: '#FFF' }}>
              {editingArticle ? '✏️ Editar Noticia' : '➕ Redactar Nueva Noticia'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Título del Artículo *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: ¡Actualización del Sistema de Ruleta!"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#1E1B4B',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFF',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    URL Imagen de Portada (Opcional)
                  </label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFF',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Resumen Corto (Breve descripción de 1-2 frases) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Resumen visible en las tarjetas principales..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Contenido Completo (Markdown / Texto) *
                </label>
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Redacta la noticia completa aquí..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFF',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                  />
                  <span>📌 Fijar como noticia destacada</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span>Publicado visible</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn--ghost"
                  style={{ padding: '10px 18px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ padding: '10px 24px', fontWeight: 700 }}
                >
                  {editingArticle ? 'Guardar Cambios' : 'Publicar Noticia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminNewsPage() {
  return (
    <ClientOnly>
      <AdminNewsContent />
    </ClientOnly>
  );
}
