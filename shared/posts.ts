export interface PostData {
  id: string;
  content: string;
  mediaUrl: string | null;
  isPinned: boolean;
  isPoll: boolean;
  pollData: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    username: string;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
  isLikedByMe?: boolean;
  hashtags?: string[];
  mentions?: string[];
}

export interface CreatePostPayload {
  content: string;
  mediaUrl?: string;
  isPinned?: boolean;
  pollData?: string;
  hashtags?: string[];
}

// NOTA: CommentData vive en ./types (versión rica usada por el frontend).
// Eliminada de aquí para que el barrel export (index.ts) no tenga ambigüedad.
export interface CreateCommentPayload {
  content: string;
  mediaUrl?: string;
}

export interface DirectMessageData {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    username: string;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  receiver: {
    id: string;
    username: string;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
}
