'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch, getAccessToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';

interface Post {
  id: string;
  content: string;
  mediaUrl: string | null;
  isPinned: boolean;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    username: string;
    role?: string;
    vtuberProfile?: { displayName: string; avatarUrl: string | null; isApproved?: boolean; isVerified?: boolean } | null;
  };
  _count: { comments: number; likes: number };
  isLikedByMe: boolean;
  hashtags: string[];
}

function FeedContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [trendingHashtags, setTrendingHashtags] = useState<{ id: string; name: string; _count: { posts: number } }[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedMode, setFeedMode] = useState<'global' | 'following'>('global');

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      const mode = feedMode === 'following' && user ? 'true' : 'false';
      const data = await apiFetch(`/posts?limit=20&page=${pageNum}&personalized=${mode}`, {});
      if (append) {
        setPosts(prev => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      setHasMore(data.length === 20);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [feedMode, user]);

  const loadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  };

  const fetchHashtags = useCallback(async () => {
    try {
      const data = await apiFetch('/posts/hashtags/trending?limit=10', {});
      setTrendingHashtags(data);
    } catch {}
  }, []);

  useEffect(() => {
    setPage(1);
    fetchFeed(1, false);
    fetchHashtags();
  }, [fetchFeed, fetchHashtags]);

  const processImageFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Formato no soportado. Usa JPEG, PNG, WebP o GIF.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 5 MB.');
      return false;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
    return true;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imagePreview) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!user) { router.push('/login'); return; }
    if (imagePreview) {
      setError('Ya tienes una imagen seleccionada. Elimínala primero para arrastrar otra.');
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';
    const token = getAccessToken();
    const res = await fetch(`${baseUrl}/api/uploads/post`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al subir imagen' }));
      throw new Error(err.message || 'Error al subir imagen');
    }
    const data = await res.json();
    return data.url;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!newPost.trim() && !selectedImage) return;
    setPosting(true);
    setError('');

    try {
      let mediaUrl = undefined;
      if (selectedImage) {
        setUploadingImage(true);
        mediaUrl = await uploadImage(selectedImage);
        setUploadingImage(false);
      }

      const post = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: newPost.trim() || '(imagen)',
          mediaUrl,
        }),
      });
      setPosts(prev => [post, ...prev]);
      setNewPost('');
      removeImage();
      fetchHashtags(); // Refresh trending
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al publicar');
    } finally {
      setPosting(false);
      setUploadingImage(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) { router.push('/login'); return; }
    try {
      if (isLiked) {
        await apiFetch(`/posts/${postId}/unlike`, { method: 'POST' });
      } else {
        await apiFetch(`/posts/${postId}/like`, { method: 'POST' });
      }
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLikedByMe: !isLiked,
            _count: { ...p._count, likes: isLiked ? p._count.likes - 1 : p._count.likes + 1 },
          };
        }
        return p;
      }));
    } catch {}
  };

  if (loading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando feed...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.2rem', margin: 0 }}>Feed</h1>
        {user && (
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
            <button onClick={() => { setFeedMode('global'); setPage(1); }} className="btn" style={{
              padding: '6px 14px', fontSize: '0.8rem',
              background: feedMode === 'global' ? 'var(--primary)' : 'transparent',
              border: 'none', color: feedMode === 'global' ? 'white' : 'var(--text-muted)',
            }}>Global</button>
            <button onClick={() => { setFeedMode('following'); setPage(1); }} className="btn" style={{
              padding: '6px 14px', fontSize: '0.8rem',
              background: feedMode === 'following' ? 'var(--primary)' : 'transparent',
              border: 'none', color: feedMode === 'following' ? 'white' : 'var(--text-muted)',
            }}>Siguiendo</button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: 'rgba(255,77,79,0.1)', color: 'var(--error)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Create Post */}
      <div className="glass" style={{ padding: '20px', marginBottom: '24px', position: 'relative' }}>
        <form
          onSubmit={handleCreatePost}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ position: 'relative' }}
        >
          {/* Drag & drop overlay */}
          {isDragOver && (
            <div style={{
              position: 'absolute', inset: '-12px', zIndex: 10,
              borderRadius: '16px',
              border: '2px dashed var(--primary)',
              background: 'rgba(255,0,127,0.08)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '8px', pointerEvents: 'none',
              backdropFilter: 'blur(2px)',
              animation: 'fadeInUp 0.2s ease-out',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>Suelta tu imagen aquí</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>JPEG, PNG, WebP o GIF · Máx 5 MB</span>
            </div>
          )}
          <textarea
            className="input"
            style={{ minHeight: '80px', resize: 'vertical', marginBottom: '12px', fontSize: '0.95rem' }}
            placeholder={user ? 'Arrastra una imagen o escribe algo... Comparte con la comunidad 📸' : 'Inicia sesión para publicar...'}
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            disabled={!user}
            maxLength={2000}
          />

          {/* Image preview */}
          {imagePreview && (
            <div style={{
              position: 'relative', marginBottom: '12px', borderRadius: '12px', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', background: 'rgba(0,0,0,0.3)' }} />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px',
                  borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,77,79,0.8)')}
                onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
                title="Eliminar imagen"
              >✕</button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Image upload button */}
              {user && (
                <>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    id="post-image-input"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                    disabled={posting || !!imagePreview}
                  />
                  <label
                    htmlFor="post-image-input"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '8px', cursor: imagePreview ? 'not-allowed' : 'pointer',
                      color: imagePreview ? 'var(--text-muted)' : 'var(--text)',
                      fontSize: '0.85rem', transition: 'all 0.2s', opacity: imagePreview ? 0.5 : 1,
                      background: 'rgba(255,255,255,0.05)',
                    }}
                    onMouseOver={e => { if (!imagePreview) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseOut={e => { if (!imagePreview) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    Imagen
                  </label>
                </>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {newPost.length}/2000 · #hashtags
              </span>
            </div>
            <button type="submit" className="btn" disabled={!user || (!newPost.trim() && !selectedImage) || posting || uploadingImage} style={{ padding: '10px 24px' }}>
              {uploadingImage ? 'Subiendo imagen...' : posting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexDirection: user ? 'row' : 'column', alignItems: 'flex-start' }}>
        {/* Feed */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {posts.length === 0 ? (
            <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '12px' }}>
                No hay publicaciones aún.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                ¡Sé el primero en compartir algo con la comunidad!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {posts.map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} currentUserId={user?.id} onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))} />
              ))}
              {hasMore && (
                <button onClick={loadMore} disabled={loadingMore} className="btn" style={{
                  padding: '12px', width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)', color: 'var(--text)',
                }}>
                  {loadingMore ? 'Cargando...' : 'Cargar más publicaciones ↓'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Trending Hashtags */}
        {trendingHashtags.length > 0 && (
          <div className="glass" style={{ padding: '20px', width: '260px', position: 'sticky', top: '100px', flexShrink: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Tendencias</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trendingHashtags.map(tag => (
                <Link
                  key={tag.id}
                  href={`/feed?tag=${tag.name}`}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: '8px', textDecoration: 'none', color: 'var(--text)',
                    transition: 'background 0.2s', fontSize: '0.9rem',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>#{tag.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tag._count.posts}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onLike, currentUserId, onDelete }: { post: Post; onLike: (id: string, isLiked: boolean) => void; currentUserId?: string; onDelete?: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const isOwner = currentUserId === post.userId;

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const updated = await apiFetch(`/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editContent.trim() }),
      });
      post.content = updated.content;
      setEditing(false);
      setMenuOpen(false);
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/posts/${post.id}`, { method: 'DELETE' });
      setShowDeleteConfirm(false);
      onDelete?.(post.id);
    } catch {
      setDeleting(false);
    }
  };
  interface CommentData {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    user: {
      id: string;
      username: string;
      role?: string;
      vtuberProfile?: { displayName: string; avatarUrl: string | null; isApproved?: boolean } | null;
    };
  }
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await apiFetch(`/posts/${post.id}/comments`, {});
      setComments(data);
    } catch {}
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const newComment = await apiFetch(`/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim() }),
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      post._count.comments++;
    } catch {}
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Close lightbox or delete confirmation on ESC
  useEffect(() => {
    if (!lightboxImage && !showDeleteConfirm) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
        setShowDeleteConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = lightboxImage ? 'hidden' : '';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxImage, showDeleteConfirm]);

  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
      {/* Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              width: '44px', height: '44px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              background: 'rgba(0,0,0,0.5)', color: 'white',
              fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', zIndex: 1,
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,0,127,0.6)'; e.currentTarget.style.borderColor = '#ff007f'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            aria-label="Cerrar"
          >✕</button>

          {/* Image */}
          <img
            src={lightboxImage}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              objectFit: 'contain', userSelect: 'none',
              animation: 'lightboxZoomIn 0.3s ease-out',
            }}
          />

          {/* Footer hint */}
          <div style={{
            position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            ESC para cerrar
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          onClick={() => { if (!deleting) setShowDeleteConfirm(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              animation: 'lightboxZoomIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,77,106,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Eliminar publicación</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ¿Estás seguro? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >Cancelar</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #ff4d6a, #ff1a4f)',
                  color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={e => (e.currentTarget.style.opacity = '1')}
              >{deleting ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Post header */}
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Link href={`/profile/${post.user.id}`}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: post.user.vtuberProfile?.avatarUrl
                ? `url(${post.user.vtuberProfile.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {!post.user.vtuberProfile?.avatarUrl && (post.user.vtuberProfile?.displayName || post.user.username).charAt(0).toUpperCase()}
            </div>
          </Link>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link href={`/profile/${post.user.id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {post.user.vtuberProfile?.displayName || post.user.username}
              {(post.user.role === 'VTUBER' || post.user.vtuberProfile?.isApproved) && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="VTuber Oficial">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
            </Link>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              @{post.user.username} · {timeAgo(post.createdAt)}
            </div>
          </div>
          {post.isPinned && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginRight: '8px' }}>Fijado</span>}
          {/* Three-dot menu for post owner */}
          {isOwner && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: 'none', background: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseOver={e => { if (!menuOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseOut={e => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
                aria-label="Opciones"
              >⋮</button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                  minWidth: '150px', zIndex: 100,
                  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '4px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  animation: 'fadeInUp 0.12s ease-out',
                }}>
                  <button
                    onClick={() => { setEditContent(post.content); setEditing(true); setMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '8px 12px', border: 'none', background: 'none',
                      color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem',
                      borderRadius: '6px', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '8px 12px', border: 'none', background: 'none',
                      color: '#ff4d6a', cursor: 'pointer', fontSize: '0.85rem',
                      borderRadius: '6px', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,77,106,0.1)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post content or edit mode */}
        {editing ? (
          <div style={{ marginBottom: '12px' }}>
            <textarea
              className="input"
              style={{ width: '100%', minHeight: '80px', fontSize: '0.95rem', lineHeight: 1.6, resize: 'vertical', marginBottom: '8px' }}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              maxLength={2000}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{editContent.length}/2000</span>
              <button
                onClick={() => { setEditing(false); setEditContent(post.content); }}
                style={{
                  padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >Cancelar</button>
              <button
                onClick={handleEdit}
                disabled={saving || !editContent.trim()}
                className="btn"
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
              >{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '12px' }}>
            {post.content.split(/(#\w+)/g).map((part, i) => {
              if (part.startsWith('#')) {
                return <Link key={i} href={`/feed?tag=${part.slice(1)}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>{part}</Link>;
              }
              if (part.startsWith('@')) {
                return <Link key={i} href={`/vtubers?q=${encodeURIComponent(part.slice(1))}`} style={{ color: 'var(--secondary)', fontWeight: 500 }}>{part}</Link>;
              }
              return part;
            })}
          </p>
        )}

        {/* Media */}
        {post.mediaUrl && (
          <div
            style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', cursor: 'zoom-in', position: 'relative' }}
            onClick={() => setLightboxImage(post.mediaUrl!)}
            onMouseOver={e => {
              const img = e.currentTarget.querySelector('img');
              const overlay = e.currentTarget.querySelector('.media-overlay');
              if (img) img.style.transform = 'scale(1.02)';
              if (overlay) (overlay as HTMLElement).style.opacity = '1';
            }}
            onMouseOut={e => {
              const img = e.currentTarget.querySelector('img');
              const overlay = e.currentTarget.querySelector('.media-overlay');
              if (img) img.style.transform = 'scale(1)';
              if (overlay) (overlay as HTMLElement).style.opacity = '0';
            }}
          >
            <img
              src={post.mediaUrl}
              alt=""
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', transition: 'transform 0.3s ease', display: 'block' }}
            />
            <div className="media-overlay" style={{
              position: 'absolute', inset: 0, borderRadius: '12px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)',
              opacity: 0, transition: 'opacity 0.3s',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '12px',
              pointerEvents: 'none',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </div>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {post.hashtags.map(tag => (
              <Link key={tag} href={`/feed?tag=${tag}`} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          <button
            onClick={() => onLike(post.id, post.isLikedByMe)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: post.isLikedByMe ? '#ff6b9d' : 'var(--text-muted)',
              fontSize: '0.9rem', padding: '4px 12px', borderRadius: '20px',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            {post.isLikedByMe ? 'Liked' : 'Like'} {post._count.likes}
          </button>
          <button
            onClick={toggleComments}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: showComments ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.9rem', padding: '4px 12px', borderRadius: '20px',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            Comment {post._count.comments}
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', background: 'rgba(0,0,0,0.15)' }}>
          {loadingComments ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '12px' }}>
              Sin comentarios aún. ¡Sé el primero!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              {comments.map((comment: CommentData) => (
                <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                  <Link href={`/profile/${comment.userId}`}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0,
                    }}>
                      {(comment.user?.vtuberProfile?.displayName || comment.user?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div style={{ flex: 1 }}>
                    <Link href={`/profile/${comment.userId}`} style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {comment.user?.vtuberProfile?.displayName || comment.user?.username}
                      {(comment.user?.role === 'VTUBER' || comment.user?.vtuberProfile?.isApproved) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="VTuber Oficial">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      )}
                    </Link>
                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem', lineHeight: 1.4 }}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentUserId && (
            <form onSubmit={handleComment} style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                placeholder="Escribe un comentario..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                maxLength={500}
              />
              <button type="submit" className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }} disabled={!commentText.trim()}>
                Enviar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <ClientOnly fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando feed...</div>}>
      <FeedContent />
    </ClientOnly>
  );
}
