"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { connectSocket, NOTIFICATION_EVENTS } from '@/lib/socket-client';
import { useToast } from '@/lib/ToastContext';
import ClientOnly from '@/lib/ClientOnly';
import styles from './Navbar.module.css';

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
function useNavbarState(user: { id: string } | null) {
  const { showToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [equippedBadge, setEquippedBadge] = useState<{ icon: string; label: string } | null>(null);

  // Equipped badge fetch
  useEffect(() => {
    if (!user) { setEquippedBadge(null); return; }
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

  // Notification count: polling + real-time socket
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchUnread = async () => {
      try { const data = await apiFetch('/notifications/unread-count', {}); setUnreadCount(data.count); } catch { }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);

    let sock: any;
    try {
      sock = connectSocket();
      sock.on(NOTIFICATION_EVENTS.NEW, () => {
        setUnreadCount(prev => prev + 1);
        showToast('🔔 Nueva notificación', 'success');
      });
    } catch (err) {
      console.warn('[Socket] Could not connect for notifications:', err);
    }

    return () => {
      clearInterval(interval);
      if (sock) sock.off(NOTIFICATION_EVENTS.NEW);
    };
  }, [user, showToast]);

  return { unreadCount, equippedBadge };
}

// ==========================================================================
// Global Search Modal
// ==========================================================================
function SearchModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; href: string; icon: string }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const q = query.toLowerCase();
    const items = [
      { label: 'VTubers', href: '/vtubers', icon: '👤' },
      { label: 'Eventos', href: '/events', icon: '📅' },
      { label: 'Gremios', href: '/guilds', icon: '🛡️' },
      { label: 'Feed', href: '/feed', icon: '📰' },
      { label: 'Chat global', href: '/chat', icon: '💬' },
      { label: 'Tienda', href: '/shop', icon: '🛒' },
      { label: 'Ranking', href: '/leaderboard', icon: '🏆' },
      { label: 'Dashboard', href: '/dashboard', icon: '📊' },
      { label: 'Notificaciones', href: '/notifications', icon: '🔔' },
      { label: 'Inventario', href: '/inventory', icon: '🎒' },
      { label: 'Logros', href: '/achievements', icon: '🏅' },
    ];
    const filtered = items
      .filter(item => item.label.toLowerCase().includes(q))
      .slice(0, 6);
    setResults(filtered);
    setSearching(false);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '120px', animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%', maxWidth: '480px', padding: '16px',
          animation: 'slideDown 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>{Icons.search}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar en Gremio Estelar..."
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

        {!query.trim() && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span>Ir a:</span>
            {[
              { label: 'Eventos', href: '/events' },
              { label: 'VTubers', href: '/vtubers' },
              { label: 'Gremios', href: '/guilds' },
              { label: 'Tienda', href: '/shop' },
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

        {searching && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Buscando...
          </div>
        )}
        {!searching && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {results.map(item => (
              <Link key={item.href} href={item.href} onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
                color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
                transition: 'background 0.12s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
        {!searching && query.trim() && results.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No se encontraron resultados para &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// Quick Create Dropdown (Post, Event, Guild)
// ==========================================================================
function CreateDropdown({ closeMenu }: { closeMenu?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    { icon: Icons.write, label: 'Nueva Publicación', href: '/feed', color: 'var(--primary)' },
    { icon: Icons.calendar, label: 'Nuevo Evento', href: '/events/create', color: 'var(--accent)' },
    { icon: Icons.shield, label: 'Nuevo Gremio', href: '/guilds/create', color: 'var(--success)' },
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

  const avatarUrl = user.vtuberProfile?.avatarUrl || '';
  const displayName = user.vtuberProfile?.displayName || user.username;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '32px', height: '32px', borderRadius: '50%', border: 'none',
          padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
          background: avatarUrl
            ? `url(${avatarUrl}) center/cover`
            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
          outline: open ? '2px solid var(--primary)' : '2px solid transparent',
          outlineOffset: '2px',
          transition: 'outline 0.15s',
        }}
        title={displayName}
      >
        {!avatarUrl && (
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
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

          <Link href="/dashboard"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>{Icons.grid}</span>
            <span>Dashboard</span>
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

          {user.role === 'ADMIN' && (
            <Link href="/admin"
              onClick={() => setOpen(false)}
              style={menuItemStyle}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{Icons.trending}</span>
              <span style={{ color: 'var(--primary)' }}>Admin</span>
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
function AuthNav({ closeMenu, isMobile, unreadCount, equippedBadge }: {
  closeMenu?: () => void;
  isMobile?: boolean;
  unreadCount: number;
  equippedBadge: { icon: string; label: string } | null;
}) {
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

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

          {[
            { icon: '📰', label: 'Feed', href: '/feed' },
            { icon: '📅', label: 'Eventos', href: '/events' },
            { icon: '🛡️', label: 'Gremios', href: '/guilds' },
            { icon: '👤', label: 'VTubers', href: '/vtubers' },
            { icon: '💬', label: 'Chat', href: '/chat' },
            { icon: '🛒', label: 'Tienda', href: '/shop' },
            { icon: '🏆', label: 'Ranking', href: '/leaderboard' },
            { icon: '📊', label: 'Dashboard', href: '/dashboard' },
            { icon: '🔔', label: 'Notificaciones', href: '/notifications', badge: unreadCount > 0 ? unreadCount : undefined },
          ].map(link => (
            <Link key={link.href} href={link.href} onClick={closeMenu} style={mobileLink}>
              <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{link.icon}</span>
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

          {user.role === 'ADMIN' && (
            <Link href="/admin" onClick={closeMenu} style={{ ...mobileLink, color: 'var(--primary)', fontWeight: 600 }}>
              <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>⚙️</span>
              <span>Admin</span>
            </Link>
          )}

          <Link href={`/profile/${user.id}`} onClick={closeMenu} style={mobileLink}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
              background: user.vtuberProfile?.avatarUrl
                ? `url(${user.vtuberProfile.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.6rem', fontWeight: 'bold',
            }}>
              {!user.vtuberProfile?.avatarUrl && (user.vtuberProfile?.displayName || user.username).charAt(0).toUpperCase()}
            </div>
            <span>Mi Perfil</span>
          </Link>

          <button onClick={() => { logout(); closeMenu?.(); }} style={{
            ...mobileLink, border: 'none', background: 'transparent', width: '100%', cursor: 'pointer',
            color: 'var(--error)',
          }}>
            <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </>
      );
    }

    // Desktop mode: horizontal icon bar
    return (
      <>
        {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
        <button onClick={() => setShowSearch(true)} style={iconBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="Buscar"
        >
          {Icons.search}
        </button>

        <Link href="/chat" style={{ ...iconBtn, textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="Chat global"
        >
          {Icons.message}
        </Link>

        <Link href="/notifications" style={{ ...iconBtn, textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="Notificaciones"
        >
          {Icons.bell}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '3px', right: '3px',
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 6px var(--primary-glow)',
            }} />
          )}
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
          <span style={{ fontSize: '1rem' }}>🔑</span>
          <span>Iniciar Sesión</span>
        </Link>
        <Link href="/register" onClick={closeMenu} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
          color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
          background: 'var(--primary-subtle)',
        }}>
          <span style={{ fontSize: '1rem' }}>✨</span>
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
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { unreadCount, equippedBadge } = useNavbarState(user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
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
          <Image src="/logo.png" alt="Gremio Estelar" width={0} height={0} sizes="100vw" style={{ height: '28px', width: 'auto' }} />
        </Link>

        <div className={styles.desktopNav}>
          <ClientOnly fallback={null}>
            <AuthNav unreadCount={unreadCount} equippedBadge={equippedBadge} />
          </ClientOnly>
        </div>

        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile: AuthNav renders the mobile menu content directly */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <ClientOnly fallback={null}>
            <AuthNav isMobile closeMenu={() => setMenuOpen(false)} unreadCount={unreadCount} equippedBadge={equippedBadge} />
          </ClientOnly>
        </div>
      )}
    </nav>
  );
}
