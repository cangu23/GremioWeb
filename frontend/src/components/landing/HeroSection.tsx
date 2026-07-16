'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';

export default function HeroSection() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Subtle background texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(139,92,246,0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(108,180,238,0.02) 0%, transparent 50%)',
        pointerEvents: 'none', zIndex: -1,
      }} />

      {/* Thin red accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '80px', height: '2px',
        background: 'var(--primary)',
        opacity: visible ? 0.6 : 0,
        transition: 'opacity 0.8s ease',
      }} />

      {/* Logo */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.1s forwards' : 'none',
          marginBottom: '24px',
        }}
      >
        <Image
          src="/logo.png"
          alt="Gremio Estelar"
          width={0}
          height={0}
          sizes="100vw"
          style={{
            height: '80px',
            width: 'auto',
            opacity: 0.9,
          }}
        />
      </div>

      {/* Tagline badge */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.2s forwards' : 'none',
          marginBottom: '20px',
        }}
      >
        <span style={{
          display: 'inline-block',
          padding: '5px 16px',
          borderRadius: '20px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--primary)',
          background: 'var(--primary-subtle)',
          border: '1px solid rgba(139,92,246,0.2)',
          letterSpacing: '0.03em',
        }}>
          ✦ Comunidad para Creadores Virtuales
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.3s forwards' : 'none',
          fontSize: 'clamp(2.2rem, 7vw, 4.5rem)',
          fontWeight: 700,
          lineHeight: 1.08,
          marginBottom: '16px',
          letterSpacing: '-0.03em',
          maxWidth: '800px',
        }}
      >
        El{' '}
        <span style={{ color: 'var(--primary)' }}>Hogar</span>{' '}
        de los{' '}
        <span style={{
          background: 'linear-gradient(135deg, var(--primary), var(--warm))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          VTubers
        </span>
      </h1>

      {/* Subtitle */}
      <p
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.4s forwards' : 'none',
          fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
          color: 'var(--text-muted)',
          maxWidth: '600px',
          lineHeight: 1.7,
          marginBottom: '36px',
        }}
      >
        La plataforma definitiva para creadores de contenido virtual. Gestiona tu perfil, 
        organiza eventos y haz crecer tu comunidad en un solo lugar.
      </p>

      {/* CTA Buttons */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.5s forwards' : 'none',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {user ? (
          <>
            <Link href="/dashboard" className="btn btn--lg">
              Ir al Dashboard
            </Link>
            <Link href="/vtubers" className="btn btn--outline btn--lg">
              Explorar VTubers
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="btn btn--lg">
              ✦ Unirse al Gremio
            </Link>
            <Link href="/login" className="btn btn--outline btn--lg">
              Ya soy miembro
            </Link>
          </>
        )}
      </div>

      {/* Bottom accent stats */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.7s forwards' : 'none',
          display: 'flex',
          gap: '28px',
          alignItems: 'center',
          marginTop: '48px',
        }}
      >
        {[
          { label: 'VTubers', sub: 'Registrados' },
          { label: 'Eventos', sub: 'Colaborativos' },
          { label: 'Comunidad', sub: 'Activa' },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
            {i > 0 && (
              <div style={{
                position: 'absolute',
                left: '-14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1px',
                height: '20px',
                background: 'var(--glass-border)',
              }} />
            )}
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
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
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Descubre más
        </span>
        <div style={{
          width: '16px', height: '26px',
          border: '1.5px solid rgba(255,255,255,0.1)',
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
