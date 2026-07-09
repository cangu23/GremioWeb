'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

const adminNavItems = [
  {
    section: 'Panel',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { href: '/admin/users', label: 'Usuarios', icon: '👥' },
      { href: '/admin/vtubers', label: 'VTubers', icon: '🎤' },
      { href: '/admin/events', label: 'Eventos', icon: '📅' },
      { href: '/admin/guilds', label: 'Gremios', icon: '🏰' },
      { href: '/admin/posts', label: 'Publicaciones', icon: '📝' },
    ],
  },
  {
    section: 'Moderación',
    items: [
      { href: '/admin/reports', label: 'Reportes', icon: '🚨' },
      { href: '/admin/logs', label: 'Auditoría', icon: '📋' },
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚡</div>
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
          ⚡ Admin Panel
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
                      <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                      <span>{item.label}</span>
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
