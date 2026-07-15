'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';

const TITLE_PARTS = [
  { text: 'El', delay: 0 },
  { text: 'Hogar', delay: 0.12 },
  { text: 'de los', delay: 0.24 },
  { text: 'VTubers', delay: 0.36, highlight: true },
];

const SUBTITLE_TEXT = 'La plataforma definitiva para creadores de contenido virtual. Gestiona tu perfil, muestra tu personalidad, organiza eventos y haz crecer tu comunidad en un solo lugar.';

const generateStars = () => {
  const arr: { x: number; y: number; size: number; delay: number; duration: number }[] = [];
  for (let i = 0; i < 80; i++) {
    arr.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    });
  }
  return arr;
};
const STARS = generateStars();

const COMETS = [
  { top: '15%', delay: 0, duration: 4 },
  { top: '45%', delay: 3, duration: 5 },
  { top: '70%', delay: 7, duration: 4.5 },
];

// Floating background shapes (reduced count for cleaner look)
const FLOATING_SHAPES = [
  { type: 'circle', size: 60, x: '15%', y: '20%', duration: 20, delay: 0, color: 'rgba(138,43,226,0.08)' },
  { type: 'square', size: 40, x: '80%', y: '30%', duration: 25, delay: 2, color: 'rgba(255,0,127,0.06)' },
  { type: 'circle', size: 30, x: '25%', y: '70%', duration: 22, delay: 1, color: 'rgba(138,43,226,0.05)' },
  { type: 'circle', size: 80, x: '50%', y: '75%', duration: 30, delay: 0, color: 'rgba(255,0,127,0.03)' },
];

export default function HeroSection() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const typeIndexRef = useRef(0);

  useEffect(() => {
    setVisible(true);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      if (typeIndexRef.current < SUBTITLE_TEXT.length) {
        setTypedText(SUBTITLE_TEXT.slice(0, typeIndexRef.current + 1));
        typeIndexRef.current++;
      } else {
        clearInterval(interval);
        setShowCursor(false);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [visible]);

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
      {/* ===== STARFIELD BACKGROUND ===== */}
      {STARS.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: star.size > 2.5
              ? 'radial-gradient(circle, rgba(255,255,255,0.8), rgba(138,43,226,0.3))'
              : 'rgba(255,255,255,0.6)',
            boxShadow: star.size > 2.5 ? '0 0 6px rgba(138,43,226,0.4), 0 0 12px rgba(138,43,226,0.2)' : 'none',
            pointerEvents: 'none',
            zIndex: 0,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            opacity: 0.2,
          }}
        />
      ))}

      {/* ===== COMETS ===== */}
      {COMETS.map((comet, i) => (
        <div
          key={`comet-${i}`}
          style={{
            position: 'absolute',
            top: comet.top,
            left: '-100px',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.8), rgba(138,43,226,0.6))',
            boxShadow: '0 0 4px rgba(138,43,226,0.3), 0 0 8px rgba(138,43,226,0.1)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: `comet ${comet.duration}s linear ${comet.delay}s infinite`,
            opacity: 0,
          }}
        >
          {/* Comet tail */}
          <div style={{
            position: 'absolute',
            top: '-1px',
            right: '2px',
            width: '80px',
            height: '2px',
            background: 'linear-gradient(to left, rgba(138,43,226,0.4), transparent)',
            borderRadius: '1px',
          }} />
        </div>
      ))}

      {/* ===== DECORATIVE GRID OVERLAY ===== */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.4,
      }} />

      {/* ===== MAIN GLOW (with mouse parallax) ===== */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.12) 0%, rgba(255,0,127,0.06) 30%, rgba(0,212,255,0.03) 50%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
          willChange: 'transform',
        }}
      />

      {/* ===== FLOATING SHAPES ===== */}
      {FLOATING_SHAPES.map((shape, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: shape.x,
            top: shape.y,
            width: shape.type === 'circle' ? shape.size : shape.size,
            height: shape.size,
            borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'square' ? '6px' : '0',
            background: shape.color,
            border: shape.type === 'square' ? `1px solid ${shape.color.replace('0.0', '0.1')}` : 'none',
            pointerEvents: 'none',
            zIndex: 0,
            animation: `floatShape ${shape.duration}s ease-in-out ${shape.delay}s infinite`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* ===== TOP BADGE ROW ===== */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: '28px',
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
            animation: visible ? 'glow-pulse 3s ease-in-out infinite' : 'none',
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
          marginBottom: '20px',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.12), transparent 70%)',
          animation: 'glow-pulse 3s ease-in-out infinite 0.5s',
          pointerEvents: 'none',
        }} />
        <Image
          src="/logo.png"
          alt="Gremio Estelar"
          width={0}
          height={0}
          sizes="100vw"
          style={{
            height: '90px',
            width: 'auto',
            filter: 'drop-shadow(0 0 40px rgba(138,43,226,0.5))',
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
          marginBottom: '16px',
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

      {/* ===== TYPEWRITER DESCRIPTION ===== */}
      <div
        style={{
          fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          marginBottom: '40px',
          lineHeight: 1.8,
          minHeight: '3.6em',
          opacity: 0,
          animation: visible ? 'fadeIn 0.4s ease 0.5s forwards' : 'none',
        }}
      >
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>Gremio Estelar</span>
        <span> </span>
        {typedText}
        {showCursor && (
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '1.2em',
              background: 'var(--primary)',
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
              animation: 'typewriter-cursor 0.8s step-end infinite',
            }}
          />
        )}
      </div>

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
        {user ? (
          <>
            <Link
              href="/dashboard"
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
              Ir al Dashboard
            </Link>
            <Link
              href="/vtubers"
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
              Explorar VTubers
            </Link>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* ===== MINI STAT TICKER ===== */}
      <div
        style={{
          display: 'flex',
          gap: '32px',
          alignItems: 'center',
          marginTop: '48px',
          opacity: 0,
          animation: visible ? 'fadeIn 0.6s ease 1.4s forwards' : 'none',
        }}
      >
        {[
          { value: 'Comunidad', label: 'Activa' },
          { value: 'VTubers', label: 'Registrados' },
          { value: 'Eventos', label: 'Colaborativos' },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
            {i > 0 && (
              <div style={{
                position: 'absolute',
                left: '-16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1px',
                height: '24px',
                background: 'rgba(255,255,255,0.08)',
              }} />
            )}
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* ===== SCROLL INDICATOR ===== */}
      <div
        style={{
          position: 'absolute',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          opacity: 0,
          animation: visible ? 'fadeIn 0.6s ease 1.6s forwards' : 'none',
        }}
      >
        <span style={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
          Descubre más
        </span>
        <div
          style={{
            width: '18px',
            height: '28px',
            border: '2px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '5px',
            animation: 'float 2s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: '2px',
              height: '7px',
              background: 'var(--primary)',
              borderRadius: '2px',
              animation: 'scrollDot 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* ===== KEYFRAMES ===== */}
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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes scrollDot {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.3; transform: translateY(5px); }
        }
      `}</style>
    </section>
  );
}
