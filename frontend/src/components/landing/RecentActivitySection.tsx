'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface ActivityPost {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    role?: string;
    vtuberProfile?: { displayName: string; avatarUrl: string | null; isApproved?: boolean } | null;
  };
  _count: { comments: number; likes: number };
}

interface ActivityEvent {
  id: string;
  title: string;
  date: string;
  status: string;
  creator: { id: string; username: string };
  _count: { attendees: number };
}

interface ActivityVTuber {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  user: { id: string; username: string };
}

interface ActivityData {
  posts: ActivityPost[];
  events: ActivityEvent[];
  vtubers: ActivityVTuber[];
}

type TabKey = 'posts' | 'events' | 'vtubers';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const TABS: { key: TabKey; icon: React.ReactNode; label: string }[] = [
  {
    key: 'posts',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    label: 'Publicaciones',
  },
  {
    key: 'events',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    label: 'Eventos',
  },
  {
    key: 'vtubers',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    label: 'Nuevos VTubers',
  },
];

export default function RecentActivitySection() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const result = await apiFetch('/activity', {});
        setData(result);
      } catch {
        // Silently fail — section just won't render
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <section className="section" ref={sectionRef}>
        <div className="container">
          <h2 className="section-title">Actividad Reciente</h2>
          <p className="section-subtitle">Lo que está pasando en la comunidad ahora mismo</p>
          <div className="glass" style={{
            padding: '40px', borderRadius: '20px',
            display: 'flex', justifyContent: 'center',
          }}>
            <span style={{
              width: '24px', height: '24px',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        </div>
      </section>
    );
  }

  if (!data || (data.posts.length === 0 && data.events.length === 0 && data.vtubers.length === 0)) {
    return null;
  }

  // Auto-select first tab with data
  const activeKey = data[activeTab]?.length > 0 ? activeTab : (
    data.posts.length > 0 ? 'posts' :
    data.events.length > 0 ? 'events' : 'vtubers'
  );

  return (
    <section
      ref={sectionRef}
      className="section"
      id="recent-activity"
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.02) 50%, transparent 100%)',
      }}
    >
      <div className="container">
        <h2 className="section-title" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          Actividad Reciente
        </h2>
        <p className="section-subtitle" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          Lo que está pasando en la comunidad ahora mismo
        </p>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '32px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
        }}>
          {TABS.map((tab) => {
            const count = data[tab.key]?.length || 0;
            const isActive = activeKey === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                disabled={count === 0}
                style={{
                  padding: '10px 20px', borderRadius: '10px',
                  border: 'none', cursor: count === 0 ? 'default' : 'pointer',
                  background: isActive ? 'rgba(138,43,226,0.15)' : 'transparent',
                  color: isActive ? 'var(--text)' : count === 0 ? 'rgba(255,255,255,0.15)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: count === 0 ? 0.5 : 1,
                }}
              >
                <span style={{ display: 'inline-flex' }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span style={{
                    padding: '1px 7px', borderRadius: '10px',
                    background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                    minWidth: '18px', textAlign: 'center',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
          maxWidth: '700px', margin: '0 auto',
        }}>
          {activeKey === 'posts' && (
            <ActivityPosts data={data.posts} />
          )}
          {activeKey === 'events' && (
            <ActivityEvents data={data.events} />
          )}
          {activeKey === 'vtubers' && (
            <ActivityVtubers data={data.vtubers} />
          )}
        </div>

        {/* View all CTA */}
        <div style={{
          textAlign: 'center', marginTop: '32px',
          opacity: visible ? 1 : 0,
          transition: 'all 0.6s ease 0.5s',
        }}>
          <Link
            href="/feed"
            className="btn btn-outline"
            style={{ padding: '12px 28px', fontSize: '0.95rem', borderRadius: '12px', borderWidth: '2px' }}
          >
            Ver toda la actividad
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===== POSTS TAB ===== */
function ActivityPosts({ data }: { data: ActivityPost[] }) {
  if (data.length === 0) return <EmptyTab icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>} text="No hay publicaciones recientes aun." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((post, idx) => (
        <Link
          key={post.id}
          href={`/profile/${post.user.id}`}
          className="glass"
          style={{
            padding: '18px 20px', borderRadius: '16px',
            textDecoration: 'none', color: 'var(--text)',
            transition: 'all 0.3s ease',
            animation: `fadeInUp 0.5s ease ${idx * 0.08}s forwards`,
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: post.user.vtuberProfile?.avatarUrl
                ? `url(${post.user.vtuberProfile.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '0.7rem',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {!post.user.vtuberProfile?.avatarUrl && (post.user.vtuberProfile?.displayName || post.user.username).charAt(0).toUpperCase()}
            </div>              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 600 }}>
                    {post.user.vtuberProfile?.displayName || post.user.username}
                  </span>
                  {(post.user.role === 'VTUBER' || post.user.vtuberProfile?.isApproved) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="VTuber Oficial">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  )}
                </div>
                <span style={{ color: 'var(--text-muted)' }}>
                  · {formatTimeAgo(post.createdAt)}
                </span>
              </div>
          </div>
          {/* Content preview */}
          <p style={{
            fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-muted)',
            whiteSpace: 'pre-wrap',
          }}>
            {post.content}
          </p>
          {/* Stats */}
          <div style={{
            display: 'flex', gap: '16px', marginTop: '10px',
            paddingTop: '10px', borderTop: '1px solid var(--glass-border)',
            fontSize: '0.78rem', color: 'var(--text-muted)',
          }}>
            <span>Likes {post._count.likes}</span>
            <span>Comments {post._count.comments}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ===== EVENTS TAB ===== */
function ActivityEvents({ data }: { data: ActivityEvent[] }) {
  if (data.length === 0) return <EmptyTab icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="16" y1="14" x2="16" y2="18"/></svg>} text="No hay eventos proximos." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((event, idx) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          className="glass"
          style={{
            padding: '18px 20px', borderRadius: '16px',
            textDecoration: 'none', color: 'var(--text)',
            transition: 'all 0.3s ease',
            animation: `fadeInUp 0.5s ease ${idx * 0.08}s forwards`,
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Date badge */}
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(255,0,127,0.1))',
              border: '1px solid rgba(138,43,226,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1.2,
            }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {new Date(event.date).toLocaleDateString('es-ES', { month: 'short' })}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>
                {new Date(event.date).getDate()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Por @{event.creator.username} · {event._count.attendees} asistentes
              </div>
            </div>
            {/* Status badge */}
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
              background: event.status === 'UPCOMING' ? 'rgba(0,212,255,0.1)' : 'rgba(0,230,118,0.1)',
              color: event.status === 'UPCOMING' ? 'var(--accent)' : 'var(--success)',
              flexShrink: 0,
            }}>
              {event.status === 'UPCOMING' ? 'Próximo' : 'En vivo'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ===== VTUBERS TAB ===== */
function ActivityVtubers({ data }: { data: ActivityVTuber[] }) {
  if (data.length === 0) return <EmptyTab icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><path d="M8 21l4-4 4 4"/></svg>} text="No hay nuevos VTubers aun." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((vtuber, idx) => (
        <Link
          key={vtuber.id}
          href={`/profile/${vtuber.userId}`}
          className="glass"
          style={{
            padding: '18px 20px', borderRadius: '16px',
            textDecoration: 'none', color: 'var(--text)',
            transition: 'all 0.3s ease',
            animation: `fadeInUp 0.5s ease ${idx * 0.08}s forwards`,
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: vtuber.avatarUrl
                ? `url(${vtuber.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
              overflow: 'hidden',
            }}>
              {!vtuber.avatarUrl && vtuber.displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {vtuber.displayName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                @{vtuber.user.username} · se unió {formatTimeAgo(vtuber.createdAt)}
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>VT</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ===== EMPTY STATE ===== */
function EmptyTab({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="glass" style={{
      padding: '40px', borderRadius: '20px', textAlign: 'center',
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }}>{icon}</div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{text}</p>
    </div>
  );
}
