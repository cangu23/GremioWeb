'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { connectSocket, disconnectSocket, DM_EVENTS } from '@/lib/socket-client';
import { apiFetch } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ClientOnly from '@/lib/ClientOnly';
import type { Socket } from 'socket.io-client';

/* ─────────── Types ─────────── */

interface UserInfo {
  id: string;
  username: string;
  vtuberProfile: { displayName: string; avatarUrl: string | null } | null;
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
  return user.vtuberProfile?.displayName || user.username;
}

function getInitial(user: UserInfo): string {
  return getUsername(user).charAt(0).toUpperCase();
}

/* ─────────── Main Content ─────────── */

function MessengerContent() {
  const { user: currentUser, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Conversations list
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // Active conversation
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUserInfo, setActiveUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<DmMessageData[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Typing
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mobile state
  const [showList, setShowList] = useState(true);

  // Unread count per user (tracked separately from active messages for accuracy)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  // Online users from socket presence events
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  /* ─── Handle `?user=` query param ─── */
  useEffect(() => {
    const userIdFromUrl = searchParams.get('user');
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

    // If socket is already connected (e.g. from Navbar), reflect immediately
    if (sock.connected) {
      setConnected(true);
    }

    // Track typing timeout ref for cleanup
    const typingClearRef = { current: null as ReturnType<typeof setTimeout> | null };

    // Handle new incoming DM
    sock.on(DM_EVENTS.MESSAGE, (msg: DmMessageData) => {
      const isForActiveChat = activeUserId && (msg.senderId === activeUserId || msg.senderId === currentUser.id);

      // If the message is for the active conversation, append it
      if (isForActiveChat) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark as read if received
        if (msg.receiverId === currentUser.id && sock.connected) {
          sock.emit(DM_EVENTS.READ, { messageIds: [msg.id] });
        }
      }

      // Update unread counts
      if (msg.receiverId === currentUser.id && !isForActiveChat) {
        const senderId = msg.senderId;
        setUnreadMap(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
      }

      // Update conversation list: add or move to top
      setConversations(prev => {
        const existing = prev.findIndex(c => c.id === msg.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated.splice(existing, 1);
          return [msg, ...updated];
        }
        return [msg, ...prev];
      });
    });

    // Handle typing indicators
    sock.on(DM_EVENTS.TYPING, (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === activeUserId) {
        setTypingUserId(data.isTyping ? data.userId : null);
      }
      // Auto-clear after 3s, resetting on each new event
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
      // Don't call disconnectSocket() — socket is shared globally
    };
  }, [currentUser, isLoading, router, activeUserId]);

  /* ─── Socket presence tracking (separate effect: doesn't depend on activeUserId) ─── */
  useEffect(() => {
    if (!currentUser) return;

    let sock: Socket;
    try {
      sock = connectSocket();
    } catch {
      return;
    }

    // Receive initial online user list
    sock.on('user:online-list', (data: { onlineIds: string[] }) => {
      setOnlineUsers(new Set(data.onlineIds));
    });

    // User came online
    sock.on('user:online', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add(data.userId);
        return next;
      });
    });

    // User went offline
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

        // If we have an activeUserId from URL, find user info
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
    // Clear unread for this user when opening the chat
    setUnreadMap(prev => { const next = { ...prev }; delete next[activeUserId]; return next; });
    apiFetch(`/dm/conversations/${activeUserId}`, {})
      .then((data: DmMessageData[]) => {
        setMessages(data || []);

        // Mark unread as read via socket
        const unreadIds = (data || [])
          .filter(m => m.receiverId === currentUser.id && !m.read)
          .map(m => m.id);
        if (unreadIds.length > 0 && socket?.connected) {
          socket.emit(DM_EVENTS.READ, { messageIds: unreadIds });
        }

        // Find user info if not set
        if (!activeUserInfo && data && data.length > 0) {
          const lastMsg = data[data.length - 1];
          const other = lastMsg.senderId === currentUser.id ? lastMsg.receiver : lastMsg.sender;
          if (other.id === activeUserId) setActiveUserInfo(other);
        }
      })
      .catch(() => {})
      .finally(() => setMessagesLoading(false));
  }, [currentUser, activeUserId, socket]);

  /* ─── Scroll to bottom on new messages ─── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ─── Select a conversation ─── */
  const selectConversation = useCallback((otherUser: UserInfo) => {
    setActiveUserId(otherUser.id);
    setActiveUserInfo(otherUser);
    setShowList(false);
    // Update URL without reload
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

  /* ─── Loading / Auth states ─── */

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

  /* ─── Helper to get unread count for a user ─── */
  const getUnreadCount = (otherUserId: string): number => {
    return unreadMap[otherUserId] || 0;
  };

  /* ─── Render ─── */

  return (
    <div className="container" style={{ maxWidth: '1200px', paddingTop: '16px', paddingBottom: '0', height: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
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
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '4px',
                display: 'none',
              }}
              className="mobile-back-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Mensajes</h1>
          <span style={{
            fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px',
            background: connected ? 'rgba(0,230,118,0.1)' : 'rgba(239,68,68,0.08)',
            color: connected ? 'var(--success)' : 'var(--error)',
            fontWeight: 600,
          }}>
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 720px) {
          .messenger-split { flex-direction: column !important; }
          .conv-list { width: 100% !important; max-width: 100% !important; border-right: none !important; }
          .conv-list-hidden { display: none !important; }
          .msg-pane-hidden { display: none !important; }
          .mobile-back-btn { display: flex !important; }
        }
      `}</style>

      {/* Main split view */}
      <div className="messenger-split" style={{
        display: 'flex', flex: 1, overflow: 'hidden', gap: '0',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {/* ─── LEFT: Conversation List ─── */}
        <div className={`conv-list ${!showList ? 'conv-list-hidden' : ''}`} style={{
          width: '320px', maxWidth: '320px', flexShrink: 0,
          borderRight: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Search / New Chat */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1px dashed rgba(255,255,255,0.1)',
                background: 'transparent', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva conversación
            </button>

            {showNewChat && (
              <div style={{ marginTop: '10px' }}>
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
                    Buscando...
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
                          padding: '10px 12px', borderRadius: '8px',
                          border: 'none', background: 'transparent', color: 'var(--text)',
                          cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                          width: '100%', textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                          background: u.vtuberProfile?.avatarUrl
                            ? `url(${u.vtuberProfile.avatarUrl}) center/cover`
                            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                        }}>
                          {!u.vtuberProfile?.avatarUrl && getInitial(u)}
                        </div>
                        <span>{getUsername(u)}</span>
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

          {/* Conversation items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {conversationsLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px', marginBottom: '2px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)', flexShrink: 0,
                      animation: 'shimmer 2s ease-in-out infinite',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        width: '60%', height: '12px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.04)', marginBottom: '6px',
                        animation: 'shimmer 2s ease-in-out infinite',
                      }} />
                      <div style={{
                        width: '80%', height: '10px', borderRadius: '5px',
                        background: 'rgba(255,255,255,0.03)',
                        animation: 'shimmer 2s ease-in-out infinite',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  No hay conversaciones aún
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, opacity: 0.7 }}>
                  Busca un usuario para iniciar un chat
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherUser(conv, currentUser.id);
                const unread = getUnreadCount(other.id);
                const isActive = activeUserId === other.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(other)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px', borderRadius: '10px',
                      border: 'none', background: isActive ? 'rgba(138,43,226,0.08)' : 'transparent',
                      color: 'var(--text)', cursor: 'pointer',
                      width: '100%', textAlign: 'left',
                      transition: 'background 0.12s',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                >
                  {/* Avatar with online dot */}
                  <div style={{
                    position: 'relative',
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: other.vtuberProfile?.avatarUrl
                      ? `url(${other.vtuberProfile.avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {!other.vtuberProfile?.avatarUrl && getInitial(other)}
                    {/* Online indicator dot */}
                    <div style={{
                      position: 'absolute', bottom: '1px', right: '1px',
                      width: '11px', height: '11px', borderRadius: '50%',
                      border: '2px solid var(--background)',
                      background: onlineUsers.has(other.id) ? '#22c55e' : '#555',
                      transition: 'background 0.3s ease',
                    }} />
                  </div>

                  {/* Info: solo nombre + online + badge, sin preview de mensaje */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          minWidth: 0, flex: 1,
                        }}>
                          <span style={{
                            fontWeight: isActive ? 700 : 600,
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {getUsername(other)}
                          </span>
                          <span style={{
                            display: 'inline-block',
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: onlineUsers.has(other.id) ? '#22c55e' : 'rgba(255,255,255,0.15)',
                            flexShrink: 0,
                          }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {unread > 0 && (
                            <span style={{
                              background: 'var(--secondary)', color: '#fff',
                              fontSize: '0.63rem', fontWeight: 700,
                              padding: '2px 7px', borderRadius: '10px',
                            }}>
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.68rem', color: 'var(--text-muted)',
                          }}>
                            {formatTime(conv.createdAt)}
                          </span>
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
                padding: '14px 18px',
                borderBottom: '1px solid var(--glass-border)',
                flexShrink: 0,
              }}>
                <button
                  onClick={() => setShowList(true)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: '2px', display: 'none',
                  }}
                  className="mobile-back-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <Link href={`/profile/${activeUserInfo.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  textDecoration: 'none', color: 'inherit', flex: 1,
                }}>
                  <div style={{
                    position: 'relative',
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: activeUserInfo.vtuberProfile?.avatarUrl
                      ? `url(${activeUserInfo.vtuberProfile.avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {!activeUserInfo.vtuberProfile?.avatarUrl && getInitial(activeUserInfo)}
                    {/* Online indicator dot */}
                    <div style={{
                      position: 'absolute', bottom: '0', right: '0',
                      width: '10px', height: '10px', borderRadius: '50%',
                      border: '2px solid var(--background)',
                      background: onlineUsers.has(activeUserInfo.id) ? '#22c55e' : '#555',
                      transition: 'background 0.3s ease',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {getUsername(activeUserInfo)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: onlineUsers.has(activeUserInfo.id) ? '#22c55e' : 'rgba(255,255,255,0.2)',
                      }} />
                      {onlineUsers.has(activeUserInfo.id) ? 'En línea' : 'Desconectado'}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Messages area */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                {messagesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <span style={{
                      width: '18px', height: '18px',
                      border: '2px solid rgba(255,255,255,0.08)',
                      borderTopColor: 'var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                    }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '8px',
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.3}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                      No hay mensajes aún
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, opacity: 0.7 }}>
                      Envía un mensaje para iniciar la conversación
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Date divider for today */}
                    {(() => {
                      const today = new Date().toDateString();
                      const yesterday = new Date(Date.now() - 86400000).toDateString();
                      let lastDate = '';
                      return messages.map((msg, idx) => {
                        const msgDate = new Date(msg.createdAt).toDateString();
                        let divider = null;
                        if (msgDate !== lastDate) {
                          lastDate = msgDate;
                          let label = msgDate === today ? 'Hoy' :
                            msgDate === yesterday ? 'Ayer' :
                            new Date(msg.createdAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                          divider = (
                            <div key={`divider-${msg.id}`} style={{
                              textAlign: 'center', padding: '12px 0 8px',
                              fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                              <span style={{
                                padding: '4px 14px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                              }}>
                                {label}
                              </span>
                            </div>
                          );
                        }

                        const isMine = msg.senderId === currentUser.id;
                        const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);

                        return (
                          <div key={msg.id}>
                            {divider}
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-end',
                              gap: '8px',
                              flexDirection: isMine ? 'row-reverse' : 'row',
                              maxWidth: '85%',
                              alignSelf: isMine ? 'flex-end' : 'flex-start',
                              marginLeft: isMine ? 'auto' : '0',
                            }}>
                              {showAvatar && (
                                <div style={{
                                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                                  background: activeUserInfo.vtuberProfile?.avatarUrl
                                    ? `url(${activeUserInfo.vtuberProfile.avatarUrl}) center/cover`
                                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontSize: '0.55rem', fontWeight: 700,
                                }}>
                                  {!activeUserInfo.vtuberProfile?.avatarUrl && getInitial(activeUserInfo)}
                                </div>
                              )}
                              {!showAvatar && !isMine && <div style={{ width: '26px', flexShrink: 0 }} />}
                              <div style={{
                                background: isMine
                                  ? 'linear-gradient(135deg, var(--primary), #7c6aff)'
                                  : 'rgba(255,255,255,0.06)',
                                padding: '10px 14px',
                                borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                maxWidth: '100%',
                              }}>
                                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.45, wordBreak: 'break-word' }}>
                                  {msg.content}
                                </p>
                                <div style={{
                                  display: 'flex', alignItems: 'center', justifyContent: isMine ? 'flex-end' : 'flex-start',
                                  gap: '4px', marginTop: '4px',
                                }}>
                                  <span style={{ fontSize: '0.62rem', opacity: 0.5 }}>
                                    {formatTimeFull(msg.createdAt)}
                                  </span>
                                  {isMine && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill={msg.read ? 'var(--accent)' : 'rgba(255,255,255,0.3)'} style={{ opacity: msg.read ? 1 : 0.4 }}>
                                      <path d="M9 12l2 2 4-4" stroke={msg.read ? 'var(--accent)' : 'rgba(255,255,255,0.3)'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M9 12l2 2 4-4" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicator */}
              {typingUserId && (
                <div style={{ padding: '4px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {getUsername(activeUserInfo)} está escribiendo...
                </div>
              )}

              {/* Input area */}
              <form
                onSubmit={handleSend}
                style={{
                  display: 'flex', gap: '8px',
                  padding: '12px 18px',
                  borderTop: '1px solid var(--glass-border)',
                  flexShrink: 0,
                }}
              >
                <input
                  ref={inputRef}
                  className="input"
                  style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem' }}
                  placeholder="Escribe un mensaje..."
                  value={input}
                  onChange={handleInputChange}
                  disabled={!connected}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="btn"
                  style={{
                    padding: '10px 20px', fontSize: '0.85rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                  disabled={!connected || !input.trim() || sending}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Enviar
                </button>
              </form>
            </>
          ) : (
            /* Empty state — no conversation selected */
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '16px',
              padding: '40px',
            }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.25}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="12" y1="9" x2="16" y2="9" /><line x1="12" y1="13" x2="14" y2="13" />
              </svg>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
                Selecciona una conversación
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', opacity: 0.7, margin: 0, textAlign: 'center', maxWidth: '300px' }}>
                Elige un chat de la lista o busca un usuario para iniciar una conversación privada
              </p>
              <button
                onClick={() => setShowList(true)}
                className="btn"
                style={{ padding: '10px 24px', fontSize: '0.85rem', display: 'none' }}
              >
                Ver conversaciones
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ClientOnly
      fallback={
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '1200px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Cargando mensajes...</p>
        </div>
      }
    >
      <MessengerContent />
    </ClientOnly>
  );
}
