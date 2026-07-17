'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { connectSocket } from '@/lib/socket-client';
import Link from 'next/link';
import ClientOnly from '@/lib/ClientOnly';
import type { Socket } from 'socket.io-client';
import PostCard from '@/components/posts/PostCard';
import CreatePost from '@/components/posts/CreatePost';
import SkeletonPostCard from '@/components/posts/SkeletonPostCard';
import { usePosts } from '@/lib/hooks/usePosts';
import type { GuildItem, TrendingHashtag, LiveVTuberProfile, FollowingUser, EventItem } from '../../../shared/types';

// ==========================================================================
// Landing sections (for non-authenticated users)
// ==========================================================================
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import LiveNowSection from '@/components/landing/LiveNowSection';
import FeaturedVtubersSection from '@/components/landing/FeaturedVtubersSection';
import PricingSection from '@/components/landing/PricingSection';
import RecentActivitySection from '@/components/landing/RecentActivitySection';
import CTASection from '@/components/landing/CTASection';

function SectionDivider() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '12px', padding: '0 20px', opacity: 0.2,
    }}>
      <div style={{
        flex: 1, maxWidth: '120px', height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--glass-border))',
      }} />
      <div style={{
        width: '3px', height: '3px', borderRadius: '50%', background: 'var(--primary)',
      }} />
      <div style={{
        flex: 1, maxWidth: '120px', height: '1px',
        background: 'linear-gradient(90deg, var(--glass-border), transparent)',
      }} />
    </div>
  );
}

function LandingPage() {
  return (
    <>
      <HeroSection />
      <SectionDivider />
      <LiveNowSection />
      <SectionDivider />
      <HowItWorksSection />
      <SectionDivider />
      <StatsSection />
      <SectionDivider />
      <FeaturesSection />
      <SectionDivider />
      <FeaturedVtubersSection />
      <SectionDivider />
      <PricingSection />
      <SectionDivider />
      <RecentActivitySection />
      <SectionDivider />
      <CTASection />
    </>
  );
}

// ==========================================================================
// SVG Icons
// ==========================================================================
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


