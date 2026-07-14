'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalVtubers: number;
  totalGuilds: number;
  totalEvents: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalMessages: number;
  pendingReports: number;
  pendingVtuberRequests: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface Activity {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
  user: { id: string; username: string };
}

const ICONS = {
  users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  active: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 3 19 6 24 1"/></svg>`,
  vtubers: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  guilds: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  events: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  posts: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  comments: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  likes: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  messages: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  reports: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  requests: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
};

const statCards = [
  { key: 'totalUsers', label: 'Usuarios Registrados', color: '#8a2be2', icon: 'users' },
  { key: 'activeUsers', label: 'Usuarios Activos', color: '#00e676', icon: 'active' },
  { key: 'totalVtubers', label: 'VTubers', color: '#ff007f', icon: 'vtubers' },
  { key: 'totalGuilds', label: 'Gremios', color: '#ff9800', icon: 'guilds' },
  { key: 'totalEvents', label: 'Eventos', color: '#2196f3', icon: 'events' },
  { key: 'totalPosts', label: 'Publicaciones', color: '#9c27b0', icon: 'posts' },
  { key: 'totalComments', label: 'Comentarios', color: '#00bcd4', icon: 'comments' },
  { key: 'totalLikes', label: 'Likes', color: '#f44336', icon: 'likes' },
  { key: 'totalMessages', label: 'Mensajes', color: '#4caf50', icon: 'messages' },
  { key: 'pendingReports', label: 'Reportes Pendientes', color: '#ff5722', icon: 'reports' },
  { key: 'pendingVtuberRequests', label: 'Solicitudes VTuber', color: '#ff007f', icon: 'requests', link: '/admin/vtuber-requests' },
];

const activityLabels: Record<string, string> = {
  BAN_USER: 'Usuario baneado',
  SUSPEND_USER: 'Usuario suspendido',
  RESTORE_USER: 'Usuario restaurado',
  UPDATE_USER: 'Usuario actualizado',
  DELETE_USER: 'Usuario eliminado',
  UPDATE_VTUBER: 'VTuber actualizado',
  CANCEL_EVENT: 'Evento cancelado',
  FEATURE_EVENT: 'Evento destacado',
  DELETE_EVENT: 'Evento eliminado',
  SUSPEND_GUILD: 'Gremio suspendido',
  UNSUSPEND_GUILD: 'Gremio restaurado',
  DELETE_GUILD: 'Gremio eliminado',
  HIDE_POST: 'Publicación oculta',
  RESTORE_POST: 'Publicación restaurada',
  DELETE_POST: 'Publicación eliminada',
  RESOLVE_REPORT: 'Reporte resuelto',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/dashboard/stats'),
      apiFetch('/admin/dashboard/activity?limit=20'),
    ]).then(([statsData, activityData]) => {
      setStats(statsData);
      setActivity(activityData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass" style={{ flex: '1 1 180px', padding: '24px', borderRadius: '16px', minHeight: '120px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.2; } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Resumen general de la plataforma
      </p>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {statCards.map((card) => {
          const cardContent = (
            <>
              <div style={{ color: card.color, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: ICONS[card.icon as keyof typeof ICONS] }} />
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, marginBottom: '4px' }}>
                {stats?.[card.key as keyof DashboardStats]?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{card.label}</div>
            </>
          );

          return card.link ? (
            <Link
              key={card.key}
              href={card.link}
              className="glass"
              style={{
                padding: '20px',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                border: `1px solid ${card.color}22`,
                display: 'block',
                position: 'relative',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${card.color}44`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${card.color}22`; }}
            >
              {cardContent}
              {stats?.[card.key as keyof DashboardStats] ? (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  padding: '2px 8px', borderRadius: '10px',
                  background: card.color, color: '#fff',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  Pendientes
                </div>
              ) : null}
            </Link>
          ) : (
            <div
              key={card.key}
              className="glass"
              style={{
                padding: '20px',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                cursor: 'default',
                border: `1px solid ${card.color}22`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${card.color}44`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${card.color}22`; }}
            >
              {cardContent}
            </div>
          );
        })}
      </div>

      {/* New Registrations */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '16px' }}>Nuevos Registros</h2>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[
          { label: 'Hoy', value: stats?.newUsersToday || 0, gradient: 'linear-gradient(135deg, #8a2be2, #ff007f)' },
          { label: 'Esta Semana', value: stats?.newUsersThisWeek || 0, gradient: 'linear-gradient(135deg, #2196f3, #00bcd4)' },
          { label: 'Este Mes', value: stats?.newUsersThisMonth || 0, gradient: 'linear-gradient(135deg, #4caf50, #8bc34a)' },
        ].map((item) => (
          <div
            key={item.label}
            className="glass"
            style={{
              flex: '1',
              minWidth: '160px',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 800, background: item.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {item.value.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '16px' }}>Actividad Reciente</h2>
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {activity.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay actividad reciente registrada
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Acción', 'Administrador', 'Detalle', 'Fecha'].map((h) => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: log.action.startsWith('BAN') || log.action.startsWith('DELETE') ? 'rgba(244,67,54,0.15)' :
                                     log.action.startsWith('SUSPEND') || log.action.startsWith('HIDE') ? 'rgba(255,152,0,0.15)' :
                                     log.action.startsWith('RESTORE') || log.action.startsWith('UNSUSPEND') ? 'rgba(0,230,118,0.15)' :
                                     'rgba(138,43,226,0.15)',
                        color: log.action.startsWith('BAN') || log.action.startsWith('DELETE') ? '#f44336' :
                               log.action.startsWith('SUSPEND') || log.action.startsWith('HIDE') ? '#ff9800' :
                               log.action.startsWith('RESTORE') || log.action.startsWith('UNSUSPEND') ? '#00e676' :
                               '#8a2be2',
                      }}>
                        {activityLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      @{log.user?.username || 'Sistema'}
                    </td>
                    <td style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.detail || '-'}
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
