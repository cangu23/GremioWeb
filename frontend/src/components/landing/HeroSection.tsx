'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const TITLE_PARTS = [
  { text: 'El', delay: 0 },
  { text: 'Hogar', delay: 0.15 },
  { text: 'de los', delay: 0.3 },
  { text: 'VTubers', delay: 0.45, highlight: true },
];

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: 'calc(100vh - 80px)',
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
      {/* Decorative background glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(138,43,226,0.15) 0%, rgba(255,0,127,0.08) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.8s ease 0.05s forwards' : 'none',
          marginBottom: '24px',
        }}
      >
        <img
          src="/logo.png"
          alt="Gremio Estelar"
          style={{
            height: '100px',
            width: 'auto',
            filter: 'drop-shadow(0 0 20px rgba(138,43,226,0.3))',
          }}
        />
      </div>

      {/* Badge */}
      <div
        className={`glass ${visible ? 'animate-fade-in' : ''}`}
        style={{
          padding: '8px 20px',
          borderRadius: '50px',
          fontSize: '0.85rem',
          color: 'var(--accent)',
          marginBottom: '32px',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          background: 'rgba(0, 212, 255, 0.05)',
          opacity: 0,
          animationDelay: '0.1s',
          animationFillMode: 'forwards',
        }}
      >
        ✦ Comunidad para Creadores de Contenido Virtual
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '24px',
          letterSpacing: '-0.03em',
        }}
      >
        {TITLE_PARTS.map((part, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: 0,
              transform: 'translateY(30px)',
              animation: visible ? `fadeInUp 0.6s ease ${part.delay}s forwards` : 'none',
              marginRight: '0.25em',
              background: part.highlight
                ? 'linear-gradient(135deg, var(--primary), var(--secondary), var(--accent))'
                : 'none',
              WebkitBackgroundClip: part.highlight ? 'text' : 'unset',
              WebkitTextFillColor: part.highlight ? 'transparent' : 'unset',
              backgroundClip: part.highlight ? 'text' : 'unset',
            }}
          >
            {part.text}
          </span>
        ))}
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          marginBottom: '48px',
          lineHeight: 1.8,
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.7s forwards' : 'none',
        }}
      >
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>Gremio Estelar</span> es la plataforma
        definitiva para conectar creadores de contenido virtual. Gestiona tu perfil, muestra tu
        personalidad, organiza eventos y haz crecer tu comunidad en un solo lugar.
      </p>

      {/* CTA Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.9s forwards' : 'none',
        }}
      >
        <Link
          href="/register"
          className="btn"
          style={{
            padding: '18px 36px',
            fontSize: '1.1rem',
            fontWeight: 700,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            boxShadow: '0 0 30px rgba(138,43,226,0.3)',
          }}
        >
          ✦ Unirse al Gremio
        </Link>
        <Link
          href="/login"
          className="btn btn-outline"
          style={{
            padding: '18px 36px',
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: '12px',
          }}
        >
          Ya soy miembro
        </Link>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          opacity: 0,
          animation: visible ? 'fadeIn 0.6s ease 1.3s forwards' : 'none',
        }}
      >
        <span>Descubre más</span>
        <div
          className="animate-float"
          style={{
            width: '24px',
            height: '36px',
            border: '2px solid var(--text-muted)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px',
          }}
        >
          <div
            className="animate-pulse-slow"
            style={{
              width: '3px',
              height: '10px',
              background: 'var(--primary)',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>
    </section>
  );
}
