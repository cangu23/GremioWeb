'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import type { PostCardData, CommentData } from '../../../../shared/types';

interface PostCardProps {
  post: PostCardData;
  onLike: (id: string, isLiked: boolean) => void;
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

// ==========================================================================
// Helpers
// ==========================================================================
function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ==========================================================================
// PostCard Component
// ==========================================================================
export default function PostCard({ post, onLike, currentUserId, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
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
        method: 'PUT', body: JSON.stringify({ content: editContent.trim() }),
      });
      post.content = updated.content;
      setEditing(false);
      setMenuOpen(false);
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/posts/${post.id}`, { method: 'DELETE' });
      setShowDeleteConfirm(false);
      onDelete?.(post.id);
    } catch { setDeleting(false); }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await apiFetch(`/posts/${post.id}/comments`, {});
      setComments(data);
    } catch {} finally { setLoadingComments(false); }
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const newComment = await apiFetch(`/posts/${post.id}/comments`, {
        method: 'POST', body: JSON.stringify({ content: commentText.trim() }),
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      post._count.comments++;
    } catch {}
  };

  // Close lightbox / delete confirm on ESC
  useEffect(() => {
    if (!lightboxImage && !showDeleteConfirm) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightboxImage(null); setShowDeleteConfirm(false); }
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
      {/* ===== LIGHTBOX ===== */}
      {lightboxImage && (
        <div onClick={() => setLightboxImage(null)} style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out', animation: 'fadeIn 0.2s ease-out',
        }}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }} style={{
            position: 'absolute', top: '20px', right: '20px',
            width: '44px', height: '44px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            background: 'rgba(0,0,0,0.5)', color: 'white',
            fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', zIndex: 1,
          }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.6)'; e.currentTarget.style.borderColor = '#8B5CF6'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            aria-label="Cerrar">✕</button>
          <img src={lightboxImage} alt="" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)', objectFit: 'contain',
            userSelect: 'none', animation: 'lightboxZoomIn 0.3s ease-out',
          }} />
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

      {/* ===== DELETE CONFIRMATION ===== */}
      {showDeleteConfirm && (
        <div onClick={() => { if (!deleting) setShowDeleteConfirm(false); }} style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'lightboxZoomIn 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,77,106,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Eliminar publicación</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>¿Estás seguro? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} style={{
                padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #ff4d6a, #ff1a4f)',
                color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              }}>{deleting ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== POST HEADER ===== */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Link href={`/profile/${post.user.id}`}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: post.user.vtuberProfile?.avatarUrl
                ? `url(${post.user.vtuberProfile.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '1rem',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {!post.user.vtuberProfile?.avatarUrl && (post.user.vtuberProfile?.displayName || post.user.username).charAt(0).toUpperCase()}
            </div>
          </Link>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link href={`/profile/${post.user.id}`} style={{
              color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
              {post.user.vtuberProfile?.displayName || post.user.username}
              {(post.user.role === 'VTUBER' || post.user.vtuberProfile?.isApproved) && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="VTuber Oficial">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
            </Link>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              @{post.user.username} · {timeAgo(post.createdAt)}
            </div>
          </div>
          {post.isPinned && <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>📌 Fijado</span>}
          {isOwner && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{
                width: '30px', height: '30px', borderRadius: '50%',
                border: 'none', background: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', transition: 'all 0.2s', flexShrink: 0,
              }}
                onMouseOver={e => { if (!menuOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseOut={e => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
                aria-label="Opciones">⋮</button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                  minWidth: '140px', zIndex: 100,
                  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '4px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  animation: 'fadeInUp 0.12s ease-out',
                }}>
                  <button onClick={() => { setEditContent(post.content); setEditing(true); setMenuOpen(false); }} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 12px', border: 'none', background: 'none',
                    color: 'var(--text)', cursor: 'pointer', fontSize: '0.82rem',
                    borderRadius: '6px', transition: 'background 0.15s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                  </button>
                  <button onClick={() => { setShowDeleteConfirm(true); setMenuOpen(false); }} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 12px', border: 'none', background: 'none',
                    color: '#ff4d6a', cursor: 'pointer', fontSize: '0.82rem',
                    borderRadius: '6px', transition: 'background 0.15s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,77,106,0.1)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== POST CONTENT ===== */}
        {editing ? (
          <div style={{ marginBottom: '8px' }}>
            <textarea className="input" style={{ width: '100%', minHeight: '70px', fontSize: '0.9rem', lineHeight: 1.5, resize: 'vertical', marginBottom: '8px' }}
              value={editContent} onChange={e => setEditContent(e.target.value)} maxLength={2000} autoFocus />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{editContent.length}/2000</span>
              <button onClick={() => { setEditing(false); setEditContent(post.content); }} style={{
                padding: '5px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: '0.82rem',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Cancelar</button>
              <button onClick={handleEdit} disabled={saving || !editContent.trim()} className="btn" style={{ padding: '5px 14px', fontSize: '0.82rem' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '8px' }}>
            {post.content.split(/(#\w+)/g).map((part, i) => {
              if (part.startsWith('#')) return <Link key={i} href={`/feed?tag=${part.slice(1)}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>{part}</Link>;
              if (part.startsWith('@')) return <Link key={i} href={`/vtubers?q=${encodeURIComponent(part.slice(1))}`} style={{ color: 'var(--secondary)', fontWeight: 500 }}>{part}</Link>;
              return part;
            })}
          </p>
        )}

        {/* ===== MEDIA ===== */}
        {post.mediaUrl && (
          <div
            style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', cursor: 'zoom-in', position: 'relative' }}
            onClick={() => setLightboxImage(post.mediaUrl!)}
            onMouseOver={e => {
              const overlay = e.currentTarget.querySelector('.media-overlay') as HTMLElement | null;
              const img = e.currentTarget.querySelector('img');
              if (img) img.style.transform = 'scale(1.02)';
              if (overlay) overlay.style.opacity = '1';
            }}
            onMouseOut={e => {
              const overlay = e.currentTarget.querySelector('.media-overlay') as HTMLElement | null;
              const img = e.currentTarget.querySelector('img');
              if (img) img.style.transform = 'scale(1)';
              if (overlay) overlay.style.opacity = '0';
            }}
          >
            <img src={post.mediaUrl} alt="" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', transition: 'transform 0.3s ease', display: 'block' }} />
            <div className="media-overlay" style={{
              position: 'absolute', inset: 0, borderRadius: '10px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)',
              opacity: 0, transition: 'opacity 0.3s',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px',
              pointerEvents: 'none',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </div>
          </div>
        )}

        {/* ===== HASHTAGS ===== */}
        {post.hashtags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {post.hashtags.map(tag => (
              <Link key={tag} href={`/feed?tag=${tag}`} style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>#{tag}</Link>
            ))}
          </div>
        )}

        {/* ===== LIKE / COMMENT COUNTS ===== */}
        <div style={{ display: 'flex', gap: '16px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{post._count.likes} {post._count.likes === 1 ? 'like' : 'likes'}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{post._count.comments} {post._count.comments === 1 ? 'comentario' : 'comentarios'}</span>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => onLike(post.id, post.isLikedByMe)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1,
            background: post.isLikedByMe ? 'rgba(139,92,246,0.08)' : 'none', border: 'none',
            cursor: 'pointer', color: post.isLikedByMe ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.82rem', padding: '6px 8px', borderRadius: '6px',
            transition: 'all 0.2s', fontWeight: post.isLikedByMe ? 600 : 400,
          }}
            onMouseOver={e => { if (!post.isLikedByMe) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { if (!post.isLikedByMe) e.currentTarget.style.background = 'none'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.isLikedByMe ? '#8B5CF6' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            Like
          </button>
          <button onClick={toggleComments} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1,
            background: 'none', border: 'none', cursor: 'pointer',
            color: showComments ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.82rem', padding: '6px 8px', borderRadius: '6px',
            transition: 'all 0.2s',
          }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Comentar
          </button>
        </div>
      </div>

      {/* ===== COMMENTS SECTION ===== */}
      {showComments && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', background: 'rgba(0,0,0,0.15)' }}>
          {loadingComments ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', marginBottom: '10px' }}>Sin comentarios. ¡Sé el primero!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/profile/${comment.userId}`}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0 }}>
                      {(comment.user?.vtuberProfile?.displayName || comment.user?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div style={{ flex: 1 }}>
                    <Link href={`/profile/${comment.userId}`} style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)', textDecoration: 'none' }}>
                      {comment.user?.vtuberProfile?.displayName || comment.user?.username}
                    </Link>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', lineHeight: 1.4 }}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUserId && (
            <form onSubmit={handleComment} style={{ display: 'flex', gap: '8px' }}>
              <input className="input" style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem' }} placeholder="Escribe un comentario..." value={commentText} onChange={e => setCommentText(e.target.value)} maxLength={500} />
              <button type="submit" className="btn" style={{ padding: '7px 14px', fontSize: '0.82rem' }} disabled={!commentText.trim()}>Enviar</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
