// ============================================================================
// Frontend UI Shared Types
// ============================================================================
// These types are shared between page.tsx, feed/page.tsx, PostCard.tsx,
// and CreatePost.tsx to avoid duplication.

// ============================================================================
// Post types (also aliased as PostCardData / CreatePostData)
// ============================================================================
export interface Post {
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
    displayName?: string | null;
    avatarUrl?: string | null;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
      isApproved?: boolean;
      isVerified?: boolean;
    } | null;
    streamerProfile?: {
      displayName: string;
      avatarUrl: string | null;
      isApproved?: boolean;
      isVerified?: boolean;
    } | null;
  };
  _count: { comments: number; likes: number };
  isLikedByMe: boolean;
  hashtags: string[];
}

/** Alias shared by PostCard component */
export type PostCardData = Post;

/** Alias shared by CreatePost component */
export type CreatePostData = Post;

// ============================================================================
// Comment types
// ============================================================================
export interface CommentData {
  id: string;
  content: string;
  mediaUrl?: string | null;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    username: string;
    role?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
      isApproved?: boolean;
      isVerified?: boolean;
    } | null;
    streamerProfile?: {
      displayName: string;
      avatarUrl: string | null;
      isApproved?: boolean;
      isVerified?: boolean;
    } | null;
  };
  _count?: {
    likes: number;
  };
  isLikedByMe?: boolean;
}

// ============================================================================
// Guild (sidebar)
// ============================================================================
export interface GuildItem {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  _count: { members: number };
  isMember: boolean;
  myRole: string | null;
}

// ============================================================================
// Trending hashtags (sidebar)
// ============================================================================
export interface TrendingHashtag {
  id: string;
  name: string;
  _count: { posts: number };
}

// ============================================================================
// Live VTuber (sidebar)
// ============================================================================
export interface LiveVTuberProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isLive: boolean;
  lastLiveAt: string | null;
  isVerified: boolean;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  user: { id: string; username: string };
}

// ============================================================================
// Live Streamer (sidebar) — misma forma que /streamers/live
// ============================================================================
export interface LiveStreamerProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isLive: boolean;
  lastLiveAt: string | null;
  isVerified: boolean;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  user: { id: string; username: string };
}

// ============================================================================
// Following / Friend (sidebar)
// ============================================================================
export interface FollowingUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  vtuberProfile?: {
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean | null;
  } | null;
}

// ============================================================================
// Event (sidebar)
// ============================================================================
export interface EventItem {
  id: string;
  title: string;
  date: string;
  creator: { id: string; username: string };
  _count: { attendees: number };
}

// ============================================================================
// API DTOs & Responses
// ============================================================================
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreatePostDTO {
  content: string;
  mediaUrl?: string;
  hashtags?: string[];
}

export interface CreateGuildDTO {
  name: string;
  description: string;
  logoUrl?: string;
}

export interface GlobalSearchResults {
  users: Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    vtuberProfile?: { displayName: string; avatarUrl: string | null; isVerified?: boolean } | null;
  }>;
  guilds: Array<{
    id: string;
    name: string;
    description: string;
    logoUrl: string | null;
    _count: { members: number };
  }>;
  posts: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null };
  }>;
  events: Array<{
    id: string;
    title: string;
    date: string;
    creator: { id: string; username: string };
  }>;
}
