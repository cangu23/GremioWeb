'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, subtitle }: AuthLayoutProps) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  // State to handle custom image fallbacks gracefully
  const [bgImage] = useState('/images/auth/bg.jpg');
  const [charImage] = useState('/images/auth/character.png');
  const [bgFailed, setBgFailed] = useState(false);
  const [charFailed, setCharFailed] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0814',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* 🌌 DYNAMIC BACKGROUND LAYER */}
      {!bgFailed ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.55) contrast(1.1) blur(1px)',
            transform: 'scale(1.02)',
            transition: 'all 0.5s ease',
            zIndex: 0,
          }}
          onError={() => setBgFailed(true)}
        />
      ) : (
        /* Fallback cosmic gradient background */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 75% 30%, rgba(139, 92, 246, 0.25) 0%, rgba(236, 72, 153, 0.15) 35%, #0a0814 80%)',
            zIndex: 0,
          }}
        />
      )}

      {/* Ambient Radial Lights & Glow Beams */}
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(124, 58, 237, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        className="auth-glow-pulse"
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(219, 39, 119, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          animationDelay: '-2s',
        }}
      />

      {/* Grid Pattern Overlay for Futuristic Aesthetic */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
          opacity: 0.6,
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
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${(i * 17) % 90 + 5}%`,
              left: `${(i * 23) % 90 + 5}%`,
              width: `${(i % 3) * 3 + 4}px`,
              height: `${(i % 3) * 3 + 4}px`,
              borderRadius: '50%',
              background: i % 2 === 0 ? '#A78BFA' : '#F472B6',
              boxShadow: i % 2 === 0 ? '0 0 10px #A78BFA' : '0 0 10px #F472B6',
              animation: `authParticleTwinkle ${3 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* 🚀 MAIN CONTENT CONTAINER (SPLIT SCREEN LAYOUT) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '32px',
          alignItems: 'center',
          minHeight: '85vh',
        }}
      >
        {/* ------------------------------------------------------------- */}
        {/* LEFT COLUMN: AUTH FORM PANEL (Glassmorphism Card)             */}
        {/* ------------------------------------------------------------- */}
        <div
          style={{
            gridColumn: 'span 12',
            maxWidth: '480px',
            width: '100%',
            margin: '0 auto',
            animation: 'authSlideInLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="lg:grid-col-5"
        >
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: '#fff',
                }}
              >
                ❖
              </div>
              <span
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  background: 'linear-gradient(135deg, #ffffff 30%, #A78BFA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textTransform: 'uppercase',
                }}
              >
                GREMIO ESTELAR
              </span>
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0 }}>
              {subtitle}
            </p>
          </div>

          {/* GLASS CARD FORM CONTAINER */}
          <div
            className="auth-glass-card"
            style={{
              borderRadius: '28px',
              padding: '36px 32px',
              position: 'relative',
              overflow: 'hidden',
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
                background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.8), transparent)',
              }}
            />

            {/* TAB TOGGLE: LOGIN / REGISTER */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '4px',
                borderRadius: '16px',
                marginBottom: '28px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Link
                href="/login"
                className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Registrarse
              </Link>
            </div>

            {/* FORM CHILDREN */}
            {children}
          </div>

          {/* Footer Copyright / Help Link */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            © {new Date().getFullYear()} Gremio Estelar • Todos los derechos reservados
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT COLUMN: HERO CHARACTER SHOWCASE (Animated Overlay)     */}
        {/* ------------------------------------------------------------- */}
        <div
          style={{
            gridColumn: 'span 12',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            animation: 'authSlideInRight 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="auth-hero-column"
        >
          {/* Outer Glowing Circle behind character */}
          <div
            className="auth-glow-pulse"
            style={{
              position: 'absolute',
              width: '420px',
              height: '420px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(236, 72, 153, 0.1) 60%, transparent 80%)',
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }}
          />

          {/* Floating Character Wrapper */}
          <div
            className="auth-character-anim"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              minHeight: '480px',
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
                  maxHeight: '520px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 25px rgba(139, 92, 246, 0.4))',
                  transition: 'all 0.5s ease',
                }}
              />
            ) : (
              /* Fallback character showcase illustration if image not placed yet */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/hoshi.png"
                alt="VTuber Mascot Showcase"
                onError={() => {
                  // Fallback
                }}
                style={{
                  maxHeight: '480px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 25px rgba(139, 92, 246, 0.4))',
                }}
              />
            )}

            {/* Floating Glass Stats / Community Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                background: 'rgba(15, 10, 25, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '14px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4), 0 0 20px rgba(139, 92, 246, 0.2)',
                animation: 'authCharacterFloat 8s ease-in-out infinite reverse',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff',
                }}
              >
                ✦
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                  Universo VTuber Estelar
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                  Gana experiencia, medallas y recompensas diarias
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Responsive Styles for Split Layout */}
      <style jsx>{`
        @media (min-width: 992px) {
          .lg\\:grid-col-5 {
            grid-column: span 5 !important;
          }
          .auth-hero-column {
            grid-column: span 7 !important;
          }
        }
        @media (max-width: 991px) {
          .auth-hero-column {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
