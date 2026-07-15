'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const TITLE_PARTS = [
  { text: 'El', delay: 0 },
  { text: 'Hogar', delay: 0.12 },
  { text: 'de los', delay: 0.24 },
  { text: 'VTubers', delay: 0.36, highlight: true },
];

// Floating background shapes
const FLOATING_SHAPES = [
  { type: 'circle', size: 60, x: '15%', y: '20%', duration: 20, delay: 0, color: 'rgba(138,43,226,0.08)' },
  { type: 'square', size: 40, x: '80%', y: '30%', duration: 25, delay: 2, color: 'rgba(255,0,127,0.06)' },
  { type: 'triangle', size: 50, x: '65%', y: '60%', duration: 18, delay: 4, color: 'rgba(0,212,255,0.06)' },
  { type: 'circle', size: 30, x: '25%', y: '70%', duration: 22, delay: 1, color: 'rgba(138,43,226,0.05)' },
  { type: 'square', size: 70, x: '45%', y: '15%', duration: 28, delay: 3, color: 'rgba(255,0,127,0.04)' },
  { type: 'circle', size: 20, x: '90%', y: '50%', duration: 15, delay: 5, color: 'rgba(0,212,255,0.08)' },
  { type: 'square', size: 45, x: '10%', y: '45%', duration: 24, delay: 2, color: 'rgba(138,43,226,0.06)' },
  { type: 'circle', size: 80, x: '50%', y: '75%', duration: 30, delay: 0, color: 'rgba(255,0,127,0.03)' },
];

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setVisible(true);
  }, []);

  // Smooth mouse parallax effect for the background glow
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  }, []);

  useEffect(() => {
    if (!glowRef.current) return;
    const glow = glowRef.current;
    const animate = () => {
      const x = mousePos.x * 30;
      const y = mousePos.y * 30;
      glow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mousePos]);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
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
        overflow: 'hidden',
      }}
    >
      {/* ===== DECORATIVE GRID OVERLAY ===== */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.5,
      }} />

      {/* ===== MAIN GLOW (with mouse parallax) ===== */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.15) 0%, rgba(255,0,127,0.08) 30%, rgba(0,212,255,0.04) 50%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
          transition: 'width 0.5s ease, height 0.5s ease',
          willChange: 'transform',
        }}
      />

      {/* ===== SECONDARY GLOW (static orbital) ===== */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '20%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%)',
        pointerEvents: 'none',
        zIndex: -1,
        animation: 'floatOrb 12s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,0,127,0.05), transparent 70%)',
        pointerEvents: 'none',
        zIndex: -1,
        animation: 'floatOrb 15s ease-in-out infinite 3s',
      }} />

      {/* ===== FLOATING SHAPES ===== */}
      {FLOATING_SHAPES.map((shape, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: shape.x,
            top: shape.y,
            width: shape.type === 'circle' ? shape.size : shape.type === 'triangle' ? 0 : shape.size,
            height: shape.type === 'triangle' ? 0 : shape.size,
            borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'square' ? '6px' : '0',
            background: shape.color,
            border: shape.type === 'square' ? `1px solid ${shape.color.replace('0.0', '0.1')}` : 'none',
            pointerEvents: 'none',
            zIndex: 0,
            animation: `floatShape ${shape.duration}s ease-in-out ${shape.delay}s infinite`,
            opacity: 0.6,
            transform: shape.type === 'triangle'
              ? 'rotate(0deg)'
              : 'none',
          }}
        >
          {shape.type === 'triangle' && (
            <svg width={shape.size} height={shape.size} viewBox="0 0 50 50" style={{ position: 'absolute', top: '-25px', left: '-25px' }}>
              <polygon points="25,0 50,50 0,50" fill={shape.color} stroke={shape.color.replace('0.0', '0.12')} strokeWidth="1" />
            </svg>
          )}
        </div>
      ))}

      {/* ===== TOP BADGE ROW ===== */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: '32px',
        opacity: 0,
        animation: visible ? 'fadeInUp 0.6s ease 0.05s forwards' : 'none',
      }}>
        <div
          className="glass"
          style={{
            padding: '8px 20px',
            borderRadius: '50px',
            fontSize: '0.85rem',
            color: 'var(--accent)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            background: 'rgba(0, 212, 255, 0.05)',
            animation: visible ? 'pulseGlow 3s ease-in-out infinite' : 'none',
          }}
        >
          ✦ Comunidad para Creadores de Contenido Virtual
        </div>
      </div>

      {/* ===== LOGO ===== */}
      <div
        style={{
          opacity: 0,
          animation: visible ? 'fadeInUp 0.8s ease 0.1s forwards' : 'none',
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        {/* Logo glow ring */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.15), transparent 70%)',
          animation: 'pulseGlow 3s ease-in-out infinite 0.5s',
          pointerEvents: 'none',
        }} />
        <Image
          src="/logo.png"
          alt="Gremio Estelar"
          width={0}
          height={0}
          sizes="100vw"
          style={{
            height: '100px',
            width: 'auto',
            filter: 'drop-shadow(0 0 30px rgba(138,43,226,0.4))',
            position: 'relative',
            zIndex: 1,
          }}
        />
      </div>

      {/* ===== TITLE ===== */}
      <h1
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '20px',
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
              marginRight: '0.2em',
              background: part.highlight
                ? 'linear-gradient(135deg, var(--primary), var(--secondary), var(--accent))'
                : 'none',
              WebkitBackgroundClip: part.highlight ? 'text' : 'unset',
              WebkitTextFillColor: part.highlight ? 'transparent' : 'unset',
              backgroundClip: part.highlight ? 'text' : 'unset',
              backgroundSize: part.highlight ? '200% 200%' : 'unset',
              animation: visible
                ? `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${part.delay}s forwards${part.highlight ? ', gradientShift 4s ease-in-out infinite' : ''}`
                : 'none',
            }}
          >
            {part.text}
          </span>
        ))}
      </h1>

      {/* ===== DESCRIPTION ===== */}
      <p
        style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          marginBottom: '48px',
          lineHeight: 1.8,
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.6s forwards' : 'none',
        }}
      >
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>Gremio Estelar</span> es la plataforma
        definitiva para conectar creadores de contenido virtual. Gestiona tu perfil, muestra tu
        personalidad, organiza eventos y haz crecer tu comunidad en un solo lugar.
      </p>

      {/* ===== CTA BUTTONS ===== */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          opacity: 0,
          animation: visible ? 'fadeInUp 0.6s ease 0.8s forwards' : 'none',
        }}
      >
        <Link
          href="/register"
          className="btn"
          style={{
            padding: '18px 36px',
            fontSize: '1.1rem',
            fontWeight: 700,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            boxShadow: '0 0 30px rgba(138,43,226,0.3)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 0 50px rgba(138,43,226,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(138,43,226,0.3)';
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
            borderRadius: '14px',
            border: '2px solid var(--glass-border)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.background = 'rgba(138,43,226,0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Ya soy miembro
        </Link>
      </div>

      {/* ===== SCROLL INDICATOR ===== */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          opacity: 0,
          animation: visible ? 'fadeIn 0.6s ease 1.2s forwards' : 'none',
        }}
      >
        <span style={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
          Descubre más
        </span>
        <div
          style={{
            width: '20px',
            height: '32px',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px',
            animation: 'float 2s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: '2px',
              height: '8px',
              background: 'var(--primary)',
              borderRadius: '2px',
              animation: 'scrollDot 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* ===== KEYFRAMES (injected via style tag) ===== */}
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -20px); }
          50% { transform: translate(-20px, -40px); }
          75% { transform: translate(-40px, 10px); }
        }
        @keyframes floatShape {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          25% { transform: translateY(-30px) rotate(90deg); opacity: 0.8; }
          50% { transform: translateY(-60px) rotate(180deg); opacity: 0.4; }
          75% { transform: translateY(-30px) rotate(270deg); opacity: 0.7; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes scrollDot {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.3; transform: translateY(6px); }
        }
      `}</style>
    </section>
  );
}
