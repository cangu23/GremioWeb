'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
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
  codes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  requests: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  reports: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  logs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  hoshizora: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
};

const adminNavItems = [
  {
    section: 'Panel',
    items: [
      { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    ],
  },
  {
    section: 'Gestion',
    items: [
      { href: '/admin/users', label: 'Usuarios', icon: 'users' },
      { href: '/admin/vtubers', label: 'VTubers', icon: 'vtubers' },
      { href: '/admin/events', label: 'Eventos', icon: 'events' },
      { href: '/admin/guilds', label: 'Gremios', icon: 'guilds' },
      { href: '/admin/posts', label: 'Publicaciones', icon: 'posts' },
    ],
  },
  {
    section: 'Hoshizora',
    items: [
      { href: '/admin/hoshizora-maid', label: 'Hoshizora Maid', icon: 'hoshizora' },
    ],
  },
  {
    section: 'Acceso',
    items: [
      { href: '/admin/codes', label: 'Códigos', icon: 'codes' },
      { href: '/admin/vtuber-requests', label: 'Solicitudes VTuber', icon: 'requests' },
    ],
  },
  {
    section: 'Moderacion',
    items: [
      { href: '/admin/reports', label: 'Reportes', icon: 'reports' },
      { href: '/admin/warnings', label: 'Advertencias', icon: 'shield' },
      { href: '/admin/logs', label: 'Auditoria', icon: 'logs' },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    setMounted(true);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px', fontWeight: 300 }}>--</div>
          <p style={{ color: 'var(--text-muted)' }}>Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚡</div>
          <p style={{ color: 'var(--text-muted)' }}>Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          minHeight: '100vh',
          background: 'rgba(15, 12, 41, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          padding: '24px 16px',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          overflowY: 'auto',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
        className="admin-sidebar"
      >
        <Link href="/admin" style={{ fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(135deg, #8a2be2, #ff007f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', padding: '8px 12px', textDecoration: 'none' }}>
          Admin Panel
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {adminNavItems.map((section) => (
            <div key={section.section}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 12px', marginBottom: '8px' }}>
                {section.section}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', background: isActive ? 'rgba(138, 43, 226, 0.2)' : 'transparent', border: isActive ? '1px solid rgba(138, 43, 226, 0.3)' : '1px solid transparent', textDecoration: 'none', transition: 'all 0.2s ease' }}>
                      <span style={{ display: 'inline-flex', marginRight: '10px', opacity: 0.7 }}>{NAV_ICONS[item.icon]}</span>
                      <span>{item.label}</span>
                      {item.href === '/admin/vtuber-requests' && pendingRequests > 0 && (
                        <span style={{
                          marginLeft: 'auto',
                          minWidth: '20px',
                          height: '20px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #ff007f, #ff9800)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 6px',
                          lineHeight: 1,
                        }}
                        >
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

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '260px', minHeight: '100vh' }} className="admin-main">
        <header style={{ height: '64px', background: 'rgba(15, 12, 41, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', padding: '8px' }} className="admin-hamburger">☰</button>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Panel de Administración</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{user.username}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main style={{ padding: '32px' }}>{children}</main>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .admin-hamburger { display: flex !important; }
          .admin-sidebar { transform: translateX(-100%) !important; }
          .admin-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
