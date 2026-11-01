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

function AgencyStat({ target, label, sublabel }: { target: number; label: string; sublabel: string }) {
  const value = useCountUp(target);
  return (
    <div style={{ textAlign: 'center', position: 'relative', padding: '0 12px' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(139,92,246,0.85)', fontWeight: 700, marginBottom: '2px' }}>
        {sublabel}
      </div>
      <div
        style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        <span className="landing-gradient-text">{value.toLocaleString('es-ES')}+</span>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.04em', fontWeight: 600 }}>
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
        const gurenDefault: FloatingVTuber = {
          id: 'guren-lead',
          userId: 'gurenvt_',
          displayName: 'Guren Tatsumaki',
          avatarUrl: '/images/guren-avatar.jpg',
          isLive: false,
          user: { _count: { followers: 366 } },
        };

        if (Array.isArray(live) && live.length > 0) {
          setFloating(live.slice(0, 3));
        } else {
          const featured = await apiFetch('/vtubers/featured', {}).catch(() => []);
          if (Array.isArray(featured) && featured.length > 0) {
            setFloating(featured.slice(0, 3));
          } else {
            setFloating([gurenDefault]);
          }
        }
      } catch {
        /* silent */
      }
    })();
  }, []);

  const totalVtubers = stats?.totalVtubers ?? 0;
  const totalEvents = stats?.totalEvents ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;

  // Mobile: hide floating cards
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
        padding: '52px 20px 76px',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {/* Background Japanese Agency Subtle Grid & Cyber Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 65% 65% at 50% 45%, #000 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 45%, #000 35%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Atmospheric Glow Orbs */}
      <div
        className="landing-orb"
        style={{
          width: 520,
          height: 520,
          left: '-140px',
          top: '-100px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 65%)',
          animation: 'landingFloat 10s ease-in-out infinite',
        }}
      />
      <div
        className="landing-orb"
        style={{
          width: 460,
          height: 460,
          right: '-120px',
          top: '18%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.12), transparent 65%)',
          animation: 'landingFloat 12s ease-in-out infinite reverse',
        }}
      />

      {/* Floating mini-cards (desktop agency highlights) */}
      {!isMobile && leftCard && (
        <div
          className="landing-float-card"
          style={{
            left: '5%',
            top: '24%',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animationDelay: '0.4s',
            zIndex: 2,
            border: '1px solid rgba(139,92,246,0.25)',
            background: 'rgba(15,15,22,0.85)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              flexShrink: 0,
              overflow: 'hidden',
              background: leftCard.avatarUrl
                ? `url(${leftCard.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--warm))',
              border: '2px solid rgba(139,92,246,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.72rem',
            }}
          >
            {!leftCard.avatarUrl && leftCard.displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.08em', color: 'rgba(139,92,246,0.9)', textTransform: 'uppercase', fontWeight: 700 }}>
              TALENT // 所属
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {leftCard.displayName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', color: leftCard.isLive ? '#ff4757' : 'var(--text-muted)', fontWeight: 700 }}>
              {leftCard.isLive && <span className="landing-live-dot" style={{ width: 5, height: 5 }} />}
              {leftCard.isLive ? 'ON AIR' : 'OFFLINE'}
            </div>
          </div>
        </div>
      )}

      {!isMobile && rightCard && (
        <div
          className="landing-float-card"
          style={{
            right: '5%',
            top: '32%',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animationDelay: '1.4s',
            zIndex: 2,
            border: '1px solid rgba(56,189,248,0.25)',
            background: 'rgba(15,15,22,0.85)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              flexShrink: 0,
              overflow: 'hidden',
              background: rightCard.avatarUrl
                ? `url(${rightCard.avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--accent), var(--primary))',
              border: '2px solid rgba(56,189,248,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.72rem',
            }}
          >
            {!rightCard.avatarUrl && rightCard.displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
              CREATOR // 配信者
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rightCard.displayName}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {rightCard.isLive ? 'Transmitiendo' : `${rightCard.user?._count?.followers ?? 0} fans`}
            </div>
          </div>
        </div>
      )}

      {!isMobile && sideCard && (
        <div
          className="landing-float-card"
          style={{
            left: '10%',
            bottom: '22%',
            padding: '8px 14px',
            animationDelay: '2.2s',
            zIndex: 2,
            border: '1px solid var(--glass-border)',
            background: 'rgba(15,15,22,0.85)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
            <span style={{ color: 'var(--primary)' }}>✦</span>
            <span>{sideCard.displayName}</span>
            <span style={{ fontSize: '0.58rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>GEN 0</span>
          </div>
        </div>
      )}

      {/* Agency Brand Header with Japanese Typography Sublabel (Inspired by LeFolk) */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.05s forwards' : 'none',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
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
            height: '86px',
            width: 'auto',
            opacity: 0.96,
            filter: 'drop-shadow(0 0 28px rgba(139,92,246,0.38))',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            GREMIO ESTELAR
          </span>
          <span style={{ color: 'rgba(139,92,246,0.6)', fontSize: '0.75rem' }}>/</span>
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            グレミオ・エステラール
          </span>
        </div>
      </div>

      {/* LeFolk-style Badge: Virtual Talent Group & Motto */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.15s forwards' : 'none',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '5px 16px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(56,189,248,0.08))',
            border: '1px solid rgba(139,92,246,0.28)',
            boxShadow: '0 4px 18px rgba(139,92,246,0.12)',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            VIRTUAL TALENT GROUP & CREATOR NETWORK // バーチャルタレント
          </span>
        </div>
      </div>

      {/* Main Title: Japanese Agency Philosophy Headline */}
      <h1
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.25s forwards' : 'none',
          fontSize: 'clamp(2.4rem, 6.5vw, 4.4rem)',
          fontWeight: 900,
          lineHeight: 1.08,
          marginBottom: '20px',
          letterSpacing: '-0.035em',
          maxWidth: '880px',
        }}
      >
        Extendiendo la <span className="landing-gradient-text">cultura virtual</span> a través de la{' '}
        <span className="landing-gradient-text">creación</span>
      </h1>

      {/* Subtitle with agency focus */}
      <p
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.35s forwards' : 'none',
          fontSize: 'clamp(0.95rem, 1.45vw, 1.12rem)',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          lineHeight: 1.75,
          marginBottom: '38px',
        }}
      >
        El hogar y red de VTubers, streamers y su comunidad en español. Perfiles con lore e historia,
        sincronización de streams en directo, Pase Estelar y un modelo económico transparente con 35% de comisión neta para creadores.
      </p>

      {/* CTA Buttons in sleek agency aesthetic */}
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
            <Link href="/dashboard" className="btn btn--lg btn--shine" style={{ padding: '12px 28px', fontWeight: 800 }}>
              Panel de Miembro // DASHBOARD
            </Link>
            <Link href="/vtubers" className="btn btn--outline btn--lg" style={{ padding: '12px 26px', fontWeight: 700 }}>
              Explorar Talentos // TALENTS
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="btn btn--lg btn--shine" style={{ padding: '12px 28px', fontWeight: 800 }}>
              ✦ Unirse al Gremio // JOIN US
            </Link>
            <Link href="/vtubers" className="btn btn--outline btn--lg" style={{ padding: '12px 26px', fontWeight: 700 }}>
              Talentos & Streams // TALENTS
            </Link>
          </>
        )}
      </div>

      {/* LeFolk-style Technical Agency Stats Bar */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.6s forwards' : 'none',
          display: 'flex',
          gap: 'clamp(16px, 4vw, 44px)',
          alignItems: 'center',
          marginTop: '52px',
          padding: '18px 36px',
          borderRadius: '16px',
          background: 'rgba(15,15,22,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <AgencyStat target={totalVtubers} sublabel="[01] // TALENTS" label="VTubers Registrados" />
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />
        <AgencyStat target={totalEvents} sublabel="[02] // EVENTS" label="Eventos Realizados" />
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />
        <AgencyStat target={totalUsers} sublabel="[03] // MEMBERS" label="Miembros de la Red" />
      </div>

      {/* Scroll indicator with Japanese agency flair */}
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
        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          SCROLL // スクロール
        </span>
        <div
          style={{
            width: '16px',
            height: '26px',
            border: '1.5px solid rgba(139,92,246,0.3)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '5px',
          }}
        >
          <div
            style={{
              width: '2px',
              height: '6px',
              background: 'var(--primary)',
              borderRadius: '2px',
              animation: 'scrollDown 1.5s ease-in-out infinite',
            }}
          />
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
