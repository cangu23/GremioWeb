'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { connectSocket, disconnectSocket, CHAT_EVENTS } from '@/lib/socket-client';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import type { Socket } from 'socket.io-client';

interface ChatUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  displayName: string | null;
}

interface ChatMessage {
  id: string;
  room: string;
  userId: string;
  content: string;
  createdAt: string;
  user: ChatUser;
}

interface TypingUser {
  userId: string;
  username: string;
  isTyping: boolean;
}

function ChatContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;

    let sock: Socket;
    try {
      sock = connectSocket();
      setSocket(sock);
    } catch {
      return;
    }

    sock.on('connect', () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));

    sock.on(CHAT_EVENTS.HISTORY, (history: ChatMessage[]) => {
      setMessages(history);
    });

    sock.on(CHAT_EVENTS.MESSAGE, (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    sock.on(CHAT_EVENTS.TYPING, (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(t => t.userId !== data.userId);
        if (data.isTyping) {
          return [...filtered, data];
        }
        return filtered;
      });
    });

    sock.on(CHAT_EVENTS.ERROR, (err: { message: string }) => {
      console.error('[Chat] Error:', err.message);
    });

    return () => {
      sock.off(CHAT_EVENTS.HISTORY);
      sock.off(CHAT_EVENTS.MESSAGE);
      sock.off(CHAT_EVENTS.TYPING);
      sock.off(CHAT_EVENTS.ERROR);
      sock.off('connect');
      sock.off('disconnect');
      disconnectSocket();
    };
  }, [user, isLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit(CHAT_EVENTS.MESSAGE, { content: input.trim() });
    setInput('');

    // Stop typing indicator
    socket.emit(CHAT_EVENTS.TYPING, { isTyping: false });
  }, [input, socket]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!socket) return;

    socket.emit(CHAT_EVENTS.TYPING, { isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(CHAT_EVENTS.TYPING, { isTyping: false });
    }, 2000);
  }, [socket]);

  if (isLoading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!user) return null;

  const typingNames = typingUsers
    .filter(t => t.userId !== user.id)
    .map(t => t.username);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Chat Global</h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
            {connected ? 'Conectado' : 'Desconectado'}
          </p>
        </div>
        <Link href="/notifications" style={{ color: 'var(--primary)', fontSize: '0.9rem', textDecoration: 'none' }}>
          Notificaciones
        </Link>
      </div>

      <div
        className="glass"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 240px)',
          minHeight: '400px',
          overflow: 'hidden',
        }}
      >
        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)',
                fontSize: '0.95rem',
              }}
            >
              No hay mensajes aún. ¡Sé el primero en escribir!
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.userId === user.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '10px',
                    flexDirection: isMine ? 'row-reverse' : 'row',
                    maxWidth: '80%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isMine && (
                    <Link href={`/profile/${msg.userId}`}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: msg.user.avatarUrl
                            ? `url(${msg.user.avatarUrl}) center/cover`
                            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {!msg.user.avatarUrl && msg.user.username.charAt(0).toUpperCase()}
                      </div>
                    </Link>
                  )}
                  <div
                    style={{
                      background: isMine
                        ? 'linear-gradient(135deg, var(--primary), #7c6aff)'
                        : 'rgba(255,255,255,0.06)',
                      padding: '10px 14px',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      maxWidth: '100%',
                    }}
                  >
                    {!isMine && (
                      <Link
                        href={`/profile/${msg.userId}`}
                        style={{
                          color: 'var(--primary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'block',
                          marginBottom: '2px',
                        }}
                      >
                        {msg.user.displayName || msg.user.username}
                      </Link>
                    )}
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {msg.content}
                    </p>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        opacity: 0.5,
                        marginTop: '4px',
                        textAlign: isMine ? 'right' : 'left',
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingNames.length > 0 && (
          <div style={{ padding: '4px 16px', fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
            {typingNames.length === 1
              ? `${typingNames[0]} está escribiendo...`
              : `${typingNames.join(', ')} están escribiendo...`}
          </div>
        )}

        {/* Input area */}
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <input
            className="input"
            style={{ flex: 1, padding: '10px 16px', fontSize: '0.9rem' }}
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={handleInputChange}
            disabled={!connected}
            maxLength={1000}
          />
          <button
            type="submit"
            className="btn"
            style={{ padding: '10px 24px' }}
            disabled={!connected || !input.trim()}
          >
            Enviar
          </button>
        </form>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px', maxWidth: '800px' }}>
      <ClientOnly
        fallback={
          <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
            Cargando chat...
          </div>
        }
      >
        <ChatContent />
      </ClientOnly>
    </div>
  );
}