// ==========================================================================
// Home Page Content (authenticated)
// ==========================================================================
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
    };

    fetchSidebarData();

    // Poll live VTubers every 45s for real-time updates
    const livePollInterval = setInterval(async () => {
      try {
        const data = await apiFetch('/vtubers/live', {});
        if (Array.isArray(data)) setLiveVtubers(data.slice(0, 5));
      } catch {}
    }, 45000);

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

  if (!user) return <LandingPage />;

  const displayName = user.vtuberProfile?.displayName || user.username;
  const avatarUrl = user.vtuberProfile?.avatarUrl || '';

  // ==========================================================================
  // LEFT SIDEBAR
  // ==========================================================================
  const sidebarLinks = [
    { icon: NavIcons.feed, label: 'Feed', href: '/feed', color: 'var(--primary)' },
    { icon: NavIcons.events, label: 'Eventos', href: '/events' },
    { icon: NavIcons.guilds, label: 'Gremios', href: '/guilds' },
    { icon: NavIcons.vtubers, label: 'VTubers', href: '/vtubers' },
    { icon: NavIcons.chat, label: 'Chat', href: '/chat' },
    { icon: NavIcons.shop, label: 'Tienda', href: '/shop', color: 'var(--warm)' },
    { icon: NavIcons.leaderboard, label: 'Ranking', href: '/leaderboard' },
    { icon: NavIcons.dashboard, label: 'Dashboard', href: '/dashboard' },
  ];

  // ==========================================================================
  // RIGHT SIDEBAR
  // ==========================================================================
  const RightSidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '88px' }}>
      {/* Welcome card */}
      <div className="glass" style={{ padding: '16px', textAlign: 'center' }}>
        <Link href={`/profile/${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 8px',
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', color: 'white', fontWeight: 'bold',
            border: user.role === 'VTUBER' ? '2px solid var(--primary)' : '2px solid transparent',
          }}>
            {!avatarUrl && displayName.charAt(0).toUpperCase()}
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
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: v.avatarUrl
                    ? `url(${v.avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '0.65rem',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {!v.avatarUrl && v.displayName.charAt(0).toUpperCase()}
                  {/* Live dot */}
                  <div style={{
                    position: 'absolute', bottom: '-1px', right: '-1px',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: 'var(--primary)',
                    border: '2px solid var(--bg-deep)',
                  }} />
                </div>
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
                  {v.twitchUrl || v.youtubeUrl ? '🎬' : ''}
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
              const displayName = friend.vtuberProfile?.displayName || friend.username;
              const avatarUrl = friend.vtuberProfile?.avatarUrl || '';
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
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: avatarUrl
                      ? `url(${avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '0.65rem',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {!avatarUrl && displayName.charAt(0).toUpperCase()}
                    {/* Status dot: live (purple) > online (green) > offline (gray) */}
                    <div style={{
                      position: 'absolute', bottom: '-1px', right: '-1px',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: statusColor,
                      border: '2px solid var(--bg-deep)',
                      boxShadow: isLive ? `0 0 6px var(--primary-glow)` : 'none',
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
                      {liveInfo.twitchUrl || liveInfo.youtubeUrl ? '🔴' : ''}
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
      <div className="home-sidebar-left" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Feed mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16v4H4z"/><path d="M4 12h16v8H4z"/>
            </svg>
            Inicio
          </h1>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
            <button onClick={() => { setFeedMode('global'); setPage(1); }} style={{
              padding: '5px 12px', fontSize: '0.78rem', borderRadius: '6px', border: 'none',
              background: feedMode === 'global' ? 'var(--primary)' : 'transparent',
              color: feedMode === 'global' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: feedMode === 'global' ? 600 : 400,
              transition: 'all 0.2s',
            }}>Global</button>
            <button onClick={() => { setFeedMode('following'); setPage(1); }} style={{
              padding: '5px 12px', fontSize: '0.78rem', borderRadius: '6px', border: 'none',
              background: feedMode === 'following' ? 'var(--primary)' : 'transparent',
              color: feedMode === 'following' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: feedMode === 'following' ? 600 : 400,
              transition: 'all 0.2s',
            }}>Siguiendo</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,77,79,0.1)', color: 'var(--error)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <CreatePost
          compact
          onPostCreated={handlePostCreated}
        />

        {/* ═══ LIVE VTUBERS — tarjetas tipo publicación ═══ */}
        {liveVtubers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {liveVtubers.map(v => (
              <div key={v.id} className="glass" style={{
                borderRadius: '16px',
                border: '1px solid rgba(233,30,99,0.15)',
                boxShadow: '0 0 30px rgba(233,30,99,0.06)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                animation: 'fadeInUp 0.5s ease forwards',
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
                {/* Live header bar */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, rgba(233,30,99,0.08), rgba(145,65,255,0.04))',
                  borderBottom: '1px solid rgba(233,30,99,0.1)',
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#e91e63',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#e91e63', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    En vivo ahora
                  </span>
                </div>

                {/* Card body */}
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Avatar */}
                  <Link href={`/profile/${v.userId}`} style={{ flexShrink: 0 }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: v.avatarUrl
                        ? `url(${v.avatarUrl}) center/cover`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '1rem',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'transform 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {!v.avatarUrl && v.displayName.charAt(0).toUpperCase()}
                      {v.avatarUrl && (
                        <img src={v.avatarUrl} alt={v.displayName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      {/* Live ring */}
                      <div style={{
                        position: 'absolute', inset: -3, borderRadius: '50%',
                        border: '2px solid rgba(233,30,99,0.5)',
                        animation: 'pulse 2s ease-in-out infinite',
                        pointerEvents: 'none',
                      }} />
                    </div>
                  </Link>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Link href={`/profile/${v.userId}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                        {v.displayName}
                      </Link>
                      {v.isVerified && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="Verificado">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      @{v.user.username} · {v.twitchUrl ? 'Twitch' : v.youtubeUrl ? 'YouTube' : 'Streaming'}
                    </div>
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <a
                      href={v.twitchUrl || v.youtubeUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #e91e63, #ff6b9d)',
                        color: '#fff', border: 'none',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        animation: 'vtuber-live-glow 2s ease-in-out infinite',
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                      Ver Stream
                    </a>
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
            <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.3 }}>🌌</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '4px' }}>No hay publicaciones aún.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>¡Comparte algo con la comunidad estelar!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} currentUserId={user.id} onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))} />
            ))}
            {hasMore && (
              <button onClick={loadMore} disabled={loadingMore} className="btn btn--outline" style={{
                padding: '12px', width: '100%', justifyContent: 'center', fontSize: '0.85rem',
              }}>
                {loadingMore ? (
                  <><span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Cargando...</>
                ) : 'Cargar más publicaciones ↓'}
              </button>
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

// ==========================================================================
// Page Entry Point
// ==========================================================================
export default function HomePage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p>Cargando...</p>
      </div>
    }>
      <HomeContent />
    </ClientOnly>
  );
}
