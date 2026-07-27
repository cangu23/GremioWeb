'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { ShimmerBlock } from '@/components/ui/Skeleton';
import { connectSocket, NOTIFICATION_EVENTS } from '@/lib/socket-client';
import { useToast } from '@/lib/ToastContext';
import GiftEnvelopeModal, { GiftData } from '@/components/ui/GiftEnvelopeModal';

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
type FilterTab = 'ALL' | 'UNREAD' | 'SOCIAL' | 'INTERACTION' | 'STELLAR';

function NotificationsContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [showGiftEnvelope, setShowGiftEnvelope] = useState(false);
  const [giftEnvelopeData, setGiftEnvelopeData] = useState<GiftData | null>(null);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    try {
      const data = await apiFetch(`/notifications?limit=${LIMIT}&page=${pageNum}`, {});
      setNotifications(prev => append ? [...prev, ...data] : data);
      if (Array.isArray(data) && data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(pageNum);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar notificaciones');
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
        setNotifications(prev => [notif, ...prev]);
        showToast(`🔔 ${notif.title}`, 'info');
      });
    } catch {}
    return () => {
      if (sock) sock.off(NOTIFICATION_EVENTS.NEW);
    };
  }, [user, showToast]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notifications-read'));
    } catch {}
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent('notifications-read'));
      showToast('Todas las notificaciones marcadas como leídas', 'success');
    } catch {}
  }, [showToast]);

  const handleDeleteNotification = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new CustomEvent('notifications-read'));
    } catch {}
  }, []);

  const handleClearRead = useCallback(async () => {
    try {
      await apiFetch('/notifications/clear-read', { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => !n.read));
      showToast('Notificaciones leídas eliminadas', 'success');
    } catch {}
  }, [showToast]);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    await fetchNotifications(page + 1, true);
  }, [page, fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === 'UNREAD') return !n.read;
      if (activeTab === 'SOCIAL') return ['follow', 'friend_request', 'friend_accept'].includes(n.type);
      if (activeTab === 'INTERACTION') return ['like', 'comment', 'mention', 'dm'].includes(n.type);
      if (activeTab === 'STELLAR') return ['achievement', 'level_up', 'event_attend', 'event_created', 'guild_joined', 'vtuber_approved', 'vtuber_rejected', 'vtuber_verified'].includes(n.type);
      return true;
    });
  }, [notifications, activeTab]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

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
    const icons: Record<string, { icon: React.ReactNode; color: string }> = {
      follow: {
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>,
        color: '#38bdf8',
      },
      like: {
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
        color: '#ff4d6a',
      },
      comment: {
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
        color: '#8b5cf6',
      },
      mention: {
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>,
        color: '#ec4899',
      },
      achievement: {
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
        color: '#f59e0b',
      },
      level_up: {
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 12 7 1 18"/><polyline points="23 13 12 2 1 13"/></svg>,
        color: '#10b981',
      },
      event_created: {
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
        color: '#00d4aa',
      },
      guild_joined: {
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
        color: '#9b6bff',
      },
    };
    return icons[type] || {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
      color: 'var(--primary)',
    };
  };

  return (
    <>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800 }}>Notificaciones</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            {unreadCount > 0 ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer` : 'Estás al día con tus notificaciones'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn"
              style={{ padding: '8px 14px', fontSize: '0.82rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--primary)' }}
            >
              ✓ Leer todas
            </button>
          )}

          {notifications.some(n => n.read) && (
            <button
              onClick={handleClearRead}
              style={{
                padding: '8px 14px', fontSize: '0.82rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              title="Borrar notificaciones ya leídas"
            >
              🗑️ Limpiar leídas
            </button>
          )}
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
        {[
          { key: 'ALL', label: 'Todas' },
          { key: 'UNREAD', label: `Sin leer ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
          { key: 'SOCIAL', label: 'Social' },
          { key: 'INTERACTION', label: 'Interacciones' },
          { key: 'STELLAR', label: 'Comunidad & Estelar' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as FilterTab)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: activeTab === tab.key ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
              background: activeTab === tab.key ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '14px' }}>
              <ShimmerBlock width="42px" height="42px" borderRadius="50%" />
              <div style={{ flex: 1 }}>
                <ShimmerBlock width="140px" height="16px" borderRadius="4px" />
                <ShimmerBlock width="80%" height="14px" borderRadius="4px" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--error)', borderRadius: '16px' }}>
          Error: {error}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🔔</span>
          No tienes notificaciones en esta categoría.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((n) => {
            const link = getNotificationLink(n);
            const { icon, color } = getTypeIcon(n.type);

            const isGift = n.type === 'STARDUST_RECEIVED' || n.type === 'GIFT_PLAN_RECEIVED' || n.title.includes('Regalo') || n.title.includes('Polvo Estelar');

            const handleClick = () => {
              if (!n.read) handleMarkAsRead(n.id);
              if (isGift) {
                const senderMatch = n.message.match(/@([a-zA-Z0-9_.-]+)/);
                const senderName = senderMatch ? senderMatch[1] : 'Amigo Estelar';
                const msgMatch = n.message.match(/:\s*"([^"]+)"/);
                const amountMatch = n.message.match(/⭐\s*([\d,.]+)/);

                setGiftEnvelopeData({
                  title: n.title,
                  senderName,
                  amount: amountMatch ? amountMatch[1] : undefined,
                  message: msgMatch ? msgMatch[1] : undefined,
                  giftType: n.type === 'GIFT_PLAN_RECEIVED' ? 'PREMIUM' : 'STARDUST',
                });
                setShowGiftEnvelope(true);
                return;
              }
              if (link) router.push(link);
            };

            return (
              <div
                key={n.id}
                className="glass"
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: link ? 'pointer' : 'default',
                  borderLeft: n.read ? '3px solid transparent' : `3px solid ${color}`,
                  background: n.read ? 'rgba(255,255,255,0.02)' : `${color}0d`,
                  opacity: n.read ? 0.72 : 1,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onClick={handleClick}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: `${color}22`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: !n.read ? `0 0 12px ${color}33` : 'none',
                  }}
                >
                  {icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{n.title}</strong>
                    {!n.read && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.8 }}>
                    {new Date(n.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => handleDeleteNotification(n.id, e)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', padding: '6px', borderRadius: '6px',
                      fontSize: '0.85rem', opacity: 0.5, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ff4d6a'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    title="Eliminar notificación"
                  >
                    🗑️
                  </button>

                  {link && (
                    <span style={{ color: color, fontSize: '0.9rem', fontWeight: 700 }}>
                      →
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="btn"
              style={{
                padding: '12px', fontSize: '0.85rem', width: '100%', marginTop: '10px',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {loadingMore ? 'Cargando...' : 'Cargar más notificaciones ↓'}
            </button>
          )}
        </div>
      )}

      {/* Interactive Gift Envelope Modal */}
      <GiftEnvelopeModal
        isOpen={showGiftEnvelope}
        onClose={() => setShowGiftEnvelope(false)}
        giftData={giftEnvelopeData}
      />
    </>
  );
}

export default function NotificationsPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px', maxWidth: '750px' }}>
      <ClientOnly fallback={<div className="container" style={{ paddingTop: '20px', maxWidth: '750px' }}>Cargando...</div>}>
        <NotificationsContent />
      </ClientOnly>
    </div>
  );
}
