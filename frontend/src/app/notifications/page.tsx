'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { ShimmerBlock } from '@/components/ui/Skeleton';
import { connectSocket, NOTIFICATION_EVENTS } from '@/lib/socket-client';

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

const LIMIT = 30;

function NotificationsContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    try {
      const data = await apiFetch(`/notifications?limit=${LIMIT}&page=${pageNum}`, {});
      setNotifications(prev => append ? [...prev, ...data] : data);
      // If we got fewer results than the limit, there's no more
      if (Array.isArray(data) && data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(pageNum);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchNotifications(1);
    }
  }, [user, isLoading, router, fetchNotifications]);

  // Socket listener for real-time notifications
  useEffect(() => {
    if (!user) return;
    let sock: any;
    try {
      sock = connectSocket();
      sock.on(NOTIFICATION_EVENTS.NEW, (notif: Notification) => {
        // Prepend new notification to the top
        setNotifications(prev => [notif, ...prev]);
      });
    } catch {}
    return () => {
      if (sock) sock.off(NOTIFICATION_EVENTS.NEW);
    };
  }, [user]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      // Dispatch event so Navbar can refresh unread count
      window.dispatchEvent(new CustomEvent('notifications-read'));
    } catch {}
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Dispatch event so Navbar can refresh unread count
      window.dispatchEvent(new CustomEvent('notifications-read'));
    } catch {}
  }, []);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    await fetchNotifications(page + 1, true);
  }, [page, fetchNotifications]);

  const getNotificationLink = (n: Notification) => {
    switch (n.type) {
      case 'follow': return `/profile/${n.referenceId}`;
      case 'like':
      case 'comment':
      case 'mention': return `/feed?post=${n.referenceId}`;
      case 'event_attend':
      case 'event_created': return `/events/${n.referenceId}`;
      case 'guild_joined': return `/guilds/${n.referenceId}`;
      case 'achievement':
      case 'level_up': return '/achievements';
      case 'dm': return '/chat';
      case 'friend_request':
      case 'friend_accept': return `/profile/${n.referenceId}`;
      case 'vtuber_request': return '/admin/vtuber-requests';
      // Handle both old uppercase (DB legacy) and new lowercase types
      case 'VTUBER_APPROVED':
      case 'vtuber_approved':
      case 'VTUBER_REJECTED':
      case 'vtuber_rejected':
      case 'VTUBER_VERIFIED':
      case 'vtuber_verified': return '/vtuber-profile';
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      follow: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      like: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
      comment: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      mention: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="23 11 23 19"/><polyline points="23 19 27 15"/><polyline points="23 19 19 15"/></svg>,
      event_attend: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      event_created: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>,
      guild_joined: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      achievement: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
      level_up: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 12 7 1 18"/><polyline points="23 13 12 2 1 13"/></svg>,
      dm: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      friend_request: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>,
      friend_accept: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
      vtuber_approved: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      vtuber_rejected: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
      vtuber_verified: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
    };
    return icons[type] || <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass" style={{
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px',
              borderLeft: '3px solid var(--primary)',
              animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
            }}>
              <ShimmerBlock width="40px" height="40px" borderRadius="50%" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShimmerBlock width="140px" height="16px" borderRadius="4px" />
                  <ShimmerBlock width="8px" height="8px" borderRadius="50%" />
                </div>
                <ShimmerBlock width="80%" height="14px" borderRadius="4px" />
                <ShimmerBlock width="100px" height="12px" borderRadius="4px" />
              </div>
              <ShimmerBlock width="50px" height="14px" borderRadius="4px" />
            </div>
          ))}
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
            const handleClick = () => {
              if (!n.read) handleMarkAsRead(n.id);
              if (link) router.push(link);
            };
            return (
              <div
                key={n.id}
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
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.background = '';
                }}
                onClick={handleClick}
                onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
                tabIndex={link ? 0 : -1}
                role={link ? 'button' : undefined}
                aria-label={n.title}
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
                    flexShrink: 0,
                  }}
                >
                  <span style={{ display: 'inline-flex', opacity: 0.7 }}>{getTypeIcon(n.type)}</span>
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
                  <span style={{
                    color: 'var(--primary)',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    opacity: 0.6,
                  }}>
                    →
                  </span>
                )}
              </div>
            );
          })}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="btn"
              style={{
                padding: '10px', fontSize: '0.85rem', width: '100%',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {loadingMore ? 'Cargando...' : 'Cargar más notificaciones ↓'}
            </button>
          )}
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
          <div className="container" style={{ paddingTop: '20px', maxWidth: '700px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '3px solid var(--primary)' }}>
                  <ShimmerBlock width="40px" height="40px" borderRadius="50%" />
                  <div style={{ flex: 1 }}>
                    <ShimmerBlock width="140px" height="16px" borderRadius="4px" />
                    <ShimmerBlock width="80%" height="14px" borderRadius="4px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <NotificationsContent />
      </ClientOnly>
    </div>
  );
}
