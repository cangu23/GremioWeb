'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import { useToast } from '@/lib/ToastContext';
import ModerateModal from './ModerateModal';
import ReportModal from './ReportModal';
import MentionInput, { renderContentWithMentions } from './MentionInput';
import StickerPicker from '@/components/ui/StickerPicker';
import type { PostCardData, CommentData } from '../../../../shared/types';

interface PostCardProps {
  post: PostCardData;
  onLike: (id: string, isLiked: boolean) => void;
  currentUserId?: string;
  currentUserRole?: string;
  onDelete?: (id: string) => void;
  highlight?: boolean;
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
export default function PostCard({ post, onLike, currentUserId, currentUserRole, onDelete, highlight }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentMentionIds, setCommentMentionIds] = useState<string[]>([]);
  const [showCommentStickerPicker, setShowCommentStickerPicker] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<'post' | 'comment'>('post');
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    type: 'post' | 'comment';
    commentId?: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Quick moderation open helper
  const openModerateModal = (targetType: 'post' | 'comment', commentId?: string) => {
    setDeleteCommentId(targetType === 'comment' ? (commentId || null) : null);
    setShowDeleteConfirm(true);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    // Delay adding listener to avoid the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleEsc);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu]);

  const isOwner = currentUserId === post.userId;
  const isStaff = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR';

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

  const openReportModal = (target: 'post' | 'comment', commentId?: string) => {
    setReportTarget(target);
    setReportCommentId(commentId || null);
    setShowReportModal(true);
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
        method: 'POST',
        body: JSON.stringify({
          content: commentText.trim(),
          mentions: commentMentionIds.length > 0 ? commentMentionIds : undefined,
        }),
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setCommentMentionIds([]);
      post._count.comments++;
    } catch {}
  };

  // Close lightbox on ESC
  useEffect(() => {
    if (!lightboxImage) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxImage]);

