'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

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

const statCards = [
  { key: 'totalUsers', label: 'Usuarios Registrados', color: '#8a2be2' },
  { key: 'activeUsers', label: 'Usuarios Activos', color: '#00e676' },
  { key: 'totalVtubers', label: 'VTubers', color: '#ff007f' },
  { key: 'totalGuilds', label: 'Gremios', color: '#ff9800' },
  { key: 'totalEvents', label: 'Eventos', color: '#2196f3' },
  { key: 'totalPosts', label: 'Publicaciones', color: '#9c27b0' },
  { key: 'totalComments', label: 'Comentarios', color: '#00bcd4' },
  { key: 'totalLikes', label: 'Likes', color: '#f44336' },
  { key: 'totalMessages', label: 'Mensajes', color: '#4caf50' },
  { key: 'pendingReports', label: 'Reportes Pendientes', color: '#ff5722' },
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
        {statCards.map((card) => (
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
            <div style={{ width: '30px', height: '3px', borderRadius: '2px', background: card.color, marginBottom: '16px' }} />
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, marginBottom: '4px' }}>
              {stats?.[card.key as keyof DashboardStats]?.toLocaleString() || '0'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{card.label}</div>
          </div>
        ))}
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
