'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, subtitle }: AuthLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';

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
      const x = (e.clientX / innerWidth - 0.5) * 16;
      const y = (e.clientY / innerHeight - 0.5) * 16;
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
        flexDirection: 'column',
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
            transform: `translate3d(${mouseOffset.x * -0.5}px, ${mouseOffset.y * -0.5}px, 0) scale(1.02)`,
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
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)',
          transform: `translate3d(${mouseOffset.x * 0.8}px, ${mouseOffset.y * 0.8}px, 0)`,
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
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, transparent 70%)',
          transform: `translate3d(${mouseOffset.x * -0.8}px, ${mouseOffset.y * -0.8}px, 0)`,
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
          opacity: 0.45,
          zIndex: 1,
        }}
      />

      {/* Floating Sparkles */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${(i * 17) % 85 + 7}%`,
              left: `${(i * 23) % 85 + 7}%`,
              width: `${(i % 3) * 3 + 4}px`,
              height: `${(i % 3) * 3 + 4}px`,
              borderRadius: '50%',
              background: i % 2 === 0 ? '#818CF8' : '#C084FC',
              boxShadow: i % 2 === 0 ? '0 0 14px #818CF8' : '0 0 14px #C084FC',
              animation: `authParticleTwinkle ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* 👑 CLEAN TOP HEADER BAR (BRAND LOGO ONLY - NO FLOATING OVERLAPPING BUTTONS) */}
      <header
        style={{
          position: 'relative',
          zIndex: 30,
          width: '100%',
          padding: '24px 44px 0 44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1, #A855F7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.65)',
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            ❖
          </div>
          <span
            style={{
              fontSize: '1.4rem',
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

      {/* 🚀 MAIN CONTENT SPLIT AREA */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px 24px 48px',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT PANEL: HERO CHARACTER SHOWCASE (CLEAN, PROMINENT, ANIMATED ONLY) */}
        <div
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            animation: 'authSlideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="auth-hero-column"
        >
          {/* Character Image - Large (90vh), Natural Float & Parallax Animation */}
          <div
            className="auth-character-anim"
            style={{
              position: 'relative',
              height: '88vh',
              maxHeight: '830px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translate3d(${mouseOffset.x * 0.6}px, ${mouseOffset.y * 0.6}px, 0)`,
              transition: 'transform 0.2s cubic-bezier(0.1, 1, 0.1, 1)',
            }}
          >
            {!charFailed ? (
              /* User custom character image */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={charImage}
                alt="Character Showcase"
                onError={() => setCharFailed(true)}
                style={{
                  height: '100%',
                  width: 'auto',
                  maxHeight: '88vh',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.45))',
                  transition: 'all 0.5s ease',
                }}
              />
            ) : (
              /* Fallback character showcase */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/hoshi.png"
                alt="VTuber Mascot Showcase"
                style={{
                  height: '100%',
                  width: 'auto',
                  maxHeight: '88vh',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.45))',
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL: GLASS FORM CARD */}
        <div
          style={{
            width: '430px',
            maxWidth: '90vw',
            flexShrink: 0,
            zIndex: 15,
            transform: `translate3d(${mouseOffset.x * -0.4}px, ${mouseOffset.y * -0.4}px, 0)`,
            transition: 'transform 0.2s cubic-bezier(0.1, 1, 0.1, 1)',
            animation: 'authSlideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* GLASS CARD CONTAINER */}
          <div
            className="auth-glass-card"
            style={{
              borderRadius: '26px',
              padding: '32px 28px',
              position: 'relative',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.7), 0 0 45px rgba(99, 102, 241, 0.25)',
              background: 'rgba(10, 14, 28, 0.8)',
              borderColor: 'rgba(147, 197, 253, 0.22)',
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
            <div className="auth-tab-container" style={{ marginBottom: '20px' }}>
              <div
                className="auth-tab-slider"
                style={{
                  transform: isLogin ? 'translateX(0)' : 'translateX(100%)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(168, 85, 247, 0.7))',
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
                fontSize: '0.85rem',
                color: 'rgba(226, 232, 240, 0.75)',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {subtitle}
            </p>

            {/* SMOOTH ANIMATED FORM BODY */}
            <div key={pathname} className="auth-form-anim">
              {children}
            </div>
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
