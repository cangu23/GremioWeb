'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalVtubers: number;
  totalVtubersLive: number;
  totalMaids: number;
  totalGuilds: number;
  totalEvents: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalMessages: number;
  pendingReports: number;
  pendingVtuberRequests: number;
  pendingVerifications: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  userCountByRole: Record<string, number>;
}

interface Activity {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
  user: { id: string; username: string };
}

/* ─── Icons ─── */
const ICONS: Record<string, string> = {
  users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  active: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 3 19 6 24 1"/></svg>`,
  vtubers: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  maid: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  guilds: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  events: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  posts: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  comments: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  likes: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  messages: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  reports: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  requests: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  live: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>`,
  codes: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
};

/* ─── Stat Cards ─── */
const statCards = [
  { key: 'totalUsers', label: 'Usuarios Registrados', color: '#8a2be2', icon: 'users' },
  { key: 'activeUsers', label: 'Usuarios Activos', color: '#00e676', icon: 'active' },
  { key: 'totalVtubers', label: 'Perfiles VTuber', color: '#ff007f', icon: 'vtubers' },
  { key: 'totalMaids', label: 'Maids Registradas', color: '#d4a030', icon: 'maid' },
  { key: 'totalVtubersLive', label: 'VTubers en Vivo', color: '#e91e63', icon: 'live' },
  { key: 'totalGuilds', label: 'Gremios', color: '#ff9800', icon: 'guilds' },
  { key: 'totalEvents', label: 'Eventos', color: '#2196f3', icon: 'events' },
  { key: 'totalPosts', label: 'Publicaciones', color: '#9c27b0', icon: 'posts' },
  { key: 'totalComments', label: 'Comentarios', color: '#00bcd4', icon: 'comments' },
  { key: 'totalLikes', label: 'Likes', color: '#f44336', icon: 'likes' },
  { key: 'totalMessages', label: 'Mensajes', color: '#4caf50', icon: 'messages' },
  { key: 'pendingReports', label: 'Reportes Pendientes', color: '#ff5722', icon: 'reports' },
  { key: 'pendingVtuberRequests', label: 'Solicitudes VTuber', color: '#ff007f', icon: 'requests', link: '/admin/vtuber-requests' },
  { key: 'pendingVerifications', label: 'Verificar VTubers', color: '#1d9bf0', icon: 'vtubers', link: '/admin/vtubers' },
];

/* ─── Quick Actions ─── */
const quickActions = [
  { label: 'Nuevo Evento', icon: 'events', href: '/events/create', color: '#2196f3' },
  { label: 'Generar Código', icon: 'codes', href: '/admin/codes', color: '#ff007f' },
  { label: 'Gestionar MAIDs', icon: 'maid', href: '/admin/hoshizora-maid', color: '#d4a030' },
  { label: 'Ver Reportes', icon: 'reports', href: '/admin/reports', color: '#ff5722' },
  { label: 'Auditoría', icon: 'shield', href: '/admin/logs', color: '#9e9e9e' },
  { label: 'VTubers en Vivo', icon: 'live', href: '/admin/vtubers?isLive=true', color: '#e91e63' },
];

/* ─── Activity Labels ─── */
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
  APPROVE_VTUBER: 'VTuber aprobado',
  VERIFY_VTUBER: 'VTuber verificado',
};

/* ─── Role Colors ─── */
const roleColors: Record<string, string> = {
  ADMIN: '#8a2be2',
  MODERATOR: '#2196f3',
  VTUBER: '#ff007f',
  MAID: '#d4a030',
  USER: '#4caf50',
};

/* ─── Component ─── */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/dashboard/stats'),
      apiFetch('/admin/dashboard/activity?limit=15'),
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

  const totalByRole = stats?.userCountByRole || {};
  const roleEntries = Object.entries(totalByRole).filter(([, count]) => count > 0);
  const maxRoleCount = Math.max(...roleEntries.map(([, c]) => c), 1);
  const totalForChart = roleEntries.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {stats ? `${stats.totalUsers} usuarios · ${stats.totalPosts} publicaciones · ${stats.totalMessages} mensajes` : 'Cargando...'}
          </p>
        </div>
        {/* Pending summary badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(stats?.pendingVtuberRequests ?? 0) > 0 && (
            <Link href="/admin/vtuber-requests" style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(255,0,127,0.1)', border: '1px solid rgba(255,0,127,0.25)',
              color: '#ff007f', fontSize: '0.85rem', fontWeight: 600,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,127,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,0,127,0.1)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 12 11 15 16 9" /></svg>
              {stats!.pendingVtuberRequests} solicitudes
            </Link>
          )}
          {(stats?.pendingReports ?? 0) > 0 && (
            <Link href="/admin/reports" style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(255,87,34,0.1)', border: '1px solid rgba(255,87,34,0.25)',
              color: '#ff5722', fontSize: '0.85rem', fontWeight: 600,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,87,34,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,87,34,0.1)'; }}
            >
              {stats!.pendingReports} reportes
            </Link>
          )}
          {(stats?.pendingVerifications ?? 0) > 0 && (
            <Link href="/admin/vtubers" style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(29,155,240,0.1)', border: '1px solid rgba(29,155,240,0.25)',
              color: '#1d9bf0', fontSize: '0.85rem', fontWeight: 600,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,155,240,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,155,240,0.1)'; }}
            >
              {stats!.pendingVerifications} por verificar
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {statCards.map((card) => {
          const val = stats?.[card.key as keyof DashboardStats] as number ?? 0;
          const content = (
            <>
              <div style={{ color: card.color, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span dangerouslySetInnerHTML={{ __html: ICONS[card.icon] || '' }} />
                <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{val.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{card.label}</div>
            </>
          );
          return card.link ? (
            <Link key={card.key} href={card.link} className="glass" style={{
              padding: '16px', borderRadius: '14px', transition: 'all 0.3s ease',
              textDecoration: 'none', border: `1px solid ${card.color}18`,
              display: 'block',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${card.color}44`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${card.color}18`; }}
            >
              {content}
              {val > 0 && (
                <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 8px', borderRadius: '8px', background: card.color, color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                  Pendientes
                </div>
              )}
            </Link>
          ) : (
            <div key={card.key} className="glass" style={{
              padding: '16px', borderRadius: '14px', transition: 'all 0.3s ease',
              border: `1px solid ${card.color}18`, position: 'relative',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${card.color}44`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${card.color}18`; }}
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* ── Row: Role Distribution + Growth Timeline + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(200px, 1fr) minmax(240px, 1fr)', gap: '20px', marginBottom: '32px' }}>

        {/* ─── Role Distribution ─── */}
        <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Distribución de Roles
          </h3>
          {roleEntries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {roleEntries.map(([role, count]) => {
                const pct = totalForChart > 0 ? (count / totalForChart) * 100 : 0;
                const color = roleColors[role] || '#666';
                return (
                  <div key={role}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color }}>{role}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Growth Timeline ─── */}
        <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Crecimiento de Usuarios
          </h3>
          {[
            { label: 'Hoy', value: stats?.newUsersToday || 0, max: stats?.newUsersThisMonth || 1, color: '#8a2be2' },
            { label: 'Semana', value: stats?.newUsersThisWeek || 0, max: stats?.newUsersThisMonth || 1, color: '#2196f3' },
            { label: 'Mes', value: stats?.newUsersThisMonth || 0, max: stats?.newUsersThisMonth || 1, color: '#4caf50' },
          ].map((item) => {
            const pct = item.max > 0 ? (item.value / item.max) * 100 : 0;
            return (
              <div key={item.label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(pct, 3)}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Acciones Rápidas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                textDecoration: 'none', color: 'var(--text)',
                fontSize: '0.85rem', fontWeight: 500,
                transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <span style={{ color: action.color, display: 'flex' }} dangerouslySetInnerHTML={{ __html: ICONS[action.icon] || '' }} />
                <span>{action.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Actividad Reciente
      </h2>
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {activity.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay actividad reciente registrada</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Acción', 'Admin', 'Detalle', 'Fecha'].map((h) => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((log) => {
                  const isBad = log.action.startsWith('BAN') || log.action.startsWith('DELETE');
                  const isWarn = log.action.startsWith('SUSPEND') || log.action.startsWith('HIDE') || log.action.startsWith('CANCEL');
                  const isGood = log.action.startsWith('RESTORE') || log.action.startsWith('UNSUSPEND') || log.action.startsWith('VERIFY') || log.action.startsWith('APPROVE');
                  const bgColor = isBad ? 'rgba(244,67,54,0.15)' : isWarn ? 'rgba(255,152,0,0.15)' : isGood ? 'rgba(0,230,118,0.15)' : 'rgba(138,43,226,0.15)';
                  const textColor = isBad ? '#f44336' : isWarn ? '#ff9800' : isGood ? '#00e676' : '#8a2be2';
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: bgColor, color: textColor }}>
                          {activityLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{log.user?.username || 'Sistema'}</td>
                      <td style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(() => {
                          if (!log.detail) return '-';
                          try {
                            const parsed = JSON.parse(log.detail);
                            return parsed.changes?.join(', ') || parsed.targetUsername || log.detail.slice(0, 80);
                          } catch { return log.detail.slice(0, 80); }
                        })()}
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('es-ES')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
