'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import { useToast } from '@/lib/ToastContext';
import dynamic from 'next/dynamic';
import MentionInput, { renderContentWithMentions } from './MentionInput';
import { useStickersCache } from '@/lib/content-renderer';
import RoleBadge from '@/components/ui/RoleBadge';
import { getPrimaryRole, isStaffRole, hasAnyRole, getEffectivePlan, planMeetsOrExceeds } from '@gremio-estelar/shared';
import type { PostCardData, CommentData } from '../../../../shared/types';

// Lazy-loaded modals to shrink initial bundle & boost rendering speed
const ModerateModal = dynamic(() => import('./ModerateModal'), { ssr: false });
const ReportModal = dynamic(() => import('./ReportModal'), { ssr: false });
const SendStardustModal = dynamic(() => import('@/components/ui/SendStardustModal'), { ssr: false });
const MediaLightbox = dynamic(() => import('./MediaLightbox'), { ssr: false });
const StickerPicker = dynamic(() => import('@/components/ui/StickerPicker'), { ssr: false });

interface PostCardProps {
  post: PostCardData;
  onLike: (id: string, isLiked: boolean) => void;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserPlan?: string;
  onDelete?: (id: string) => void;
  highlight?: boolean;
}

// Emojis de reacción animada (NOVA+) — deben coincidir con el backend
const REACTION_EMOJIS = ['💖', '🔥', '😂', '😮', '😢', '👏'];

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

function extractEquippedFrame(user: any): { frameUrl?: string | null; equippedFrame?: string | null } {
  if (!user) return {};
  if (user.equippedFrameUrl || user.frameUrl) return { frameUrl: user.equippedFrameUrl || user.frameUrl };
  if (user.equippedFrame) return { equippedFrame: user.equippedFrame };

  const purchases = user.purchases;
  if (Array.isArray(purchases)) {
    const frameItem = purchases.find((p: any) =>
      p.equipped && p.item && (
        p.item.type === 'AVATAR_FRAME' ||
        p.item.type === 'FRAME' ||
        p.item.type === 'DECORATION' ||
        p.item.type === 'HOVER' ||
        p.item.type === 'EFFECT' ||
        p.item.type === 'COLOR'
      )
    )?.item;

    if (frameItem) {
      if (frameItem.imageUrl) return { frameUrl: frameItem.imageUrl };
      if (frameItem.data) {
        try {
          const parsed = typeof frameItem.data === 'string' ? JSON.parse(frameItem.data) : frameItem.data;
          if (parsed?.frameUrl || parsed?.imageUrl) return { frameUrl: parsed.frameUrl || parsed.imageUrl };
          if (parsed?.gradient || parsed?.borderColor || parsed?.color || parsed?.style) {
            return { equippedFrame: parsed.gradient || parsed.borderColor || parsed.color || parsed.style };
          }
        } catch {
          return { equippedFrame: frameItem.data };
        }
      }
      return { equippedFrame: 'linear-gradient(135deg, #ff007f, #7928ca, #00dfd8)' };
    }
  }
  return {};
}

