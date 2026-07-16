'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { Post } from '../../../../shared/types';

// ==========================================================================
// Types
// ==========================================================================
interface UsePostsOptions {
  user?: { id: string } | null;
  initialFeedMode?: 'global' | 'following';
  /** Whether to fetch immediately on mount (default: true) */
  autoFetch?: boolean;
}

interface UsePostsReturn {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  loading: boolean;
  error: string;
  page: number;
  hasMore: boolean;
  loadingMore: boolean;
  feedMode: 'global' | 'following';
  setFeedMode: React.Dispatch<React.SetStateAction<'global' | 'following'>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  loadMore: () => void;
  handleLike: (postId: string, isLiked: boolean) => Promise<void>;
  refetch: () => void;
}

// ==========================================================================
// Hook
// ==========================================================================
export function usePosts(options?: UsePostsOptions): UsePostsReturn {
  const { user, initialFeedMode = 'global', autoFetch = true } = options || {};

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedMode, setFeedMode] = useState<'global' | 'following'>(initialFeedMode);

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

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  }, [page, fetchFeed]);

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) return;
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
    } catch { /* ignore */ }
  }, [user]);

  const refetch = useCallback(() => {
    setPage(1);
    setLoading(true);
    fetchFeed(1, false);
  }, [fetchFeed]);

  // Initial feed load — re-fetches when feedMode or user changes
  useEffect(() => {
    if (!autoFetch) return;
    setPage(1);
    fetchFeed(1, false);
  }, [fetchFeed, autoFetch]);

  return {
    posts,
    setPosts,
    loading,
    error,
    page,
    hasMore,
    loadingMore,
    feedMode,
    setFeedMode,
    setPage,
    loadMore,
    handleLike,
    refetch,
  };
}
