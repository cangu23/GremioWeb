export interface DmMessage {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    username: string;
    vtuberProfile: { displayName: string; avatarUrl: string | null } | null;
  };
  receiver: {
    id: string;
    username: string;
    vtuberProfile: { displayName: string; avatarUrl: string | null } | null;
  };
}

export interface Conversation {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    username: string;
    vtuberProfile: { displayName: string; avatarUrl: string | null } | null;
  };
  receiver: {
    id: string;
    username: string;
    vtuberProfile: { displayName: string; avatarUrl: string | null } | null;
  };
}

export interface DmSendPayload {
  receiverId: string;
  content: string;
}

export interface DmTypingData {
  userId: string;
  username: string;
  isTyping: boolean;
  receiverId: string;
}

// Socket.IO event names for Direct Messages
export const DM_EVENTS = {
  MESSAGE: 'dm:message',
  TYPING: 'dm:typing',
  READ: 'dm:read',
} as const;
