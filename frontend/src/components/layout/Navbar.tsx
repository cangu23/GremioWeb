"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { connectSocket, NOTIFICATION_EVENTS, DM_EVENTS } from '@/lib/socket-client';
import { useToast } from '@/lib/ToastContext';
import ClientOnly from '@/lib/ClientOnly';
import UserAvatar from '@/components/ui/UserAvatar';
import StardustStatsModal from '@/components/ui/StardustStatsModal';
import StardustCardButton from '@/components/ui/StardustCardButton';
import GiftEnvelopeModal, { GiftData } from '@/components/ui/GiftEnvelopeModal';
import styles from './Navbar.module.css';
import { Users, Calendar, Shield, FileText, MessageCircle, ShoppingBag, Award, BarChart, Bell, Backpack, Sparkles, Settings, LogOut, Key, Plus, Grid, TrendingUp, User, HelpCircle } from '@/components/ui/Icons';

// ==========================================================================
// SVG Icon components (unique to header)
// ==========================================================================

const Icons = {
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  message: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  write: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  shield: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  shop: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  trending: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
};

// ==========================================================================
// Hook: shared navbar state (notification count, equipped badge, socket)
// Elevado al Navbar padre para evitar duplicación entre AuthNav mobile/desktop
// ==========================================================================
function useNavbarState(user: { id: string } | null, isLoading: boolean) {
  const { showToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [equippedBadge, setEquippedBadge] = useState<{ icon: string; label: string } | null>(null);

  // Equipped badge fetch
  useEffect(() => {
    if (isLoading || !user) { setEquippedBadge(null); return; }
    (async () => {
      try {
        const badge = await apiFetch(`/shop/badge/${user.id}`, {});
        if (badge?.item?.data) {
          const data = JSON.parse(badge.item.data);
          setEquippedBadge({ icon: data.icon || '🏅', label: data.label || '' });
        } else {
          setEquippedBadge(null);
        }
      } catch { setEquippedBadge(null); }
    })();
  }, [user]);

  // Notification count: polling + real-time socket + custom refresh event
  // Only runs when user is logged in
  useEffect(() => {
    if (isLoading || !user) { setUnreadCount(0); return; }

    const fetchUnread = async () => {
      try { const data = await apiFetch('/notifications/unread-count', {}); setUnreadCount(data.count); } catch { }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 120000); // Cada 2 minutos

    // Listen for custom event dispatched when user reads notifications on /notifications page
    const handleNotifsRead = () => setTimeout(fetchUnread, 300);
    window.addEventListener('notifications-read', handleNotifsRead);

    let sock: any;
    try {
      sock = connectSocket();
      sock.on(NOTIFICATION_EVENTS.NEW, (notif: any) => {
        setUnreadCount(prev => prev + 1);
        const toastMsg = notif?.title || 'Nueva notificación';
        showToast(toastMsg, 'success');
        const isGift = notif?.type === 'STARDUST_RECEIVED' || notif?.type === 'GIFT_PLAN_RECEIVED' || notif?.title?.includes('Regalo') || notif?.title?.includes('Polvo Estelar');
        if (isGift) {
          window.dispatchEvent(new CustomEvent('open-gift-envelope', { detail: notif }));
        }
      });
    } catch (err) {
      console.warn('[Socket] Could not connect for notifications:', err);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', handleNotifsRead);
      if (sock) sock.off(NOTIFICATION_EVENTS.NEW);
    };
  }, [user, showToast]);

  // DM unread count: fetch + real-time via socket
  // Only runs when user is logged in
  useEffect(() => {
    if (isLoading || !user) { setDmUnreadCount(0); return; }

    const fetchDmUnread = async () => {
      try { const data = await apiFetch('/dm/unread-count', {}); setDmUnreadCount(data.count); } catch { }
    };
    fetchDmUnread();
    const interval = setInterval(fetchDmUnread, 120000); // Cada 2 minutos

    let sock: any;
    try {
      sock = connectSocket();
      // Increment when a new DM arrives (not from ourselves)
      sock.on(DM_EVENTS.MESSAGE, (msg: { receiverId: string }) => {
        if (msg.receiverId === user.id) {
          setDmUnreadCount(prev => prev + 1);
        }
      });
    } catch (err) {
      console.warn('[Socket] Could not connect for DM count:', err);
    }

    return () => {
      clearInterval(interval);
      if (sock) sock.off(DM_EVENTS.MESSAGE);
    };
  }, [user]);

  return { unreadCount, dmUnreadCount, equippedBadge };
}

// ==========================================================================
// Global Search Modal
// ==========================================================================
function SearchModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    guilds: any[];
    posts: any[];
    events: any[];
  }>({ users: [], guilds: [], posts: [], events: [] });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], guilds: [], posts: [], events: [] });
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch(`/search?q=${encodeURIComponent(query.trim())}&limit=4`, {});
        setResults(data || { users: [], guilds: [], posts: [], events: [] });
      } catch {
        setResults({ users: [], guilds: [], posts: [], events: [] });
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const totalResults = results.users.length + results.guilds.length + results.posts.length + results.events.length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '80px', paddingLeft: '16px', paddingRight: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%', maxWidth: '580px', padding: '16px', borderRadius: '16px',
          background: 'rgba(15, 15, 22, 0.95)', border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
          <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{Icons.search}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar usuarios, gremios, eventos o publicaciones..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: '0.95rem', fontFamily: 'inherit',
            }}
          />
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: '4px', display: 'inline-flex',
          }}>
            {Icons.close}
          </button>
        </div>

        {searching && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '8px' }} />
            Buscando en GremioWeb...
          </div>
        )}

        {!searching && query.trim() && totalResults === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No se encontraron resultados para &quot;{query}&quot;
          </div>
        )}

        {!searching && !query.trim() && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span>Accesos rápidos:</span>
            {[
              { label: 'VTubers', href: '/vtubers' },
              { label: 'Eventos', href: '/events' },
              { label: 'Gremios', href: '/guilds' },
              { label: 'Tienda', href: '/shop' },
              { label: 'Hoshizora Maid', href: '/hoshizora-maid' },
            ].map(q => (
              <Link key={q.label} href={q.href} onClick={onClose} style={{
                padding: '2px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-muted)', fontSize: '0.78rem', textDecoration: 'none',
              }}>
                {q.label}
              </Link>
            ))}
          </div>
        )}

        {!searching && totalResults > 0 && (
          <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.users.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '4px' }}>Usuarios</div>
                {results.users.map(u => (
                  <Link key={u.id} href={`/profile/${u.id}`} onClick={onClose} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px',
                    textDecoration: 'none', color: 'var(--text)', fontSize: '0.85rem',
                  }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: u.avatarUrl ? `url(${u.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold',
                    }}>
                      {!u.avatarUrl && u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.displayName || u.username}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {results.guilds.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '4px' }}>Gremios</div>
                {results.guilds.map(g => (
                  <Link key={g.id} href={`/guilds/${g.id}`} onClick={onClose} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px',
                    textDecoration: 'none', color: 'var(--text)', fontSize: '0.85rem',
                  }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: g.logoUrl ? `url(${g.logoUrl}) center/cover` : 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold',
                    }}>
                      {!g.logoUrl && g.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{g.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{g._count?.members || 0} miembros</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {results.posts.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#4caf50', marginBottom: '4px' }}>Publicaciones</div>
                {results.posts.map(p => (
                  <Link key={p.id} href={`/feed?post=${p.id}`} onClick={onClose} style={{
                    display: 'block', padding: '6px 8px', borderRadius: '6px',
                    textDecoration: 'none', color: 'var(--text)', fontSize: '0.82rem',
                  }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{p.user.username}: </span>
                    <span>{p.content}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// Notifications & Direct Messages Popovers
// ==========================================================================
function NotificationsDropdown({ unreadCount }: { unreadCount: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && user) {
      setLoading(true);
      try {
        const data = await apiFetch('/notifications?limit=5', {});
        setNotifs(data || []);
      } catch {} finally {
        setLoading(false);
      }
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          padding: '7px', borderRadius: '8px', border: 'none',
          background: open ? 'rgba(255,255,255,0.06)' : 'transparent',
          color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex',
          transition: 'all 0.15s', position: 'relative',
        }}
        title="Notificaciones"
      >
        {Icons.bell}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '3px', right: '3px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--primary)', boxShadow: '0 0 6px var(--primary-glow)',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px',
          width: '320px', zIndex: 1000,
          background: 'rgba(20,20,32,0.97)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)', padding: '12px',
          animation: 'slideDown 0.15s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Notificaciones</span>
            <Link href="/notifications" onClick={() => setOpen(false)} style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Ver todas →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cargando...</div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin notificaciones recientes</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    const isGift = n.type === 'STARDUST_RECEIVED' || n.type === 'GIFT_PLAN_RECEIVED' || n.title?.includes('Regalo') || n.title?.includes('Polvo Estelar');
                    if (isGift) {
                      window.dispatchEvent(new CustomEvent('open-gift-envelope', { detail: n }));
                    } else {
                      router.push('/notifications');
                    }
                  }}
                  style={{
                    padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
                    background: n.read ? 'transparent' : 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(139,92,246,0.1)')}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff', marginBottom: '2px' }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessagesDropdown({ dmUnreadCount }: { dmUnreadCount: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && user) {
      setLoading(true);
      try {
        const data = await apiFetch('/dm/conversations', {});
        setConvs((data || []).slice(0, 5));
      } catch {} finally {
        setLoading(false);
      }
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          padding: '7px', borderRadius: '8px', border: 'none',
          background: open ? 'rgba(255,255,255,0.06)' : 'transparent',
          color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex',
          transition: 'all 0.15s', position: 'relative',
        }}
        title="Mensajes Directos"
      >
        {Icons.message}
        {dmUnreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            minWidth: '16px', height: '16px', borderRadius: '8px',
            background: 'var(--secondary)', color: '#fff', fontSize: '0.6rem',
            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', boxShadow: '0 0 6px rgba(255,0,127,0.5)',
          }}>
            {dmUnreadCount > 99 ? '99+' : dmUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px',
          width: '320px', zIndex: 1000,
          background: 'rgba(20,20,32,0.97)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)', padding: '12px',
          animation: 'slideDown 0.15s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Bandeja de Entrada</span>
            <Link href="/chat" onClick={() => setOpen(false)} style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Ver chat completo →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cargando chats...</div>
          ) : convs.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No tienes conversaciones recientes</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {convs.map(c => {
                const other = c.senderId === user?.id ? c.receiver : c.sender;
                const name = other.displayName || other.vtuberProfile?.displayName || other.username;
                return (
                  <div
                    key={c.id}
                    onClick={() => { setOpen(false); router.push(`/chat?user=${other.id}`); }}
                    style={{
                      padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  >
                    <UserAvatar src={other.avatarUrl || other.vtuberProfile?.avatarUrl} alt={name} size={34} user={other} userId={other.id} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff' }}>{name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// Quick Create Dropdown (Post, Event, Guild)
// ==========================================================================
function CreateDropdown({ closeMenu }: { closeMenu?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const canCreate = user?.role === 'VTUBER' || user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const actions = [
    { icon: Icons.write, label: 'Nueva Publicación', href: '/', color: 'var(--primary)' },
    ...(canCreate ? [
      { icon: Icons.calendar, label: 'Nuevo Evento', href: '/events/create', color: 'var(--accent)' },
      { icon: Icons.shield, label: 'Nuevo Gremio', href: '/guilds/create', color: 'var(--success)' },
    ] : []),
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '7px', borderRadius: '8px', border: 'none',
          background: open ? 'var(--primary-subtle)' : 'transparent',
          color: open ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
        title="Crear"
      >
        {Icons.plus}
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-flex' }}>
          {Icons.chevronDown}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: '0', marginTop: '6px',
          minWidth: '200px', zIndex: 100,
          background: 'rgba(20,20,30,0.96)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)', borderRadius: '12px',
          padding: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.15s ease',
        }}>
          {actions.map(action => (
            <Link key={action.href} href={action.href}
              onClick={() => { setOpen(false); closeMenu?.(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
                color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
                transition: 'background 0.12s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: action.color, display: 'inline-flex' }}>{action.icon}</span>
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// User Menu Dropdown
// ==========================================================================
function UserMenu({ closeMenu, equippedBadge }: { closeMenu?: () => void; equippedBadge: { icon: string; label: string } | null }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const avatarUrl = user.avatarUrl || user.vtuberProfile?.avatarUrl || '';
  const displayName = user.displayName || user.vtuberProfile?.displayName || user.username;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title={displayName}
        style={{
          padding: 0, border: 'none', background: 'none', cursor: 'pointer',
          display: 'inline-flex', flexShrink: 0,
          outline: open ? '2px solid var(--primary)' : '2px solid transparent',
          outlineOffset: '2px',
          transition: 'outline 0.15s',
        }}
      >
        <UserAvatar
          src={avatarUrl}
          alt={displayName}
          user={user}
          size={32}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: '0', marginTop: '6px',
          minWidth: '190px', zIndex: 100,
          background: 'rgba(20,20,30,0.96)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)', borderRadius: '12px',
          padding: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.15s ease',
        }}>
          {/* User info header with badge */}
          <div style={{
            padding: '8px 12px 10px', borderBottom: '1px solid var(--glass-border)',
            marginBottom: '4px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {displayName}
              {equippedBadge && (
                <span title={`Insignia: ${equippedBadge.label}`} style={{ fontSize: '1rem', lineHeight: 1 }}>
                  {equippedBadge.icon}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{user.username}</div>
          </div>

          <Link href={`/profile/${user.id}`}
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>{Icons.user}</span>
            <span>Mi Perfil</span>
          </Link>

          <Link href={(user.role === 'VTUBER' || user.role === 'MAID') ? "/vtuber-profile" : "/settings"}
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span>{(user.role === 'VTUBER' || user.role === 'MAID') ? 'Perfil VTuber' : 'Configuración'}</span>
          </Link>

          <Link href="/dashboard"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>{Icons.grid}</span>
            <span>Dashboard</span>
          </Link>

          <Link href="/achievements"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: '#ffd700', display: 'inline-flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </span>
            <span style={{ color: '#ffd700', fontWeight: 600 }}>Logros y Trofeos 🏆</span>
          </Link>

          <Link href="/pass"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: '#38bdf8', display: 'inline-flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#38bdf8" stroke="#38bdf8" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Pase Estelar</span>
          </Link>

          <Link href="/premium"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: '#fbbf24', display: 'inline-flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>
            </span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>Planes Premium</span>
          </Link>

          <Link href="/shop"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: 'var(--warm)', display: 'inline-flex' }}>{Icons.shop}</span>
            <span style={{ color: 'var(--warm)' }}>Tienda</span>
          </Link>

          {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
            <Link href="/admin"
              onClick={() => setOpen(false)}
              style={menuItemStyle}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{Icons.trending}</span>
              <span style={{ color: 'var(--primary)' }}>{user.role === 'ADMIN' ? 'Panel Admin' : 'Panel Moderación'}</span>
            </Link>
          )}

          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />

          <button onClick={() => { setOpen(false); logout(); closeMenu?.(); }}
            style={{
              ...menuItemStyle, border: 'none', background: 'transparent', width: '100%',
              cursor: 'pointer', color: 'var(--error)',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ display: 'inline-flex' }}>{Icons.logout}</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
  color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
  transition: 'background 0.12s',
};

// ==========================================================================
// AuthNav — redesigned with unique icons, no sidebar duplicates
// ==========================================================================
function AuthNav({ closeMenu, isMobile, unreadCount, dmUnreadCount, equippedBadge }: {
  closeMenu?: () => void;
  isMobile?: boolean;
  unreadCount: number;
  dmUnreadCount: number;
  equippedBadge: { icon: string; label: string } | null;
}) {
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showStardustModal, setShowStardustModal] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('gremio_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('gremio_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const iconBtn: React.CSSProperties = {
    padding: '7px', borderRadius: '8px', border: 'none',
    background: 'transparent', color: 'var(--text-muted)',
    cursor: 'pointer', display: 'inline-flex',
    transition: 'all 0.15s', position: 'relative',
  };

  const mobileLink: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
    color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
  };

  if (user) {
    // Mobile mode: renders vertical nav list (shown inside hamburger menu)
    if (isMobile) {
      return (
        <>
          {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
          <StardustStatsModal isOpen={showStardustModal} onClose={() => setShowStardustModal(false)} />
          <button onClick={() => { setShowSearch(true); closeMenu?.(); }} style={{
            ...mobileLink, border: 'none', background: 'transparent', width: '100%', cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>{Icons.search}</span>
            <span>Buscar</span>
          </button>

          <div style={{ marginBottom: '6px' }}>
            <StardustCardButton
              isMobile
              onClick={() => { setShowStardustModal(true); closeMenu?.(); }}
            />
          </div>

          {[
            { icon: <FileText size={18} />, label: 'Feed', href: '/' },
            { icon: <Calendar size={18} />, label: 'Eventos', href: '/events' },
            { icon: <Shield size={18} />, label: 'Gremios', href: '/guilds' },
            { icon: <Users size={18} />, label: 'VTubers', href: '/vtubers' },
            { icon: <MessageCircle size={18} />, label: 'Chat', href: '/chat', badge: dmUnreadCount > 0 ? dmUnreadCount : undefined },
            { icon: <ShoppingBag size={18} />, label: 'Tienda', href: '/shop' },
            { icon: <Award size={18} />, label: 'Ranking', href: '/leaderboard' },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Recompensas', href: '/daily-rewards' },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>, label: 'Ruleta', href: '/roulette' },
            { icon: <BarChart size={18} />, label: 'Dashboard', href: '/dashboard' },
            { icon: <Bell size={18} />, label: 'Notificaciones', href: '/notifications', badge: unreadCount > 0 ? unreadCount : undefined },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>, label: 'Hoshizora Maid', href: '/hoshizora-maid' },
          ].map(link => (
            <Link key={link.href} href={link.href} onClick={closeMenu} style={mobileLink}>
              <span style={{ display: 'inline-flex', width: '20px', justifyContent: 'center' }}>{link.icon}</span>
              <span>{link.label}</span>
              {link.badge !== undefined && link.badge > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--primary)', color: '#fff',
                  fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '10px',
                }}>
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </Link>
          ))}

          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />

          {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
            <Link href="/admin" onClick={closeMenu} style={{ ...mobileLink, color: 'var(--primary)', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', width: '20px', justifyContent: 'center' }}><Settings size={18} color="var(--primary)" /></span>
              <span>{user.role === 'ADMIN' ? 'Panel Admin' : 'Panel Moderación'}</span>
            </Link>
          )}

          <Link href={`/profile/${user.id}`} onClick={closeMenu} style={mobileLink}>
            <UserAvatar
              src={user.avatarUrl || user.vtuberProfile?.avatarUrl}
              alt={user.username}
              size={20}
              user={user}
              userId={user.id}
            />
            <span>Mi Perfil</span>
          </Link>

          <Link href={(user.role === 'VTUBER' || user.role === 'MAID') ? "/vtuber-profile" : "/settings"} onClick={closeMenu} style={mobileLink}>
            <span style={{ display: 'inline-flex', width: '20px', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span>{(user.role === 'VTUBER' || user.role === 'MAID') ? 'Perfil VTuber' : 'Configuración'}</span>
          </Link>

          <button onClick={() => { logout(); closeMenu?.(); }} style={{
            ...mobileLink, border: 'none', background: 'transparent', width: '100%', cursor: 'pointer',
            color: 'var(--error)',
          }}>
            <span style={{ display: 'inline-flex', width: '20px', justifyContent: 'center' }}><LogOut size={18} /></span>
            <span>Cerrar Sesión</span>
          </button>
        </>
      );
    }

    // Desktop mode: horizontal icon bar
    return (
      <>
        {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
        <StardustStatsModal isOpen={showStardustModal} onClose={() => setShowStardustModal(false)} />

        <StardustCardButton
          onClick={() => setShowStardustModal(true)}
        />

        <button
          onClick={() => setShowSearch(true)}
          style={iconBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="Buscar (Ctrl+K)"
          aria-label="Buscar en la plataforma"
        >
          {Icons.search}
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={toggleTheme}
          style={iconBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Cambiar tema de color"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        <MessagesDropdown dmUnreadCount={dmUnreadCount} />
        <NotificationsDropdown unreadCount={unreadCount} />

        {/* Hoshizora Maid — Café link */}
        <Link href="/hoshizora-maid" style={{ ...iconBtn, textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,160,48,0.12)'; e.currentTarget.style.color = '#d4a030'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="Hoshizora Maid Café"
          aria-label="Hoshizora Maid Café"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </Link>

        <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 4px' }} />

        <CreateDropdown closeMenu={closeMenu} />
        <UserMenu closeMenu={closeMenu} equippedBadge={equippedBadge} />
      </>
    );
  }

  // Non-authenticated
  if (isMobile) {
    return (
      <>
        {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
        <button onClick={() => { setShowSearch(true); closeMenu?.(); }} style={{
          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
          padding: '10px 12px', borderRadius: '8px', border: 'none',
          background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
        }}>
          <span style={{ display: 'inline-flex' }}>{Icons.search}</span>
          <span>Buscar</span>
        </button>
        <Link href="/login" onClick={closeMenu} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
          color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
        }}>
          <span style={{ display: 'inline-flex', width: '20px', justifyContent: 'center' }}><Key size={18} /></span>
          <span>Iniciar Sesión</span>
        </Link>
        <Link href="/register" onClick={closeMenu} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
          color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
          background: 'var(--primary-subtle)',
        }}>
          <span style={{ display: 'inline-flex', width: '20px', justifyContent: 'center' }}><Sparkles size={18} color="var(--primary)" /></span>
          <span>Unirse al Gremio</span>
        </Link>
      </>
    );
  }

  return (
    <>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      <button onClick={() => setShowSearch(true)} style={{
        padding: '7px', borderRadius: '8px', border: 'none',
        background: 'transparent', color: 'var(--text-muted)',
        cursor: 'pointer', display: 'inline-flex', transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        title="Buscar"
      >
        {Icons.search}
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 8px' }} />

      <Link href="/login" style={{
        color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500,
        textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', transition: 'all 0.2s ease',
      }} onClick={closeMenu}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
        Iniciar Sesión
      </Link>
      <Link href="/register" style={{
        padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600,
        borderRadius: '6px', background: 'var(--primary)', color: '#fff', textDecoration: 'none',
        transition: 'all 0.2s ease',
      }} onClick={closeMenu}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(139,92,246,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.boxShadow = 'none'; }}>
        Unirse
      </Link>
    </>
  );
}

// ==========================================================================
// Navbar (shell with scroll effect)
// NOTE: AuthNav returns RAW buttons/icons (no wrapper classes).
// Navbar wraps them in desktopNav / mobileMenu for proper CSS layout.
// ==========================================================================
export default function Navbar() {
  const { user, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { unreadCount, dmUnreadCount, equippedBadge } = useNavbarState(user, isLoading);

  const [globalGiftData, setGlobalGiftData] = useState<GiftData | null>(null);
  const [showGlobalEnvelope, setShowGlobalEnvelope] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleGiftEvent = (e: any) => {
      if (e.detail) {
        const notif = e.detail;
        const senderMatch = notif.message?.match(/@([a-zA-Z0-9_.-]+)/);
        const senderName = senderMatch ? senderMatch[1] : 'Amigo Estelar';
        const msgMatch = notif.message?.match(/:\s*"([^"]+)"/);
        const amountMatch = notif.message?.match(/⭐\s*([\d,.]+)/);
        setGlobalGiftData({
          id: notif.id,
          isAlreadyRead: notif.read,
          title: notif.title,
          senderName,
          amount: amountMatch ? amountMatch[1] : undefined,
          message: msgMatch ? msgMatch[1] : undefined,
          giftType: notif.type === 'GIFT_PLAN_RECEIVED' ? 'PREMIUM' : 'STARDUST',
        });
        setShowGlobalEnvelope(true);
      }
    };
    window.addEventListener('open-gift-envelope' as any, handleGiftEvent);
    return () => window.removeEventListener('open-gift-envelope' as any, handleGiftEvent);
  }, []);

  return (
    <>
      <nav
        className={styles.navbar}
        style={{
          background: scrolled ? 'rgba(13, 13, 13, 0.92)' : 'rgba(13, 13, 13, 0.6)',
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
            <Image src="/logo.png" alt="Gremio Estelar" width={0} height={0} sizes="100vw" priority style={{ height: '28px', width: 'auto' }} />
          </Link>

          <div className={styles.desktopNav}>
            <ClientOnly fallback={null}>
              <AuthNav unreadCount={unreadCount} dmUnreadCount={dmUnreadCount} equippedBadge={equippedBadge} />
            </ClientOnly>
          </div>

          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir navegación principal" aria-expanded={menuOpen}>
            <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile: AuthNav renders the mobile menu content directly */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <ClientOnly fallback={null}>
              <AuthNav isMobile closeMenu={() => setMenuOpen(false)} unreadCount={unreadCount} dmUnreadCount={dmUnreadCount} equippedBadge={equippedBadge} />
            </ClientOnly>
          </div>
        )}
      </nav>

      {/* Global Interactive Gift Envelope Modal */}
      <GiftEnvelopeModal
        isOpen={showGlobalEnvelope}
        onClose={() => setShowGlobalEnvelope(false)}
        giftData={globalGiftData}
      />
    </>
  );
}
