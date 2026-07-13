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

const NOTIFICATION_ICONS: Record<string, string> = {
  follow: '◈',
  like: '♥',
  comment: '○',
  mention: '@',
  event_created: '◇',
  event_attend: '◆',
  guild_joined: '□',
  guild_request: '▽',
  achievement: '△',
  level_up: '▲',
  dm: '◎',
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

  const tabs = [
    { key: 'notifications' as const, label: 'Notificaciones', icon: '■', count: notifications.filter((n) => !n.read).length },
    { key: 'events' as const, label: 'Eventos', icon: '◇', count: events.length },
    { key: 'achievements' as const, label: 'Logros', icon: '△', count: achievements.length },
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
          {tabs.map((tab) => (
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
              <span>{tab.icon}</span>
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
              <EmptyState icon="■" text="No tienes notificaciones recientes" />
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
                    <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '1px' }}>
                      {NOTIFICATION_ICONS[notif.type] || '■'}
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
              <EmptyState icon="◇" text="No tienes eventos próximos" action={{ label: 'Explorar eventos', href: '/events' }} />
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
              <EmptyState icon="△" text="Aún no has desbloqueado logros" action={{ label: 'Ver todos los logros', href: '/achievements' }} />
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
                      {item.achievement.iconUrl || '◆'}
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
  icon: string;
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
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{icon}</div>
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
