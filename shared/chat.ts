export interface ChatMessageData {
  id: string;
  room: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    displayName: string | null;
  };
}

export interface ChatSendPayload {
  room: string;
  content: string;
}

// Socket.IO event names
export const CHAT_EVENTS = {
  MESSAGE: 'chat:message',
  HISTORY: 'chat:history',
  JOIN: 'chat:join',
  TYPING: 'chat:typing',
} as const;
