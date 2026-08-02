'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';
import { useToast } from '@/lib/ToastContext';

interface NewsAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
}

interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string | null;
  category: string; // PLATFORM, VTUBER, COMMUNITY, EVENT, PATCH_NOTES
  isPinned: boolean;
  isPublished: boolean;
  views: number;
  createdAt: string;
  author: NewsAuthor;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Todas', icon: '🌟' },
  { id: 'PLATFORM', label: 'Plataforma', icon: '🚀' },
  { id: 'VTUBER', label: 'VTubers', icon: '🎙️' },
  { id: 'COMMUNITY', label: 'Comunidad', icon: '👥' },
  { id: 'EVENT', label: 'Eventos', icon: '🎉' },
  { id: 'PATCH_NOTES', label: 'Parches', icon: '⚡' },
];

const CATEGORY_META: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  PLATFORM: { label: 'Plataforma', icon: '🚀', bg: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA' },
  VTUBER: { label: 'VTubers', icon: '🎙️', bg: 'rgba(236, 72, 153, 0.2)', color: '#F472B6' },
  COMMUNITY: { label: 'Comunidad', icon: '👥', bg: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' },
  EVENT: { label: 'Eventos', icon: '🎉', bg: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' },
  PATCH_NOTES: { label: 'Notas de Parche', icon: '⚡', bg: 'rgba(16, 185, 129, 0.2)', color: '#34D399' },
};

function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min de lectura`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function NewsContent() {
  const { showToast } = useToast();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [pinnedArticle, setPinnedArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [readingModalOpen, setReadingModalOpen] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'ALL') queryParams.append('category', selectedCategory);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());

      const data = await apiFetch(`/news?${queryParams.toString()}`);
      setArticles(data.articles || []);
    } catch (err: unknown) {
      showToast('Error al cargar noticias', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, showToast]);

  const fetchPinned = useCallback(async () => {
    try {
      const data = await apiFetch('/news/pinned');
      setPinnedArticle(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNews();
    fetchPinned();
  }, [fetchNews, fetchPinned]);

  const openArticleReader = async (article: NewsArticle) => {
    setSelectedArticle(article);
    setReadingModalOpen(true);

    // Fetch single article to register view counter
    try {
      const full = await apiFetch(`/news/${article.slug}`);
      setSelectedArticle(full);
      // update local view counter
      setArticles((prev) =>
        prev.map((a) => (a.id === full.id ? { ...a, views: full.views } : a))
      );
    } catch {}
  };

  const copyShareLink = (article: NewsArticle) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/news#${article.slug}`;
      navigator.clipboard.writeText(url);
      showToast('¡Enlace copiado al portapapeles!', 'success');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '28px', paddingBottom: '60px', maxWidth: '1100px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: '#A78BFA',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '12px',
        }}>
          <span>📢</span> Novedades de la Comunidad y la Plataforma
        </div>

        <h1 style={{
          fontSize: '2.4rem',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #FFF 0%, #A78BFA 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>
          Noticias & Novedades
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Mantente al día con las últimas actualizaciones del Gremio, notas de parches, anuncios de VTubers y eventos comunitarios.
        </p>
      </div>

      {/* Featured Pinned Hero Card */}
      {pinnedArticle && !searchQuery && selectedCategory === 'ALL' && (
        <div
          onClick={() => openArticleReader(pinnedArticle)}
          className="glass"
          style={{
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            marginBottom: '36px',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(139, 92, 246, 0.15)',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          }}
        >
          {/* Cover image / gradient fallback */}
          <div style={{
            minHeight: '260px',
            background: pinnedArticle.coverImage
              ? `url(${pinnedArticle.coverImage}) center/cover no-repeat`
              : 'linear-gradient(135deg, #4C1D95 0%, #1E1B4B 100%)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              display: 'flex',
              gap: '8px',
            }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: 'rgba(245, 158, 11, 0.9)',
                color: '#000',
                fontSize: '0.75rem',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
              }}>
                📌 DESTACADO
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: CATEGORY_META[pinnedArticle.category]?.bg || 'rgba(255,255,255,0.2)',
                color: CATEGORY_META[pinnedArticle.category]?.color || '#FFF',
                fontSize: '0.75rem',
                fontWeight: 800,
                backdropFilter: 'blur(4px)',
              }}>
                {CATEGORY_META[pinnedArticle.category]?.icon} {CATEGORY_META[pinnedArticle.category]?.label || pinnedArticle.category}
              </span>
            </div>
          </div>

          {/* Details column */}
          <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              <span>📅 {formatDate(pinnedArticle.createdAt)}</span>
              <span>•</span>
              <span>⏱️ {estimateReadingTime(pinnedArticle.content)}</span>
              <span>•</span>
              <span>👁️ {pinnedArticle.views} vistas</span>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '12px', color: '#FFF' }}>
              {pinnedArticle.title}
            </h2>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              {pinnedArticle.summary}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                }}>
                  {pinnedArticle.author.avatarUrl ? (
                    <img src={pinnedArticle.author.avatarUrl} alt={pinnedArticle.author.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    pinnedArticle.author.username.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pinnedArticle.author.displayName || pinnedArticle.author.username}</span>
              </div>

              <span className="btn btn--primary" style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                Leer Noticia Completa →
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px',
        padding: '12px 16px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.03)',
                  color: active ? '#FFF' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <input
            type="text"
            placeholder="Buscar noticias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#FFF',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            🔍
          </span>
        </div>
      </div>

      {/* Main Articles Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <span style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : articles.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📭 No hay publicaciones en esta categoría.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Prueba seleccionando otra categoría o limpiando el buscador.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '24px',
        }}>
          {articles.map((item) => {
            const meta = CATEGORY_META[item.category] || { label: item.category, icon: '📄', bg: 'rgba(255,255,255,0.1)', color: '#FFF' };

            return (
              <div
                key={item.id}
                onClick={() => openArticleReader(item)}
                className="glass"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Cover Image */}
                <div style={{
                  height: '170px',
                  background: item.coverImage
                    ? `url(${item.coverImage}) center/cover no-repeat`
                    : 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(15,23,42,0.8) 100%)',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    gap: '6px',
                  }}>
                    {item.isPinned && (
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '12px',
                        background: 'rgba(245, 158, 11, 0.9)',
                        color: '#000',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}>
                        📌 FIJADO
                      </span>
                    )}
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      background: meta.bg,
                      color: meta.color,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      backdropFilter: 'blur(4px)',
                    }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                </div>

                {/* Article Info */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>{formatDate(item.createdAt)}</span>
                    <span>👁️ {item.views} vistas</span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.4, marginBottom: '8px', color: '#FFF' }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {item.summary}
                  </p>

                  {/* Footer Author & Read link */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        overflow: 'hidden',
                      }}>
                        {item.author.avatarUrl ? (
                          <img src={item.author.avatarUrl} alt={item.author.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          item.author.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.author.displayName || item.author.username}</span>
                    </div>

                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Leer más →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reader Modal */}
      {readingModalOpen && selectedArticle && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div className="glass" style={{
            position: 'relative',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Header with image */}
            <div style={{
              height: '220px',
              background: selectedArticle.coverImage
                ? `url(${selectedArticle.coverImage}) center/cover no-repeat`
                : 'linear-gradient(135deg, #4C1D95 0%, #0F172A 100%)',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '20px',
            }}>
              <button
                onClick={() => setReadingModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFF',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>

              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                display: 'flex',
                gap: '8px',
              }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  background: CATEGORY_META[selectedArticle.category]?.bg || 'rgba(0,0,0,0.6)',
                  color: CATEGORY_META[selectedArticle.category]?.color || '#FFF',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  backdropFilter: 'blur(4px)',
                }}>
                  {CATEGORY_META[selectedArticle.category]?.icon} {CATEGORY_META[selectedArticle.category]?.label || selectedArticle.category}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <span>📅 {formatDate(selectedArticle.createdAt)}</span>
                <span>•</span>
                <span>⏱️ {estimateReadingTime(selectedArticle.content)}</span>
                <span>•</span>
                <span>👁️ {selectedArticle.views} lecturas</span>
              </div>

              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '14px', lineHeight: 1.3, color: '#FFF' }}>
                {selectedArticle.title}
              </h1>

              <div style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderLeft: '4px solid var(--primary)',
                fontSize: '0.95rem',
                color: '#E2E8F0',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}>
                {selectedArticle.summary}
              </div>

              {/* Rendered content */}
              <div style={{
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: '#CBD5E1',
                whiteSpace: 'pre-line',
              }}>
                {selectedArticle.content}
              </div>

              {/* Author footer */}
              <div style={{
                marginTop: '32px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    overflow: 'hidden',
                  }}>
                    {selectedArticle.author.avatarUrl ? (
                      <img src={selectedArticle.author.avatarUrl} alt={selectedArticle.author.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      selectedArticle.author.username.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedArticle.author.displayName || selectedArticle.author.username}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Publicado por el equipo de GremioWeb</div>
                  </div>
                </div>

                <button
                  onClick={() => copyShareLink(selectedArticle)}
                  className="btn btn--ghost"
                  style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '10px' }}
                >
                  🔗 Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewsPage() {
  return (
    <ClientOnly>
      <NewsContent />
    </ClientOnly>
  );
}
