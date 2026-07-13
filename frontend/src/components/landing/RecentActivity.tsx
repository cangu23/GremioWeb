'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface ActivityEvent {
  id: string;
  title: string;
  date: string;
  status: string;
  creator: { username: string };
  _count?: { attendees: number };
}

interface ActivityNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface ActivityAchievement {
  id: string;
  achievement: {
    name: string;
    description: string;
    iconUrl: string | null;
    xpReward: number;
    category: string;
  };
  earnedAt: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  follow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  like: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  comment: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  mention: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c1.66 0 3.25-.4 4.64-1.12"/><circle cx="12" cy="12" r="4"/><path d="M16 8v4a2 2 0 0 0 4 0v-2"/></svg>,
  event_created: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>,
  event_attend: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>,
  guild_joined: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  guild_request: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  achievement: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  level_up: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 12 7 1 18"/><polyline points="23 13 12 2 1 13"/></svg>,
  dm: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M17 9l-5 5-5-5"/></svg>,
};

export default function RecentActivity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [achievements, setAchievements] = useState<ActivityAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'notifications' | 'achievements'>('notifications');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, notifsData, gamiData] = await Promise.all([
          apiFetch('/events/my/events', {}).catch(() => []),
          apiFetch('/notifications?limit=5', {}).catch(() => []),
          apiFetch('/gamification/me', {}).catch(() => null),
        ]);

        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setNotifications(Array.isArray(notifsData) ? notifsData : []);
        setAchievements(gamiData?.achievements?.slice(0, 5) || []);
      } catch {
        setError('No se pudieron cargar algunas actividades.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        className="glass"
        style={{
          padding: '32px',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: 'var(--text-muted)',
          gap: '12px',
        }}
      >
        <span
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        Cargando actividad...
      </div>
    );
  }

  const TABS_CONFIG: { key: 'notifications' | 'events' | 'achievements'; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: 'notifications',
      label: 'Notificaciones',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
      count: notifications.filter((n) => !n.read).length,
    },
    {
      key: 'events',
      label: 'Eventos',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      count: events.length,
    },
    {
      key: 'achievements',
      label: 'Logros',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
      count: achievements.length,
    },
  ];

  return (
    <div
      className="glass"
      style={{
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 28px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          Actividad Reciente
        </h2>

        {/* Desktop tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            padding: '3px',
          }}
        >
          {TABS_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background:
                  activeTab === tab.key
                    ? 'rgba(138,43,226,0.2)'
                    : 'transparent',
                color: activeTab === tab.key ? 'var(--text)' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ display: 'inline-flex' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    background:
                      tab.key === 'notifications'
                        ? 'var(--primary)'
                        : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>


      {/* Content */}
      <div style={{ padding: '20px 28px 28px' }}>
        {error && (
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            {error}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            {notifications.length === 0 ? (
              <EmptyState icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} text="No tienes notificaciones recientes" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href="/notifications"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: notif.read
                        ? 'transparent'
                        : 'rgba(138,43,226,0.05)',
                      textDecoration: 'none',
                      color: 'var(--text)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read
                        ? 'transparent'
                        : 'rgba(138,43,226,0.05)';
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '1px', display: 'inline-flex', opacity: 0.6 }}>
                      {NOTIFICATION_ICONS[notif.type] || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: notif.read ? 400 : 600,
                          fontSize: '0.9rem',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {notif.title}
                        </span>
                        {!notif.read && (
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
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notif.message}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.7 }}>
                        {formatTimeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/notifications"
                  style={{
                    textAlign: 'center',
                    padding: '12px',
                    fontSize: '0.85rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    marginTop: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(138,43,226,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Ver todas las notificaciones →
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            {events.length === 0 ? (
              <EmptyState icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="16" y1="14" x2="16" y2="18"/></svg>} text="No tienes eventos próximos" action={{ label: 'Explorar eventos', href: '/events' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.slice(0, 5).map((item) => {
                  const eventData = (item as any).event || item;
                  return (
                    <Link
                      key={item.id}
                      href={`/events/${eventData.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: 'var(--text)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Date badge */}
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '12px',
                          background:
                            'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(255,0,127,0.1))',
                          border: '1px solid rgba(138,43,226,0.2)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {new Date(eventData.date).toLocaleDateString('es-ES', {
                            month: 'short',
                          })}
                        </span>
                        <span
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: 'var(--text)',
                          }}
                        >
                          {new Date(eventData.date).getDate()}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            marginBottom: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {eventData.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>Por @{eventData.creator?.username || 'desconocido'}</span>
                          {eventData._count && (
                            <>
                              <span>·</span>
                              <span>{eventData._count.attendees} asistentes</span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Status badge */}
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background:
                            eventData.status === 'UPCOMING'
                              ? 'rgba(0,212,255,0.1)'
                              : eventData.status === 'ONGOING'
                              ? 'rgba(0,230,118,0.1)'
                              : eventData.status === 'FINISHED'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(255,77,79,0.1)',
                          color:
                            eventData.status === 'UPCOMING'
                              ? 'var(--accent)'
                              : eventData.status === 'ONGOING'
                              ? 'var(--success)'
                              : eventData.status === 'FINISHED'
                              ? 'var(--text-muted)'
                              : 'var(--error)',
                          flexShrink: 0,
                        }}
                      >
                        {eventData.status === 'UPCOMING'
                          ? 'Próximo'
                          : eventData.status === 'ONGOING'
                          ? 'En vivo'
                          : eventData.status === 'FINISHED'
                          ? 'Finalizado'
                          : 'Cancelado'}
                      </span>
                    </Link>
                  );
                })}
                <Link
                  href="/events"
                  style={{
                    textAlign: 'center',
                    padding: '12px',
                    fontSize: '0.85rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    marginTop: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(138,43,226,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Ver todos los eventos →
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            {achievements.length === 0 ? (
              <EmptyState icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>} text="Aún no has desbloqueado logros" action={{ label: 'Ver todos los logros', href: '/achievements' }} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {achievements.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--glass-border)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(138,43,226,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.5rem',
                        marginBottom: '8px',
                      }}
                    >
                      {item.achievement.iconUrl
                        ? <img src={item.achievement.iconUrl} alt="" style={{ width: '28px', height: '28px' }} />
                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                      }
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        marginBottom: '4px',
                      }}
                    >
                      {item.achievement.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                        marginBottom: '8px',
                      }}
                    >
                      {item.achievement.description}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.7rem',
                      }}
                    >
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        +{item.achievement.xpReward} XP
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatTimeAgo(item.earnedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  text,
  action,
}: {
  icon: React.ReactNode;
  text: string;
  action?: { label: string; href: string };
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', marginBottom: '12px', opacity: 0.5 }}>{icon}</div>
      <p style={{ fontSize: '0.9rem', marginBottom: action ? '16px' : 0 }}>{text}</p>
      {action && (
        <Link
          href={action.href}
          className="btn"
          style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px' }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
