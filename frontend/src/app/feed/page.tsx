'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';
import PostCard from '@/components/posts/PostCard';
import CreatePost from '@/components/posts/CreatePost';
import SkeletonPostCard from '@/components/posts/SkeletonPostCard';
import { usePosts } from '@/lib/hooks/usePosts';
import type { TrendingHashtag } from '../../../../shared/types';

function FeedContent() {
  const { user, isLoading } = useAuth();
  const {
    posts, setPosts, loading, error, hasMore, loadingMore,
    feedMode, setFeedMode, setPage, loadMore, handleLike,
  } = usePosts({ user });

  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);

  const fetchHashtags = useCallback(async () => {
    try {
      const data = await apiFetch('/posts/hashtags/trending?limit=10', {});
      setTrendingHashtags(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchHashtags();
  }, [fetchHashtags]);

  const handlePostCreated = (post: any) => {
    setPosts(prev => [post, ...prev]);
    fetchHashtags(); // Refresh trending
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: '700px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SkeletonPostCard />
          <SkeletonPostCard withImage />
          <SkeletonPostCard />
          <SkeletonPostCard withImage />
        </div>
      </div>
    );
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

      <CreatePost
        onPostCreated={handlePostCreated}
        onRefreshTrending={fetchHashtags}
      />

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



export default function FeedPage() {
  return (
    <ClientOnly fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando feed...</div>}>
      <FeedContent />
    </ClientOnly>
  );
}
