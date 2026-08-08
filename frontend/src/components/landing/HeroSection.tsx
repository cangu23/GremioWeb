'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';

interface PlatformStats {
  totalVtubers: number;
  totalEvents: number;
  totalUsers: number;
}

interface FloatingVTuber {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isLive: boolean;
  user: { _count?: { followers: number } };
}

function useCountUp(target: number, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function CountUpStat({ target, label }: { target: number; label: string }) {
  const value = useCountUp(target);
  return (
    <div style={{ textAlign: 'center', position: 'relative', padding: '0 6px' }}>
      <div style={{
        fontSize: '1.35rem',
        fontWeight: 800,
        lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        <span className="landing-gradient-text">{value.toLocaleString('es-ES')}+</span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.03em', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

export default function HeroSection() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [floating, setFloating] = useState<FloatingVTuber[]>([]);

  useEffect(() => {
    setVisible(true);
    (async () => {
      try {
        const [s, live] = await Promise.all([
          apiFetch('/stats', {}),
          apiFetch('/vtubers/live', {}).catch(() => []),
        ]);
        setStats(s || null);
        if (Array.isArray(live) && live.length > 0) {
          setFloating(live.slice(0, 3));
        } else {
          const featured = await apiFetch('/vtubers/featured', {}).catch(() => []);
          if (Array.isArray(featured) && featured.length > 0) {
            setFloating(featured.slice(0, 3));
          }
        }
      } catch { /* silent */ }
    })();
  }, []);

  const totalVtubers = stats?.totalVtubers ?? 0;
  const totalEvents = stats?.totalEvents ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;

  // Mobile: hide floating cards (they need horizontal space)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    setIsMobile(mq.matches);
    const on = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const leftCard = floating[0];
  const rightCard = floating[1];
  const sideCard = floating[2];

  return (
    <section
      style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '56px 20px 72px',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {/* Glow orbs */}
      <div className="landing-orb" style={{
        width: 480, height: 480, left: '-120px', top: '-80px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.16), transparent 65%)',
        animation: 'landingFloat 9s ease-in-out infinite',
      }} />
      <div className="landing-orb" style={{
        width: 420, height: 420, right: '-100px', top: '20%',
        background: 'radial-gradient(circle, rgba(108,180,238,0.12), transparent 65%)',
        animation: 'landingFloat 11s ease-in-out infinite reverse',
      }} />
      <div className="landing-orb" style={{
        width: 380, height: 380, left: '30%', bottom: '-140px',
        background: 'radial-gradient(circle, rgba(245,158,11,0.08), transparent 65%)',
        animation: 'landingFloat 13s ease-in-out infinite',
      }} />

      {/* Subtle background texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'radial-gradient(circle at 25% 25%, rgba(139,92,246,0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(108,180,238,0.02) 0%, transparent 50%)',
        pointerEvents: 'none', zIndex: -1,
      }} />

      {/* Thin accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 2, borderRadius: 2,
        background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
        opacity: visible ? 0.9 : 0,
        transition: 'opacity 1s ease 0.3s',
      }} />

      {/* Floating mini-cards (desktop only) */}
      {!isMobile && leftCard && (
        <div className="landing-float-card" style={{
          left: '6%', top: '26%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px',
          animationDelay: '0.5s', zIndex: 2,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: leftCard.avatarUrl
              ? `url(${leftCard.avatarUrl}) center/cover`
              : 'linear-gradient(135deg, var(--primary), var(--warm))',
            border: '2px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.7rem',
          }}>
            {!leftCard.avatarUrl && leftCard.displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {leftCard.displayName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', color: leftCard.isLive ? '#ff4757' : 'var(--text-muted)', fontWeight: 600 }}>
              {leftCard.isLive && <span className="landing-live-dot" style={{ width: 5, height: 5 }} />}
              {leftCard.isLive ? 'EN VIVO' : 'En la plataforma'}
            </div>
          </div>
        </div>
      )}

      {!isMobile && rightCard && (
        <div className="landing-float-card" style={{
          right: '6%', top: '34%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px',
          animationDelay: '1.6s', zIndex: 2,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: rightCard.avatarUrl
              ? `url(${rightCard.avatarUrl}) center/cover`
              : 'linear-gradient(135deg, var(--accent), var(--primary))',
            border: '2px solid rgba(108,180,238,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.7rem',
          }}>
            {!rightCard.avatarUrl && rightCard.displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rightCard.displayName}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {rightCard.isLive ? 'En vivo ahora' : `${rightCard.user?._count?.followers ?? 0} seguidores`}
            </div>
          </div>
        </div>
      )}

      {!isMobile && sideCard && (
        <div className="landing-float-card" style={{
          left: '11%', bottom: '22%', padding: '10px 14px',
          animationDelay: '2.4s', zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {sideCard.displayName}
          </div>
        </div>
      )}

      {/* Logo */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.05s forwards' : 'none',
          marginBottom: '22px',
        }}
      >
        <Image
          src="/logo.png"
          alt="Gremio Estelar"
          width={0}
          height={0}
          sizes="100vw"
          priority
          style={{
            height: '84px',
            width: 'auto',
            opacity: 0.95,
            filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.35))',
          }}
        />
      </div>

      {/* Tagline badge */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.15s forwards' : 'none',
          marginBottom: '20px',
        }}
      >
        <span className="landing-eyebrow">
          Comunidad para Creadores Virtuales
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.25s forwards' : 'none',
          fontSize: 'clamp(2.3rem, 7vw, 4.6rem)',
          fontWeight: 800,
          lineHeight: 1.06,
          marginBottom: '18px',
          letterSpacing: '-0.035em',
          maxWidth: '820px',
        }}
      >
        El <span className="landing-gradient-text">Hogar</span> de los{' '}
        <span className="landing-gradient-text">VTubers</span>
      </h1>

      {/* Subtitle */}
      <p
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.35s forwards' : 'none',
          fontSize: 'clamp(0.95rem, 1.5vw, 1.12rem)',
          color: 'var(--text-muted)',
          maxWidth: '640px',
          lineHeight: 1.75,
          marginBottom: '38px',
        }}
      >
        La plataforma definitiva para creadores de contenido virtual. Gestiona tu perfil,
        organiza eventos, colabora en gremios y haz crecer tu comunidad en un solo lugar.
      </p>

      {/* CTA Buttons */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.45s forwards' : 'none',
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {user ? (
          <>
            <Link href="/dashboard" className="btn btn--lg btn--shine">
              Ir al Dashboard
            </Link>
            <Link href="/vtubers" className="btn btn--outline btn--lg">
              Explorar VTubers
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="btn btn--lg btn--shine">
              ✦ Unirse al Gremio
            </Link>
            <Link href="/login" className="btn btn--outline btn--lg">
              Ya soy miembro
            </Link>
          </>
        )}
      </div>

      {/* Real stats */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.6s forwards' : 'none',
          display: 'flex',
          gap: 'clamp(20px, 5vw, 48px)',
          alignItems: 'center',
          marginTop: '52px',
          padding: '18px 32px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <CountUpStat target={totalVtubers} label="VTubers registrados" />
        <div style={{ width: 1, height: 30, background: 'var(--glass-border)' }} />
        <CountUpStat target={totalEvents} label="Eventos realizados" />
        <div style={{ width: 1, height: 30, background: 'var(--glass-border)' }} />
        <CountUpStat target={totalUsers} label="Miembros" />
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          opacity: 0,
          animation: visible ? 'fadeIn 0.6s ease 1.2s forwards' : 'none',
        }}
      >
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Descubre más
        </span>
        <div style={{
          width: '16px', height: '26px',
          border: '1.5px solid rgba(139,92,246,0.3)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '5px',
        }}>
          <div style={{
            width: '2px', height: '6px',
            background: 'var(--primary)',
            borderRadius: '2px',
            animation: 'scrollDown 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scrollDown {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50%      { opacity: 0.3; transform: translateY(5px); }
        }
      `}</style>
    </section>
  );
}
