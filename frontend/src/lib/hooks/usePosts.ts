'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import type { Post } from '@gremio-estelar/shared';

// ==========================================================================
// Types
// ==========================================================================
export type FeedMode = 'for-you' | 'following' | 'global';

interface UsePostsOptions {
  user?: { id: string } | null;
  initialFeedMode?: FeedMode;
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
  feedMode: FeedMode;
  setFeedMode: React.Dispatch<React.SetStateAction<FeedMode>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  loadMore: () => void;
  handleLike: (postId: string, isLiked: boolean) => Promise<void>;
  refetch: () => void;
}

// ==========================================================================
// Hook
// ==========================================================================
export function usePosts(options?: UsePostsOptions): UsePostsReturn {
  const { user, initialFeedMode = 'for-you', autoFetch = true } = options || {};

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>(initialFeedMode);

  // Guard de secuencia: SOLO los fetches frescos (carga inicial, cambio de
  // feedMode, refetch) invalidan las respuestas en vuelo. Los append (loadMore)
  // NO incrementan la secuencia — de lo contrario, un loadMore en carrera con
  // la carga inicial descartaría la página base (feed mostrando solo pág. 2).
  const requestSeq = useRef(0);

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    if (!append) requestSeq.current += 1;
    const seq = requestSeq.current;
    try {
      const data = await apiFetch(`/posts?limit=20&page=${pageNum}&mode=${feedMode}`, {});
      if (seq !== requestSeq.current) return; // respuesta obsoleta
      if (append) {
        setPosts(prev => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      setHasMore(data.length === 20);
    } catch (err: unknown) {
      if (seq !== requestSeq.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar feed');
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [feedMode]);

  const loadMore = useCallback(() => {
    // Guard contra llamadas concurrentes: evita fetchear la misma página dos
    // veces (posts duplicados) con scroll rápido / doble clic.
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  }, [page, fetchFeed, loadingMore, hasMore]);

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) return;
    // Optimistic Update: update UI immediately
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLikedByMe: !isLiked,
          _count: { ...p._count, likes: isLiked ? Math.max(0, p._count.likes - 1) : p._count.likes + 1 },
        };
      }
      return p;
    }));

    try {
      if (isLiked) {
        await apiFetch(`/posts/${postId}/unlike`, { method: 'POST' });
      } else {
        await apiFetch(`/posts/${postId}/like`, { method: 'POST' });
      }
    } catch {
      // Revert on failure
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLikedByMe: isLiked,
            _count: { ...p._count, likes: isLiked ? p._count.likes + 1 : Math.max(0, p._count.likes - 1) },
          };
        }
        return p;
      }));
    }
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
    setLoading(true);
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
