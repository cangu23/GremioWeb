'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ClientOnly from '@/lib/ClientOnly';

interface AuthLayoutProps {
  activeTab?: 'login' | 'register';
}

/* Deterministic starfield (fixed seeds to avoid hydration mismatch) */
const STARS = Array.from({ length: 46 }, (_, i) => ({
  id: i,
  left: (i * 37 + 11) % 100,
  top: (i * 53 + 7) % 100,
  size: 1 + ((i * 13) % 3),
  delay: (i % 8) * 0.4,
}));

export default function AuthLayout({ activeTab }: AuthLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = activeTab ? activeTab === 'login' : pathname === '/login';

  // State to handle custom image fallbacks gracefully
  const [bgImage] = useState('/images/auth/bg.jpg');
  const [charImage] = useState('/images/auth/character.png');
  const [bgFailed, setBgFailed] = useState(false);
  const [charFailed, setCharFailed] = useState(false);

  // Gentle 3D mouse parallax (background + character only, NOT the form card)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 10;
      const y = (e.clientY / innerHeight - 0.5) * 10;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleTabSwitch = (targetPath: string) => {
    if (pathname !== targetPath) {
      router.push(targetPath, { scroll: false });
    }
  };

  const heading = isLogin ? 'Bienvenido de vuelta' : 'Únete al Gremio';
  const subtitle = isLogin
    ? 'Accede a tu cuenta y continúa tu aventura estelar'
    : 'Crea tu cuenta y emprende tu leyenda entre las estrellas';

  // Gold constellation ornament behind the character (Teyvat-style)
  const constellation = useMemo(
    () => (
      <svg
        viewBox="0 0 500 640"
        className="auth-constellation"
        style={{
          position: 'absolute',
          width: '115%',
          height: '115%',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          opacity: 0.5,
        }}
        aria-hidden="true"
      >
        <g stroke="rgba(232,199,122,0.4)" strokeWidth="1" fill="none">
          <path d="M90 120 L180 70 L260 130 L330 90" />
          <path d="M180 70 L210 180 L330 90" />
          <path d="M210 180 L120 260 L90 120" />
          <path d="M330 90 L420 170 L350 260" />
          <path d="M420 170 L470 300" />
          <path d="M120 260 L210 180 L280 300 L180 380 L120 260" />
          <path d="M350 260 L280 300" />
          <path d="M280 300 L380 390 L470 300" />
          <path d="M380 390 L300 480" />
        </g>
        <g fill="#F5E7B0">
          {[
            [90, 120],
            [180, 70],
            [260, 130],
            [330, 90],
            [210, 180],
            [120, 260],
            [420, 170],
            [470, 300],
            [280, 300],
            [180, 380],
            [350, 260],
            [380, 390],
            [300, 480],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 3.5 : 2.2} opacity={0.9} />
          ))}
        </g>
      </svg>
    ),
    []
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        overflow: 'hidden',
        background: '#05070f',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 🌌 FULLSCREEN FIXED BACKGROUND (Genshin-style deep dusk) */}
      {!bgFailed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={bgImage}
          alt=""
          onError={() => setBgFailed(true)}
          style={{
            position: 'absolute',
            inset: '-10px',
            width: 'calc(100% + 20px)',
            height: 'calc(100% + 20px)',
            objectFit: 'cover',
            objectPosition: 'center center',
            filter: 'brightness(0.5) contrast(1.08) saturate(1.25)',
            transform: `translate3d(${mouseOffset.x * -0.25}px, ${mouseOffset.y * -0.25}px, 0) scale(1.02)`,
            transition: 'transform 0.25s cubic-bezier(0.1, 1, 0.1, 1)',
            zIndex: 0,
          }}
        />
      ) : (
        /* Fallback Genshin dusk gradient */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 30% 30%, rgba(60, 84, 148, 0.55) 0%, rgba(18, 24, 52, 0.7) 45%, #05070f 85%)',
            zIndex: 0,
          }}
        />
      )}

      {/* Deep blue-ink overlay (Teyvat night) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(115deg, rgba(5,7,15,0.88) 0%, rgba(10,14,30,0.62) 38%, rgba(5,7,15,0.72) 100%)',
          zIndex: 1,
        }}
      />

      {/* Golden horizon glow (character side) */}
      <div
        style={{
          position: 'absolute',
          left: '2%',
          bottom: '-18%',
          width: '46vw',
          height: '46vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Twinkling starfield */}
      {STARS.map((s) => (
        <div
          key={s.id}
          className="auth-star-twinkle"
          style={{
            position: 'absolute',
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            background: s.size > 2 ? '#F5E7B0' : '#cfd8ff',
            boxShadow: s.size > 2 ? '0 0 6px rgba(245,231,176,0.9)' : '0 0 4px rgba(207,216,255,0.7)',
            animationDelay: `${s.delay}s`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      ))}

      {/* Ambient vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* 👑 BRAND HEADER (real logo, gold shimmer) */}
      <header
        style={{
          position: 'absolute',
          top: '24px',
          left: '36px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Gremio Estelar"
            style={{
              height: '34px',
              width: 'auto',
              filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.55))',
            }}
          />
          <span
            className="auth-gold-shimmer"
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Gremio Estelar
          </span>
        </Link>
      </header>

      {/* 🚀 CENTERED MAX-WIDTH WORKSPACE — character + card as one balanced unit */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1180px',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '0 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT PANEL: CHARACTER SHOWCASE (gold constellation aura) */}
        <div
          style={{
            // Content-sized (character's real width), so the whole
            // character+card unit centers truly on screen.
            flex: '0 0 auto',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            overflow: 'visible',
            zIndex: 20,
          }}
          className="auth-hero-column"
        >
          <div
            style={{
              position: 'relative',
              height: '66vh',
              maxHeight: '590px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Stronger Genshin-style overlap: the character leans onto the
              // card. pointerEvents: none keeps every click on the card working.
              marginRight: '-58px',
              pointerEvents: 'none',
              transform: `translate3d(${mouseOffset.x * 0.4}px, ${mouseOffset.y * 0.4}px, 0)`,
              transition: 'transform 0.25s cubic-bezier(0.1, 1, 0.1, 1)',
            }}
          >
            {/* Constellation map behind the character */}
            {constellation}

            {/* Rotating golden aura */}
            <div
              className="auth-gold-aura"
              style={{
                position: 'absolute',
                width: '140%',
                height: '140%',
                borderRadius: '50%',
                background:
                  'conic-gradient(from 0deg, rgba(212,175,55,0.14) 0%, transparent 18%, rgba(245,231,176,0.1) 40%, transparent 60%, rgba(212,175,55,0.14) 100%)',
                filter: 'blur(12px)',
                pointerEvents: 'none',
              }}
            />
            {/* Warm light rays */}
            <div
              style={{
                position: 'absolute',
                width: '170%',
                height: '170%',
                background:
                  'conic-gradient(from 40deg, transparent 0deg, rgba(245,231,176,0.06) 12deg, transparent 26deg, rgba(212,175,55,0.05) 40deg, transparent 55deg, rgba(245,231,176,0.06) 70deg, transparent 84deg, rgba(212,175,55,0.05) 98deg, transparent 112deg)',
                animation: 'authRaySway 8s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />

            {/* Soft shadow cast ONTO the card (character overlaps the panel) */}
            <div
              style={{
                position: 'absolute',
                right: '-76px',
                top: '6%',
                bottom: '2%',
                width: '110px',
                background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.22) 45%, transparent 100%)',
                filter: 'blur(7px)',
                pointerEvents: 'none',
              }}
            />
            {/* Golden rim-light where the character meets the card */}
            <div
              style={{
                position: 'absolute',
                right: '-46px',
                top: '8%',
                bottom: '6%',
                width: '26px',
                background: 'linear-gradient(to left, rgba(245,231,176,0.16) 0%, transparent 100%)',
                filter: 'blur(4px)',
                pointerEvents: 'none',
              }}
            />
            {/* Contact shadow grounding the character */}
            <div
              style={{
                position: 'absolute',
                bottom: '-4%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '72%',
                height: '30px',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)',
                filter: 'blur(9px)',
                pointerEvents: 'none',
              }}
            />

            <div
              className="auth-character-anim"
              style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!charFailed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={charImage}
                  alt="Mascota de Gremio Estelar"
                  onError={() => setCharFailed(true)}
                  style={{
                    height: '100%',
                    width: 'auto',
                    maxHeight: '64vh',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 18px 44px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 30px rgba(212,175,55,0.18))',
                    transition: 'all 0.5s ease',
                  }}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/hoshi.png"
                  alt="Mascota de Gremio Estelar"
                  style={{
                    height: '100%',
                    width: 'auto',
                    maxHeight: '64vh',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 18px 44px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 30px rgba(212,175,55,0.18))',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: ORNATE GOLD FORM CARD (stable, no parallax) */}
        <div
          style={{
            width: '430px',
            maxWidth: '92vw',
            flexShrink: 0,
            zIndex: 15,
            animation: 'authSlideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className="auth-glass-card"
            style={{
              borderRadius: '20px',
              padding: '22px 30px 18px',
              position: 'relative',
              overflow: 'hidden',
              // Fit the viewport: card never exceeds the screen; the form
              // area scrolls internally if needed, tabs/heading stay pinned.
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Ornamental gold corners */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                width: 22,
                height: 22,
                borderTop: '2px solid #D4AF37',
                borderLeft: '2px solid #D4AF37',
                borderTopLeftRadius: 12,
                opacity: 0.75,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 22,
                height: 22,
                borderTop: '2px solid #D4AF37',
                borderRight: '2px solid #D4AF37',
                borderTopRightRadius: 12,
                opacity: 0.75,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                width: 22,
                height: 22,
                borderBottom: '2px solid #D4AF37',
                borderLeft: '2px solid #D4AF37',
                borderBottomLeftRadius: 12,
                opacity: 0.75,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 22,
                height: 22,
                borderBottom: '2px solid #D4AF37',
                borderRight: '2px solid #D4AF37',
                borderBottomRightRadius: 12,
                opacity: 0.75,
                pointerEvents: 'none',
              }}
            />

            {/* Top gold shimmer edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #F5E7B0, #D4AF37, #F5E7B0, transparent)',
                backgroundSize: '200% 100%',
                animation: 'authGoldShimmer 6s linear infinite',
              }}
            />

            {/* Kicker: star + gold rule */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '2px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.55))',
                  maxWidth: '64px',
                }}
              />
              <span
                style={{
                  fontSize: '0.85rem',
                  color: '#E8C77A',
                  letterSpacing: '0.3em',
                  textIndent: '0.3em',
                }}
                aria-hidden="true"
              >
                ✦
              </span>
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.55), transparent)',
                  maxWidth: '64px',
                }}
              />
            </div>

            {/* TAB TOGGLE WITH SLIDING GOLD PILL */}
            <div className="auth-tab-container" style={{ marginBottom: '14px', flexShrink: 0 }}>
              <div
                className="auth-tab-slider"
                style={{
                  transform: isLogin ? 'translateX(0)' : 'translateX(100%)',
                }}
              />
              <button
                type="button"
                onClick={() => handleTabSwitch('/login')}
                className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('/register')}
                className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
              >
                Registrarse
              </button>
            </div>

            {/* Heading — elegant Genshin-style hierarchy */}
            <div style={{ textAlign: 'center', marginBottom: '12px', flexShrink: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.55rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: '#F5EFDF',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  lineHeight: 1.25,
                }}
              >
                {heading}
              </h1>
              <p
                style={{
                  margin: '5px 0 0',
                  fontSize: '0.8rem',
                  color: 'rgba(245, 239, 223, 0.55)',
                  lineHeight: 1.45,
                }}
              >
                {subtitle}
              </p>
            </div>

            {/* 🎛️ SMOOTH HORIZONTAL SLIDING FORM PANEL TRACK (scrolls internally if short viewport) */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                paddingRight: '2px',
              }}
              className="auth-form-scroll"
            >
              <ClientOnly
                fallback={
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.4)' }}>
                    <p style={{ fontSize: '0.85rem' }}>Cargando interfaz...</p>
                  </div>
                }
              >
                <div style={{ width: '100%', overflow: 'hidden' }}>
                  <div
                    style={{
                      display: 'flex',
                      width: '200%',
                      transform: isLogin ? 'translateX(0%)' : 'translateX(-50%)',
                      transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {/* Panel 1: Login */}
                    <div style={{ width: '50%', paddingRight: '6px', boxSizing: 'border-box' }}>
                      <LoginForm />
                    </div>
                    {/* Panel 2: Register */}
                    <div style={{ width: '50%', paddingLeft: '6px', boxSizing: 'border-box' }}>
                      <RegisterForm />
                    </div>
                  </div>
                </div>
              </ClientOnly>
            </div>
          </div>
        </div>
      </main>

      {/* 📜 VERSION FOOTER (Genshin launcher style) */}
      <footer
        className="auth-footer"
        style={{
          position: 'absolute',
          bottom: '22px',
          left: '36px',
          right: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 30,
          fontFamily: 'var(--font-sans)',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            color: 'rgba(232, 199, 122, 0.6)',
            textTransform: 'uppercase',
          }}
        >
          Versión 1.0.0
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            color: 'rgba(245, 239, 223, 0.35)',
            textTransform: 'uppercase',
          }}
        >
          © 2026 Gremio Estelar
        </span>
      </footer>

      {/* Responsive styling */}
      <style jsx global>{`
        .auth-form-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .auth-form-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        @media (max-width: 1020px) {
          .auth-hero-column {
            display: none !important;
          }
          .auth-footer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