  return (
    <div id={`post-${post.id}`} className="glass" style={{
      overflow: 'hidden',
      transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
      boxShadow: highlight ? '0 0 0 2px var(--primary), 0 0 20px rgba(108,99,255,0.3)' : undefined,
      borderColor: highlight ? 'var(--primary)' : undefined,
      position: 'relative',
      cursor: isStaff && !isOwner ? (contextMenu ? 'default' : undefined) : undefined,
    }}
      // Ctrl+Click → direct moderation for staff
      onClick={(e) => {
        if ((e.ctrlKey || e.metaKey) && isStaff && !isOwner) {
          e.preventDefault();
          e.stopPropagation();
          openModerateModal('post');
        }
      }}
      // Right-click → custom context menu for staff
      onContextMenu={(e) => {
        if (isStaff && !isOwner) {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, type: 'post' });
        }
      }}
    >

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

      {/* ===== CUSTOM CONTEXT MENU ===== */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 10002,
            minWidth: '180px',
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
            animation: 'fadeInUp 0.1s ease-out',
          }}
        >
          <div style={{
            padding: '6px 12px 4px',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}>
            Moderación rápida
          </div>            <button
            onClick={() => {
              openModerateModal(contextMenu.type === 'comment' ? 'comment' : 'post', contextMenu.commentId);
              setContextMenu(null);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '8px 12px', border: 'none', background: 'none',
              color: '#ff4d6a', cursor: 'pointer', fontSize: '0.82rem',
              borderRadius: '6px', transition: 'background 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,77,106,0.1)')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            {contextMenu.type === 'post' ? 'Eliminar publicación' : 'Eliminar comentario'}
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Ctrl+Click
            </span>
          </button>

          {!isOwner && currentUserId && (
            <button
              onClick={() => {
                openReportModal(
                  contextMenu.type,
                  contextMenu.commentId
                );
                setContextMenu(null);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '8px 12px', border: 'none', background: 'none',
                color: '#ff9800', cursor: 'pointer', fontSize: '0.82rem',
                borderRadius: '6px', transition: 'background 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,152,0,0.1)')}
              onMouseOut={e => (e.currentTarget.style.background = 'none')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              Reportar {contextMenu.type === 'post' ? 'publicación' : 'comentario'}
            </button>
          )}
        </div>
      )}

      {/* ===== WIDGETS (portal-based) ===== */}
      {/* Report Modal Widget */}
      <ReportModal
        isOpen={showReportModal}
        targetType={reportTarget}
        postId={post.id}
        commentId={reportCommentId || undefined}
        onClose={() => { setShowReportModal(false); setReportCommentId(null); }}
      />

      {/* Moderate/Delete Confirmation Widget */}
      <ModerateModal
        isOpen={showDeleteConfirm}
        targetType={deleteCommentId ? 'comment' : 'post'}
        postId={post.id}
        targetId={deleteCommentId || post.id}
        contentPreview={deleteCommentId
          ? comments.find(c => c.id === deleteCommentId)?.content || ''
          : post.content
        }
        authorName={deleteCommentId
          ? comments.find(c => c.id === deleteCommentId)?.user?.username || ''
          : post.user?.username || ''
        }
        authorAvatarUrl={deleteCommentId
          ? comments.find(c => c.id === deleteCommentId)?.user?.vtuberProfile?.avatarUrl || undefined
          : post.user?.vtuberProfile?.avatarUrl || undefined
        }
        authorId={deleteCommentId
          ? comments.find(c => c.id === deleteCommentId)?.userId || ''
          : post.userId
        }
        isStaff={isStaff}
        isOwner={isOwner}
        onClose={() => { setShowDeleteConfirm(false); setDeleteCommentId(null); setModerationNote(''); }}
        onDeleted={() => { onDelete?.(post.id); }}
      />

      {/* ===== POST HEADER ===== */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <UserAvatar
            src={post.user.vtuberProfile?.avatarUrl}
            alt={post.user.displayName || post.user.vtuberProfile?.displayName || post.user.username}
            userId={post.user.id}
            isVerified={post.user.vtuberProfile?.isVerified || post.user.vtuberProfile?.isApproved}
            size={40}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link href={`/profile/${post.user.id}`} style={{
              color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
              {post.user.displayName || post.user.vtuberProfile?.displayName || post.user.username}
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
                minWidth: '160px', zIndex: 100,
                background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '4px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'fadeInUp 0.12s ease-out',
              }}>
                {isOwner && (
                  <>
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
                  </>
                )}
                {!isOwner && isStaff && (
                  <>
                    <div style={{ padding: '4px 12px', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moderar</div>
                    <button onClick={() => { setShowDeleteConfirm(true); setMenuOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '8px 12px', border: 'none', background: 'none',
                      color: '#ff4d6a', cursor: 'pointer', fontSize: '0.82rem',
                      borderRadius: '6px', transition: 'background 0.15s',
                    }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,77,106,0.1)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Eliminar publicación
                    </button>
                  </>
                )}
                {!isOwner && currentUserId && (
                  <button onClick={() => { openReportModal('post'); setMenuOpen(false); }} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 12px', border: 'none', background: 'none',
                    color: '#ff9800', cursor: 'pointer', fontSize: '0.82rem',
                    borderRadius: '6px', transition: 'background 0.15s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,152,0,0.1)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                    Reportar
                  </button>
                )}
              </div>
            )}
          </div>
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
        ) : (            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '8px' }}>
            {renderContentWithMentions(post.content)}
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
                <div key={comment.id} style={{
                  display: 'flex', gap: '8px', position: 'relative', paddingRight: '20px',
                  // Visual feedback for staff on hover when not owner
                  ...(isStaff && currentUserId && comment.userId !== currentUserId ? {
                    borderRadius: '6px',
                    transition: 'background 0.15s',
                    cursor: contextMenu ? 'default' : undefined,
                  } : {}),
                }}
                  // Ctrl+Click → direct moderation for staff
                  onClick={(e) => {
                    if ((e.ctrlKey || e.metaKey) && isStaff && currentUserId && comment.userId !== currentUserId) {
                      e.preventDefault();
                      e.stopPropagation();
                      openModerateModal('comment', comment.id);
                    }
                  }}
                  // Right-click → custom context menu for staff
                  onContextMenu={(e) => {
                    if (isStaff && currentUserId && comment.userId !== currentUserId) {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, type: 'comment', commentId: comment.id });
                    }
                  }}
                  onMouseOver={e => {
                    if (isStaff && currentUserId && comment.userId !== currentUserId) {
                      e.currentTarget.style.background = 'rgba(255,77,106,0.04)';
                    }
                  }}
                  onMouseOut={e => {
                    if (isStaff && currentUserId && comment.userId !== currentUserId) {
                      e.currentTarget.style.background = 'none';
                    }
                  }}
                >
                  <Link href={`/profile/${comment.userId}`}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: comment.user?.vtuberProfile?.avatarUrl
                        ? `url(${comment.user.vtuberProfile.avatarUrl}) center/cover`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.7rem', fontWeight: 'bold',
                      overflow: 'hidden',
                    }}>
                      {!comment.user?.vtuberProfile?.avatarUrl && (comment.user?.vtuberProfile?.displayName || comment.user?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Link href={`/profile/${comment.userId}`} style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)', textDecoration: 'none' }}>
                        {comment.user?.vtuberProfile?.displayName || comment.user?.username}
                      </Link>
                      {/* Staff moderate button for comments */}
                      {isStaff && currentUserId && comment.userId !== currentUserId && (
                        <button
                          onClick={() => { setDeleteCommentId(comment.id); setShowDeleteConfirm(true); }}
                          title="Eliminar comentario (moderación)"
                          style={{
                            marginLeft: 'auto',
                            width: '24px', height: '24px', flexShrink: 0,
                            border: 'none', background: 'rgba(255,77,106,0.08)',
                            cursor: 'pointer',
                            color: '#ff4d6a', opacity: 0.5,
                            borderRadius: '6px',
                            transition: 'all 0.15s',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0,
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.background = 'rgba(255,77,106,0.2)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.opacity = '0.5';
                            e.currentTarget.style.background = 'rgba(255,77,106,0.08)';
                            e.currentTarget.style.transform = 'none';
                          }}
                          aria-label="Moderar comentario"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </button>
                      )}
                      {/* Report button for non-staff users */}
                      {!isStaff && currentUserId && comment.userId !== currentUserId && (
                        <button
                          onClick={() => openReportModal('comment', comment.id)}
                          title="Reportar comentario"
                          style={{
                            marginLeft: 'auto',
                            width: '18px', height: '18px', flexShrink: 0,
                            border: 'none', background: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', opacity: 0.3,
                            transition: 'opacity 0.15s',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0,
                          }}
                          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                          onMouseOut={e => (e.currentTarget.style.opacity = '0.3')}
                          aria-label="Reportar comentario"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', lineHeight: 1.4 }}>{renderContentWithMentions(comment.content)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUserId && (
            <form onSubmit={handleComment} style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: 1 }}>
                <MentionInput
                  value={commentText}
                  onChange={setCommentText}
                  onMentionsChange={setCommentMentionIds}
                  placeholder="Escribe un comentario..."
                  maxLength={500}
                  minHeight="auto"
                  style={{ padding: '7px 10px', fontSize: '0.82rem', minHeight: '34px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowCommentStickerPicker(!showCommentStickerPicker)}
                    title="Añadir sticker"
                    style={{
                      width: '34px', height: '34px', flexShrink: 0,
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      background: showCommentStickerPicker ? 'rgba(138,43,226,0.1)' : 'rgba(255,255,255,0.04)',
                      color: showCommentStickerPicker ? 'var(--primary)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.08)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseOut={e => { if (!showCommentStickerPicker) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </button>
                  {showCommentStickerPicker && (
                    <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '8px', zIndex: 100 }}>
                      <StickerPicker
                        onSelect={(sticker) => {
                          setCommentText(prev => prev + ` :${sticker.name}: `);
                          setShowCommentStickerPicker(false);
                        }}
                        onClose={() => setShowCommentStickerPicker(false)}
                      />
                    </div>
                  )}
                </div>
                <button type="submit" className="btn" style={{ padding: '7px 14px', fontSize: '0.82rem', height: '34px' }} disabled={!commentText.trim()}>Enviar</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
