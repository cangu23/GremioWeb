'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import RecentActivity from '@/components/landing/RecentActivity';
import UserAvatar from '@/components/ui/UserAvatar';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface GamificationData {
  xp: number;
  level: number;
  xpProgress: { current: number; level: number };
  achievements: Array<{ id: string; name: string; description: string }>;
}

/* ===== SVGs ===== */
const SvgNotif = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const SvgStar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const SvgAward = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const SvgRss = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>
  </svg>
);

const SvgCalendar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const SvgChat = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const SvgShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const SvgUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SvgCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ===== Dashboard Content ===== */
function DashboardContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [gami, setGami] = useState<GamificationData | null>(null);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ message: string; newRole: string; codeName: string } | null>(null);
  const [showVtuberWelcome, setShowVtuberWelcome] = useState(false);

  const xpThresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5200, 6600, 8200, 10000, 12000];
  const isVtuber = user?.role === 'VTUBER' || user?.vtuberProfile?.isApproved === true;

  useEffect(() => {
    if (user) {
      apiFetch('/gamification/me', {}).then(setGami).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (isVtuber && typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('vtuber_welcome_seen');
      if (!seen) {
        setShowVtuberWelcome(true);
        sessionStorage.setItem('vtuber_welcome_seen', 'true');
      }
    }
  }, [isVtuber]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const getXpProgress = (xp: number, level: number) => {
    const prevThresh = xpThresholds[Math.min(level - 1, xpThresholds.length - 1)];
    const nextThresh = xpThresholds[Math.min(level, xpThresholds.length - 1)];
    const progress = xp - prevThresh;
    const needed = nextThresh - prevThresh;
    return { current: progress, needed, percentage: needed > 0 ? Math.min(100, Math.round((progress / needed) * 100)) : 100 };
  };

  if (isLoading || !user) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  const displayName = user.displayName || user.vtuberProfile?.displayName || '';
  const avatarUrl = user.avatarUrl || user.vtuberProfile?.avatarUrl || '';
  const xpProgress = gami ? getXpProgress(gami.xp, gami.level) : null;

  /* ===== Section header component ===== */
  const SectionHeader = ({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        background: color ? `${color}15` : 'var(--primary-subtle)',
        color: color || 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {label}
      </h2>
    </div>
  );

  /* ===== Card renderer ===== */
  const renderQuickCard = (item: { icon: React.ReactNode; label: string; href: string; desc: string; color?: string }) => (
    <Link
      key={item.href}
      href={item.href}
      className="glass"
      style={{
        padding: '22px 20px',
        borderRadius: '16px',
        textDecoration: 'none',
        color: 'var(--text)',
        transition: 'all 0.3s var(--ease-out-expo)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '10px',
        border: '1px solid var(--glass-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(138,43,226,0.25)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
      }}
    >
      <div style={{
        color: item.color || 'var(--primary)',
        opacity: 0.8,
        marginBottom: '2px',
        display: 'flex',
      }}>
        {item.icon}
      </div>
      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.label}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</span>
    </Link>
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* ===== VTUBER WELCOME BANNER ===== */}
      {showVtuberWelcome && (
        <div style={{
          marginBottom: '32px', padding: '36px 40px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255,0,127,0.12), rgba(138,43,226,0.08))',
          border: '1px solid rgba(255,0,127,0.2)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          animation: 'fadeInUp 0.6s ease',
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,127,0.15), transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '12px', display: 'inline-flex', padding: '12px', borderRadius: '14px', background: 'rgba(255,0,127,0.1)' }}>
              <SvgStar />
            </div>
            <h2 className="heading-md" style={{ marginBottom: '8px', background: 'linear-gradient(135deg, #ff007f, #ff9800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Bienvenido al Gremio Estelar
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Ya eres un VTuber oficial. Configura tu perfil, conecta tus redes y empieza a crear contenido.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/vtuber-profile" className="btn btn--gradient">
                Configurar mi Perfil
              </Link>
              <button onClick={() => setShowVtuberWelcome(false)} className="btn btn--ghost">
                Más tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HERO HEADER ===== */}
      <div style={{
        position: 'relative', marginBottom: '40px', padding: '36px 40px',
        borderRadius: '20px',
        background: isVtuber
          ? 'linear-gradient(135deg, rgba(255,0,127,0.1), rgba(138,43,226,0.06))'
          : 'linear-gradient(135deg, rgba(138,43,226,0.1), rgba(255,0,127,0.04))',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.12), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <UserAvatar
            src={avatarUrl}
            alt={displayName || user.username}
            userId={user.id}
            size={72}
          />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 className="heading-md" style={{ marginBottom: 0 }}>
                Bienvenido,{' '}
                <span className="text-gradient--primary">{user.username}</span>
              </h1>
              {isVtuber && (
                <span className="badge badge--secondary">VTuber</span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {displayName
                ? `${displayName} — Panel de control`
                : 'Panel de control'}
            </p>
          </div>
        </div>
      </div>

      {/* ===== CREATOR STUDIO (solo VTubers) ===== */}
      {isVtuber && (
        <div style={{ marginBottom: '40px' }}>
          <SectionHeader icon={<SvgStar />} label="Studio del Creador" color="#ff007f" />
          <div className="grid-4">
            {[
              { icon: <SvgStar />, label: 'Mi Perfil VTuber', href: '/vtuber-profile', desc: 'Edita tu personaje', color: '#ff007f' },
              { icon: <SvgAward />, label: 'Logros', href: '/achievements', desc: 'Desbloquea recompensas' },
              { icon: <SvgRss />, label: 'Feed', href: '/feed', desc: 'Publica contenido' },
              { icon: <SvgCalendar />, label: 'Mis Eventos', href: '/events', desc: 'Organiza streams' },
            ].map(renderQuickCard)}
          </div>
        </div>
      )}

      {/* ===== COMUNIDAD ===== */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader icon={<SvgUsers />} label="Comunidad" />
        <div className="grid-4">
          {[
            { icon: <SvgChat />, label: 'Chat', href: '/chat', desc: 'Chatea en vivo' },
            { icon: <SvgShield />, label: 'Gremios', href: '/guilds', desc: 'Encuentra tu grupo' },
            { icon: <SvgCalendar />, label: 'Eventos', href: '/events', desc: 'Descubre eventos' },
            { icon: <SvgStar />, label: 'VTubers', href: '/vtubers', desc: 'Explora perfiles' },
            { icon: <SvgAward />, label: 'Recompensas', href: '/daily-rewards', desc: 'Reclama tu recompensa', color: '#F59E0B' },
            { icon: <SvgStar />, label: 'Ruleta', href: '/roulette', desc: 'Gira y gana', color: '#EF4444' },
          ].map(renderQuickCard)}
        </div>
      </div>

      {/* ===== ACTIVIDAD RECIENTE ===== */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader icon={<SvgNotif />} label="Actividad Reciente" />
        <RecentActivity />
      </div>

      {/* ===== PROGRESO Y ACCIONES ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* XP Card */}
        {gami && xpProgress && (
          <div className="glass-card glass-card--accent">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 500 }}>Nivel</p>
                <p className="heading-lg" style={{ marginBottom: 0, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {gami.level}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 500 }}>Experiencia</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                  {gami.xp.toLocaleString()}{' '}
                  <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>XP</span>
                </p>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Nv. {gami.level}</span>
                <span>{xpProgress.current.toLocaleString()} / {xpProgress.needed.toLocaleString()} XP</span>
                <span>Nv. {gami.level + 1}</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${xpProgress.percentage}%`, height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary), var(--accent))',
                  borderRadius: '6px', transition: 'width 1s var(--ease-out-expo)',
                  position: 'relative',
                }}>
                  <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: '#fff', fontWeight: 700 }}>
                    {xpProgress.percentage}%
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/achievements" className="btn btn--sm">
                Logros ({gami.achievements.length})
              </Link>
              <Link href="/leaderboard" className="btn btn--sm btn--outline">
                Ranking
              </Link>
            </div>
          </div>
        )}

        {/* Canjear Código Card */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Canjear Código
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
            {isVtuber
              ? 'Canjea un código especial para obtener beneficios exclusivos como creador.'
              : '¿Tienes un código de invitación? Canjéalo aquí para obtener un rol especial.'}
          </p>

          {redeemResult ? (
            <div style={{ padding: '20px', borderRadius: '12px', textAlign: 'center', background: 'var(--success-subtle)', border: '1px solid rgba(0,230,118,0.2)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,230,118,0.1)', marginBottom: '12px', color: 'var(--success)' }}>
                <SvgCheck />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px', color: 'var(--success)' }}>{redeemResult.message}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Código: {redeemResult.codeName}</div>
              <button onClick={() => { setRedeemResult(null); setShowRedeem(false); window.location.reload(); }} className="btn btn--sm" style={{ marginTop: '16px' }}>
                Continuar
              </button>
            </div>
          ) : showRedeem ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!redeemCode.trim()) return;
              setRedeeming(true);
              try {
                const res = await apiFetch('/auth/redeem-code', { method: 'POST', body: JSON.stringify({ code: redeemCode.trim() }) });
                setRedeemResult(res);
                showToast(`${res.message}`, 'success');
              } catch (err: unknown) {
                showToast(err instanceof Error ? err.message : 'Código inválido', 'error');
              } finally { setRedeeming(false); }
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input className="input" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder="Ej: GC-7F3K9A2B..." style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem' }} required />
                <button type="submit" className="btn btn--gradient" disabled={redeeming || !redeemCode.trim()} style={{ padding: '12px 22px' }}>
                  {redeeming ? '...' : 'Canjear'}
                </button>
              </div>
              <button type="button" onClick={() => setShowRedeem(false)} className="btn btn--ghost" style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.85rem' }}>
                Cancelar
              </button>
            </form>
          ) : (
            <button onClick={() => setShowRedeem(true)} className="btn btn--gradient" style={{ width: '100%', padding: '14px', fontWeight: 700 }}>
              Tengo un Código
            </button>
          )}
        </div>

        {/* Perfil público */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isVtuber ? 'Mi Perfil' : 'Tu Perfil'}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
            {isVtuber
              ? 'Administra tu perfil de VTuber, tu personaje y cómo te ve la comunidad.'
              : 'Completa tu perfil y personaliza tu experiencia en Gremio Estelar.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href={`/profile/${user.id}`} className="btn btn--outline" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem' }}>
              Ver Perfil Público
            </Link>
            {isVtuber && (
              <Link href="/vtuber-profile" className="btn btn--gradient" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem' }}>
                Editar Personaje VTuber
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <div className="container" style={{ paddingBottom: '40px', paddingTop: '24px' }}>
        <ClientOnly
          fallback={
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
              <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p>Cargando dashboard...</p>
            </div>
          }
        >
          <DashboardContent />
        </ClientOnly>
      </div>
    </ErrorBoundary>
  );
}
