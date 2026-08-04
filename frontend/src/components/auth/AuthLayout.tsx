'use client';

import React, { useState } from 'react';
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
        background: '#080a16',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 🌌 FULLSCREEN FIXED BACKGROUND (Clean, no zooming or stretching) */}
      {!bgFailed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={bgImage}
          alt="Auth Background"
          onError={() => setBgFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            filter: 'brightness(0.65) contrast(1.08) saturate(1.1)',
            zIndex: 0,
          }}
        />
      ) : (
        /* Fallback cosmic gradient matching the blue/violet stardust aesthetic */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 75% 35%, rgba(99, 102, 241, 0.35) 0%, rgba(168, 85, 247, 0.2) 45%, #080a16 85%)',
            zIndex: 0,
          }}
        />
      )}

      {/* Atmospheric Soft Lighting Beams matching background palette */}
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          top: '-10%',
          left: '10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '20%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          animationDelay: '-2.5s',
        }}
      />

      {/* Subtle Stardust Mesh Grid */}
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
              boxShadow: i % 2 === 0 ? '0 0 12px #818CF8' : '0 0 12px #C084FC',
              animation: `authParticleTwinkle ${3.5 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* 👑 TOP HEADER BAR */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          width: '100%',
          padding: '24px 48px',
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
            gap: '12px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '13px',
              background: 'linear-gradient(135deg, #6366F1, #A855F7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)',
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            ❖
          </div>
          <span
            style={{
              fontSize: '1.45rem',
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

        {/* Top Right Quick Action Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            {isLogin ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
          </span>
          <button
            onClick={() => handleTabSwitch(isLogin ? '/register' : '/login')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '9px 20px',
              borderRadius: '22px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.35)';
              e.currentTarget.style.borderColor = '#818CF8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            {isLogin ? 'Regístrate' : 'Iniciar Sesión'}
          </button>
        </div>
      </header>

      {/* 🚀 MAIN CONTENT SPLIT AREA */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          width: '100%',
          height: 'calc(100vh - 88px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 54px 36px 54px',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT PANEL: GLASS FORM CARD */}
        <div
          style={{
            width: '450px',
            maxWidth: '90vw',
            flexShrink: 0,
            zIndex: 15,
            animation: 'authSlideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* GLASS CARD CONTAINER */}
          <div
            className="auth-glass-card"
            style={{
              borderRadius: '26px',
              padding: '34px 30px',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(99, 102, 241, 0.25)',
              background: 'rgba(10, 14, 28, 0.76)',
              borderColor: 'rgba(147, 197, 253, 0.18)',
            }}
          >
            {/* Top Light Accent Line */}
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
            <div className="auth-tab-container">
              <div
                className="auth-tab-slider"
                style={{
                  transform: isLogin ? 'translateX(0)' : 'translateX(100%)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.6), rgba(168, 85, 247, 0.6))',
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

            {/* Form Subtitle Header */}
            <p
              style={{
                fontSize: '0.88rem',
                color: 'rgba(226, 232, 240, 0.7)',
                marginBottom: '22px',
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

        {/* RIGHT PANEL: CHARACTER SHOWCASE (FACING INWARDS TOWARDS FORM) */}
        <div
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          className="auth-hero-column"
        >
          {/* Character Glowing Backdrop Circle */}
          <div
            className="auth-glow-pulse"
            style={{
              position: 'absolute',
              width: '540px',
              height: '540px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, rgba(168, 85, 247, 0.18) 50%, transparent 75%)',
              filter: 'blur(32px)',
              pointerEvents: 'none',
            }}
          />

          {/* Character Image - Scaled & Flipped Horizontally to Look Inwards towards Form */}
          <div
            className="auth-character-anim"
            style={{
              position: 'relative',
              height: '82vh',
              maxHeight: '750px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
                  maxHeight: '82vh',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 35px rgba(99, 102, 241, 0.45))',
                  transition: 'all 0.5s ease',
                }}
              />
            ) : (
              /* Fallback character showcase - Flipped horizontally (scaleX(-1)) so she faces the login card */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/hoshi.png"
                alt="VTuber Mascot Showcase"
                style={{
                  height: '100%',
                  width: 'auto',
                  maxHeight: '82vh',
                  objectFit: 'contain',
                  transform: 'scaleX(-1)', // Flip so her hands and gaze point towards the left form card!
                  filter: 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 35px rgba(99, 102, 241, 0.45))',
                }}
              />
            )}

            {/* Floating Glass Stats / Community Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                background: 'rgba(10, 14, 28, 0.85)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(147, 197, 253, 0.2)',
                borderRadius: '20px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.55), 0 0 25px rgba(99, 102, 241, 0.3)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38BDF8, #818CF8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#fff',
                }}
              >
                ✦
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                  Universo VTuber Estelar
                </div>
                <div style={{ fontSize: '0.76rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                  Gana experiencia, medallas y recompensas diarias
                </div>
              </div>
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
