'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

function NotificationsContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchNotifications();
    }
  }, [user, isLoading, router]);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications?limit=50', {});
      setNotifications(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  }, []);

  const getNotificationLink = (n: Notification) => {
    switch (n.type) {
      case 'follow': return `/profile/${n.referenceId}`;
      case 'event_attend':
      case 'event_created': return `/events/${n.referenceId}`;
      case 'guild_joined': return `/guilds/${n.referenceId}`;
      case 'achievement': return '/achievements';
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      follow: 'FL',
      event_attend: 'EV',
      event_created: 'EV',
      guild_joined: 'GL',
      achievement: 'AC',
      level_up: 'LV',
    };
    return icons[type] || 'NT';
  };

  if (isLoading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!user) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Notificaciones</h1>
          {unreadCount > 0 && (
            <p style={{ color: 'var(--muted)', margin: '4px 0 0 0' }}>
              Tienes {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn"
            style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--primary)' }}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          Cargando notificaciones...
        </div>
      ) : error ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
          Error: {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          No tienes notificaciones todavía.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((n) => {
            const link = getNotificationLink(n);
            const content = (
              <div
                className="glass"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: link ? 'pointer' : 'default',
                  borderLeft: n.read ? '3px solid transparent' : '3px solid var(--primary)',
                  opacity: n.read ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
                onClick={() => {
                  if (!n.read) handleMarkAsRead(n.id);
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: n.read ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  {getTypeIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{n.title}</strong>
                    {!n.read && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px', opacity: 0.7 }}>
                    {new Date(n.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {link && (
                  <Link
                    href={link}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Ver →
                  </Link>
                )}
              </div>
            );

            if (link) {
              return (
                <Link
                  key={n.id}
                  href={link}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  onClick={() => {
                    if (!n.read) handleMarkAsRead(n.id);
                  }}
                >
                  {content}
                </Link>
              );
            }

            return <div key={n.id}>{content}</div>;
          })}
        </div>
      )}
    </>
  );
}

export default function NotificationsPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px', maxWidth: '700px' }}>
      <ClientOnly
        fallback={
          <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
            Cargando notificaciones...
          </div>
        }
      >
        <NotificationsContent />
      </ClientOnly>
    </div>
  );
}
