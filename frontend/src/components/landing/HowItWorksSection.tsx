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
        <div className="section-accent-line" style={{
          opacity: visibleSteps.size > 0 ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }} />
        <h2 className="section-title" style={{
          opacity: visibleSteps.size > 0 ? 1 : 0,
          transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          Cómo empezar
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
        }}>
          {STEPS.map((step, index) => {
            const isVisible = visibleSteps.has(index);
            return (
              <div
                key={index}
                className="step-card"
                data-index={index}
                style={{
                  padding: '36px 28px',
                  borderRadius: '14px',
                  background: isVisible ? 'var(--bg-card)' : 'rgba(255,255,255,0.01)',
                  border: isVisible ? '1px solid var(--glass-border)' : '1px solid transparent',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                {/* Step number */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: isVisible ? 'var(--primary-subtle)' : 'rgba(255,255,255,0.03)',
                  color: isVisible ? 'var(--primary)' : 'var(--text-muted)',
                  marginBottom: '20px',
                  transition: 'all 0.4s ease',
                }}>
                  {step.icon}
                </div>

                {/* Label */}
                <span style={{
                  display: 'inline-block',
                  padding: '2px 12px',
                  borderRadius: '12px',
                  background: isVisible ? 'rgba(230,57,70,0.06)' : 'rgba(255,255,255,0.02)',
                  color: isVisible ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  marginBottom: '12px',
                  transition: 'all 0.4s ease',
                }}>
                  Paso {step.number}
                </span>

                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'color 0.4s ease',
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
