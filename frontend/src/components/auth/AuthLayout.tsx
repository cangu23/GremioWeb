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
        zIndex: 99999,
        overflow: 'hidden',
        background: '#070510',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 🌌 FULLSCREEN FIXED BACKGROUND (1:1 Aspect ratio, zero zoom stretch) */}
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
            filter: 'brightness(0.55) contrast(1.1)',
            zIndex: 0,
          }}
        />
      ) : (
        /* Fallback cosmic gradient background */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 75% 35%, rgba(139, 92, 246, 0.35) 0%, rgba(236, 72, 153, 0.2) 40%, #070510 85%)',
            zIndex: 0,
          }}
        />
      )}

      {/* Glow Beams */}
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '25%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.28) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          animationDelay: '-2.5s',
        }}
      />

      {/* Grid Pattern Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
          opacity: 0.5,
          zIndex: 1,
        }}
      />

      {/* Floating Stardust Sparkles */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${(i * 19) % 85 + 7}%`,
              left: `${(i * 27) % 85 + 7}%`,
              width: `${(i % 3) * 3 + 4}px`,
              height: `${(i % 3) * 3 + 4}px`,
              borderRadius: '50%',
              background: i % 2 === 0 ? '#A78BFA' : '#F472B6',
              boxShadow: i % 2 === 0 ? '0 0 12px #A78BFA' : '0 0 12px #F472B6',
              animation: `authParticleTwinkle ${3.5 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* 👑 TOP BAR (OTAKORE STYLE: LOGO ON LEFT, TOGGLE/CLOSE ON RIGHT) */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          width: '100%',
          padding: '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
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
              background: 'linear-gradient(135deg, #ffffff 40%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
            }}
          >
            GREMIO ESTELAR
          </span>
        </Link>

        {/* Top Right Quick Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            {isLogin ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
          </span>
          <button
            onClick={() => handleTabSwitch(isLogin ? '/register' : '/login')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
              e.currentTarget.style.borderColor = '#A78BFA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
            }}
          >
            {isLogin ? 'Regístrate' : 'Iniciar Sesión'}
          </button>
        </div>
      </header>

      {/* 🚀 MAIN SPLIT CONTENT AREA */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          width: '100%',
          height: 'calc(100vh - 86px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 48px 32px 48px',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT PANEL: AUTH FORM CARD */}
        <div
          style={{
            width: '440px',
            maxWidth: '90vw',
            flexShrink: 0,
            zIndex: 15,
            animation: 'authSlideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* GLASS CARD FORM CONTAINER */}
          <div
            className="auth-glass-card"
            style={{
              borderRadius: '24px',
              padding: '32px 28px',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.2)',
            }}
          >
            {/* Top Glowing Edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.8), transparent)',
              }}
            />

            {/* TAB TOGGLE: SMOOTH SLIDING PILL */}
            <div className="auth-tab-container">
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

            {/* Form Subtitle Header */}
            <p
              style={{
                fontSize: '0.88rem',
                color: 'rgba(255, 255, 255, 0.65)',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {subtitle}
            </p>

            {/* FORM BODY WITH SMOOTH ANIMATION */}
            <div key={pathname} className="auth-form-anim">
              {children}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: FULL HEIGHT PROMINENT CHARACTER OVERLAY */}
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
              width: '520px',
              height: '520px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.15) 50%, transparent 75%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          {/* Character Container - Large, Eye level, Floating */}
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
                  filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 35px rgba(139, 92, 246, 0.4))',
                  transition: 'all 0.5s ease',
                }}
              />
            ) : (
              /* Fallback character showcase illustration if image not placed yet */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/hoshi.png"
                alt="VTuber Mascot Showcase"
                style={{
                  height: '100%',
                  width: 'auto',
                  maxHeight: '82vh',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 35px rgba(139, 92, 246, 0.4))',
                }}
              />
            )}

            {/* Floating Glass Stats / Community Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '20px',
                background: 'rgba(12, 8, 22, 0.85)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '20px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5), 0 0 25px rgba(139, 92, 246, 0.3)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981, #3B82F6)',
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
                <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.65)' }}>
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
