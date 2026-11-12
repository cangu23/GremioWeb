'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RequestsSubnav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/admin/applications', label: 'Postulaciones de Roles', icon: '★', activeColor: '#fbbf24' },
    { href: '/admin/vtuber-requests', label: 'Solicitudes VTuber', icon: '✦', activeColor: '#ec4899' },
    { href: '/admin/streamer-requests', label: 'Solicitudes Streamer', icon: '✦', activeColor: '#38bdf8' },
    { href: '/admin/pet-requests', label: 'Solicitudes Mascotas', icon: '✦', activeColor: '#ff9800' },
    { href: '/admin/codes', label: 'Códigos de Activación', icon: '✦', activeColor: '#a78bfa' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      paddingBottom: '12px',
      overflowX: 'auto',
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              background: isActive ? `${tab.activeColor}22` : 'rgba(255,255,255,0.03)',
              border: isActive ? `1px solid ${tab.activeColor}66` : '1px solid rgba(255,255,255,0.06)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: isActive ? tab.activeColor : 'var(--text-muted)', fontSize: '0.75rem' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

