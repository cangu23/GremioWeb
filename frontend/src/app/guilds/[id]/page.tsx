'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { connectSocket, getSocket } from '@/lib/socket-client';
import ClientOnly from '@/lib/ClientOnly';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Socket } from 'socket.io-client';

interface GuildMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    vtuberProfile?: { displayName: string; avatarUrl: string | null; isVerified?: boolean } | null;
  };
}

interface GuildChannel {
  id: string;
  name: string;
  type: string;
  position: number;
  _count: { messages: number };
}

interface GuildDetail {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  tags?: string | null;
  creatorId: string;
  creator: { id: string; username: string; vtuberProfile?: { displayName: string; avatarUrl: string | null } | null };
  _count: { members: number };
  isMember: boolean;
  myRole: string | null;
  members: GuildMember[];
  channels?: GuildChannel[];
}

interface ChatMessage {
  id: string;
  channelId: string;
  guildId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified?: boolean;
  };
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  LEADER: { label: 'Líder', color: '#ff007f', bg: 'rgba(255,0,127,0.15)' },
  OFFICER: { label: 'Oficial', color: '#8a2be2', bg: 'rgba(138,43,226,0.15)' },
  MEMBER: { label: 'Miembro', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' },
};

function GuildDetailContent() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [guild, setGuild] = useState<GuildDetail | null>(null);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [hoverMsgId, setHoverMsgId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, { username: string; displayName: string | null }>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef<number>(0);
  const typingCleanupRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  const fetchGuild = useCallback(async () => {
    try {
      const data = await apiFetch(`/guilds/${id}`);
      setGuild(data);
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchChannels = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetch(`/guilds/${id}/channels`);
      setChannels(data);
      return data;
    } catch { return []; }
  }, [id, user]);

  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      const data = await apiFetch(`/guilds/${id}/channels/${channelId}/messages?limit=50`);
      setMessages(data);
    } catch { setMessages([]); }
  }, [id]);

  // Initial load
  useEffect(() => {
    if (!id) return;
    const init = async () => {
      const g = await fetchGuild();
      if (g?.isMember) {
        const ch = await fetchChannels();
        if (ch && ch.length > 0) {
          setActiveChannel(ch[0].id);
        }
      }
    };
    init();
  }, [id, fetchGuild, fetchChannels]);

  // Load messages when active channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel);
    }
    // Clear typing indicator when switching channels
    setTypingUsers({});
  }, [activeChannel, fetchMessages]);

  // Socket connection for guild messaging (join/leave only, no activeChannel dep)
  useEffect(() => {
    if (!user || !id) return;
    let sock: Socket;
    try {
      sock = connectSocket();
      socketRef.current = sock;
      sock.emit('guild:join', { guildId: id as string });
    } catch (err) {
      console.warn('[Socket] Could not connect:', err);
    }

    return () => {
      if (sock) {
        sock.emit('guild:leave', { guildId: id as string });
      }
    };
  }, [user, id]);

  // Socket message & typing listener (separate effect to avoid re-joining guild on channel switch)
  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;

    const onMessage = (msg: ChatMessage) => {
      if (msg.channelId === activeChannel) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const onMessageDeleted = (data: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    };

    const onMessageUpdated = (msg: ChatMessage) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    };

    const onTyping = (data: { userId: string; username: string; displayName: string | null; channelId: string; isTyping: boolean }) => {
      // Only show typing indicator for the active channel
      if (data.channelId !== activeChannel) return;
      // Don't show own typing
      if (data.userId === user?.id) return;

      setTypingUsers(prev => {
        const next = { ...prev };
        if (data.isTyping) {
          next[data.userId] = { username: data.username, displayName: data.displayName };
          // Auto-cleanup after 5s in case we miss the stop event
          const existing = typingCleanupRef.current.get(data.userId);
          if (existing) clearTimeout(existing);
          typingCleanupRef.current.set(data.userId, setTimeout(() => {
            setTypingUsers(p => {
              const updated = { ...p };
              delete updated[data.userId];
              return updated;
            });
            typingCleanupRef.current.delete(data.userId);
          }, 5000));
        } else {
          delete next[data.userId];
          const existing = typingCleanupRef.current.get(data.userId);
          if (existing) { clearTimeout(existing); typingCleanupRef.current.delete(data.userId); }
        }
        return next;
      });
    };

    sock.on('guild:message', onMessage);
    sock.on('guild:message:deleted', onMessageDeleted);
    sock.on('guild:message:updated', onMessageUpdated);
    sock.on('guild:typing', onTyping);
    sock.on('guild:error', (err: { message: string }) => {
      console.warn('[Guild Socket]', err.message);
    });

    return () => {
      sock.off('guild:message', onMessage);
      sock.off('guild:message:deleted', onMessageDeleted);
      sock.off('guild:message:updated', onMessageUpdated);
      sock.off('guild:typing', onTyping);
      sock.off('guild:error');
      // Clean up typing timeouts
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingCleanupRef.current.forEach(t => clearTimeout(t));
      typingCleanupRef.current.clear();
    };
  }, [activeChannel, user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Emit typing indicator with throttling
  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 2500) return; // throttle every 2.5s
    lastTypingEmitRef.current = now;
    socketRef.current?.emit('guild:typing', {
      guildId: id as string,
      channelId: activeChannel,
      isTyping: true,
    });
  }, [id, activeChannel]);

  const handleSendMessage = () => {
    if (!input.trim() || !activeChannel || !socketRef.current) return;
    const content = input.trim();
    setInput('');
    // Stop typing indicator on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('guild:typing', {
      guildId: id as string,
      channelId: activeChannel,
      isTyping: false,
    });
    socketRef.current.emit('guild:message', {
      guildId: id as string,
      channelId: activeChannel,
      content,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.length > 0) {
      emitTyping();
      // After user stops typing for 3s, emit stop
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('guild:typing', {
          guildId: id as string,
          channelId: activeChannel,
          isTyping: false,
        });
      }, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`/guilds/${id}/channels`, {
        method: 'POST',
        body: JSON.stringify({ name: newChannelName.trim() }),
      });
      setNewChannelName('');
      setShowCreateChannel(false);
      await fetchChannels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`/guilds/${id}/channels/${activeChannel}/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editContent.trim() }),
      });
      setEditingMessageId(null);
      setEditContent('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('¿Eliminar este mensaje?')) return;
    setDeletingMsgId(messageId);
    try {
      await apiFetch(`/guilds/${id}/channels/${activeChannel}/messages/${messageId}`, {
        method: 'DELETE',
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setDeletingMsgId(null);
    }
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    if (!confirm(`¿Eliminar el canal #${channelName}? Todos los mensajes se perderán.`)) return;
    try {
      await apiFetch(`/guilds/${id}/channels/${channelId}`, { method: 'DELETE' });
      const updatedChannels = channels.filter(c => c.id !== channelId);
      setChannels(updatedChannels);
      if (activeChannel === channelId) {
        setActiveChannel(updatedChannels.length > 0 ? updatedChannels[0].id : null);
        setMessages([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/guilds/${id}/leave`, { method: 'POST' });
      router.push('/guilds');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar el gremio para siempre?')) return;
    setActionLoading(true);
    try {
      await apiFetch(`/guilds/${id}`, { method: 'DELETE' });
      router.push('/guilds');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); setActionLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <span style={{
          width: '24px', height: '24px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          marginRight: '12px',
        }} />
        Cargando gremio...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--error)' }}>Error: {error}</p>
        <Link href="/guilds" className="btn" style={{ padding: '10px 20px', borderRadius: '10px' }}>← Volver</Link>
      </div>
    );
  }

  if (!guild) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '3rem' }}>🔍</div>
        <p style={{ color: 'var(--text-muted)' }}>Gremio no encontrado.</p>
        <Link href="/guilds" className="btn" style={{ padding: '10px 20px', borderRadius: '10px' }}>← Volver</Link>
      </div>
    );
  }

  const canManage = guild.myRole === 'LEADER' || guild.myRole === 'OFFICER';

  if (!guild.isMember) {
    return <NonMemberView guild={guild} onJoin={() => fetchGuild().then() } />;
  }

  const activeChannelObj = channels.find(c => c.id === activeChannel);

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden',
      background: 'var(--bg)', borderRadius: '12px', margin: '8px',
      border: '1px solid var(--glass-border)',
    }}>
      {/* ===== LEFT SIDEBAR: Channels ===== */}
      <div style={{
        width: '240px', minWidth: '240px', background: 'rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--glass-border)',
      }}>
        {/* Guild name header */}
        <div style={{
          padding: '16px 16px', borderBottom: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Link href="/guilds" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>←</Link>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: guild.logoUrl ? `url(${guild.logoUrl}) center/cover` : 'linear-gradient(135deg, var(--secondary), var(--primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', color: 'white', fontWeight: 'bold', flexShrink: 0,
          }}>
            {!guild.logoUrl && guild.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {guild.name}
          </span>
        </div>

        {/* Channel list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '4px 8px', marginBottom: '4px',
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Canales de texto
            </span>
            {canManage && (
              <button onClick={() => setShowCreateChannel(!showCreateChannel)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '1rem', padding: '2px 6px', borderRadius: '4px',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                title="Crear canal"
              >
                +
              </button>
            )}
          </div>

          {showCreateChannel && (
            <div style={{ padding: '4px 8px', marginBottom: '8px', display: 'flex', gap: '4px' }}>
              <input
                autoFocus
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateChannel(); if (e.key === 'Escape') setShowCreateChannel(false); }}
                placeholder="nombre-del-canal"
                style={{
                  flex: 1, padding: '6px 8px', borderRadius: '6px', fontSize: '0.8rem',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', outline: 'none',
                }}
              />
              <button onClick={handleCreateChannel} disabled={actionLoading} style={{
                padding: '6px 10px', borderRadius: '6px', background: 'var(--primary)',
                color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
              }}>+</button>
            </div>
          )}

          {channels.map(ch => (
            <div
              key={ch.id}
              style={{
                display: 'flex', alignItems: 'center', borderRadius: '8px', marginBottom: '2px',
                background: activeChannel === ch.id ? 'rgba(138,43,226,0.15)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <button
                onClick={() => setActiveChannel(ch.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', fontSize: '0.85rem',
                  color: activeChannel === ch.id ? 'var(--primary)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: 'transparent',
                  transition: 'color 0.15s', minWidth: 0,
                }}
                onMouseEnter={e => { if (activeChannel !== ch.id) { e.currentTarget.style.color = 'var(--text)'; } }}
                onMouseLeave={e => { if (activeChannel !== ch.id) { e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                <span>#</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
              </button>
              {canManage && (
                <button
                  onClick={() => handleDeleteChannel(ch.id, ch.name)}
                  style={{
                    background: 'none', border: 'none', color: 'transparent',
                    cursor: 'pointer', fontSize: '0.7rem', padding: '4px 6px', borderRadius: '4px',
                    transition: 'all 0.15s', flexShrink: 0, lineHeight: 1,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#f44336';
                    e.currentTarget.style.background = 'rgba(244,67,54,0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'transparent';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  title="Eliminar canal"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* User footer */}
        <div style={{
          padding: '10px 12px', borderTop: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0,
          }}>
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </div>
            <div style={{
              fontSize: '0.7rem', fontWeight: 600,
              color: guild.myRole ? (roleConfig[guild.myRole]?.color || 'var(--text-muted)') : 'var(--text-muted)',
            }}>
              {guild.myRole ? (roleConfig[guild.myRole]?.label || guild.myRole) : 'Miembro'}
            </div>
          </div>
          {guild.myRole !== 'LEADER' && (
            <button onClick={handleLeave} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(255,77,79,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              title="Salir del gremio"
            >
              ✕
            </button>
          )}
          {guild.myRole === 'LEADER' && (
            <button onClick={handleDelete} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f44336'; e.currentTarget.style.background = 'rgba(244,67,54,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              title="Eliminar gremio"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* ===== CENTER: Chat area ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Channel header */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.95rem',
          background: 'rgba(0,0,0,0.1)',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>#</span>
          <span>{activeChannelObj?.name || 'Selecciona un canal'}</span>
          <span style={{ flex: 1 }} />
          <button onClick={() => setShowMembers(!showMembers)} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            👥 {guild.members.length}
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {!activeChannel ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '2rem' }}>💬</div>
              <div style={{ fontSize: '0.9rem' }}>Selecciona un canal para empezar a chatear</div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '2rem' }}>#</div>
              <div style={{ fontSize: '0.9rem' }}>Bienvenido a <strong>#{activeChannelObj?.name}</strong></div>
              <div style={{ fontSize: '0.8rem' }}>Este es el inicio del canal</div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isSameUser = i > 0 && messages[i - 1].user.id === msg.user.id;
              const showAvatar = !isSameUser;
              const timeAgo = getTimeAgo(new Date(msg.createdAt));
              const isOwn = user?.id === msg.user.id;
              const canManageMsg = canManage || isOwn;
              const isEditing = editingMessageId === msg.id;
              const isDeleting = deletingMsgId === msg.id;
              return (
                <div
                  key={msg.id}
                  style={{ display: 'flex', gap: '12px', padding: '2px 0', marginTop: showAvatar ? '8px' : '0', position: 'relative' }}
                  onMouseEnter={() => setHoverMsgId(msg.id)}
                  onMouseLeave={() => setHoverMsgId(null)}
                >
                  {showAvatar ? (
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                      background: msg.user.avatarUrl
                        ? `url(${msg.user.avatarUrl}) center/cover`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.75rem', fontWeight: 'bold', overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {!msg.user.avatarUrl && (msg.user.displayName || msg.user.username).charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div style={{ width: '36px', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {showAvatar && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: getUsernameColor(msg.user.id) }}>
                          {msg.user.displayName || msg.user.username}
                        </span>
                        {msg.user.isVerified && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0" aria-label="Verificado">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeAgo}</span>
                      </div>
                    )}

                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        <textarea
                          autoFocus
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleEditMessage(msg.id);
                            }
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)',
                            color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                            resize: 'none', minHeight: '60px', fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditMessage(msg.id)}
                            disabled={actionLoading || !editContent.trim()}
                            style={{
                              padding: '6px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                              background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
                            }}
                          >
                            {actionLoading ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: '6px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                              background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                    )}
                  </div>

                  {/* Hover actions: Edit / Delete */}
                  {hoverMsgId === msg.id && canManageMsg && !isEditing && (
                    <div style={{
                      position: 'absolute', top: showAvatar ? '0' : '0', right: '0',
                      display: 'flex', gap: '2px',
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                      borderRadius: '6px', padding: '2px',
                    }}>
                      {isOwn && (
                        <button
                          onClick={() => handleStartEdit(msg)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '0.75rem', padding: '4px 7px', borderRadius: '4px',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                          title="Editar mensaje"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        disabled={isDeleting}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)',
                          cursor: 'pointer', fontSize: '0.75rem', padding: '4px 7px', borderRadius: '4px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f44336'; e.currentTarget.style.background = 'rgba(244,67,54,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                        title="Eliminar mensaje"
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />

          {/* Typing indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 0', fontSize: '0.8rem', color: 'var(--text-muted)',
            }}>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: 'var(--text-muted)',
                  animation: 'typingBounce 1.4s ease-in-out infinite',
                }} />
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: 'var(--text-muted)',
                  animation: 'typingBounce 1.4s ease-in-out infinite 0.2s',
                }} />
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: 'var(--text-muted)',
                  animation: 'typingBounce 1.4s ease-in-out infinite 0.4s',
                }} />
              </div>
              <span>
                {Object.values(typingUsers).map(t => t.displayName || t.username).join(', ')}
                {Object.keys(typingUsers).length === 1 ? ' está escribiendo...' : ' están escribiendo...'}
              </span>
            </div>
          )}
        </div>

        {/* Chat input */}
        {activeChannel && (
          <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(0,0,0,0.25)', borderRadius: '10px',
              padding: '4px 4px 4px 16px',
              border: '1px solid var(--glass-border)',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <input
                ref={chatInputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Mensaje en #${activeChannelObj?.name || '...'}`}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text)', fontSize: '0.9rem', padding: '10px 0',
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem',
                  background: input.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: input.trim() ? 'white' : 'var(--text-muted)',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { if (input.trim()) { e.currentTarget.style.opacity = '0.9'; } }}
                onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== RIGHT SIDEBAR: Members ===== */}
      {showMembers && (
        <div style={{
          width: '240px', minWidth: '240px', background: 'rgba(0,0,0,0.15)',
          borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Miembros — {guild.members.length}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {(['LEADER', 'OFFICER', 'MEMBER'] as const).map(role => {
              const rc = roleConfig[role];
              const roleMembers = guild.members.filter(m => m.role === role);
              if (roleMembers.length === 0) return null;
              return (
                <div key={role} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    {role === 'LEADER' ? `👑 ${rc.label}` : role === 'OFFICER' ? `⭐ ${rc.label}` : `👤 ${rc.label}`} — {roleMembers.length}
                  </div>
                  {roleMembers.map(member => (
                    <Link
                      key={member.id}
                      href={`/profile/${member.user.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '6px 8px', borderRadius: '8px', textDecoration: 'none',
                        color: 'var(--text)', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0,
                        }}>
                          {(member.user.vtuberProfile?.displayName || member.user.username).charAt(0).toUpperCase()}
                        </div>
                        {/* Online indicator */}
                        <div style={{
                          position: 'absolute', bottom: '-1px', right: '-1px',
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: '#00e676', border: '2px solid var(--bg)',
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.user.vtuberProfile?.displayName || member.user.username}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Non-member view: show the old detail page with Join button
function NonMemberView({ guild, onJoin }: { guild: GuildDetail; onJoin: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const tags = guild.tags ? guild.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <Link href="/guilds" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        ← Volver a gremios
      </Link>
      <div className="glass" style={{ padding: '40px', maxWidth: '740px', margin: '0 auto', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--secondary), var(--primary))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: guild.logoUrl ? `url(${guild.logoUrl}) center/cover` : 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 'bold', flexShrink: 0 }}>
            {!guild.logoUrl && guild.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>{guild.name}</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👥 {guild._count.members} miembros</span>
          </div>
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {tags.map(tag => <span key={tag} style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '10px', background: 'rgba(138,43,226,0.12)', color: 'var(--primary)', fontWeight: 500 }}>#{tag}</span>)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0 }}>
            {(guild.creator.vtuberProfile?.displayName || guild.creator.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{guild.creator.vtuberProfile?.displayName || guild.creator.username}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{guild.creator.username} — Fundador</div>
          </div>
        </div>
        <p style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.95rem', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>{guild.description}</p>
        {user ? (
          <button onClick={onJoin} className="btn" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
            ✦ Unirse al Gremio
          </button>
        ) : (
          <Link href="/login" className="btn" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
            Inicia sesión para unirte
          </Link>
        )}
      </div>
    </div>
  );
}

// Helper: consistent username colors
const USERNAME_COLORS = ['#8a2be2', '#ff007f', '#00e676', '#2196f3', '#ff9800', '#00bcd4', '#e91e63', '#4caf50'];
function getUsernameColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
  }
  return USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length];
}

// Helper: relative time
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function GuildDetailPage() {
  return (
    <ClientOnly fallback={
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <span style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '12px' }} />
        Cargando gremio...
      </div>
    }>
      <GuildDetailContent />
    </ClientOnly>
  );
}
