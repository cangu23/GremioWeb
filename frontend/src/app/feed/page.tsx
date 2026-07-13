'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
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
    vtuberProfile?: { displayName: string; avatarUrl: string | null } | null;
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!newPost.trim()) return;
    setPosting(true);
    setError('');

    try {
      const post = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({ content: newPost.trim() }),
      });
      setPosts(prev => [post, ...prev]);
      setNewPost('');
      fetchHashtags(); // Refresh trending
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al publicar');
    } finally {
      setPosting(false);
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
      <div className="glass" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleCreatePost}>
          <textarea
            className="input"
            style={{ minHeight: '80px', resize: 'vertical', marginBottom: '12px', fontSize: '0.95rem' }}
            placeholder={user ? '¿Qué está pasando? Comparte con la comunidad...' : 'Inicia sesión para publicar...'}
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            disabled={!user}
            maxLength={2000}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {newPost.length}/2000 · Usa # para hashtags
            </span>
            <button type="submit" className="btn" disabled={!user || !newPost.trim() || posting} style={{ padding: '10px 24px' }}>
              {posting ? 'Publicando...' : 'Publicar'}
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
                <PostCard key={post.id} post={post} onLike={handleLike} currentUserId={user?.id} />
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

function PostCard({ post, onLike, currentUserId }: { post: Post; onLike: (id: string, isLiked: boolean) => void; currentUserId?: string }) {
  const [showComments, setShowComments] = useState(false);
  interface CommentData {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    user: {
      id: string;
      username: string;
      vtuberProfile?: { displayName: string; avatarUrl: string | null } | null;
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

  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
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
          <div style={{ minWidth: 0 }}>
            <Link href={`/profile/${post.user.id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
              {post.user.vtuberProfile?.displayName || post.user.username}
            </Link>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              @{post.user.username} · {timeAgo(post.createdAt)}
            </div>
          </div>
          {post.isPinned && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--primary)' }}>Fijado</span>}
        </div>

        {/* Post content */}
        <p style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '12px' }}>
          {post.content.split(/(#\w+)/g).map((part, i) => {
            if (part.startsWith('#')) {
              return <Link key={i} href={`/feed?tag=${part.slice(1)}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>{part}</Link>;
            }
            if (part.startsWith('@')) {
              // Note: @mentions link to vtubers search since we don't resolve username→id in render
              return <Link key={i} href={`/vtubers?q=${encodeURIComponent(part.slice(1))}`} style={{ color: 'var(--secondary)', fontWeight: 500 }}>{part}</Link>;
            }
            return part;
          })}
        </p>

        {/* Media */}
        {post.mediaUrl && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
            <img src={post.mediaUrl} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
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
            {post.isLikedByMe ? '♥' : '♡'} {post._count.likes}
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
            ○ {post._count.comments}
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
                    <Link href={`/profile/${comment.userId}`} style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', textDecoration: 'none' }}>
                      {comment.user?.vtuberProfile?.displayName || comment.user?.username}
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
