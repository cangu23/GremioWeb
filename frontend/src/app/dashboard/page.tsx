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

interface GamificationData {
  xp: number;
  level: number;
  xpProgress: { current: number; level: number };
  achievements: Array<{ id: string; name: string; description: string }>;
}

const SVG_ICONS: Record<string, string> = {
  calendar: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  shield: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  chat: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  award: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
  rss: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>',
  star: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
};

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

  // Show VTuber welcome banner on first load after approval
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
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          color: 'var(--text-muted)',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <span
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  const displayName = user.vtuberProfile?.displayName || '';
  const avatarUrl = user.vtuberProfile?.avatarUrl || '';
  const xpProgress = gami ? getXpProgress(gami.xp, gami.level) : null;

  const renderCard = (item: { icon: string; label: string; href: string; desc: string }) => (
    <Link
      key={item.href}
      href={item.href}
      className="glass"
      style={{
        padding: '24px 20px',
        borderRadius: '16px',
        textDecoration: 'none',
        color: 'var(--text)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '8px',
        border: '1px solid var(--glass-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
      }}
    >
      <div style={{ color: item.href === '/vtuber-profile' ? '#ff007f' : 'var(--primary)', marginBottom: '4px', opacity: 0.7 }} dangerouslySetInnerHTML={{ __html: SVG_ICONS[item.icon] }} />
      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.label}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</span>
    </Link>
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* ===== VTUBER WELCOME BANNER ===== */}
      {showVtuberWelcome && (
        <div
          style={{
            marginBottom: '32px',
            padding: '32px 40px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(255,0,127,0.12), rgba(138,43,226,0.08))',
            border: '1px solid rgba(255,0,127,0.2)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeInUp 0.6s ease',
          }}
        >
          <div style={{
            position: 'absolute', top: '-60px', right: '-30px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,0,127,0.15), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff007f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(135deg, #ff007f, #ff9800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Bienvenido al Gremio Estelar
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 20px' }}>
              Ya eres un VTuber oficial. Configura tu perfil, conecta tus redes y empieza a crear contenido.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/vtuber-profile" className="btn" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #ff007f, #ff9800)' }}>
                Configurar mi Perfil
              </Link>
              <button onClick={() => setShowVtuberWelcome(false)} className="btn" style={{ padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>
                Mas tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HERO HEADER ===== */}
      <div
        style={{
          position: 'relative',
          marginBottom: '40px',
          padding: '40px',
          borderRadius: '24px',
          background: isVtuber
            ? 'linear-gradient(135deg, rgba(255,0,127,0.12), rgba(138,43,226,0.08))'
            : 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(255,0,127,0.05))',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-40px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(138,43,226,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: avatarUrl
                  ? `url(${avatarUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                color: 'white',
                fontWeight: 'bold',
                border: isVtuber ? '3px solid rgba(255,0,127,0.4)' : '3px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
            >
              {!avatarUrl && (displayName || user.username).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
                  Bienvenido,{' '}
                  <span className="gradient-text">{user.username}</span>
                </h1>
                {isVtuber && (
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px',
                    background: 'linear-gradient(135deg, #ff007f22, #ff980022)',
                    border: '1px solid rgba(255,0,127,0.2)',
                    fontSize: '0.7rem', fontWeight: 700,
                    color: '#ff007f', textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    VTuber
                  </span>
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
      </div>

      {/* ===== CREATOR STUDIO (solo VTubers) ===== */}
      {isVtuber && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ff007f' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Studio del Creador
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { icon: 'star', label: 'Mi Perfil VTuber', href: '/vtuber-profile', desc: 'Edita tu personaje' },
              { icon: 'award', label: 'Logros', href: '/achievements', desc: 'Desbloquea recompensas' },
              { icon: 'rss', label: 'Feed', href: '/feed', desc: 'Publica contenido' },
              { icon: 'calendar', label: 'Mis Eventos', href: '/events', desc: 'Organiza streams' },
            ].map(renderCard)}
          </div>
        </div>
      )}

      {/* ===== COMUNIDAD (todos) ===== */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Comunidad
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { icon: 'chat', label: 'Chat', href: '/chat', desc: 'Chatea en vivo' },
            { icon: 'shield', label: 'Gremios', href: '/guilds', desc: 'Encuentra tu grupo' },
            { icon: 'calendar', label: 'Eventos', href: '/events', desc: 'Descubre eventos' },
            { icon: 'star', label: 'VTubers', href: '/vtubers', desc: 'Explora perfiles' },
          ].map(renderCard)}
        </div>
      </div>

      {/* ===== ACTIVIDAD RECIENTE ===== */}
      <div style={{ marginBottom: '40px' }}>
        <RecentActivity />
      </div>

      {/* ===== PROGRESO Y ACCIONES ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* XP Card */}
        {gami && xpProgress && (
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nivel</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {gami.level}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Experiencia</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {gami.xp.toLocaleString()}{' '}
                  <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>XP</span>
                </p>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Nv. {gami.level}</span>
                <span>{xpProgress.current.toLocaleString()} / {xpProgress.needed.toLocaleString()} XP</span>
                <span>Nv. {gami.level + 1}</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${xpProgress.percentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary), var(--accent))', borderRadius: '7px', transition: 'width 1s ease', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>
                    {xpProgress.percentage}%
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/achievements" className="btn" style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px' }}>
                Logros ({gami.achievements.length})
              </Link>
              <Link href="/leaderboard" className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px' }}>
                Ranking
              </Link>
            </div>
          </div>
        )}

        {/* Canjear Código Card */}
        <div className="glass" style={{ padding: '32px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Canjear Codigo
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {isVtuber
              ? 'Canjea un codigo especial para obtener beneficios exclusivos como creador.'
              : 'Tienes un codigo de invitacion? Canjealo aqui para obtener un rol especial.'}
          </p>

          {redeemResult ? (
            <div className="glass" style={{ padding: '20px', borderRadius: '12px', textAlign: 'center', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 700, color: 'var(--success)' }}>✓</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px', color: '#00e676' }}>{redeemResult.message}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Codigo: {redeemResult.codeName}</div>
              <button onClick={() => { setRedeemResult(null); setShowRedeem(false); window.location.reload(); }} className="btn" style={{ marginTop: '16px', padding: '10px 24px' }}>
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
                showToast(err instanceof Error ? err.message : 'Codigo invalido', 'error');
              } finally { setRedeeming(false); }
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input className="input" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder="Ej: GC-7F3K9A2B..." style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem' }} required />
                <button type="submit" className="btn" disabled={redeeming || !redeemCode.trim()} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                  {redeeming ? '...' : 'Canjear'}
                </button>
              </div>
              <button type="button" onClick={() => setShowRedeem(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px', padding: '4px 8px' }}>Cancelar</button>
            </form>
          ) : (
            <button onClick={() => setShowRedeem(true)} className="btn" style={{ width: '100%', padding: '14px', fontWeight: 700, background: 'linear-gradient(135deg, #ff007f, #8a2be2)' }}>
              Tengo un Codigo
            </button>
          )}
        </div>

        {/* Perfil público / Acceso rápido */}
        <div className="glass" style={{ padding: '32px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isVtuber ? 'Mi Perfil' : 'Tu Perfil'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {isVtuber
              ? 'Administra tu perfil de VTuber, tu personaje y como te ve la comunidad.'
              : 'Completa tu perfil y personaliza tu experiencia en Gremio Estelar.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href={`/profile/${user.id}`} className="btn btn-outline" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem' }}>
              Ver Perfil Publico
            </Link>
            {isVtuber && (
              <Link href="/vtuber-profile" className="btn" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem', background: 'linear-gradient(135deg, #ff007f, #ff9800)' }}>
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
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px' }}>
      <ClientOnly
        fallback={
          <div
            className="container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
              color: 'var(--text-muted)',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p>Cargando dashboard...</p>
          </div>
        }
      >
        <DashboardContent />
      </ClientOnly>
    </div>
  );
}
