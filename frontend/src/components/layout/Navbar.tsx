"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Fetch initial unread count
    const fetchUnread = async () => {
      try { const data = await apiFetch('/notifications/unread-count', {}); setUnreadCount(data.count); } catch { }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);

    // Connect socket for real-time notifications
    let sock: any;
    const setupSocket = () => {
      try {
        sock = connectSocket();

        // Listen for new notifications
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

  const linkStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    padding: '8px 0',
    fontSize: '0.9rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    transition: 'color 0.2s ease',
  };

  const navGroup: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const navSeparator: React.CSSProperties = {
    width: '1px',
    height: '20px',
    background: 'var(--glass-border)',
    margin: '0 8px',
  };

  return (
    <>
      {/* Group: Discover */}
      <div style={navGroup}>
        <Link href="/events" style={linkStyle} onClick={closeMenu}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          Eventos
        </Link>
        <Link href="/guilds" style={linkStyle} onClick={closeMenu}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          Gremios
        </Link>
        <Link href="/vtubers" style={linkStyle} onClick={closeMenu}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          VTubers
        </Link>
      </div>

      <div style={navSeparator} />

      {/* Group: Social */}
      <div style={navGroup}>
        <Link href="/feed" style={linkStyle} onClick={closeMenu}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          Feed
        </Link>
        <Link href="/chat" style={linkStyle} onClick={closeMenu}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          Chat
        </Link>
        <Link href="/leaderboard" style={linkStyle} onClick={closeMenu}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          Ranking
        </Link>
        <Link href="/achievements" style={linkStyle} onClick={closeMenu}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          Logros
        </Link>
      </div>

      <div style={navSeparator} />

      {user ? (
        <>
          {/* Notifications */}
          <Link
            href="/notifications"
            style={{
              ...linkStyle,
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              padding: 0,
              background: unreadCount > 0 ? 'var(--primary-subtle)' : 'transparent',
            }}
            onClick={closeMenu}
            title="Notificaciones"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = unreadCount > 0 ? 'var(--primary-subtle)' : 'transparent'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--primary)',
                color: '#fff',
                fontSize: '0.55rem',
                fontWeight: 700,
                minWidth: '14px',
                height: '14px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                boxShadow: '0 2px 6px rgba(138,43,226,0.4)',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Admin */}
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              style={{
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'var(--primary-subtle)',
                border: '1px solid rgba(138,43,226,0.2)',
                transition: 'all 0.2s ease',
              }}
              onClick={closeMenu}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(138,43,226,0.2)';
                e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--primary-subtle)';
                e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
              }}
            >
              Admin
            </Link>
          )}

          {/* Dashboard */}
          <Link
            href="/dashboard"
            style={{
              padding: '7px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(138,43,226,0.3)',
              transition: 'all 0.2s ease',
            }}
            onClick={closeMenu}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(138,43,226,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(138,43,226,0.3)';
            }}
          >
            Dashboard
          </Link>

          {/* Logout */}
          <button
            onClick={() => { logout(); closeMenu?.(); }}
            style={{
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            Cerrar Sesión
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            onClick={closeMenu}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/support"
            style={{
              color: 'var(--secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            onClick={closeMenu}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--secondary-subtle)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Apoyar
          </Link>
          <Link
            href="/register"
            style={{
              padding: '7px 18px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(138,43,226,0.3)',
              transition: 'all 0.2s ease',
            }}
            onClick={closeMenu}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(138,43,226,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(138,43,226,0.3)';
            }}
          >
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
        background: scrolled
          ? 'rgba(15, 12, 41, 0.85)'
          : 'rgba(15, 12, 41, 0.5)',
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
        borderColor: scrolled ? 'rgba(255,255,255,0.1)' : 'var(--glass-border)',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="Gremio Estelar" style={{ height: '30px', width: 'auto' }} />
        </Link>

        {/* Desktop nav */}
        <div className={styles.desktopNav}>
          <ClientOnly fallback={null}>
            <AuthNav />
          </ClientOnly>
        </div>

        {/* Hamburger button */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile menu */}
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
