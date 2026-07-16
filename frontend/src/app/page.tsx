'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch, getAccessToken } from '@/lib/api';
import { connectSocket } from '@/lib/socket-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientOnly from '@/lib/ClientOnly';
import type { Socket } from 'socket.io-client';

// ==========================================================================
// Landing sections (for non-authenticated users)
// ==========================================================================
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import LiveNowSection from '@/components/landing/LiveNowSection';
import FeaturedVtubersSection from '@/components/landing/FeaturedVtubersSection';
import PricingSection from '@/components/landing/PricingSection';
import RecentActivitySection from '@/components/landing/RecentActivitySection';
import CTASection from '@/components/landing/CTASection';

function SectionDivider() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '12px', padding: '0 20px', opacity: 0.2,
    }}>
      <div style={{
        flex: 1, maxWidth: '120px', height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--glass-border))',
      }} />
      <div style={{
        width: '3px', height: '3px', borderRadius: '50%', background: 'var(--primary)',
      }} />
      <div style={{
        flex: 1, maxWidth: '120px', height: '1px',
        background: 'linear-gradient(90deg, var(--glass-border), transparent)',
      }} />
    </div>
  );
}

function LandingPage() {
  return (
    <>
      <HeroSection />
      <SectionDivider />
      <LiveNowSection />
      <SectionDivider />
      <HowItWorksSection />
      <SectionDivider />
      <StatsSection />
      <SectionDivider />
      <FeaturesSection />
      <SectionDivider />
      <FeaturedVtubersSection />
      <SectionDivider />
      <PricingSection />
      <SectionDivider />
      <RecentActivitySection />
      <SectionDivider />
      <CTASection />
    </>
  );
}

// ==========================================================================
// Types
// ==========================================================================
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

interface GuildItem {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  _count: { members: number };
  isMember: boolean;
  myRole: string | null;
}

interface TrendingHashtag {
  id: string;
  name: string;
  _count: { posts: number };
}

interface LiveVTuberProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isLive: boolean;
  isVerified: boolean;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  user: { id: string; username: string };
}

interface FollowingUser {
  id: string;
  username: string;
  vtuberProfile?: {
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean | null;
  } | null;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  creator: { id: string; username: string };
  _count: { attendees: number };
}

// ==========================================================================
// SVG Icons
// ==========================================================================
const NavIcons = {
  feed: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v4H4z"/><path d="M4 12h16v8H4z"/></svg>,
  events: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  guilds: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  vtubers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chat: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  shop: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  leaderboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  notifications: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
};

