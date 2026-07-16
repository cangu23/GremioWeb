"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { connectSocket, NOTIFICATION_EVENTS } from '@/lib/socket-client';
import { useToast } from '@/lib/ToastContext';
import ClientOnly from '@/lib/ClientOnly';
import styles from './Navbar.module.css';

function AuthNav({ closeMenu }: { closeMenu?: () => void }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [equippedBadge, setEquippedBadge] = useState<{ icon: string; label: string } | null>(null);

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

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try { const data = await apiFetch('/notifications/unread-count', {}); setUnreadCount(data.count); } catch { }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);

    let sock: any;
    const setupSocket = () => {
      try {
        sock = connectSocket();
        sock.on(NOTIFICATION_EVENTS.NEW, (notification: {
          id: string;
          userId: string;
          type: string;
          title: string;
          message: string;
          referenceId: string | null;
          read: boolean;
          createdAt: string;
        }) => {
          setUnreadCount(prev => prev + 1);
          showToast(`🔔 ${notification.title}`, 'success');
        });
      } catch (err) {
        console.warn('[Socket] Could not connect for notifications:', err);
      }
    };
    setupSocket();

    return () => {
      clearInterval(interval);
      if (sock) {
        sock.off(NOTIFICATION_EVENTS.NEW);
      }
    };
  }, [user, showToast]);

  const linkBase: React.CSSProperties = {
    color: 'var(--text-muted)',
    textDecoration: 'none',
    padding: '6px 12px',
    fontSize: '0.82rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  };

  const navGroup: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  };

  const navSeparator: React.CSSProperties = {
    width: '1px',
    height: '16px',
    background: 'var(--glass-border)',
    margin: '0 8px',
  };

  return (
    <>
      <div style={navGroup}>
        <Link href="/events" style={linkBase} onClick={closeMenu}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
          Eventos
        </Link>
        <Link href="/guilds" style={linkBase} onClick={closeMenu}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
          Gremios
        </Link>
        <Link href="/vtubers" style={linkBase} onClick={closeMenu}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
          VTubers
        </Link>
      </div>

      <div style={navSeparator} />

      <div style={navGroup}>
        <Link href="/feed" style={linkBase} onClick={closeMenu}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
          Feed
        </Link>
        <Link href="/chat" style={linkBase} onClick={closeMenu}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
          Chat
        </Link>
        <Link href="/leaderboard" style={linkBase} onClick={closeMenu}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
          Ranking
        </Link>
        <Link href="/shop" style={{...linkBase, color: 'var(--warm)'}} onClick={closeMenu}
          onMouseEnter={e => { e.currentTarget.style.color = '#f4a261'; e.currentTarget.style.background = 'rgba(244,162,97,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--warm)'; e.currentTarget.style.background = 'transparent'; }}>
          Tienda
        </Link>
      </div>

      <div style={navSeparator} />

      {user ? (
        <>
          {equippedBadge && (
            <span title={`Insignia: ${equippedBadge.label}`} style={{ fontSize: '1rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
              {equippedBadge.icon}
            </span>
          )}

          <Link href="/notifications" style={{ ...linkBase, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: unreadCount > 0 ? 'var(--primary-subtle)' : 'transparent', borderRadius: '6px' }} onClick={closeMenu} title="Notificaciones">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-1px', right: '-1px',
                background: 'var(--primary)', color: '#fff',
                fontSize: '0.5rem', fontWeight: 700,
                minWidth: '12px', height: '12px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 2px',
                boxShadow: '0 2px 6px rgba(230,57,70,0.4)',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {user.role === 'ADMIN' && (
            <Link href="/admin" style={{ ...linkBase, color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-subtle)', border: '1px solid rgba(230,57,70,0.15)' }} onClick={closeMenu}>
              Admin
            </Link>
          )}

          <Link href="/dashboard" style={{
            padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600,
            borderRadius: '6px',
            background: 'var(--primary)', color: '#fff', textDecoration: 'none',
            transition: 'all 0.2s ease',
          }} onClick={closeMenu}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(230,57,70,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.boxShadow = 'none'; }}>
            Dashboard
          </Link>

          <button onClick={() => { logout(); closeMenu?.(); }} style={{
            padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500,
            borderRadius: '6px', background: 'transparent',
            border: '1px solid var(--glass-border)', color: 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            Salir
          </button>
        </>
      ) : (
        <>
          <Link href="/login" style={{
            color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500,
            textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', transition: 'all 0.2s ease',
          }} onClick={closeMenu}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            Iniciar Sesión
          </Link>
          <Link href="/support" style={{
            color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500,
            textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', transition: 'all 0.2s ease',
          }} onClick={closeMenu}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            Apoyar
          </Link>
          <Link href="/register" style={{
            padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600,
            borderRadius: '6px', background: 'var(--primary)', color: '#fff', textDecoration: 'none',
            transition: 'all 0.2s ease',
          }} onClick={closeMenu}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(230,57,70,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.boxShadow = 'none'; }}>
            Unirse
          </Link>
        </>
      )}
    </>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
            <AuthNav />
          </ClientOnly>
        </div>

        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <ClientOnly fallback={null}>
            <AuthNav closeMenu={() => setMenuOpen(false)} />
          </ClientOnly>
        </div>
      )}
    </nav>
  );
}