// ==========================================================================
// PostCard Component
// ==========================================================================
export default function PostCard({ post, onLike, currentUserId, currentUserRole, currentUserPlan, onDelete, highlight }: PostCardProps) {
  useStickersCache();
  const [showComments, setShowComments] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentMentionIds, setCommentMentionIds] = useState<string[]>([]);
  const [showCommentStickerPicker, setShowCommentStickerPicker] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSendStardustModal, setShowSendStardustModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<'post' | 'comment'>('post');
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    type: 'post' | 'comment';
    commentId?: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Like & Dislike states + animation triggers
  const [isDislikedByMe, setIsDislikedByMe] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dislikeAnimating, setDislikeAnimating] = useState(false);
  const [animatingCommentId, setAnimatingCommentId] = useState<string | null>(null);

  // Animated reactions (NOVA+)
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);
  const canReact = planMeetsOrExceeds(currentUserPlan, currentUserRole, 'NOVA');

  // Cargar reacciones al montar (read-only para usuarios sin plan)
  useEffect(() => {
    apiFetch(`/posts/${post.id}/reactions`, {}).then((data: any) => {
      if (data?.reactions) {
        const map: Record<string, number> = {};
        data.reactions.forEach((r: any) => { map[r.emoji] = r.count; });
        setReactions(map);
      }
      if (Array.isArray(data?.myReactions)) setMyReactions(data.myReactions);
    }).catch(() => {});
  }, [post.id]);

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;
    if (!canReact) return;
    setAnimatingReaction(emoji);
    setTimeout(() => setAnimatingReaction(null), 600);

    const wasActive = myReactions.includes(emoji);
    // Optimistic update
    setReactions(prev => {
      const count = (prev[emoji] || 0) + (wasActive ? -1 : 1);
      const next = { ...prev };
      if (count <= 0) delete next[emoji];
      else next[emoji] = count;
      return next;
    });
    setMyReactions(prev => wasActive ? prev.filter(e => e !== emoji) : [...prev, emoji]);
    setShowReactionPicker(false);

    try {
      const res = await apiFetch(`/posts/${post.id}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      if (res?.active === false) {
        // El backend lo quitó (toggle) — sincronizar
        setReactions(prev => {
          const next = { ...prev };
          next[emoji] = Math.max(0, (next[emoji] || 0) - 1);
          if (next[emoji] <= 0) delete next[emoji];
          return next;
        });
        setMyReactions(prev => prev.filter(e => e !== emoji));
      }
    } catch {
      // Revertir optimismo
      setReactions(prev => {
        const count = (prev[emoji] || 0) + (wasActive ? 1 : -1);
        const next = { ...prev };
        if (count <= 0) delete next[emoji];
        else next[emoji] = count;
        return next;
      });
      setMyReactions(prev => wasActive ? [...prev, emoji] : prev.filter(e => e !== emoji));
    }
  };

  const handleLikeClick = () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 500);

    if (isDislikedByMe) {
      setIsDislikedByMe(false);
      setDislikeCount(prev => Math.max(0, prev - 1));
    }

    onLike(post.id, post.isLikedByMe);
  };

  const handleDislikeClick = () => {
    setDislikeAnimating(true);
    setTimeout(() => setDislikeAnimating(false), 500);

    const newDisliked = !isDislikedByMe;
    setIsDislikedByMe(newDisliked);
    setDislikeCount(prev => Math.max(0, prev + (newDisliked ? 1 : -1)));

    if (newDisliked && post.isLikedByMe) {
      onLike(post.id, true);
    }
  };

  // Quick moderation open helper
  const openModerateModal = (targetType: 'post' | 'comment', commentId?: string) => {
    setDeleteCommentId(targetType === 'comment' ? (commentId || null) : null);
    setShowDeleteConfirm(true);
  };

  // Close main post menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Close comment 3-dots menu on outside click
  useEffect(() => {
    if (!openCommentMenuId) return;
    const handleClickOutside = () => setOpenCommentMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openCommentMenuId]);

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
  const isStaff = isStaffRole(currentUserRole);

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

  const handleCommentLike = async (commentId: string, currentLiked?: boolean) => {
    if (!currentUserId) return;
    setAnimatingCommentId(commentId);
    setTimeout(() => setAnimatingCommentId(null), 500);

    const nextLiked = !currentLiked;
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const currentCount = c._count?.likes || 0;
      return {
        ...c,
        isLikedByMe: nextLiked,
        _count: { likes: Math.max(0, currentCount + (nextLiked ? 1 : -1)) },
      };
    }));

    try {
      await apiFetch(`/posts/comments/${commentId}/${currentLiked ? 'unlike' : 'like'}`, { method: 'POST' });
    } catch {
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        const currentCount = c._count?.likes || 0;
        return {
          ...c,
          isLikedByMe: !!currentLiked,
          _count: { likes: Math.max(0, currentCount + (currentLiked ? 1 : -1)) },
        };
      }));
    }
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
          ? (comments.find(c => c.id === deleteCommentId)?.user?.avatarUrl || comments.find(c => c.id === deleteCommentId)?.user?.vtuberProfile?.avatarUrl || undefined)
          : (post.user?.avatarUrl || post.user?.vtuberProfile?.avatarUrl || undefined)
        }
        authorId={deleteCommentId
          ? comments.find(c => c.id === deleteCommentId)?.userId || ''
          : post.userId
        }
        isStaff={isStaff}
        isOwner={isOwner}
        onClose={() => { setShowDeleteConfirm(false); setDeleteCommentId(null); setModerationNote(''); }}
        onDeleted={() => {
          if (deleteCommentId) {
            setComments(prev => prev.filter(c => c.id !== deleteCommentId));
            post._count.comments = Math.max(0, post._count.comments - 1);
            setDeleteCommentId(null);
          } else {
            onDelete?.(post.id);
          }
        }}
      />

      {/* ===== POST HEADER ===== */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          {(() => {
            const { frameUrl, equippedFrame } = extractEquippedFrame(post.user);
            const isUserVerified = !!(post.user.vtuberProfile?.isVerified || (post.user as any).isVerified);
            return (
              <UserAvatar
                src={post.user.avatarUrl || (post.user.role === 'VTUBER' ? post.user.vtuberProfile?.avatarUrl : null)}
                alt={post.user.displayName || (post.user.role === 'VTUBER' ? post.user.vtuberProfile?.displayName : null) || post.user.username}
                userId={post.user.id}
                isVerified={isUserVerified}
                frameUrl={frameUrl}
                equippedFrame={equippedFrame}
                size={40}
              />
            );
          })()}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {(() => {
                const isVerified = !!(post.user.vtuberProfile?.isVerified || (post.user as any).isVerified);
                const displayRole = getPrimaryRole(post.user.role, (post.user as any).displayedRole);
                return (
                  <>
                    <Link href={`/profile/${post.user.id}`} style={{
                      color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span>{post.user.displayName || (post.user.role === 'VTUBER' ? post.user.vtuberProfile?.displayName : null) || post.user.username}</span>
                      {isVerified && (
                        <svg width="15" height="15" viewBox="0 0 24 24" aria-label="Verificado" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(29, 155, 240, 0.6))' }}>
                          <circle cx="12" cy="12" r="10" fill="#1d9bf0"/>
                          <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </Link>
                    {displayRole !== 'USER' && (
                      <RoleBadge
                        role={displayRole}
                        size="sm"
                      />
                    )}
                  </>
                );
              })()}
            </div>
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
        ) : (
          post.content && post.content !== '(imagen)' && post.content !== '[imagen]' && post.content.trim() !== '' && (
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '8px' }}>
              {renderContentWithMentions(post.content)}
            </p>
          )
        )}

        {/* ===== MEDIA ===== */}
        {post.mediaUrl && (
          (post.mediaUrl.includes('/stickers/') || post.mediaUrl.includes('sticker')) ? (
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'flex-start' }}>
              <img
                src={post.mediaUrl}
                alt="Sticker"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'contain',
                  display: 'block',
                  cursor: 'pointer',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                }}
                onClick={() => setLightboxImage(post.mediaUrl!)}
              />
            </div>
          ) : (
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '10px',
                cursor: 'zoom-in',
                position: 'relative',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
              onClick={() => setLightboxImage(post.mediaUrl!)}
              onMouseOver={e => {
                const overlay = e.currentTarget.querySelector('.media-overlay') as HTMLElement | null;
                if (overlay) overlay.style.opacity = '1';
              }}
              onMouseOut={e => {
                const overlay = e.currentTarget.querySelector('.media-overlay') as HTMLElement | null;
                if (overlay) overlay.style.opacity = '0';
              }}
            >
              <img
                src={post.mediaUrl}
                alt=""
                style={{
                  width: '100%',
                  maxHeight: '650px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              <div className="media-overlay" style={{
                position: 'absolute', inset: 0, borderRadius: '12px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)',
                opacity: 0, transition: 'opacity 0.25s ease',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                padding: '12px', pointerEvents: 'none',
              }}>
                <span style={{
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                  color: '#fff', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                  Ver completa / Zoom
                </span>
              </div>
            </div>
          )
        )}

        {/* ===== HASHTAGS ===== */}
        {post.hashtags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {post.hashtags.map(tag => (
              <Link key={tag} href={`/feed?tag=${tag}`} style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>#{tag}</Link>
            ))}
          </div>
        )}

        {/* ===== LIKE / DISLIKE / COMMENT COUNTS ===== */}
        <div style={{ display: 'flex', gap: '16px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{post._count.likes} {post._count.likes === 1 ? 'me gusta' : 'me gusta'}</span>
          {dislikeCount > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{dislikeCount} {dislikeCount === 1 ? 'no me gusta' : 'no me gusta'}</span>
          )}
          {Object.keys(reactions).length > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {Object.entries(reactions).map(([emoji, count]) => (
                <span key={emoji} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: myReactions.includes(emoji) ? 'rgba(138,43,226,0.15)' : 'rgba(255,255,255,0.04)', padding: '1px 7px', borderRadius: '12px', border: myReactions.includes(emoji) ? '1px solid rgba(138,43,226,0.3)' : '1px solid transparent', cursor: canReact && currentUserId ? 'pointer' : 'default' }}
                  title={`${emoji} — ${count} ${count === 1 ? 'reacción' : 'reacciones'}`}
                  onClick={(e) => { e.stopPropagation(); if (canReact && currentUserId) handleReaction(emoji); }}
                >
                  <span style={{ fontSize: '0.85rem', display: 'inline-block', animation: animatingReaction === emoji ? 'reactionPop 0.5s cubic-bezier(0.17, 0.89, 0.32, 1.49)' : 'none' }}>{emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{count}</span>
                </span>
              ))}
            </span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{post._count.comments} {post._count.comments === 1 ? 'comentario' : 'comentarios'}</span>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* LIKE BUTTON */}
          <button
            type="button"
            onClick={handleLikeClick}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1,
              background: post.isLikedByMe ? 'rgba(139,92,246,0.12)' : 'transparent',
              border: post.isLikedByMe ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
              cursor: 'pointer', color: post.isLikedByMe ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.84rem', padding: '7px 10px', borderRadius: '10px',
              transition: 'all 0.2s ease', fontWeight: post.isLikedByMe ? 600 : 500,
            }}
            onMouseOver={e => { if (!post.isLikedByMe) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseOut={e => { if (!post.isLikedByMe) e.currentTarget.style.background = 'transparent'; }}
          >
            <svg
              width="17" height="17" viewBox="0 0 24 24"
              fill={post.isLikedByMe ? 'var(--primary)' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{
                animation: likeAnimating ? 'postHeartPop 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.49)' : 'none',
                filter: post.isLikedByMe ? 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' : 'none',
              }}
            >
              <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>
            </svg>
            <span>Me gusta</span>
          </button>

          {/* DISLIKE BUTTON */}
          <button
            type="button"
            onClick={handleDislikeClick}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1,
              background: isDislikedByMe ? 'rgba(255,77,106,0.12)' : 'transparent',
              border: isDislikedByMe ? '1px solid rgba(255,77,106,0.3)' : '1px solid transparent',
              cursor: 'pointer', color: isDislikedByMe ? '#ff4d6a' : 'var(--text-muted)',
              fontSize: '0.84rem', padding: '7px 10px', borderRadius: '10px',
              transition: 'all 0.2s ease', fontWeight: isDislikedByMe ? 600 : 500,
            }}
            onMouseOver={e => { if (!isDislikedByMe) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseOut={e => { if (!isDislikedByMe) e.currentTarget.style.background = 'transparent'; }}
          >
            <svg
              width="17" height="17" viewBox="0 0 24 24"
              fill={isDislikedByMe ? '#ff4d6a' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{
                animation: dislikeAnimating ? 'postHeartPop 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.49)' : 'none',
                filter: isDislikedByMe ? 'drop-shadow(0 0 6px rgba(255,77,106,0.5))' : 'none',
              }}
            >
              <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3"/>
            </svg>
            <span>No me gusta</span>
          </button>

          {/* COMMENT BUTTON */}
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

          {/* REACTION BUTTON (NOVA+) */}
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <button
              type="button"
              onClick={() => {
                if (!currentUserId) return;
                if (!canReact) return;
                setShowReactionPicker(!showReactionPicker);
              }}
              title={canReact ? 'Reaccionar' : 'Las reacciones animadas son exclusivas de Nova Pro y Stellar Elite'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1,
                background: showReactionPicker ? 'rgba(138,43,226,0.12)' : 'rgba(138,43,226,0.06)',
                border: showReactionPicker ? '1px solid rgba(138,43,226,0.3)' : '1px solid rgba(138,43,226,0.15)',
                cursor: canReact ? 'pointer' : 'not-allowed',
                color: 'var(--primary)', fontSize: '0.82rem', padding: '7px 10px', borderRadius: '10px',
                transition: 'all 0.2s ease', fontWeight: 600, opacity: canReact ? 1 : 0.55,
              }}
              onMouseOver={e => { if (canReact) e.currentTarget.style.background = 'rgba(138,43,226,0.18)'; }}
              onMouseOut={e => { if (!showReactionPicker) e.currentTarget.style.background = 'rgba(138,43,226,0.06)'; }}
            >
              <span style={{ fontSize: '0.95rem', display: 'inline-block', animation: animatingReaction ? 'reactionPop 0.5s cubic-bezier(0.17, 0.89, 0.32, 1.49)' : 'none' }}>😍</span>
              <span>Reaccionar</span>
            </button>
            {showReactionPicker && (
              <div
                style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px',
                  zIndex: 50,
                  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px', padding: '8px 10px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  display: 'flex', gap: '4px',
                  animation: 'fadeInUp 0.15s ease-out',
                }}
                onMouseLeave={() => setShowReactionPicker(false)}
              >
                {REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReaction(emoji)}
                    style={{
                      width: '38px', height: '38px', fontSize: '1.35rem', border: 'none',
                      background: myReactions.includes(emoji) ? 'rgba(138,43,226,0.2)' : 'transparent',
                      borderRadius: '10px', cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GIFT STARDUST BUTTON */}
          {currentUserId && post.user && post.user.id !== currentUserId && (
            <button
              type="button"
              onClick={() => setShowSendStardustModal(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flex: 1,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                cursor: 'pointer', color: '#fbbf24',
                fontSize: '0.82rem', padding: '7px 10px', borderRadius: '10px',
                transition: 'all 0.2s ease', fontWeight: 600,
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.18)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.08)')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Regalar</span>
            </button>
          )}
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
                <div
                  key={comment.id}
                  style={{
                    display: 'flex', gap: '10px',
                    padding: '10px 12px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  {(() => {
                    const { frameUrl, equippedFrame } = extractEquippedFrame(comment.user);
                    return (
                      <UserAvatar
                        src={comment.user?.avatarUrl || (comment.user?.role === 'VTUBER' ? comment.user?.vtuberProfile?.avatarUrl : null)}
                        alt={comment.user?.displayName || (comment.user?.role === 'VTUBER' ? comment.user?.vtuberProfile?.displayName : null) || comment.user?.username || '?'}
                        userId={comment.userId}
                        isVerified={comment.user?.role === 'VTUBER' && (comment.user?.vtuberProfile?.isVerified || comment.user?.vtuberProfile?.isApproved)}
                        frameUrl={frameUrl}
                        equippedFrame={equippedFrame}
                        size={34}
                      />
                    );
                  })()}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Comment Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <Link href={`/profile/${comment.userId}`} style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {comment.user?.displayName || (comment.user?.role === 'VTUBER' ? comment.user?.vtuberProfile?.displayName : null) || comment.user?.username}
                        {(comment.user?.role === 'VTUBER' && (comment.user?.vtuberProfile?.isVerified || comment.user?.vtuberProfile?.isApproved)) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#1d9bf0" aria-label="Verificado">
                            <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
                            <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </Link>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        @{comment.user?.username}
                      </span>
                      
                      {/* OP / Author badge */}
                      {comment.userId === post.userId && (
                        <span style={{
                          padding: '1px 6px', borderRadius: '4px',
                          background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)',
                          color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 700,
                        }}>
                          Autor
                        </span>
                      )}

                      {/* Staff badge */}
                      {isStaffRole(comment.user?.role) && (
                        <span style={{
                          padding: '1px 6px', borderRadius: '4px',
                          background: 'rgba(255,77,106,0.15)', border: '1px solid rgba(255,77,106,0.3)',
                          color: '#ff4d6a', fontSize: '0.65rem', fontWeight: 700,
                        }}>
                          Staff
                        </span>
                      )}

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                        • {timeAgo(comment.createdAt)}
                      </span>

                      {/* 3-dots menu */}
                      {currentUserId && (
                        <div style={{ marginLeft: 'auto', position: 'relative' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id);
                            }}
                            title="Opciones"
                            style={{
                              width: '22px', height: '22px', borderRadius: '50%',
                              border: 'none', background: 'transparent',
                              color: 'var(--text-muted)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0,
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </button>

                          {openCommentMenuId === comment.id && (
                            <div style={{
                              position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                              background: '#181828', border: '1px solid var(--glass-border)',
                              borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                              padding: '4px', zIndex: 60, minWidth: '140px',
                            }}>
                              {(comment.userId === currentUserId || post.userId === currentUserId || isStaff) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCommentMenuId(null);
                                    openModerateModal('comment', comment.id);
                                  }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                    padding: '8px 10px', border: 'none', background: 'none',
                                    color: '#ff4d6a', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                    borderRadius: '6px', textAlign: 'left',
                                  }}
                                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,77,106,0.12)')}
                                  onMouseOut={e => (e.currentTarget.style.background = 'none')}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                  </svg>
                                  Eliminar
                                </button>
                              )}
                              {comment.userId !== currentUserId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCommentMenuId(null);
                                    openReportModal('comment', comment.id);
                                  }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                    padding: '8px 10px', border: 'none', background: 'none',
                                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                    borderRadius: '6px', textAlign: 'left',
                                  }}
                                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text)'; }}
                                  onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                                  </svg>
                                  Reportar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comment Content */}
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', lineHeight: 1.45, color: 'var(--text)' }}>
                      {renderContentWithMentions(comment.content)}
                    </p>

                    {/* Media attachment */}
                    {comment.mediaUrl && (
                      <div style={{ marginTop: '8px', maxWidth: '220px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <img src={comment.mediaUrl} alt="" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', display: 'block' }} />
                      </div>
                    )}

                    {/* Comment Action Footer (Like & Reply) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleCommentLike(comment.id, comment.isLikedByMe)}
                        style={{
                          border: 'none', background: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          color: comment.isLikedByMe ? '#ff4d6a' : 'var(--text-muted)',
                          fontSize: '0.75rem', fontWeight: comment.isLikedByMe ? 600 : 400,
                          padding: 0, transition: 'all 0.15s',
                        }}
                      >
                        <svg
                          width="13" height="13" viewBox="0 0 24 24"
                          fill={comment.isLikedByMe ? '#ff4d6a' : 'none'}
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{
                            animation: animatingCommentId === comment.id ? 'postHeartPop 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.49)' : 'none',
                          }}
                        >
                          <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>
                        </svg>
                        <span>{(comment._count?.likes || 0) > 0 ? comment._count?.likes : 'Me gusta'}</span>
                      </button>

                      {currentUserId && (
                        <button
                          type="button"
                          onClick={() => {
                            setCommentText(prev => (prev ? `${prev} @${comment.user?.username} ` : `@${comment.user?.username} `));
                          }}
                          style={{
                            border: 'none', background: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500,
                            padding: 0, transition: 'color 0.15s',
                          }}
                          onMouseOver={e => (e.currentTarget.style.color = 'var(--primary)')}
                          onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          Responder
                        </button>
                      )}
                    </div>
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
      {/* Lightbox Modal */}
      {lightboxImage && (
        <MediaLightbox
          src={lightboxImage}
          isVideo={/\.(mp4|webm|ogg)($|\?)/i.test(lightboxImage)}
          onClose={() => setLightboxImage(null)}
        />
      )}
      {/* Send Stardust Modal */}
      {showSendStardustModal && (
        <SendStardustModal
          isOpen={showSendStardustModal}
          onClose={() => setShowSendStardustModal(false)}
          recipient={
            post.user
              ? {
                  id: post.user.id,
                  username: post.user.username,
                  displayName: post.user.displayName || post.user.username,
                  avatarUrl: post.user.avatarUrl,
                }
              : null
          }
        />
      )}

      {/* Inline Keyframe Animations */}
      <style>{`
        @keyframes postHeartPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.45) rotate(-12deg); }
          80% { transform: scale(0.9) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes reactionPop {
          0% { transform: scale(0.4) rotate(-15deg); opacity: 0; }
          60% { transform: scale(1.4) rotate(8deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
