'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { connectSocket } from '@/lib/socket-client';
import Link from 'next/link';
import type { Socket } from 'socket.io-client';
import PostCard from '@/components/posts/PostCard';
import CreatePost from '@/components/posts/CreatePost';
import SkeletonPostCard from '@/components/posts/SkeletonPostCard';
import UserAvatar from '@/components/ui/UserAvatar';
import StardustProgressBar from '@/components/ui/StardustProgressBar';
import PlanBadge from '@/components/ui/PlanBadge';
import { usePosts } from '@/lib/hooks/usePosts';
import type { GuildItem, TrendingHashtag, LiveVTuberProfile, FollowingUser, EventItem } from '../../../../shared/types';

// Twitch helper
function extractTwitchChannel(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:twitch\.tv\/)([a-zA-Z0-9_]+)/);
  return match ? match[1].toLowerCase() : null;
}

const NavIcons = {
  feed: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v4H4z"/><path d="M4 12h16v8H4z"/></svg>,
  events: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  guilds: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  vtubers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chat: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  shop: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  leaderboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  notifications: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
};

function HomeContent() {
  const { user, isLoading } = useAuth();

  // Left sidebar data
  const [myGuilds, setMyGuilds] = useState<GuildItem[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Center - Feed
  const {
    posts, setPosts, loading, error, hasMore, loadingMore,
    feedMode, setFeedMode, setPage, loadMore, handleLike,
  } = usePosts({ user });

  // Right sidebar data
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [liveVtubers, setLiveVtubers] = useState<LiveVTuberProfile[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [maidsData, setMaidsData] = useState<any[]>([]);
  const [maidsLoading, setMaidsLoading] = useState(true);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '300px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  // Tick every 60s for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => { setNow(Date.now()); }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch sidebar data + poll live VTubers
  useEffect(() => {
    if (!user) return;

    const fetchSidebarData = async () => {
      // Guilds
      try {
        const guilds = await apiFetch('/guilds', {});
        if (Array.isArray(guilds)) setMyGuilds(guilds.filter((g: GuildItem) => g.isMember));
      } catch {}

      // Hashtags
      try {
        const tags = await apiFetch('/posts/hashtags/trending?limit=8', {});
        setTrendingHashtags(Array.isArray(tags) ? tags : []);
      } catch {}

      // Notifications
      try {
        const data = await apiFetch('/notifications/unread-count', {});
        setUnreadNotifs(data.count || 0);
      } catch {}

      // Live VTubers
      try {
        const data = await apiFetch('/vtubers/live', {});
        if (Array.isArray(data)) setLiveVtubers(data.slice(0, 5));
      } catch {}

      // Following users (amigos)
      try {
        const data = await apiFetch(`/social/following/${user.id}`, {});
        if (Array.isArray(data)) setFollowingUsers(data.slice(0, 8));
      } catch {}

      // Upcoming events
      try {
        const events = await apiFetch('/events?status=UPCOMING&limit=5', {});
        setUpcomingEvents(Array.isArray(events) ? events.slice(0, 4) : []);
      } catch {}

      // Hoshizora Maids
      try {
        const data = await apiFetch('/users/role/MAID', {});
        if (Array.isArray(data)) setMaidsData(data);
      } catch {}
      setMaidsLoading(false);
    };

    fetchSidebarData();

    // Poll live VTubers every 45s for real-time updates
    const livePollInterval = setInterval(async () => {
      try {
        const data = await apiFetch('/vtubers/live', {});
        if (Array.isArray(data)) setLiveVtubers(data.slice(0, 5));
      } catch {}
    }, 12000);

    return () => {
      clearInterval(livePollInterval);
    };
  }, [user]);

  // Connect to socket for real-time friend presence
  useEffect(() => {
    if (!user) return;

    let sock: Socket;
    try {
      sock = connectSocket();

      // Receive full list of currently online users
      sock.on('user:online-list', (data: { onlineIds: string[] }) => {
        setOnlineFriendIds(new Set(data.onlineIds));
      });

      // User came online
      sock.on('user:online', (data: { userId: string }) => {
        setOnlineFriendIds(prev => {
          const next = new Set(prev);
          next.add(data.userId);
          return next;
        });
      });

      // Real-time notification count increment
      sock.on('notification:new', () => {
        setUnreadNotifs(prev => prev + 1);
      });

      // User went offline
      sock.on('user:offline', (data: { userId: string }) => {
        setOnlineFriendIds(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      });
    } catch (err) {
      console.warn('[Socket] Could not connect for presence:', err);
    }

    return () => {
      if (sock) {
        sock.off('user:online-list');
        sock.off('user:online');
        sock.off('user:offline');
        sock.off('notification:new');
      }
    };
  }, [user]);
  const handlePostCreated = (post: any) => {
    setPosts(prev => [post, ...prev]);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
      <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p>Cargando...</p>
    </div>;
  }

  if (!user) return null;

  const displayName = user.displayName || user.vtuberProfile?.displayName || user.username;
  const avatarUrl = user.avatarUrl || user.vtuberProfile?.avatarUrl || '';

  // ==========================================================================
  // LEFT SIDEBAR
  // ==========================================================================
  const sidebarLinks = [
    { icon: NavIcons.feed, label: 'Feed', href: '/', color: 'var(--primary)' },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#38bdf8" stroke="#38bdf8" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Pase Estelar', href: '/pass', color: '#38bdf8' },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>, label: 'Planes Premium', href: '/premium', color: '#fbbf24' },
    { icon: NavIcons.events, label: 'Eventos', href: '/events' },
    { icon: NavIcons.guilds, label: 'Gremios', href: '/guilds' },
    { icon: NavIcons.vtubers, label: 'VTubers', href: '/vtubers' },
    { icon: NavIcons.chat, label: 'Chat', href: '/chat' },
    { icon: NavIcons.shop, label: 'Observatorio Estelar ⭐', href: '/shop', color: 'var(--warm)' },
    { icon: NavIcons.leaderboard, label: 'Ranking', href: '/leaderboard' },
    { icon: NavIcons.dashboard, label: 'Dashboard', href: '/dashboard' },
  ];

  // ==========================================================================
  // RIGHT SIDEBAR
  // ==========================================================================
  const RightSidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
      {/* Welcome card */}
      <div className="glass" style={{ padding: '16px', textAlign: 'center' }}>
        <Link href={`/profile/${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <UserAvatar
              src={avatarUrl}
              alt={displayName}
              user={user}
              size={56}
              style={{ margin: '0 auto' }}
            />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{displayName}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{user.username}</div>
        </Link>
        {user.role === 'VTUBER' && (
          <Link href="/vtuber-profile" className="btn" style={{ marginTop: '10px', padding: '6px 14px', fontSize: '0.78rem', width: '100%' }}>
            Editar Perfil VTuber
          </Link>
        )}
        <Link href={`/profile/${user.id}`} className="btn btn--outline" style={{ marginTop: '6px', padding: '6px 14px', fontSize: '0.78rem', width: '100%' }}>
          Ver Perfil
        </Link>
      </div>

      {/* Live VTubers */}
      {liveVtubers.length > 0 && (
        <div className="glass" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              En Vivo
            </h4>
            <Link href="/vtubers" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Ver todos
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {liveVtubers.map(v => (
              <Link key={v.id} href={`/profile/${v.userId}`} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 8px', borderRadius: '8px', textDecoration: 'none', color: 'inherit',
                fontSize: '0.82rem', transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <UserAvatar
                  src={v.avatarUrl}
                  alt={v.displayName}
                  userId={v.userId}
                  isLive={true}
                  size={28}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {v.displayName}
                    {v.isVerified && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="Verificado">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>EN VIVO</div>
                </div>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  {(v.twitchUrl || v.youtubeUrl) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Following / Amigos */}
      {followingUsers.length > 0 && (
        <div className="glass" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Amigos
            </h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {followingUsers.length} ·{' '}
              <span style={{ color: '#00e676', fontWeight: 600 }}>
                {(() => {
                  let online = 0;
                  for (const f of followingUsers) {
                    if (onlineFriendIds.has(f.id) || liveVtubers.some(lv => lv.userId === f.id)) online++;
                  }
                  return `${online} en línea`;
                })()}
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {followingUsers.map(friend => {
              const displayName = friend.displayName || friend.vtuberProfile?.displayName || friend.username;
              const avatarUrl = friend.avatarUrl || friend.vtuberProfile?.avatarUrl || '';
              const isVerified = friend.vtuberProfile?.isVerified || false;
              // Check if this friend is currently live (cross-reference with liveVtubers)
              const liveInfo = liveVtubers.find(lv => lv.userId === friend.id);
              const isLive = !!liveInfo;
              // Check if this friend is online via WebSocket presence
              const isOnline = onlineFriendIds.has(friend.id);
              // Priority: live > online > offline
              const statusColor = isLive ? 'var(--primary)' : isOnline ? '#00e676' : 'rgba(255,255,255,0.15)';
              const statusText = isLive ? 'EN VIVO' : isOnline ? 'En línea' : `@${friend.username}`;
              const statusWeight = isLive ? 600 : isOnline ? 500 : 400;
              const nameColor = isLive ? 'var(--text)' : isOnline ? 'var(--text)' : 'var(--text-secondary)';

              return (
                <Link key={friend.id} href={`/profile/${friend.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 8px', borderRadius: '8px', textDecoration: 'none', color: 'inherit',
                  fontSize: '0.82rem', transition: 'background 0.15s',
                }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: avatarUrl
                        ? `url(${avatarUrl}) center/cover`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '0.65rem',
                      overflow: 'hidden',
                    }}>
                      {!avatarUrl && displayName.charAt(0).toUpperCase()}
                    </div>
                    {/* Status dot: live (purple) > online (green) > offline (gray) */}
                    <div style={{
                      position: 'absolute', bottom: '-2px', right: '-2px',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: statusColor,
                      border: '2px solid var(--bg-deep)',
                      boxShadow: isLive ? `0 0 6px var(--primary-glow)` : 'none',
                      zIndex: 2,
                    }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.82rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      color: nameColor,
                    }}>
                      {displayName}
                      {isVerified && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="Verificado">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.68rem',
                      color: isLive ? 'var(--primary)' : isOnline ? '#00e676' : 'var(--text-muted)',
                      fontWeight: statusWeight,
                    }}>
                      {statusText}
                    </div>
                  </div>
                  {isLive && liveInfo && (
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '0.72rem' }}>
                      {(liveInfo.twitchUrl || liveInfo.youtubeUrl) && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#e91e63" stroke="none" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="glass" style={{ padding: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            Tendencias
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {trendingHashtags.map((tag, i) => (
              <Link key={tag.id} href={`/feed?tag=${tag.name}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 8px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text)',
                fontSize: '0.82rem', transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '16px' }}>#{i + 1}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>#{tag.name}</span>
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tag._count.posts}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="glass" style={{ padding: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Próximos Eventos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {upcomingEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} style={{
                display: 'flex', gap: '10px', padding: '8px', borderRadius: '8px',
                textDecoration: 'none', color: 'inherit', transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(124,58,237,0.1))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1.1,
                }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {new Date(event.date).toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    por @{event.creator.username} · {event._count.attendees} asistentes
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hoshizora Maid — Coming Soon Widget */}
      <div className="glass" style={{
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(212,160,48,0.08), rgba(196,149,106,0.04))',
        border: '1px solid rgba(212,160,48,0.2)',
      }}>
        <Link href="/hoshizora-maid" style={{
          padding: '14px', display: 'flex', alignItems: 'center', gap: '12px',
          textDecoration: 'none', color: 'inherit',
          transition: 'all 0.3s ease',
        }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(212,160,48,0.05)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(212,160,48,0.25), rgba(196,149,106,0.12))',
            border: '1px solid rgba(212,160,48,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#d4a030' }}>Hoshizora Maid</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cafetería estelar en VRChat</div>
          </div>
          <span style={{
            fontSize: '0.68rem', fontWeight: 800, color: '#d4a030',
            background: 'rgba(212,160,48,0.12)', border: '1px solid rgba(212,160,48,0.25)',
            padding: '3px 8px', borderRadius: '8px', flexShrink: 0,
          }}>
            ✨ Próximamente
          </span>
        </Link>
      </div>

      {/* Notifications */}
      <Link href="/notifications" className="glass" style={{
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px',
        textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', fontWeight: 500,
        transition: 'all 0.15s',
      }}
        onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)')}
        onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}>
        <span style={{ display: 'inline-flex', color: unreadNotifs > 0 ? 'var(--primary)' : 'var(--text-muted)', position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {unreadNotifs > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
        </span>
        <span style={{ flex: 1 }}>Notificaciones</span>
        {unreadNotifs > 0 && (
          <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>
            {unreadNotifs > 99 ? '99+' : unreadNotifs}
          </span>
        )}
      </Link>
    </div>
  );

  return (
    <div className="home-layout">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="home-sidebar-left">
        {/* User quick profile */}
        <Link href={`/profile/${user.id}`} className="glass" style={{
          padding: '12px', display: 'flex', alignItems: 'center', gap: '10px',
          textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
        }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)')}
          onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
          }}>
            {!avatarUrl && displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              @{user.username}
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <div className="glass" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {sidebarLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: '8px', textDecoration: 'none',
              color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = link.color || 'var(--text)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}>
              <span style={{ color: link.color || 'var(--text-muted)', display: 'inline-flex', flexShrink: 0 }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* My Guilds */}
        {myGuilds.length > 0 && (
          <div className="glass" style={{ padding: '10px 6px' }}>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px', padding: '0 6px' }}>
              Mis Gremios
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {myGuilds.slice(0, 5).map(guild => (
                <Link key={guild.id} href={`/guilds/${guild.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 8px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text)',
                  fontSize: '0.8rem', transition: 'background 0.15s',
                }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                    background: guild.logoUrl ? `url(${guild.logoUrl}) center/cover` : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.65rem', fontWeight: 'bold',
                  }}>
                    {!guild.logoUrl && guild.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guild.name}</span>
                </Link>
              ))}
              <Link href="/guilds" style={{
                textAlign: 'center', padding: '6px', fontSize: '0.75rem',
                color: 'var(--primary)', borderRadius: '6px', transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.06)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                Ver todos los gremios →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ===== CENTER FEED ===== */}
      <div className="home-feed-center" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Feed mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16v4H4z"/><path d="M4 12h16v8H4z"/>
            </svg>
            Inicio
          </h1>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', border: '1px solid var(--glass-border)' }}>
            <button onClick={() => { setFeedMode('for-you'); setPage(1); }} style={{
              padding: '6px 14px', fontSize: '0.82rem', borderRadius: '8px', border: 'none',
              background: feedMode === 'for-you' ? 'linear-gradient(135deg, var(--primary), #8b5cf6)' : 'transparent',
              color: feedMode === 'for-you' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: feedMode === 'for-you' ? 600 : 400,
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '5px',
              boxShadow: feedMode === 'for-you' ? '0 2px 10px rgba(139,92,246,0.3)' : 'none',
            }}>
              <span>Para Ti</span> ✨
            </button>
            <button onClick={() => { setFeedMode('following'); setPage(1); }} style={{
              padding: '6px 14px', fontSize: '0.82rem', borderRadius: '8px', border: 'none',
              background: feedMode === 'following' ? 'var(--primary)' : 'transparent',
              color: feedMode === 'following' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: feedMode === 'following' ? 600 : 400,
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '5px',
              boxShadow: feedMode === 'following' ? '0 2px 10px rgba(233,30,99,0.3)' : 'none',
            }}>
              <span>Siguiendo</span> 👥
            </button>
            <button onClick={() => { setFeedMode('global'); setPage(1); }} style={{
              padding: '6px 14px', fontSize: '0.82rem', borderRadius: '8px', border: 'none',
              background: feedMode === 'global' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: feedMode === 'global' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: feedMode === 'global' ? 600 : 400,
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <span>Global</span> 🌐
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,77,79,0.1)', color: 'var(--error)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Stardust & Missions Progress Bar */}
        <StardustProgressBar />

        <CreatePost
          compact
          onPostCreated={handlePostCreated}
        />

        {/* ═══ LIVE VTUBERS — tarjetas con embed directo ═══ */}
        {liveVtubers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {liveVtubers.map((v, idx) => (
              <div key={v.id} className="glass" style={{
                borderRadius: '16px',
                border: '1px solid rgba(233,30,99,0.15)',
                boxShadow: '0 0 30px rgba(233,30,99,0.06)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                animation: `fadeInUp 0.5s ease ${idx * 0.1}s forwards`,
                opacity: 0,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(233,30,99,0.35)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(233,30,99,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(233,30,99,0.15)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(233,30,99,0.06)';
                }}
              >
                {/* ██████ HEADER con info del streamer ██████ */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(233,30,99,0.08), rgba(145,65,255,0.04))',
                  borderBottom: '1px solid rgba(233,30,99,0.1)',
                }}>
                  {/* Avatar */}
                  <Link href={`/profile/${v.userId}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: v.avatarUrl
                        ? `url(${v.avatarUrl}) center/cover`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '0.8rem',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {!v.avatarUrl && v.displayName.charAt(0).toUpperCase()}
                      {v.avatarUrl && (
                        <img src={v.avatarUrl} alt={v.displayName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <div style={{
                        position: 'absolute', inset: -2, borderRadius: '50%',
                        border: '2px solid rgba(233,30,99,0.5)',
                        animation: 'pulse 2s ease-in-out infinite',
                        pointerEvents: 'none',
                      }} />
                    </div>
                  </Link>

                  {/* Name + platform */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Link href={`/profile/${v.userId}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                        {v.displayName}
                      </Link>
                      {v.isVerified && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="Verificado">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      )}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        marginLeft: '6px',
                        padding: '2px 8px', borderRadius: '10px',
                        background: 'rgba(233,30,99,0.15)',
                        fontSize: '0.65rem', fontWeight: 700, color: '#e91e63',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e91e63', animation: 'pulse 1.5s ease-in-out infinite', display: 'inline-block' }} />
                        En vivo
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      @{v.user.username} ·{' '}
                      <span style={{ color: v.twitchUrl ? '#9146FF' : '#FF0000', fontWeight: 600 }}>
                        {v.twitchUrl ? 'Twitch' : 'YouTube'}
                      </span>
                    </div>
                  </div>

                  {/* Ir al perfil */}
                  <Link href={`/profile/${v.userId}`} style={{
                    fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600,
                    textDecoration: 'none', padding: '4px 10px', borderRadius: '6px',
                    transition: 'background 0.15s', flexShrink: 0,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Ver perfil →
                  </Link>
                </div>

                {/* ██████ TWITCH EMBED — iframe del directo ██████ */}
                {v.twitchUrl && (() => {
                  const channel = extractTwitchChannel(v.twitchUrl);
                  if (!channel) return null;
                  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                  return (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%',
                      background: '#0a0a0a',
                      borderBottom: '1px solid rgba(233,30,99,0.08)',
                    }}>
                      <iframe
                        src={`https://player.twitch.tv/?channel=${channel}&parent=${host}&muted=true`}
                        style={{
                          position: 'absolute',
                          top: 0, left: 0,
                          width: '100%', height: '100%',
                          border: 'none',
                        }}
                        allowFullScreen
                        title={`${v.displayName} en vivo`}
                      />
                    </div>
                  );
                })()}

                {/* ██████ YOUTUBE FALLBACK — si no tiene Twitch ██████ */}
                {!v.twitchUrl && v.youtubeUrl && (
                  <div style={{
                    padding: '40px 20px', textAlign: 'center',
                    background: 'rgba(10,10,10,0.5)',
                    borderBottom: '1px solid rgba(233,30,99,0.08)',
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                      <rect x="2" y="3" width="20" height="18" rx="3" ry="3"/>
                    </svg>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px', marginBottom: '12px' }}>
                      Stream en YouTube
                    </p>
                    <a href={v.youtubeUrl} target="_blank" rel="noopener noreferrer"
                      className="btn"
                      style={{
                        padding: '10px 24px', fontSize: '0.85rem', fontWeight: 700,
                        borderRadius: '10px',
                        background: '#FF0000', color: '#fff',
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#cc0000'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FF0000'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                      </svg>
                      Ver en YouTube
                    </a>
                  </div>
                )}

                {/* ██████ FOOTER — interacción ██████ */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px',
                  borderTop: '1px solid var(--glass-border)',
                }}>
                  {/* Ver en Twitch */}
                  {v.twitchUrl && (
                    <a
                      href={v.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 14px', borderRadius: '8px',
                        background: '#9146FF', color: '#fff',
                        fontSize: '0.78rem', fontWeight: 600,
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#9146FF'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.428l-3 3v-3H6.857V1.714h13.714z"/>
                      </svg>
                      Ver en Twitch
                    </a>
                  )}

                  {/* Seguidores / reacción */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <Link href={`/profile/${v.userId}`} style={{
                      color: 'var(--text-muted)', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', borderRadius: '6px',
                      fontSize: '0.78rem',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Perfil
                    </Link>
                    <Link href={`/chat?user=${v.userId}`} style={{
                      color: 'var(--text-muted)', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', borderRadius: '6px',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Mensaje
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SkeletonPostCard />
            <SkeletonPostCard withImage />
            <SkeletonPostCard />
            <SkeletonPostCard withImage />
          </div>
        ) : posts.length === 0 ? (
          <div className="glass" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="8 12 11 15 16 9"/>
                <line x1="3" y1="6" x2="5" y2="8"/>
                <line x1="19" y1="16" x2="21" y2="18"/>
                <line x1="6" y1="19" x2="8" y2="17"/>
              </svg>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '4px' }}>No hay publicaciones aún.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>¡Comparte algo con la comunidad estelar!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} currentUserId={user.id} currentUserRole={user.role} onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))} />
            ))}
            {hasMore && (
              <div ref={sentinelRef} style={{ width: '100%', padding: '8px 0' }}>
                {loadingMore ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <SkeletonPostCard />
                  </div>
                ) : (
                  <button onClick={loadMore} className="btn btn--outline" style={{
                    padding: '12px', width: '100%', justifyContent: 'center', fontSize: '0.85rem',
                  }}>
                    Cargar más publicaciones ↓
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== RIGHT SIDEBAR ===== */}
      <div className="home-sidebar-right">
        <RightSidebar />
      </div>
    </div>
  );
}

export default HomeContent;
