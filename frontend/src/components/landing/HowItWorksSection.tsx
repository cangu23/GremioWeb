'use client';

import { useEffect, useRef, useState } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Crea tu cuenta',
    description: 'Regístrate en segundos y configura tu perfil básico. Elige tu nombre de VTuber y empieza a construir tu presencia.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
    gradient: 'var(--primary)',
  },
  {
    number: '02',
    title: 'Configura tu personaje',
    description: 'Completa tu perfil VTuber con tu lore, modelos, enlaces a redes sociales, horario de streams y más. Hazlo tuyo.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M12 11l-2 3h4l-2 3" />
      </svg>
    ),
    gradient: 'var(--secondary)',
  },
  {
    number: '03',
    title: 'Conecta y crece',
    description: 'Únete a gremios, participa en eventos, chatea con la comunidad y gana XP. Tu viaje comienza ahora.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    gradient: 'var(--accent)',
  },
];

export default function HowItWorksSection() {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setTimeout(() => {
              setVisibleSteps((prev) => new Set(prev).add(index));
            }, index * 300);
          }
        }
      },
      { threshold: 0.4 }
    );

    const cards = sectionRef.current?.querySelectorAll('.step-card');
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section"
      id="how-it-works"
      style={{
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="container">
        <h2 className="section-title" style={{
          opacity: visibleSteps.size > 0 ? 1 : 0,
          transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          Cómo empezar
        </h2>
        <p className="section-subtitle" style={{
          opacity: visibleSteps.size > 0 ? 1 : 0,
          transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          En solo tres pasos puedes unirte a la comunidad y empezar a construir tu legado como creador
          de contenido virtual.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            position: 'relative',
          }}
        >
          {STEPS.map((step, index) => {
            const isVisible = visibleSteps.has(index);
            return (
              <div
                key={index}
                className="step-card"
                data-index={index}
                style={{
                  textAlign: 'center',
                  padding: '40px 24px',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateY(0)'
                    : 'translateY(40px)',
                  transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                  position: 'relative',
                }}
              >

                {/* Step number circle */}
                <div
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    background: isVisible
                      ? `radial-gradient(circle at 30% 30%, ${step.gradient}40, ${step.gradient}15)`
                      : 'rgba(255,255,255,0.03)',
                    border: isVisible
                      ? `2px solid ${step.gradient}50`
                      : '2px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    position: 'relative',
                    transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    color: isVisible ? step.gradient : 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    if (isVisible) {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.boxShadow = `0 0 40px ${step.gradient}30`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Glow ring */}
                  {isVisible && (
                    <div style={{
                      position: 'absolute',
                      inset: '-6px',
                      borderRadius: '50%',
                      border: `1px solid ${step.gradient}20`,
                      animation: 'glow-pulse 3s ease-in-out infinite',
                    }} />
                  )}
                  {isVisible ? step.icon : (
                    <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                      {step.number}
                    </span>
                  )}
                </div>

                {/* Step number label */}
                <div style={{
                  display: 'inline-block',
                  padding: '3px 14px',
                  borderRadius: '20px',
                  background: isVisible ? `${step.gradient}15` : 'rgba(255,255,255,0.03)',
                  color: isVisible ? step.gradient : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  transition: 'all 0.4s ease',
                }}>
                  Paso {step.number}
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    marginBottom: '12px',
                    color: isVisible ? 'var(--text)' : 'var(--text-muted)',
                    transition: 'color 0.4s ease',
                  }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    maxWidth: '320px',
                    margin: '0 auto',
                  }}
                >
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
