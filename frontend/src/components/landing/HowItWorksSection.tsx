'use client';

import { useEffect, useRef, useState } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Crea tu cuenta',
    description: 'Regístrate en segundos y configura tu perfil básico. Elige tu nombre de VTuber y empieza a construir tu presencia.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Configura tu personaje',
    description: 'Completa tu perfil VTuber con tu lore, modelos, enlaces a redes sociales, horario de streams y más. Hazlo tuyo.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M12 11l-2 3h4l-2 3" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Conecta y crece',
    description: 'Únete a gremios, participa en eventos, chatea con la comunidad y gana XP. Tu viaje comienza ahora.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
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
            }, index * 200);
          }
        }
      },
      { threshold: 0.3 }
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
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: visibleSteps.size > 0 ? 1 : 0,
          transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <span className="landing-eyebrow" style={{ marginBottom: '16px' }}>Primeros pasos</span>
        </div>
        <h2 className="section-title" style={{
          opacity: visibleSteps.size > 0 ? 1 : 0,
          transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.05s',
        }}>
          Cómo <span className="landing-gradient-text">empezar</span>
        </h2>
        <p className="section-subtitle" style={{
          opacity: visibleSteps.size > 0 ? 1 : 0,
          transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          En solo tres pasos puedes unirte a la comunidad y empezar a construir tu legado como creador
          de contenido virtual.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          position: 'relative',
        }}>
          {STEPS.map((step, index) => {
            const isVisible = visibleSteps.has(index);
            return (
              <div
                key={index}
                className="step-card"
                data-index={index}
                style={{
                  padding: '38px 28px 34px',
                  borderRadius: '18px',
                  background: isVisible
                    ? 'linear-gradient(170deg, rgba(30,30,35,0.7), rgba(22,22,26,0.5))'
                    : 'rgba(255,255,255,0.01)',
                  border: isVisible ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                {/* Connector line between steps (skip on last) */}
                {isVisible && index < STEPS.length - 1 && (
                  <div className="landing-step-connector" style={{
                    left: 'calc(50% + 32px)',
                    width: 'calc(100% - 64px)',
                    opacity: 0.5,
                  }} />
                )}

                {/* Big ghost number */}
                <span style={{
                  position: 'absolute', top: '2px', right: '14px',
                  fontSize: '3.4rem', fontWeight: 800, lineHeight: 1,
                  color: isVisible ? 'rgba(139,92,246,0.08)' : 'transparent',
                  transition: 'color 0.6s ease',
                  letterSpacing: '-0.03em',
                  pointerEvents: 'none',
                }}>
                  {step.number}
                </span>

                {/* Step icon with glow ring */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                  <div style={{
                    position: 'absolute', inset: '-8px', borderRadius: '18px',
                    background: isVisible ? 'radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%)' : 'transparent',
                    transition: 'opacity 0.5s ease',
                  }} />
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: isVisible
                      ? 'linear-gradient(135deg, var(--secondary), var(--primary))'
                      : 'rgba(255,255,255,0.03)',
                    color: isVisible ? '#fff' : 'var(--text-muted)',
                    position: 'relative',
                    boxShadow: isVisible ? '0 10px 30px rgba(139,92,246,0.35)' : 'none',
                    transition: 'all 0.5s ease',
                  }}>
                    {step.icon}
                  </div>
                </div>

                {/* Label */}
                <span style={{
                  display: 'inline-block',
                  padding: '3px 14px',
                  borderRadius: '50px',
                  background: isVisible ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                  color: isVisible ? 'var(--primary-hover)' : 'var(--text-muted)',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  border: isVisible ? '1px solid rgba(139,92,246,0.18)' : '1px solid transparent',
                  transition: 'all 0.4s ease',
                }}>
                  Paso {step.number}
                </span>

                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  marginBottom: '10px',
                  color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'color 0.4s ease',
                  letterSpacing: '-0.01em',
                }}>
                  {step.title}
                </h3>

                <p style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  maxWidth: '320px',
                  margin: '0 auto',
                }}>
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