// ==========================================================================
// Post Card Component
// ==========================================================================
function PostCard({ post, onLike, currentUserId, onDelete }: {
  post: Post;
  onLike: (id: string, isLiked: boolean) => void;
  currentUserId?: string;
  onDelete?: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      {/* Lightbox */}
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
        </div>
      )}

      {/* Delete confirmation */}
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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

      {/* Post header */}
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
          {post.isPinned && <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>📌</span>}
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
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

        {/* Media */}
        {post.mediaUrl && (
          <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', cursor: 'zoom-in', position: 'relative' }}
            onClick={() => setLightboxImage(post.mediaUrl!)}>
            <img src={post.mediaUrl} alt="" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', transition: 'transform 0.3s ease', display: 'block' }} />
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {post.hashtags.map(tag => (
              <Link key={tag} href={`/feed?tag=${tag}`} style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>#{tag}</Link>
            ))}
          </div>
        )}

        {/* Like/Comment count */}
        <div style={{ display: 'flex', gap: '16px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{post._count.likes} {post._count.likes === 1 ? 'like' : 'likes'}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{post._count.comments} {post._count.comments === 1 ? 'comentario' : 'comentarios'}</span>
        </div>

        {/* Actions */}
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

      {/* Comments section */}
      {showComments && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', background: 'rgba(0,0,0,0.15)' }}>
          {loadingComments ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', marginBottom: '10px' }}>Sin comentarios. ¡Sé el primero!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              {comments.map((comment: any) => (
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

// ==========================================================================
// Home Page Content (authenticated)
// ==========================================================================
function HomeContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Left sidebar data
  const [myGuilds, setMyGuilds] = useState<GuildItem[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Center - Feed
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedMode, setFeedMode] = useState<'global' | 'following'>('global');

  // Right sidebar data
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [liveVtubers, setLiveVtubers] = useState<LiveVTuberProfile[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set());

  // Fetch feed posts
  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      const mode = feedMode === 'following' && user ? 'true' : 'false';
      const data = await apiFetch(`/posts?limit=20&page=${pageNum}&personalized=${mode}`, {});
      if (append) setPosts(prev => [...prev, ...data]);
      else setPosts(data);
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

  // Fetch sidebar data
  useEffect(() => {
    if (!user) return;

    const fetchSidebarData = async () => {
      // Guilds
      try {
        const guilds = await apiFetch('/guilds', {});
        if (Array.isArray(guilds)) setMyGuilds(guilds.filter((g: GuildItem) => g.isMember));
      } catch {}

      // Hashtags
      try {
        const tags = await apiFetch('/posts/hashtags/trending?limit=8', {});
        setTrendingHashtags(Array.isArray(tags) ? tags : []);
      } catch {}

      // Notifications
      try {
        const data = await apiFetch('/notifications/unread-count', {});
        setUnreadNotifs(data.count || 0);
      } catch {}

      // Live VTubers
      try {
        const data = await apiFetch('/vtubers/live', {});
        if (Array.isArray(data)) setLiveVtubers(data.slice(0, 5));
      } catch {}

      // Following users (amigos)
      try {
        const data = await apiFetch(`/social/following/${user.id}`, {});
        if (Array.isArray(data)) setFollowingUsers(data.slice(0, 8));
      } catch {}

      // Upcoming events
      try {
        const events = await apiFetch('/events?status=UPCOMING&limit=5', {});
        setUpcomingEvents(Array.isArray(events) ? events.slice(0, 4) : []);
      } catch {}
    };

    fetchSidebarData();
  }, [user]);

  // Connect to socket for real-time friend presence
  useEffect(() => {
    if (!user) return;

    let sock: Socket;
    try {
      sock = connectSocket();

      // Receive full list of currently online users
      sock.on('user:online-list', (data: { onlineIds: string[] }) => {
        setOnlineFriendIds(new Set(data.onlineIds));
      });

      // User came online
      sock.on('user:online', (data: { userId: string }) => {
        setOnlineFriendIds(prev => {
          const next = new Set(prev);
          next.add(data.userId);
          return next;
        });
      });

      // User went offline
      sock.on('user:offline', (data: { userId: string }) => {
        setOnlineFriendIds(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      });
    } catch (err) {
      console.warn('[Socket] Could not connect for presence:', err);
    }

    return () => {
      if (sock) {
        sock.off('user:online-list');
        sock.off('user:online');
        sock.off('user:offline');
      }
    };
  }, [user]);

  // Initial feed load
  useEffect(() => {
    if (user) {
      setPage(1);
      fetchFeed(1, false);
    }
  }, [fetchFeed, user]);

  // Image handling
  const processImageFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Formato no soportado. Usa JPEG, PNG, WebP o GIF.'); return false;
    }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen es muy grande. Máximo 5 MB.'); return false; }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
    return true;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !selectedImage) return;
    setPosting(true); setError('');
    try {
      let mediaUrl = undefined;
      if (selectedImage) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', selectedImage);
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';
        const token = getAccessToken();
        const res = await fetch(`${baseUrl}/api/uploads/post`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) throw new Error('Error al subir imagen');
        const data = await res.json();
        mediaUrl = data.url;
        setUploadingImage(false);
      }
      const post = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({ content: newPost.trim() || '(imagen)', mediaUrl }),
      });
      setPosts(prev => [post, ...prev]);
      setNewPost('');
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al publicar');
    } finally { setPosting(false); setUploadingImage(false); }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) await apiFetch(`/posts/${postId}/unlike`, { method: 'POST' });
      else await apiFetch(`/posts/${postId}/like`, { method: 'POST' });
      setPosts(prev => prev.map(p => {
        if (p.id === postId) return { ...p, isLikedByMe: !isLiked, _count: { ...p._count, likes: isLiked ? p._count.likes - 1 : p._count.likes + 1 } };
        return p;
      }));
    } catch {}
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
      <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p>Cargando...</p>
    </div>;
  }

  if (!user) return <LandingPage />;

  const displayName = user.vtuberProfile?.displayName || user.username;
  const avatarUrl = user.vtuberProfile?.avatarUrl || '';

  // ==========================================================================
  // LEFT SIDEBAR
  // ==========================================================================
  const sidebarLinks = [
    { icon: NavIcons.feed, label: 'Feed', href: '/feed', color: 'var(--primary)' },
    { icon: NavIcons.events, label: 'Eventos', href: '/events' },
    { icon: NavIcons.guilds, label: 'Gremios', href: '/guilds' },
    { icon: NavIcons.vtubers, label: 'VTubers', href: '/vtubers' },
    { icon: NavIcons.chat, label: 'Chat', href: '/chat' },
    { icon: NavIcons.shop, label: 'Tienda', href: '/shop', color: 'var(--warm)' },
    { icon: NavIcons.leaderboard, label: 'Ranking', href: '/leaderboard' },
    { icon: NavIcons.dashboard, label: 'Dashboard', href: '/dashboard' },
  ];

  // ==========================================================================
  // RIGHT SIDEBAR
  // ==========================================================================
  const RightSidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '88px' }}>
      {/* Welcome card */}
      <div className="glass" style={{ padding: '16px', textAlign: 'center' }}>
        <Link href={`/profile/${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 8px',
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', color: 'white', fontWeight: 'bold',
            border: user.role === 'VTUBER' ? '2px solid var(--primary)' : '2px solid transparent',
          }}>
            {!avatarUrl && displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{displayName}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{user.username}</div>
        </Link>
        {user.role === 'VTUBER' && (
          <Link href="/vtuber-profile" className="btn" style={{ marginTop: '10px', padding: '6px 14px', fontSize: '0.78rem', width: '100%' }}>
            Editar Perfil VTuber
          </Link>
        )}
        <Link href={`/profile/${user.id}`} className="btn btn--outline" style={{ marginTop: '6px', padding: '6px 14px', fontSize: '0.78rem', width: '100%' }}>
          Ver Perfil
        </Link>
      </div>

      {/* Live VTubers */}
      {liveVtubers.length > 0 && (
        <div className="glass" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              En Vivo
            </h4>
            <Link href="/vtubers" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Ver todos
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {liveVtubers.map(v => (
              <Link key={v.id} href={`/profile/${v.userId}`} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 8px', borderRadius: '8px', textDecoration: 'none', color: 'inherit',
                fontSize: '0.82rem', transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: v.avatarUrl
                    ? `url(${v.avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '0.65rem',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {!v.avatarUrl && v.displayName.charAt(0).toUpperCase()}
                  {/* Live dot */}
                  <div style={{
                    position: 'absolute', bottom: '-1px', right: '-1px',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: 'var(--primary)',
                    border: '2px solid var(--bg-deep)',
                  }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {v.displayName}
                    {v.isVerified && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="Verificado">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>EN VIVO</div>
                </div>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  {v.twitchUrl || v.youtubeUrl ? '🎬' : ''}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Following / Amigos */}
      {followingUsers.length > 0 && (
        <div className="glass" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Amigos
            </h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {followingUsers.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {followingUsers.map(friend => {
              const displayName = friend.vtuberProfile?.displayName || friend.username;
              const avatarUrl = friend.vtuberProfile?.avatarUrl || '';
              const isVerified = friend.vtuberProfile?.isVerified || false;
              // Check if this friend is currently live (cross-reference with liveVtubers)
              const liveInfo = liveVtubers.find(lv => lv.userId === friend.id);
              const isLive = !!liveInfo;
              // Check if this friend is online via WebSocket presence
              const isOnline = onlineFriendIds.has(friend.id);
              // Priority: live > online > offline
              const statusColor = isLive ? 'var(--primary)' : isOnline ? '#00e676' : 'rgba(255,255,255,0.15)';
              const statusText = isLive ? 'EN VIVO' : isOnline ? 'En línea' : `@${friend.username}`;
              const statusWeight = isLive ? 600 : isOnline ? 500 : 400;
              const nameColor = isLive ? 'var(--text)' : isOnline ? 'var(--text)' : 'var(--text-secondary)';

              return (
                <Link key={friend.id} href={`/profile/${friend.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 8px', borderRadius: '8px', textDecoration: 'none', color: 'inherit',
                  fontSize: '0.82rem', transition: 'background 0.15s',
                }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: avatarUrl
                      ? `url(${avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '0.65rem',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {!avatarUrl && displayName.charAt(0).toUpperCase()}
                    {/* Status dot: live (purple) > online (green) > offline (gray) */}
                    <div style={{
                      position: 'absolute', bottom: '-1px', right: '-1px',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: statusColor,
                      border: '2px solid var(--bg-deep)',
                      boxShadow: isLive ? `0 0 6px var(--primary-glow)` : 'none',
                    }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.82rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      color: nameColor,
                    }}>
                      {displayName}
                      {isVerified && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="Verificado">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.68rem',
                      color: isLive ? 'var(--primary)' : isOnline ? '#00e676' : 'var(--text-muted)',
                      fontWeight: statusWeight,
                    }}>
                      {statusText}
                    </div>
                  </div>
                  {isLive && liveInfo && (
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '0.72rem' }}>
                      {liveInfo.twitchUrl || liveInfo.youtubeUrl ? '🔴' : ''}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="glass" style={{ padding: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            Tendencias
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {trendingHashtags.map((tag, i) => (
              <Link key={tag.id} href={`/feed?tag=${tag.name}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 8px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text)',
                fontSize: '0.82rem', transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '16px' }}>#{i + 1}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>#{tag.name}</span>
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tag._count.posts}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="glass" style={{ padding: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Próximos Eventos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {upcomingEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} style={{
                display: 'flex', gap: '10px', padding: '8px', borderRadius: '8px',
                textDecoration: 'none', color: 'inherit', transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(124,58,237,0.1))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1.1,
                }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {new Date(event.date).toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    por @{event.creator.username} · {event._count.attendees} asistentes
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      <Link href="/notifications" className="glass" style={{
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px',
        textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', fontWeight: 500,
        transition: 'all 0.15s',
      }}
        onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)')}
        onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}>
        <span style={{ display: 'inline-flex', color: unreadNotifs > 0 ? 'var(--primary)' : 'var(--text-muted)', position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {unreadNotifs > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
        </span>
        <span style={{ flex: 1 }}>Notificaciones</span>
        {unreadNotifs > 0 && (
          <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>
            {unreadNotifs > 99 ? '99+' : unreadNotifs}
          </span>
        )}
      </Link>
    </div>
  );

  return (
    <div className="home-layout">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="home-sidebar-left" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* User quick profile */}
        <Link href={`/profile/${user.id}`} className="glass" style={{
          padding: '12px', display: 'flex', alignItems: 'center', gap: '10px',
          textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
        }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)')}
          onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
          }}>
            {!avatarUrl && displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              @{user.username}
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <div className="glass" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {sidebarLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: '8px', textDecoration: 'none',
              color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = link.color || 'var(--text)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}>
              <span style={{ color: link.color || 'var(--text-muted)', display: 'inline-flex', flexShrink: 0 }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* My Guilds */}
        {myGuilds.length > 0 && (
          <div className="glass" style={{ padding: '10px 6px' }}>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px', padding: '0 6px' }}>
              Mis Gremios
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {myGuilds.slice(0, 5).map(guild => (
                <Link key={guild.id} href={`/guilds/${guild.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 8px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text)',
                  fontSize: '0.8rem', transition: 'background 0.15s',
                }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                    background: guild.logoUrl ? `url(${guild.logoUrl}) center/cover` : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.65rem', fontWeight: 'bold',
                  }}>
                    {!guild.logoUrl && guild.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guild.name}</span>
                </Link>
              ))}
              <Link href="/guilds" style={{
                textAlign: 'center', padding: '6px', fontSize: '0.75rem',
                color: 'var(--primary)', borderRadius: '6px', transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.06)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                Ver todos los gremios →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ===== CENTER FEED ===== */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Feed mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16v4H4z"/><path d="M4 12h16v8H4z"/>
            </svg>
            Inicio
          </h1>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
            <button onClick={() => { setFeedMode('global'); setPage(1); }} style={{
              padding: '5px 12px', fontSize: '0.78rem', borderRadius: '6px', border: 'none',
              background: feedMode === 'global' ? 'var(--primary)' : 'transparent',
              color: feedMode === 'global' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: feedMode === 'global' ? 600 : 400,
              transition: 'all 0.2s',
            }}>Global</button>
            <button onClick={() => { setFeedMode('following'); setPage(1); }} style={{
              padding: '5px 12px', fontSize: '0.78rem', borderRadius: '6px', border: 'none',
              background: feedMode === 'following' ? 'var(--primary)' : 'transparent',
              color: feedMode === 'following' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: feedMode === 'following' ? 600 : 400,
              transition: 'all 0.2s',
            }}>Siguiendo</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,77,79,0.1)', color: 'var(--error)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Post creation */}
        <div className="glass" style={{ padding: '16px' }}>
          <form onSubmit={handleCreatePost}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
              }}>
                {!avatarUrl && displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <textarea
                  className="input"
                  style={{ minHeight: '48px', resize: 'none', fontSize: '0.9rem', border: 'none', background: 'transparent', padding: '8px 4px', color: 'var(--text)' }}
                  placeholder="¿Qué está pasando, estelar? ✨"
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  maxLength={2000}
                  onFocus={e => { e.currentTarget.style.minHeight = '70px'; }}
                  onBlur={e => { if (!newPost) e.currentTarget.style.minHeight = '48px'; }}
                />

                {/* Image preview */}
                {imagePreview && (
                  <div style={{ position: 'relative', marginBottom: '8px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={imagePreview} alt="" style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', background: 'rgba(0,0,0,0.3)' }} />
                    <button type="button" onClick={() => { URL.revokeObjectURL(imagePreview!); setSelectedImage(null); setImagePreview(null); }} style={{
                      position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px',
                      borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" id="home-post-image" style={{ display: 'none' }}
                      onChange={e => { const file = e.target.files?.[0]; if (file) processImageFile(file); e.target.value = ''; }}
                      disabled={posting || !!imagePreview} />
                    <label htmlFor="home-post-image" style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      padding: '5px 10px', borderRadius: '6px', cursor: imagePreview ? 'not-allowed' : 'pointer',
                      color: imagePreview ? 'var(--text-muted)' : 'var(--text-muted)',
                      fontSize: '0.78rem', transition: 'all 0.2s', opacity: imagePreview ? 0.4 : 1,
                    }}
                      onMouseOver={e => { if (!imagePreview) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseOut={e => { if (!imagePreview) e.currentTarget.style.background = 'transparent'; }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      Foto
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{newPost.length}/2000</span>
                  </div>
                  <button type="submit" className="btn" disabled={(!newPost.trim() && !selectedImage) || posting || uploadingImage} style={{ padding: '7px 18px', fontSize: '0.82rem' }}>
                    {uploadingImage ? 'Subiendo...' : posting ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="glass" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.3 }}>🌌</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '4px' }}>No hay publicaciones aún.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>¡Comparte algo con la comunidad estelar!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} currentUserId={user.id} onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))} />
            ))}
            {hasMore && (
              <button onClick={loadMore} disabled={loadingMore} className="btn btn--outline" style={{
                padding: '12px', width: '100%', justifyContent: 'center', fontSize: '0.85rem',
              }}>
                {loadingMore ? (
                  <><span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Cargando...</>
                ) : 'Cargar más publicaciones ↓'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== RIGHT SIDEBAR ===== */}
      <div className="home-sidebar-right">
        <RightSidebar />
      </div>
    </div>
  );
}

// ==========================================================================
// Page Entry Point
// ==========================================================================
export default function HomePage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p>Cargando...</p>
      </div>
    }>
      <HomeContent />
    </ClientOnly>
  );
}
