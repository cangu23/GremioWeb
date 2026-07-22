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
  users: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  active: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 3 19 6 24 1"/></svg>`,
  vtubers: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  maid: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  guilds: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  events: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  posts: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  comments: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  likes: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  messages: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  reports: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  requests: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  live: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>`,
  codes: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
};

/* ─── Stat Cards ─── */
const statCards = [
  { key: 'totalUsers', label: 'Usuarios', color: '#00e5ff', icon: 'users' },
  { key: 'activeUsers', label: 'Activos', color: '#00e676', icon: 'active' },
  { key: 'totalVtubers', label: 'VTubers', color: '#00e5ff', icon: 'vtubers' },
  { key: 'totalMaids', label: 'Maids', color: '#00e5ff', icon: 'maid' },
  { key: 'totalGuilds', label: 'Gremios', color: '#a0a0a0', icon: 'guilds' },
  { key: 'totalEvents', label: 'Eventos', color: '#a0a0a0', icon: 'events' },
  { key: 'totalPosts', label: 'Publicaciones', color: '#a0a0a0', icon: 'posts' },
  { key: 'totalMessages', label: 'Mensajes', color: '#a0a0a0', icon: 'messages' },
];

/* ─── Activity Labels ─── */
const activityLabels: Record<string, string> = {
  BAN_USER: 'BAN',
  SUSPEND_USER: 'SUSPEND',
  RESTORE_USER: 'RESTORE',
  UPDATE_USER: 'UPDATE',
  DELETE_USER: 'DELETE',
  UPDATE_VTUBER: 'UPDATE_VT',
  CANCEL_EVENT: 'CANCEL_EVT',
  FEATURE_EVENT: 'FEATURE',
  DELETE_EVENT: 'DEL_EVT',
  SUSPEND_GUILD: 'SUSP_GLD',
  UNSUSPEND_GUILD: 'UNSUSP_GLD',
  DELETE_GUILD: 'DEL_GLD',
  HIDE_POST: 'HIDE_POST',
  RESTORE_POST: 'RESTORE',
  DELETE_POST: 'DEL_POST',
  RESOLVE_REPORT: 'RESOLVE',
  APPROVE_VTUBER: 'APPROVE',
  VERIFY_VTUBER: 'VERIFY',
};

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ padding: '24px', borderRadius: '4px', background: '#0d0d12', border: '1px solid #1a1a20', height: '100px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  const roleEntries = Object.entries(stats?.userCountByRole || {}).filter(([, count]) => count > 0);
  const totalForChart = roleEntries.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Critical Alerts (Top) ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {(stats?.pendingReports ?? 0) > 0 && (
          <Link href="/admin/reports" style={{
            flex: '1 1 200px', padding: '16px 20px', borderRadius: '4px',
            background: 'rgba(220, 20, 60, 0.1)', border: '1px solid #dc143c',
            color: '#dc143c', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            textDecoration: 'none', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220, 20, 60, 0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220, 20, 60, 0.1)'; }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Critical Alert</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>Reportes Pendientes</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats!.pendingReports}</div>
          </Link>
        )}
        {(stats?.pendingVtuberRequests ?? 0) > 0 && (
          <Link href="/admin/vtuber-requests" style={{
            flex: '1 1 200px', padding: '16px 20px', borderRadius: '4px',
            background: 'rgba(212, 175, 55, 0.1)', border: '1px solid #d4af37',
            color: '#d4af37', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            textDecoration: 'none', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'; }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Action Required</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>Solicitudes VTuber</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats!.pendingVtuberRequests}</div>
          </Link>
        )}
      </div>

      {/* ── Stats Grid (Bento Box) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1px',
        background: '#1a1a20', border: '1px solid #1a1a20', borderRadius: '4px', overflow: 'hidden'
      }}>
        {statCards.map((card) => {
          const val = stats?.[card.key as keyof DashboardStats] as number ?? 0;
          return (
            <div key={card.key} style={{
              background: '#0d0d12', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
              transition: 'background 0.2s'
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#111116'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0d0d12'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <span style={{ color: card.color }} dangerouslySetInnerHTML={{ __html: ICONS[card.icon] || '' }} />
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{card.label}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', lineHeight: 1 }}>
                {val.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Row (Terminal Actions, Roles, Activity) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Left Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Actions (Terminal Style) */}
          <div style={{ background: '#0d0d12', border: '1px solid #1a1a20', borderRadius: '4px', padding: '20px' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: '16px', fontWeight: 700 }}>Command Execution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: '>> GENERATE_CODE', href: '/admin/codes', color: '#00e5ff' },
                { label: '>> CREATE_EVENT', href: '/events/create', color: '#00e5ff' },
                { label: '>> VIEW_REPORTS', href: '/admin/reports', color: '#dc143c' },
                { label: '>> VIEW_LOGS', href: '/admin/logs', color: '#a0a0a0' },
              ].map(action => (
                <Link key={action.label} href={action.href} style={{
                  display: 'block', padding: '10px 16px', background: '#050505',
                  border: '1px solid #1a1a20', borderRadius: '2px', color: action.color,
                  fontFamily: 'monospace', fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.borderColor = action.color; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#050505'; e.currentTarget.style.borderColor = '#1a1a20'; }}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Growth / Roles */}
          <div style={{ background: '#0d0d12', border: '1px solid #1a1a20', borderRadius: '4px', padding: '20px' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: '16px', fontWeight: 700 }}>Role Distribution</h3>
            {roleEntries.length === 0 ? (
              <div style={{ color: '#666', fontSize: '0.85rem' }}>No data available</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roleEntries.map(([role, count]) => {
                  const pct = totalForChart > 0 ? (count / totalForChart) * 100 : 0;
                  const color = role === 'ADMIN' ? '#d4af37' : role === 'MODERATOR' ? '#dc143c' : '#00e5ff';
                  return (
                    <div key={role}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        <span style={{ color }}>{role}</span>
                        <span style={{ color: '#666' }}>{count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div style={{ height: '4px', background: '#1a1a20', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Activity Log (Mono) */}
        <div style={{ background: '#0d0d12', border: '1px solid #1a1a20', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #1a1a20', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', fontWeight: 700, margin: 0 }}>System Logs (Latest)</h3>
            <Link href="/admin/logs" style={{ fontSize: '0.75rem', color: '#00e5ff', textDecoration: 'none', fontFamily: 'monospace' }}>[VIEW_ALL]</Link>
          </div>
          
          <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  {['TIME', 'ACTION', 'OPERATOR', 'PAYLOAD'].map(h => (
                    <th key={h} style={{ padding: '12px 10px', textAlign: 'left', color: '#666', borderBottom: '1px solid #1a1a20', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>NO_RECORDS_FOUND</td></tr>
                ) : (
                  activity.map((log) => {
                    const isBad = log.action.startsWith('BAN') || log.action.startsWith('DELETE');
                    const isWarn = log.action.startsWith('SUSPEND') || log.action.startsWith('HIDE');
                    const isGood = log.action.startsWith('RESTORE') || log.action.startsWith('VERIFY') || log.action.startsWith('APPROVE');
                    const color = isBad ? '#dc143c' : isWarn ? '#ff9800' : isGood ? '#00e676' : '#d4af37';
                    
                    let detailStr = log.detail || '-';
                    try {
                      const parsed = JSON.parse(detailStr);
                      detailStr = parsed.changes?.join(', ') || parsed.targetUsername || detailStr.slice(0, 40);
                    } catch { detailStr = detailStr.slice(0, 40); }

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #111' }}>
                        <td style={{ padding: '10px', color: '#666', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toISOString().split('T')[1].slice(0,8)}
                        </td>
                        <td style={{ padding: '10px', color, fontWeight: 700 }}>
                          [{activityLabels[log.action] || log.action}]
                        </td>
                        <td style={{ padding: '10px', color: '#a0a0a0' }}>
                          @{log.user?.username || 'SYS'}
                        </td>
                        <td style={{ padding: '10px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {detailStr}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
