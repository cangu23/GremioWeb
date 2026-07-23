'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { connectSocket, DM_EVENTS } from '@/lib/socket-client';
import { apiFetch } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ClientOnly from '@/lib/ClientOnly';
import StickerPicker from '@/components/ui/StickerPicker';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { renderFormattedContent, useStickersCache } from '@/lib/content-renderer';
import type { Socket } from 'socket.io-client';

/* ─────────── Types ─────────── */

interface UserInfo {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  vtuberProfile: { displayName: string; avatarUrl: string | null; isVerified?: boolean } | null;
}

interface DmMessageData {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: UserInfo;
  receiver: UserInfo;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

interface ConversationData {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: UserInfo;
  receiver: UserInfo;
  isPinned?: boolean;
}

/* ─────────── Helpers ─────────── */

function getOtherUser(conversation: ConversationData, currentUserId: string): UserInfo {
  return conversation.senderId === currentUserId ? conversation.receiver : conversation.sender;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 2) return 'ayer';
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatTimeFull(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return time;
  const day = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return `${day} ${time}`;
}

function getUsername(user: UserInfo): string {
  return user.displayName || user.vtuberProfile?.displayName || user.username;
}

function getInitial(user: UserInfo): string {
  return getUsername(user).charAt(0).toUpperCase();
}

function formatMessagePreview(msg: ConversationData, currentUserId: string): string {
  const isMine = msg.senderId === currentUserId;
  const prefix = isMine ? 'Tú: ' : '';
  const isImage = msg.content.startsWith('http') && (msg.content.includes('/uploads/') || /\.(webp|png|jpg|jpeg|gif)$/i.test(msg.content));
  if (isImage) return `${prefix}📷 Imagen`;
  if (msg.content.startsWith(':') && msg.content.endsWith(':')) return `${prefix}✨ Sticker`;
  return `${prefix}${msg.content}`;
}

/* ─────────── Main Content ─────────── */

function MessengerContent() {
  useStickersCache();
  const { user: currentUser, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Conversations list
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [convFilter, setConvFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'unread' | 'vtubers'>('all');
  const [pinnedUserIds, setPinnedUserIds] = useState<Set<string>>(new Set());

  // Active conversation
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUserInfo, setActiveUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<DmMessageData[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showChatStickerPicker, setShowChatStickerPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reactions state (in-memory per message)
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({});
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Typing
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mobile state
  const [showList, setShowList] = useState(true);

  // Unread count per user
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  // Online users & friends list
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [friendsList, setFriendsList] = useState<UserInfo[]>([]);

  /* ─── Fetch friends / following list ─── */
  useEffect(() => {
    if (!currentUser) return;
    apiFetch(`/social/following/${currentUser.id}`, {})
      .then((data: any[]) => {
        if (Array.isArray(data)) setFriendsList(data);
      })
      .catch(() => {});
  }, [currentUser]);

  /* ─── Handle `?user=` query param ─── */
  useEffect(() => {
    const userIdFromUrl = searchParams?.get('user');
    if (userIdFromUrl && userIdFromUrl !== currentUser?.id) {
      setActiveUserId(userIdFromUrl);
      setShowList(false);
    }
  }, [searchParams, currentUser]);

  /* ─── Socket connection ─── */
  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) { router.push('/login'); return; }

    let sock: Socket;
    try {
      sock = connectSocket();
      setSocket(sock);
    } catch {
      return;
    }

    sock.on('connect', () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));

    if (sock.connected) {
      setConnected(true);
    }

    const typingClearRef = { current: null as ReturnType<typeof setTimeout> | null };

    sock.on(DM_EVENTS.MESSAGE, (msg: DmMessageData) => {
      const isForActiveChat = activeUserId && (msg.senderId === activeUserId || msg.senderId === currentUser.id);

      if (isForActiveChat) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.receiverId === currentUser.id && sock.connected) {
          sock.emit(DM_EVENTS.READ, { messageIds: [msg.id] });
        }
      }

      if (msg.receiverId === currentUser.id && !isForActiveChat) {
        const senderId = msg.senderId;
        setUnreadMap(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
      }

      setConversations(prev => {
        const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
        const filtered = prev.filter(c => {
          const cOtherId = c.senderId === currentUser.id ? c.receiverId : c.senderId;
          return cOtherId !== otherId;
        });
        return [msg, ...filtered];
      });
    });

    sock.on(DM_EVENTS.TYPING, (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === activeUserId) {
        setTypingUserId(data.isTyping ? data.userId : null);
      }
      if (data.isTyping) {
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        typingClearRef.current = setTimeout(() => {
          setTypingUserId(prev => prev === data.userId ? null : prev);
        }, 3000);
      }
    });

