'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Heart, MessageCircle } from '@/components/ui/Icons';

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

const TABS: { key: TabKey; label: string }[] = [
  { key: 'posts', label: 'Publicaciones' },
  { key: 'events', label: 'Eventos' },
  { key: 'vtubers', label: 'Nuevos VTubers' },
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
        if (entry.isIntersecting) setVisible(true);
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
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <section className="section" ref={sectionRef}>
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 22, height: 22, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
        </div>
      </section>
    );
  }

  if (!data || (data.posts.length === 0 && data.events.length === 0 && data.vtubers.length === 0)) {
    return null;
  }

  const activeKey = data[activeTab]?.length > 0 ? activeTab : (
    data.posts.length > 0 ? 'posts' :
    data.events.length > 0 ? 'events' : 'vtubers'
  );

  return (
    <section
      ref={sectionRef}
      className="section"
      id="recent-activity"
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        <div className="section-accent-line" style={{
          opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease',
        }} />
        <h2 className="section-title" style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          Actividad Reciente
        </h2>
        <p className="section-subtitle" style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          Lo que está pasando en la comunidad ahora mismo
        </p>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '24px',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s',
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
                  padding: '7px 16px', borderRadius: '8px',
                  border: 'none', cursor: count === 0 ? 'default' : 'pointer',
                  background: isActive ? 'var(--primary-subtle)' : 'transparent',
                  color: isActive ? 'var(--primary)' : count === 0 ? 'rgba(255,255,255,0.12)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500, fontSize: '0.82rem',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: count === 0 ? 0.4 : 1,
                }}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span style={{
                    padding: '1px 6px', borderRadius: '6px',
                    background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: '0.62rem', fontWeight: 700,
                    minWidth: '16px', textAlign: 'center',
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
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
          maxWidth: '600px', margin: '0 auto',
        }}>
          {activeKey === 'posts' && <ActivityPosts data={data.posts} />}
          {activeKey === 'events' && <ActivityEvents data={data.events} />}
          {activeKey === 'vtubers' && <ActivityVtubers data={data.vtubers} />}
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.4s' }}>
          <Link href="/feed" className="btn btn--outline btn--sm">
            Ver toda la actividad
          </Link>
        </div>
      </div>


    </section>
  );
}

function ActivityPosts({ data }: { data: ActivityPost[] }) {
  if (data.length === 0) {
    return (
      <div style={{
        padding: '32px', borderRadius: '12px', textAlign: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay publicaciones recientes aún.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((post, idx) => (
        <Link
          key={post.id}
          href={`/profile/${post.user.id}`}
          style={{
            padding: '16px 18px', borderRadius: '10px',
            background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
            textDecoration: 'none', color: 'var(--text)',
            transition: 'all 0.2s ease',
            animation: `fadeInUp 0.4s ease ${idx * 0.06}s forwards`,
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
              background: post.user.vtuberProfile?.avatarUrl
                ? `url(${post.user.vtuberProfile.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--warm))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '0.6rem',
              overflow: 'hidden',
            }}>
              {!post.user.vtuberProfile?.avatarUrl && (post.user.vtuberProfile?.displayName || post.user.username).charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.78rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {post.user.vtuberProfile?.displayName || post.user.username}
              </span>
              <span style={{ color: 'var(--text-muted)' }}> · {formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
          <p style={{
            fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)',
            whiteSpace: 'pre-wrap',
          }}>
            {post.content}
          </p>
          <div style={{
            display: 'flex', gap: '12px', marginTop: '8px',
            paddingTop: '8px', borderTop: '1px solid var(--glass-border)',
            fontSize: '0.72rem', color: 'var(--text-muted)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={12} color="var(--text-muted)" /> {post._count.likes}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={12} color="var(--text-muted)" /> {post._count.comments}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ActivityEvents({ data }: { data: ActivityEvent[] }) {
  if (data.length === 0) {
    return (
      <div style={{
        padding: '32px', borderRadius: '12px', textAlign: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay eventos próximos.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((event, idx) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          style={{
            padding: '14px 16px', borderRadius: '10px',
            background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
            textDecoration: 'none', color: 'var(--text)',
            transition: 'all 0.2s ease',
            animation: `fadeInUp 0.4s ease ${idx * 0.06}s forwards`,
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '8px', flexShrink: 0,
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.12)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1.1,
            }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {new Date(event.date).toLocaleDateString('es-ES', { month: 'short' })}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                {new Date(event.date).getDate()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Por @{event.creator.username} · {event._count.attendees} asistentes
              </div>
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600,
              background: event.status === 'UPCOMING' ? 'rgba(108,180,238,0.1)' : 'rgba(42,157,143,0.1)',
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

function ActivityVtubers({ data }: { data: ActivityVTuber[] }) {
  if (data.length === 0) {
    return (
      <div style={{
        padding: '32px', borderRadius: '12px', textAlign: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay nuevos VTubers aún.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((vtuber, idx) => (
        <Link
          key={vtuber.id}
          href={`/profile/${vtuber.userId}`}
          style={{
            padding: '14px 16px', borderRadius: '10px',
            background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
            textDecoration: 'none', color: 'var(--text)',
            transition: 'all 0.2s ease',
            animation: `fadeInUp 0.4s ease ${idx * 0.06}s forwards`,
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
              background: vtuber.avatarUrl
                ? `url(${vtuber.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--warm))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '0.8rem',
              overflow: 'hidden',
            }}>
              {!vtuber.avatarUrl && vtuber.displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                {vtuber.displayName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                @{vtuber.user.username} · se unió {formatTimeAgo(vtuber.createdAt)}
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>VT</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
