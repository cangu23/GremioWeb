'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ClientOnly from '@/lib/ClientOnly';

interface AuthLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  activeTab?: 'login' | 'register';
}

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
  const headingAccent = isLogin ? '✨' : '🚀';
  const subtitle = isLogin
    ? 'Accede a tu cuenta y continúa tu aventura VTuber'
    : 'Crea tu cuenta estelar y forma parte de la comunidad';

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
        background: '#070814',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 🌌 FULLSCREEN FIXED BACKGROUND (subtle parallax drift) */}
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
            filter: 'brightness(0.55) contrast(1.05) saturate(1.1)',
            transform: `translate3d(${mouseOffset.x * -0.25}px, ${mouseOffset.y * -0.25}px, 0) scale(1.02)`,
            transition: 'transform 0.25s cubic-bezier(0.1, 1, 0.1, 1)',
            zIndex: 0,
          }}
        />
      ) : (
        /* Fallback cosmic gradient */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 40%, rgba(99, 102, 241, 0.38) 0%, rgba(168, 85, 247, 0.22) 45%, #070814 85%)',
            zIndex: 0,
          }}
        />
      )}

      {/* Soft vignette to focus attention on the card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Subtle stardust grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '38px 38px',
          pointerEvents: 'none',
          opacity: 0.35,
          zIndex: 1,
        }}
      />

      {/* Single ambient glow (top-right) */}
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          top: '-12%',
          right: '8%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* 👑 BRAND HEADER (real logo) */}
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
              filter: 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.5))',
            }}
          />
          <span
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, #ffffff 40%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'uppercase',
            }}
          >
            Gremio Estelar
          </span>
        </Link>
      </header>

      {/* 🚀 CENTERED MAX-WIDTH WORKSPACE */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1120px',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT PANEL: CHARACTER SHOWCASE (smaller, aura-lit, no overlap) */}
        <div
          style={{
            flex: 1,
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
              height: '62vh',
              maxHeight: '560px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Deliberate, clean overlap with the card's left edge so the
              // character reads as part of the same composition (standing
              // beside the card). pointerEvents: none keeps every click on
              // the card working.
              marginRight: '-30px',
              pointerEvents: 'none',
              transform: `translate3d(${mouseOffset.x * 0.4}px, ${mouseOffset.y * 0.4}px, 0)`,
              transition: 'transform 0.25s cubic-bezier(0.1, 1, 0.1, 1)',
            }}
          >
            {/* Rotating cosmic aura behind the character */}
            <div
              className="auth-aura-rotate"
              style={{
                position: 'absolute',
                width: '130%',
                height: '130%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(124, 58, 237, 0.08) 45%, transparent 70%)',
                filter: 'blur(10px)',
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
                    maxHeight: '60vh',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 18px 40px rgba(0, 0, 0, 0.55))',
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
                    maxHeight: '60vh',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 18px 40px rgba(0, 0, 0, 0.55))',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: GLASS FORM CARD (stable, no parallax) */}
        <div
          style={{
            width: '420px',
            maxWidth: '92vw',
            flexShrink: 0,
            zIndex: 15,
            animation: 'authSlideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className="auth-glass-card"
            style={{
              borderRadius: '22px',
              padding: '26px 28px',
              position: 'relative',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.7), 0 0 45px rgba(99, 102, 241, 0.2)',
              background: 'rgba(10, 14, 28, 0.86)',
              borderColor: 'rgba(147, 197, 253, 0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Top Shimmer Edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #818CF8, #C084FC, transparent)',
              }}
            />

            {/* TAB TOGGLE WITH SLIDING PILL */}
            <div className="auth-tab-container" style={{ marginBottom: '18px' }}>
              <div
                className="auth-tab-slider"
                style={{
                  transform: isLogin ? 'translateX(0)' : 'translateX(100%)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.75), rgba(168, 85, 247, 0.75))',
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

            {/* Heading — clear hierarchy */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {heading} <span aria-hidden="true">{headingAccent}</span>
              </h1>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '0.84rem',
                  color: 'rgba(226, 232, 240, 0.65)',
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </p>
            </div>

            {/* 🎛️ SMOOTH HORIZONTAL SLIDING FORM PANEL TRACK */}
            <ClientOnly
              fallback={
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.4)' }}>
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
      </main>

      {/* Responsive styling */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .auth-hero-column {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