    return () => {
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      sock.off('connect');
      sock.off('disconnect');
      sock.off(DM_EVENTS.MESSAGE);
      sock.off(DM_EVENTS.TYPING);
    };
  }, [currentUser, isLoading, router, activeUserId]);

  /* ─── Socket presence tracking ─── */
  useEffect(() => {
    if (!currentUser) return;

    let sock: Socket;
    try {
      sock = connectSocket();
    } catch {
      return;
    }

    sock.on('user:online-list', (data: { onlineIds: string[] }) => {
      setOnlineUsers(new Set(data.onlineIds));
    });

    sock.on('user:online', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add(data.userId);
        return next;
      });
    });

    sock.on('user:offline', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    return () => {
      sock.off('user:online-list');
      sock.off('user:online');
      sock.off('user:offline');
    };
  }, [currentUser]);

  /* ─── Fetch conversations ─── */
  useEffect(() => {
    if (!currentUser) return;
    setConversationsLoading(true);
    apiFetch('/dm/conversations', {})
      .then((data: ConversationData[]) => {
        setConversations(data || []);
        if (activeUserId) {
          const conv = (data || []).find(c =>
            c.senderId === activeUserId || c.receiverId === activeUserId
          );
          if (conv) {
            setActiveUserInfo(getOtherUser(conv, currentUser.id));
          }
        }
      })
      .catch(() => {})
      .finally(() => setConversationsLoading(false));
  }, [currentUser, activeUserId]);

  /* ─── Fetch messages for active conversation ─── */
  useEffect(() => {
    if (!currentUser || !activeUserId) return;
    setMessagesLoading(true);
    setUnreadMap(prev => { const next = { ...prev }; delete next[activeUserId]; return next; });
    apiFetch(`/dm/conversations/${activeUserId}`, {})
      .then((data: DmMessageData[]) => {
        setMessages(data || []);

        const unreadIds = (data || [])
          .filter(m => m.receiverId === currentUser.id && !m.read)
          .map(m => m.id);
        if (unreadIds.length > 0 && socket?.connected) {
          socket.emit(DM_EVENTS.READ, { messageIds: unreadIds });
        }

        if (!activeUserInfo && data && data.length > 0) {
          const lastMsg = data[data.length - 1];
          const other = lastMsg.senderId === currentUser.id ? lastMsg.receiver : lastMsg.sender;
          if (other.id === activeUserId) setActiveUserInfo(other);
        }
      })
      .catch(() => {})
      .finally(() => setMessagesLoading(false));
  }, [currentUser, activeUserId, socket]);

  /* ─── Scroll to bottom on new messages without scrolling window ─── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  /* ─── Select a conversation ─── */
  const selectConversation = useCallback((otherUser: UserInfo) => {
    setActiveUserId(otherUser.id);
    setActiveUserInfo(otherUser);
    setShowList(false);
    const url = new URL(window.location.href);
    url.searchParams.set('user', otherUser.id);
    window.history.replaceState({}, '', url.toString());
  }, []);

  /* ─── Send a message ─── */
  const handleSend = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !activeUserId || sending) return;

    setSending(true);
    const content = input.trim();
    setInput('');

    socket.emit(DM_EVENTS.MESSAGE, { receiverId: activeUserId, content });
    socket.emit(DM_EVENTS.TYPING, { receiverId: activeUserId, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, socket, activeUserId, sending]);

  /* ─── Toggle Pin Conversation ─── */
  const togglePinUser = useCallback((userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  /* ─── Reaction Handler ─── */
  const handleAddReaction = useCallback((msgId: string, emoji: string) => {
    setMessageReactions(prev => {
      const msgRecs = prev[msgId] || {};
      const currentCount = msgRecs[emoji] || 0;
      return {
        ...prev,
        [msgId]: { ...msgRecs, [emoji]: currentCount + 1 }
      };
    });
  }, []);

  /* ─── Typing indicator ─── */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socket || !activeUserId) return;

    socket.emit(DM_EVENTS.TYPING, { receiverId: activeUserId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(DM_EVENTS.TYPING, { receiverId: activeUserId, isTyping: false });
    }, 2000);
  }, [socket, activeUserId]);

  /* ─── Start new conversation ─── */
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const handleSearchUsers = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchingUsers(true);
    try {
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(q)}&limit=8`, {});
      setSearchResults((data.users || data) as UserInfo[]);
    } catch { setSearchResults([]); }
    setSearchingUsers(false);
  }, []);

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '1200px' }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(255,255,255,0.08)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
      </div>
    );
  }

  if (!currentUser) return null;

  const getUnreadCount = (otherUserId: string): number => {
    return unreadMap[otherUserId] || 0;
  };

  // Deduplicate conversations so each user appears ONLY ONCE
  const uniqueConversationsMap = new Map<string, ConversationData>();
  conversations.forEach(conv => {
    const other = getOtherUser(conv, currentUser.id);
    if (!uniqueConversationsMap.has(other.id)) {
      uniqueConversationsMap.set(other.id, conv);
    }
  });
  const uniqueConversations = Array.from(uniqueConversationsMap.values());

  // Sort pinned conversations to the very top
  uniqueConversations.sort((a, b) => {
    const otherA = getOtherUser(a, currentUser.id);
    const otherB = getOtherUser(b, currentUser.id);
    const isPinnedA = pinnedUserIds.has(otherA.id);
    const isPinnedB = pinnedUserIds.has(otherB.id);
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;
    return 0;
  });

  const filteredConversations = uniqueConversations.filter(conv => {
    const other = getOtherUser(conv, currentUser.id);
    const unread = getUnreadCount(other.id);

    if (activeCategory === 'unread' && unread === 0) return false;
    if (activeCategory === 'vtubers' && !other.vtuberProfile) return false;

    if (!convFilter.trim()) return true;
    const name = getUsername(other).toLowerCase();
    const username = other.username.toLowerCase();
    const query = convFilter.toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  return (
    <div className="container" style={{ maxWidth: '1240px', paddingTop: '16px', paddingBottom: '0', height: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '12px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!showList && (
            <button
              onClick={() => setShowList(true)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)',
                cursor: 'pointer', padding: '6px 12px', borderRadius: '8px',
                display: 'none', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600,
              }}
              className="mobile-back-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Volver
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mensajes Privados
          </h1>
          <span style={{
            fontSize: '0.72rem', padding: '3px 10px', borderRadius: '12px',
            background: connected ? 'rgba(0,230,118,0.12)' : 'rgba(239,68,68,0.1)',
            border: connected ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(239,68,68,0.2)',
            color: connected ? '#22c55e' : 'var(--error)',
            fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#22c55e' : 'var(--error)', boxShadow: connected ? '0 0 6px #22c55e' : 'none' }} />
            {connected ? 'En tiempo real' : 'Desconectado'}
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .messenger-split { flex-direction: column !important; }
          .conv-list { width: 100% !important; max-width: 100% !important; border-right: none !important; }
          .conv-list-hidden { display: none !important; }
          .msg-pane-hidden { display: none !important; }
          .mobile-back-btn { display: inline-flex !important; }
        }
        @keyframes typingDotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        @keyframes reactionPop {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Main split view */}
      <div className="messenger-split" style={{
        display: 'flex', flex: 1, overflow: 'hidden', gap: '0',
        borderRadius: '18px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(18, 16, 28, 0.75)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.37)',
      }}>
        {/* ─── LEFT: Conversation List ─── */}
        <div className={`conv-list ${!showList ? 'conv-list-hidden' : ''}`} style={{
          width: '340px', maxWidth: '340px', flexShrink: 0,
          borderRight: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'rgba(0,0,0,0.15)',
        }}>
          {/* Search & New Chat */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ width: '100%', padding: '9px 12px 9px 34px', fontSize: '0.84rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}
                placeholder="Buscar chats..."
                value={convFilter}
                onChange={e => setConvFilter(e.target.value)}
              />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '10px' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'unread', label: 'No leídos' },
                { id: 'vtubers', label: 'VTubers' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  style={{
                    flex: 1, padding: '5px 8px', borderRadius: '7px', border: 'none',
                    fontSize: '0.74rem', fontWeight: activeCategory === cat.id ? 700 : 500,
                    cursor: 'pointer',
                    background: activeCategory === cat.id ? 'var(--primary)' : 'transparent',
                    color: activeCategory === cat.id ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowNewChat(!showNewChat)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '1px dashed rgba(255,255,255,0.12)',
                background: showNewChat ? 'rgba(138,43,226,0.1)' : 'transparent',
                color: showNewChat ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { if (!showNewChat) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva conversación
            </button>

            {showNewChat && (
              <div style={{ marginTop: '4px' }}>
                <input
                  className="input"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem' }}
                  placeholder="Buscar usuarios..."
                  value={searchQuery}
                  onChange={e => handleSearchUsers(e.target.value)}
                  autoFocus
                />
                {searchingUsers && (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Buscando usuarios...
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          selectConversation(u);
                          setShowNewChat(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 10px', borderRadius: '8px',
                          border: 'none', background: 'transparent', color: 'var(--text)',
                          cursor: 'pointer', fontSize: '0.84rem', fontWeight: 500,
                          width: '100%', textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                          background: u.vtuberProfile?.avatarUrl
                            ? `url(${u.vtuberProfile.avatarUrl}) center/cover`
                            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                        }}>
                          {!u.vtuberProfile?.avatarUrl && getInitial(u)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{getUsername(u)}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          @{u.username}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Contactos Rápidos (Amigos) ─── */}
          {friendsList.length > 0 && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Contactos Rápidos
              </div>
              <div className="no-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
                {friendsList.map(friend => {
                  const isOnline = onlineUsers.has(friend.id);
                  const isSelected = activeUserId === friend.id;
                  return (
                    <button
                      key={friend.id}
                      onClick={() => selectConversation(friend)}
                      title={getUsername(friend)}
                      style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        padding: 0, minWidth: '46px', flexShrink: 0, opacity: isSelected ? 1 : 0.85,
                        transition: 'transform 0.15s, opacity 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = isSelected ? '1' : '0.85'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                        <div style={{
                          width: '100%', height: '100%', borderRadius: '50%',
                          background: (friend.avatarUrl || friend.vtuberProfile?.avatarUrl)
                            ? `url(${friend.avatarUrl || friend.vtuberProfile?.avatarUrl}) center/cover`
                            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                          boxShadow: isSelected ? '0 0 0 2px var(--primary)' : 'none',
                          overflow: 'hidden',
                        }}>
                          {!(friend.avatarUrl || friend.vtuberProfile?.avatarUrl) && getInitial(friend)}
                        </div>
                        <div style={{
                          position: 'absolute', bottom: '-2px', right: '-2px',
                          width: '11px', height: '11px', borderRadius: '50%',
                          background: isOnline ? '#22c55e' : '#555',
                          border: '2px solid var(--bg-deep, #0a0a12)',
                          boxShadow: isOnline ? '0 0 6px #22c55e' : 'none',
                          zIndex: 2,
                        }} />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 600 : 400, maxWidth: '46px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getUsername(friend)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {conversationsLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px', marginBottom: '4px',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        width: '60%', height: '12px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.04)', marginBottom: '6px',
                      }} />
                      <div style={{
                        width: '80%', height: '10px', borderRadius: '5px',
                        background: 'rgba(255,255,255,0.03)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, fontWeight: 500 }}>
                  {convFilter ? 'Sin resultados de búsqueda' : 'No hay chats registrados'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherUser(conv, currentUser.id);
                const unread = getUnreadCount(other.id);
                const isActive = activeUserId === other.id;
                const isPinned = pinnedUserIds.has(other.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(other)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '12px',
                      border: 'none',
                      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(138,43,226,0.18), rgba(138,43,226,0.04))'
                        : isPinned ? 'rgba(255,255,255,0.02)' : 'transparent',
                      color: 'var(--text)', cursor: 'pointer',
                      width: '100%', textAlign: 'left',
                      transition: 'all 0.15s ease',
                      marginBottom: '3px',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = isPinned ? 'rgba(255,255,255,0.02)' : 'transparent';
                    }}
                  >
                    {/* Avatar with online dot */}
                    <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0 }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: (other.avatarUrl || other.vtuberProfile?.avatarUrl)
                          ? `url(${other.avatarUrl || other.vtuberProfile?.avatarUrl}) center/cover`
                          : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                        overflow: 'hidden',
                      }}>
                        {!(other.avatarUrl || other.vtuberProfile?.avatarUrl) && getInitial(other)}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: '-2px', right: '-2px',
                        width: '12px', height: '12px', borderRadius: '50%',
                        border: '2px solid var(--background, #0a0a0c)',
                        background: onlineUsers.has(other.id) ? '#22c55e' : '#555',
                        boxShadow: onlineUsers.has(other.id) ? '0 0 6px #22c55e' : 'none',
                        transition: 'background 0.3s ease',
                        zIndex: 2,
                      }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
                          <span style={{
                            fontWeight: unread > 0 ? 800 : isActive ? 700 : 600,
                            fontSize: '0.88rem',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {getUsername(other)}
                          </span>
                          {other.vtuberProfile && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(233,30,99,0.15)', color: '#ff4081', fontWeight: 700, flexShrink: 0 }}>
                              VTuber
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: unread > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: unread > 0 ? 700 : 400 }}>
                          {formatTime(conv.createdAt)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '0.78rem',
                          color: unread > 0 ? 'var(--text)' : 'var(--text-muted)',
                          fontWeight: unread > 0 ? 700 : 400,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: '170px',
                        }}>
                          {formatMessagePreview(conv, currentUser.id)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={(e) => togglePinUser(other.id, e)}
                            title={isPinned ? "Desanclar" : "Anclar chat"}
                            style={{
                              border: 'none', background: 'transparent', cursor: 'pointer',
                              color: isPinned ? '#eab308' : 'rgba(255,255,255,0.2)',
                              padding: '2px', display: 'flex', alignItems: 'center',
                              transition: 'color 0.15s',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? "#eab308" : "none"} stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14l-1.5-6V5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v6L5 17z" />
                            </svg>
                          </button>
                          {unread > 0 && (
                            <span style={{
                              background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff',
                              fontSize: '0.65rem', fontWeight: 800,
                              padding: '2px 7px', borderRadius: '10px', boxShadow: '0 0 8px rgba(138,43,226,0.5)',
                            }}>
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT: Conversation Pane ─── */}
        <div className={`msg-pane ${!showList ? '' : 'msg-pane-hidden'}`} style={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {activeUserId && activeUserInfo ? (
            <>
              {/* Conversation header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 20px',
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.12)',
                flexShrink: 0, justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link href={`/profile/${activeUserInfo.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      position: 'relative',
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: activeUserInfo.vtuberProfile?.avatarUrl
                        ? `url(${activeUserInfo.vtuberProfile.avatarUrl}) center/cover`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                    }}>
                      {!activeUserInfo.vtuberProfile?.avatarUrl && getInitial(activeUserInfo)}
                      <div style={{
                        position: 'absolute', bottom: '0', right: '0',
                        width: '11px', height: '11px', borderRadius: '50%',
                        border: '2px solid var(--background)',
                        background: onlineUsers.has(activeUserInfo.id) ? '#22c55e' : '#555',
                        boxShadow: onlineUsers.has(activeUserInfo.id) ? '0 0 8px #22c55e' : 'none',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getUsername(activeUserInfo)}
                        {activeUserInfo.vtuberProfile && (
                          <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(233,30,99,0.15)', color: '#ff4081', fontWeight: 700 }}>
                            VTuber
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: onlineUsers.has(activeUserInfo.id) ? '#22c55e' : 'var(--text-muted)', fontWeight: 500 }}>
                        {onlineUsers.has(activeUserInfo.id) ? '🟢 En línea' : `@${activeUserInfo.username}`}
                      </div>
                    </div>
                  </Link>
                </div>

                <Link
                  href={`/profile/${activeUserInfo.id}`}
                  className="btn btn--outline"
                  style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}
                >
                  Ver Perfil
                </Link>
              </div>

              {/* Messages area */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                {messagesLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px' }}>
                    <span style={{
                      width: '24px', height: '24px',
                      border: '3px solid rgba(255,255,255,0.08)',
                      borderTopColor: 'var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                    }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '16px', padding: '40px 20px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: activeUserInfo.vtuberProfile?.avatarUrl
                        ? `url(${activeUserInfo.vtuberProfile.avatarUrl}) center/cover`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '1.6rem', fontWeight: 700,
                      boxShadow: '0 0 24px rgba(138,43,226,0.3)',
                    }}>
                      {!activeUserInfo.vtuberProfile?.avatarUrl && getInitial(activeUserInfo)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{getUsername(activeUserInfo)}</h4>
                      <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>@{activeUserInfo.username}</p>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, maxWidth: '300px' }}>
                      ¡Sé el primero en romper el hielo e iniciar esta conversación privada!
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {[
                        { label: '👋 Decir hola', text: '¡Hola! 👋 ¿Cómo estás?' },
                        { label: '✨ Sticker rápido', text: ':dance:' },
                        { label: '🎮 Invitar a jugar', text: '¡Hola! ¿Sale jugar unas partidas?' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setInput(item.text);
                            setTimeout(() => inputRef.current?.focus(), 50);
                          }}
                          className="btn btn--outline"
                          style={{ padding: '7px 16px', fontSize: '0.82rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.senderId === currentUser.id;
                    const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);
                    const isImage = msg.content.startsWith('http') && (msg.content.includes('/uploads/') || /\.(webp|png|jpg|jpeg|gif)$/i.test(msg.content));
                    const recs = messageReactions[msg.id] || {};

                    return (
                      <div
                        key={msg.id}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '8px',
                          flexDirection: isMine ? 'row-reverse' : 'row',
                          maxWidth: '85%',
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                          marginLeft: isMine ? 'auto' : '0',
                          position: 'relative',
                        }}
                      >
                        {showAvatar && (
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                            background: activeUserInfo.vtuberProfile?.avatarUrl
                              ? `url(${activeUserInfo.vtuberProfile.avatarUrl}) center/cover`
                              : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                          }}>
                            {!activeUserInfo.vtuberProfile?.avatarUrl && getInitial(activeUserInfo)}
                          </div>
                        )}
                        {!showAvatar && !isMine && <div style={{ width: '28px', flexShrink: 0 }} />}
                        
                        <div style={{
                          background: isMine
                            ? 'linear-gradient(135deg, var(--primary), #7c6aff)'
                            : 'rgba(255,255,255,0.06)',
                          padding: isImage ? '4px' : '10px 14px',
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          maxWidth: '100%',
                          boxShadow: isMine ? '0 4px 16px rgba(138,43,226,0.25)' : 'none',
                          position: 'relative',
                        }}>
                          {isImage ? (
                            <img
                              src={msg.content}
                              alt=""
                              onClick={() => setLightboxImage(msg.content)}
                              style={{
                                maxWidth: '280px', maxHeight: '220px', borderRadius: '14px',
                                objectFit: 'cover', display: 'block', cursor: 'zoom-in',
                                border: '1px solid rgba(255,255,255,0.1)',
                              }}
                            />
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.45, wordBreak: 'break-word' }}>
                              {renderFormattedContent(msg.content)}
                            </p>
                          )}

                          {/* Message Reactions display */}
                          {Object.keys(recs).length > 0 && (
                            <div style={{
                              display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px',
                              padding: '2px 4px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)',
                              animation: 'reactionPop 0.3s ease',
                            }}>
                              {Object.entries(recs).map(([emoji, count]) => (
                                <span key={emoji} style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                  {emoji} <span style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 700 }}>{count}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: isMine ? 'flex-end' : 'flex-start',
                            gap: '5px', marginTop: '4px', padding: isImage ? '2px 6px 4px' : 0,
                          }}>
                            <span style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 500 }}>
                              {formatTimeFull(msg.createdAt)}
                            </span>
                            {isMine && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '3px' }}>
                                {msg.read ? (
                                  /* Bright double checkmark for read */
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(56,189,248,0.5))' }}>
                                    <path d="M18 6L7 17l-5-5" />
                                    <path d="M22 10l-7.5 7.5" />
                                  </svg>
                                ) : (
                                  /* Clear single checkmark for sent */
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>

                          {/* Quick Emoji Reaction Pill on hover */}
                          {hoveredMessageId === msg.id && (
                            <div style={{
                              position: 'absolute', top: '-18px', right: isMine ? '0' : 'auto', left: isMine ? 'auto' : '0',
                              display: 'flex', gap: '4px', padding: '3px 8px', borderRadius: '16px',
                              background: 'rgba(25, 20, 40, 0.95)', border: '1px solid rgba(255,255,255,0.15)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 10,
                              animation: 'reactionPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}>
                              {['❤️', '🔥', '😂', '👍', '✨'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                  style={{
                                    border: 'none', background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.85rem', padding: '1px 3px', borderRadius: '4px',
                                    transition: 'transform 0.1s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.3)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicator */}
              {typingUserId && (
                <div style={{
                  padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.1)',
                }}>
                  <div style={{
                    display: 'inline-flex', gap: '4px', alignItems: 'center',
                    padding: '4px 10px', borderRadius: '12px', background: 'rgba(138,43,226,0.12)',
                    border: '1px solid rgba(138,43,226,0.2)',
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', animation: 'typingDotBounce 1.4s infinite 0s' }} />
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', animation: 'typingDotBounce 1.4s infinite 0.2s' }} />
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', animation: 'typingDotBounce 1.4s infinite 0.4s' }} />
                  </div>
                  <span style={{ fontWeight: 500 }}>{getUsername(activeUserInfo)} está escribiendo...</span>
                </div>
              )}

              {/* Input area */}
              <form
                onSubmit={handleSend}
                style={{
                  display: 'flex', gap: '8px',
                  padding: '14px 20px',
                  borderTop: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}
              >
                {/* Hidden image file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !socket || !activeUserId) return;
                    setUploadingImage(true);
                    try {
                      const formData = new FormData();
                      formData.append('image', file);
                      const res = await apiFetch('/uploads/post', { method: 'POST', body: formData });
                      if (res.url) {
                        socket.emit(DM_EVENTS.MESSAGE, { receiverId: activeUserId, content: res.url });
                      }
                    } catch {} finally {
                      setUploadingImage(false);
                      e.target.value = '';
                    }
                  }}
                />

                {/* Media upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || !connected}
                  title="Adjuntar imagen"
                  style={{
                    width: '42px', height: '42px',
                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    background: uploadingImage ? 'rgba(138,43,226,0.18)' : 'rgba(255,255,255,0.04)',
                    color: uploadingImage ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.12)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseOut={e => { if (!uploadingImage) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>

                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setShowChatStickerPicker(!showChatStickerPicker)}
                    title="Añadir sticker"
                    style={{
                      width: '42px', height: '42px',
                      borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      background: showChatStickerPicker ? 'rgba(138,43,226,0.15)' : 'rgba(255,255,255,0.04)',
                      color: showChatStickerPicker ? 'var(--primary)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.12)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseOut={e => { if (!showChatStickerPicker) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </button>
                  {showChatStickerPicker && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', zIndex: 100 }}>
                      <StickerPicker
                        onSelect={(sticker) => {
                          setInput(prev => prev + ` :${sticker.name}: `);
                          setShowChatStickerPicker(false);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        onClose={() => setShowChatStickerPicker(false)}
                      />
                    </div>
                  )}
                </div>

                <input
                  ref={inputRef}
                  className="input"
                  style={{ flex: 1, padding: '11px 18px', fontSize: '0.9rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}
                  placeholder={uploadingImage ? "Subiendo imagen..." : "Escribe un mensaje..."}
                  value={input}
                  onChange={handleInputChange}
                  disabled={!connected || uploadingImage}
                  maxLength={1000}
                />

                <button
                  type="submit"
                  className="btn"
                  style={{
                    padding: '11px 22px', fontSize: '0.88rem', fontWeight: 700,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(138,43,226,0.35)',
                  }}
                  disabled={!connected || !input.trim() || sending || uploadingImage}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '18px',
              padding: '40px',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(138,43,226,0.2), rgba(233,30,99,0.2))',
                border: '1px solid rgba(138,43,226,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(138,43,226,0.2)',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
                  Selecciona una conversación
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, maxWidth: '320px', lineHeight: 1.45 }}>
                  Elige un chat de la barra lateral o busca cualquier VTuber/amigo para iniciar un chat privado
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image View Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', cursor: 'zoom-out',
          }}
        >
          <img src={lightboxImage} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '16px', objectFit: 'contain', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }} />
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <ClientOnly
        fallback={
          <div className="container" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '1240px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Cargando mensajes...</p>
          </div>
        }
      >
        <MessengerContent />
      </ClientOnly>
    </ErrorBoundary>
  );
}
