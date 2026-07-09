'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import styles from './Navbar.module.css';

function AuthNav({ closeMenu }: { closeMenu?: () => void }) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchUnread = async () => {
      try { const data = await apiFetch('/notifications/unread-count', {}); setUnreadCount(data.count); } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const linkStyle: React.CSSProperties = {
    color: 'var(--text)',
    textDecoration: 'none',
    padding: '8px 0',
    fontSize: '0.95rem',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <Link href="/events" style={linkStyle} onClick={closeMenu}>Eventos</Link>
      <Link href="/guilds" style={linkStyle} onClick={closeMenu}>Gremios</Link>
      <Link href="/vtubers" style={linkStyle} onClick={closeMenu}>VTubers</Link>
      <Link href="/leaderboard" style={linkStyle} onClick={closeMenu}>Ranking</Link>
      <Link href="/achievements" style={linkStyle} onClick={closeMenu}>Logros</Link>
      <Link href="/feed" style={linkStyle} onClick={closeMenu}>Feed</Link>
      <Link href="/chat" style={linkStyle} onClick={closeMenu}>Chat</Link>
      <Link href="/support" style={{ ...linkStyle, color: 'var(--primary)', fontWeight: 600 }} onClick={closeMenu}>Apoyar</Link>
      {user ? (
        <>
          <Link href="/notifications" style={{ ...linkStyle, position: 'relative', fontSize: '1.2rem' }} onClick={closeMenu} title="Notificaciones">
            🔔{unreadCount > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-8px', background: 'var(--primary)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, minWidth: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>
          <Link href="/dashboard" className="btn" style={{ padding: '6px 14px', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--primary)' }} onClick={closeMenu}>Dashboard</Link>
          <button onClick={() => { logout(); closeMenu?.(); }} className="btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Cerrar Sesión</button>
        </>
      ) : (
        <>
          <Link href="/login" style={linkStyle} onClick={closeMenu}>Iniciar Sesión</Link>
          <Link href="/register" className="btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={closeMenu}>Únete</Link>
        </>
      )}
    </>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={`glass ${styles.navbar}`}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="Gremio Estelar" style={{ height: '32px', width: 'auto' }} />
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
