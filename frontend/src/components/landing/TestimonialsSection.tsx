'use client';

import { useEffect, useRef, useState } from 'react';
import { useParallaxChildren } from '@/lib/useScrollParallax';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatarInitial: string;
  gradient: string;
  icon: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Gremio Estelar me ha permitido conectar con otros VTubers de una forma que nunca había experimentado. La comunidad es increíblemente acogedora.',
    author: 'Luna Starweaver',
    role: 'VTuber desde 2024',
    avatarInitial: 'L',
    gradient: 'linear-gradient(135deg, #8a2be2, #6a1cb0)',
    icon: '🌙',
  },
  {
    quote: 'La plataforma tiene todo lo que necesito: perfil personalizado, eventos, gremios... y encima es gratis. ¡No hay nada igual!',
    author: 'Kira Nightshade',
    role: 'Creadora de contenido',
    avatarInitial: 'K',
    gradient: 'linear-gradient(135deg, #ff007f, #cc0066)',
    icon: '⭐',
  },
  {
    quote: 'Los eventos colaborativos son mi parte favorita. Pude organizar un stream conjunto con 5 VTubers diferentes en un solo clic.',
    author: 'Ryo Thunderbolt',
    role: 'Miembro del Gremio Dragón',
    avatarInitial: 'R',
    gradient: 'linear-gradient(135deg, #00d4ff, #0099cc)',
    icon: '⚡',
  },
  {
    quote: 'El sistema de gamificación me mantiene motivada. Subir de nivel y desbloquear logros mientras hago lo que amo es genial.',
    author: 'Mochi Paws',
    role: 'VTuber desde 2025',
    avatarInitial: 'M',
    gradient: 'linear-gradient(135deg, #f5af19, #f12711)',
    icon: '🌸',
  },
  {
    quote: 'Lo que más valoro es el soporte y la moderación. Se nota que hay un equipo que se preocupa por mantener un espacio seguro para todos.',
    author: 'Aria Moonshadow',
    role: 'Streamer Afiliada',
    avatarInitial: 'A',
    gradient: 'linear-gradient(135deg, #e040fb, #7c4dff)',
    icon: '✨',
  },
];

export default function TestimonialsSection() {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useParallaxChildren(sectionRef);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!visible || isPaused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, isPaused]);

  const goTo = (index: number) => {
    setActiveIndex(index);
  };

  const prev = () => {
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[activeIndex];

  return (
    <section
      ref={sectionRef}
      className="section"
      id="testimonials"
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,0,127,0.02) 50%, transparent 100%)',
      }}
    >
      {/* Decorative blobs (with parallax) */}
      <div data-parallax-speed="-0.1" style={{
        position: 'absolute', top: '10%', left: '5%',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(138,43,226,0.06), transparent 70%)',
        pointerEvents: 'none', zIndex: -1, willChange: 'transform',
      }} />
      <div data-parallax-speed="-0.07" style={{
        position: 'absolute', bottom: '20%', right: '10%',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.05), transparent 70%)',
        pointerEvents: 'none', zIndex: -1, willChange: 'transform',
      }} />

      <div className="container">
        <h2 className="section-title" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          Lo que dicen de nosotros
        </h2>
        <p className="section-subtitle" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          Esto es lo que los miembros de nuestra comunidad tienen que decir sobre Gremio Estelar
        </p>

        {/* Testimonials Carousel */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            maxWidth: '700px',
            margin: '0 auto',
            position: 'relative',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
          }}
        >
          {/* Main card */}
          <div
            className="glass"
            style={{
              padding: '48px 40px',
              borderRadius: '24px',
              textAlign: 'center',
              position: 'relative',
              border: `1px solid rgba(138,43,226,0.15)`,
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
              minHeight: '320px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Quote icon */}
            <div style={{
              fontSize: '3rem',
              lineHeight: 1,
              marginBottom: '16px',
              opacity: 0.3,
              color: 'var(--primary)',
              fontFamily: 'Georgia, serif',
            }}>
              &ldquo;
            </div>

            {/* Quote text */}
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              lineHeight: 1.8,
              color: 'var(--text)',
              marginBottom: '32px',
              maxWidth: '560px',
              fontStyle: 'italic',
              transition: 'all 0.3s ease',
            }}>
              {current.quote}
            </p>

            {/* Author */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}>
              {/* Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: current.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.1rem',
                boxShadow: `0 0 20px ${current.gradient}40`,
              }}>
                {current.avatarInitial}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {current.author}
                  <span style={{ fontSize: '1rem' }}>{current.icon}</span>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}>
                  {current.role}
                </div>
              </div>
            </div>

            {/* Decorative gradient line */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '20%',
              right: '20%',
              height: '2px',
              background: current.gradient,
              borderRadius: '1px',
              opacity: 0.4,
            }} />
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            style={{
              position: 'absolute',
              top: '50%',
              left: '-20px',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(138,43,226,0.15)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--glass-bg)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Anterior testimonio"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={next}
            style={{
              position: 'absolute',
              top: '50%',
              right: '-20px',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(138,43,226,0.15)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--glass-bg)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Siguiente testimonio"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Dots */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginTop: '24px',
          }}>
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                style={{
                  width: index === activeIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: index === activeIndex
                    ? 'linear-gradient(90deg, var(--primary), var(--secondary))'
                    : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                aria-label={`Ir al testimonio ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
