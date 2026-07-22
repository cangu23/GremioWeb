'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  vtubers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  events: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  guilds: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  posts: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  comments: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  codes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  requests: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  reports: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  logs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><polyline points="4 10 20 10"/><line x1="10" y1="4" x2="10" y2="20"/></svg>,
  hoshizora: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  stickers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
};

const adminNavItems = [
  {
    section: 'Command Center',
    items: [
      { href: '/admin', label: 'Dashboard', icon: 'dashboard', color: '#d4af37' },
      { href: '/admin/logs', label: 'Auditoría (Logs)', icon: 'logs', color: '#00e5ff' },
    ],
  },
  {
    section: 'Gestión de Entidades',
    items: [
      { href: '/admin/users', label: 'Usuarios', icon: 'users', color: '#a0a0a0' },
      { href: '/admin/vtubers', label: 'VTubers', icon: 'vtubers', color: '#a0a0a0' },
      { href: '/admin/guilds', label: 'Gremios', icon: 'guilds', color: '#a0a0a0' },
    ],
  },
  {
    section: 'Seguridad & Mod',
    items: [
      { href: '/admin/reports', label: 'Reportes', icon: 'reports', color: '#dc143c' },
      { href: '/admin/warnings', label: 'Advertencias', icon: 'shield', color: '#dc143c' },
    ],
  },
  {
    section: 'Operaciones & Auth',
    items: [
      { href: '/admin/vtuber-requests', label: 'Solicitudes VTuber', icon: 'requests', color: '#d4af37' },
      { href: '/admin/codes', label: 'Códigos', icon: 'codes', color: '#a0a0a0' },
    ],
  },
  {
    section: 'Contenido',
    items: [
      { href: '/admin/posts', label: 'Publicaciones', icon: 'posts', color: '#a0a0a0' },
      { href: '/admin/comments', label: 'Comentarios', icon: 'comments', color: '#a0a0a0' },
      { href: '/admin/events', label: 'Eventos', icon: 'events', color: '#a0a0a0' },
      { href: '/admin/hoshizora-maid', label: 'Hoshizora Maid', icon: 'hoshizora', color: '#a0a0a0' },
      { href: '/admin/stickers', label: 'Stickers y Emojis', icon: 'stickers', color: '#a0a0a0' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const user = auth.user;
  const isLoading = auth.isLoading;
  const [sidebarOpen, setSidebarOpen] = useState(true); // Abierta por defecto en desktop
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync sidebar state with viewport: open on desktop, closed on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(!e.matches); // matches = mobile → close sidebar
    };
    handler(mq); // Set initial state based on actual viewport
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (mounted && user?.role === 'ADMIN') {
      apiFetch('/admin/dashboard/stats').then((data) => {
        if (data?.pendingVtuberRequests !== undefined) {
          setPendingRequests(data.pendingVtuberRequests);
        }
      }).catch(() => {});
    }
  }, [mounted, user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#050505' }}>
        <div style={{ textAlign: 'center', color: '#d4af37' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px', fontWeight: 300, animation: 'pulse 1.5s infinite' }}>SYSTEM BOOTING...</div>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#050505' }}>
        <div style={{ textAlign: 'center', color: '#d4af37' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.1em', animation: 'pulse 1.5s infinite' }}>AUTHENTICATING...</div>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0c', color: '#f0f0f5', fontFamily: 'var(--font-sans)' }}>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 40 }}
        />
      )}

      {/* Sidebar - Solid dark, serious, structural */}
      <aside
        style={{
          width: '240px', minHeight: '100vh', background: '#050505',
          borderRight: '1px solid #1a1a20', padding: '24px 16px', position: 'fixed',
          left: 0, top: 0, zIndex: 50, overflowY: 'auto',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column', gap: '28px',
        }}
        className="admin-sidebar"
      >
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '8px', height: '24px', background: '#d4af37' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Root
          </span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {adminNavItems.map((section) => (
            <div key={section.section}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '0 8px', marginBottom: '10px' }}>
                {section.section}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const activeColor = item.color || '#ffffff';
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 10px',
                        fontSize: '0.85rem', fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#ffffff' : '#8a8a93',
                        background: isActive ? '#141418' : 'transparent',
                        borderLeft: isActive ? `3px solid ${activeColor}` : '3px solid transparent',
                        textDecoration: 'none', transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.background = '#0d0d12';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#8a8a93';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <span style={{ color: isActive ? activeColor : '#666', transition: 'color 0.2s' }}>
                        {NAV_ICONS[item.icon]}
                      </span>
                      <span>{item.label}</span>
                      
                      {item.href === '/admin/vtuber-requests' && pendingRequests > 0 && (
                        <span style={{
                          marginLeft: 'auto', background: '#d4af37', color: '#000',
                          fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px',
                          borderRadius: '4px', lineHeight: 1,
                        }}>
                          {pendingRequests > 99 ? '99+' : pendingRequests}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1a1a20' }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
            color: '#666', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
            textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.2s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Exit Terminal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="admin-main">
        <header style={{
          height: '60px', background: '#0a0a0c', borderBottom: '1px solid #1a1a20',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 30
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '8px' }} className="admin-hamburger">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676' }} />
            System Online
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>@{user.username}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#d4af37', background: 'rgba(212,175,55,0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SYSADMIN</span>
            </div>
            <div style={{ width: '36px', height: '36px', border: '1px solid #d4af37', borderRadius: '4px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: '#d4af37' }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main style={{ padding: '32px', flex: 1 }}>{children}</main>
      </div>

      <style jsx global>{`
        body { background: #0a0a0c !important; color: #f0f0f5 !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0c; }
        ::-webkit-scrollbar-thumb { background: #222; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
        
        .admin-main .input { background: #0d0d12 !important; border: 1px solid #222 !important; color: #fff !important; border-radius: 4px !important; }
        .admin-main .input:focus { border-color: #00e5ff !important; box-shadow: 0 0 0 1px #00e5ff !important; }
        .admin-main .glass { background: #0d0d12 !important; border: 1px solid #1a1a20 !important; border-radius: 6px !important; box-shadow: none !important; backdrop-filter: none !important; }
        .admin-main .btn { border-radius: 4px !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-size: 0.8rem !important; }

        @media (max-width: 768px) {
          .admin-hamburger { display: flex !important; }
          .admin-sidebar { transform: translateX(-100%) !important; }
          .admin-main { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .admin-hamburger { display: none !important; }
        }
      `}</style>
    </div>
  );
}
