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

  // Subtle 3D Mouse Parallax Tracking
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 14;
      const y = (e.clientY / innerHeight - 0.5) * 14;
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
      {/* 🌌 FULLSCREEN FIXED BACKGROUND (With subtle 3D parallax drift) */}
      {!bgFailed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={bgImage}
          alt="Auth Background"
          onError={() => setBgFailed(true)}
          style={{
            position: 'absolute',
            inset: '-10px',
            width: 'calc(100% + 20px)',
            height: 'calc(100% + 20px)',
            objectFit: 'cover',
            objectPosition: 'center center',
            filter: 'brightness(0.65) contrast(1.08) saturate(1.15)',
            transform: `translate3d(${mouseOffset.x * -0.4}px, ${mouseOffset.y * -0.4}px, 0) scale(1.02)`,
            transition: 'transform 0.2s cubic-bezier(0.1, 1, 0.1, 1)',
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

      {/* Ambient Lighting Beams */}
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '15%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, transparent 70%)',
          transform: `translate3d(${mouseOffset.x * 0.7}px, ${mouseOffset.y * 0.7}px, 0)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          transform: `translate3d(${mouseOffset.x * -0.7}px, ${mouseOffset.y * -0.7}px, 0)`,
          pointerEvents: 'none',
          zIndex: 1,
          animationDelay: '-2.5s',
        }}
      />

      {/* Stardust Grid Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
          opacity: 0.4,
          zIndex: 1,
        }}
      />

      {/* 👑 CLEAN TOP HEADER BAR */}
      <header
        style={{
          position: 'absolute',
          top: '20px',
          left: '32px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1, #A855F7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(99, 102, 241, 0.6)',
              fontSize: '1.05rem',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            ❖
          </div>
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, #ffffff 40%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
            }}
          >
            GREMIO ESTELAR
          </span>
        </Link>
      </header>

      {/* 🚀 CENTERED MAX-WIDTH WORKSPACE (PREVENTS MIGRATION DISPLACEMENT ACROSS SCREEN RESOLUTIONS) */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1180px',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT PANEL: HERO CHARACTER SHOWCASE */}
        <div
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            zIndex: 25,
            animation: 'authSlideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="auth-hero-column"
        >
          {/* Character Image - Natural Float & Hand touching Card Frame */}
          <div
            className="auth-character-anim"
            style={{
              position: 'relative',
              height: '76vh',
              maxHeight: '690px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '-18px',
              zIndex: 25,
              transform: `translate3d(${mouseOffset.x * 0.5}px, ${mouseOffset.y * 0.5}px, 0)`,
              transition: 'transform 0.2s cubic-bezier(0.1, 1, 0.1, 1)',
            }}
          >
            {!charFailed ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={charImage}
                alt="Character Showcase"
                onError={() => setCharFailed(true)}
                style={{
                  height: '100%',
                  width: 'auto',
                  maxHeight: '76vh',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 30px rgba(0, 0, 0, 0.45))',
                  transition: 'all 0.5s ease',
                }}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/hoshi.png"
                alt="VTuber Mascot Showcase"
                style={{
                  height: '100%',
                  width: 'auto',
                  maxHeight: '76vh',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 30px rgba(0, 0, 0, 0.45))',
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL: GLASS FORM CARD WIDGET */}
        <div
          style={{
            width: '390px',
            maxWidth: '92vw',
            flexShrink: 0,
            zIndex: 15,
            transform: `translate3d(${mouseOffset.x * -0.3}px, ${mouseOffset.y * -0.3}px, 0)`,
            transition: 'transform 0.2s cubic-bezier(0.1, 1, 0.1, 1)',
            animation: 'authSlideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* GLASS CARD CONTAINER */}
          <div
            className="auth-glass-card"
            style={{
              borderRadius: '20px',
              padding: '20px 22px',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(99, 102, 241, 0.22)',
              background: 'rgba(10, 14, 28, 0.85)',
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
            <div className="auth-tab-container" style={{ marginBottom: '12px' }}>
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
                ✨ Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('/register')}
                className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
              >
                ✦ Registrarse
              </button>
            </div>

            {/* Form Subtitle Header */}
            <p
              style={{
                fontSize: '0.8rem',
                color: 'rgba(226, 232, 240, 0.75)',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              {isLogin ? 'Accede a tu cuenta y continúa tu aventura VTuber' : 'Crea tu cuenta estelar y forma parte de la comunidad'}
            </p>

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

