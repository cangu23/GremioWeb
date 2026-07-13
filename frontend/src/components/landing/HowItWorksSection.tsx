'use client';

import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'Crea tu cuenta',
    description:
      'Regístrate en segundos y configura tu perfil básico. Elige tu nombre de VTuber y empieza a construir tu presencia.',
    icon: '01',
  },
  {
    number: '02',
    title: 'Configura tu personaje',
    description:
      'Completa tu perfil VTuber con tu lore, modelos, enlaces a redes sociales, horario de streams y más. Hazlo tuyo.',
    icon: '02',
  },
  {
    number: '03',
    title: 'Conecta y crece',
    description:
      'Únete a gremios, participa en eventos, chatea con la comunidad y gana XP. Tu viaje comienza ahora.',
    icon: '03',
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
      style={{
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="container">
        <h2 className="section-title">Cómo empezar</h2>
        <p className="section-subtitle">
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
          {/* Connecting line (desktop) */}
          <div
            className="step-line"
            style={{
              position: 'absolute',
              top: '60px',
              left: 'calc(16.67% + 40px)',
              right: 'calc(16.67% + 40px)',
              height: '2px',
              background:
                'linear-gradient(90deg, var(--primary), var(--secondary), var(--accent))',
              opacity: 0.3,
              display: 'none',
            }}
          />

          {steps.map((step, index) => (
            <div
              key={index}
              className="step-card"
              data-index={index}
              style={{
                textAlign: 'center',
                padding: '40px 24px',
                opacity: visibleSteps.has(index) ? 1 : 0,
                transform: visibleSteps.has(index)
                  ? 'translateY(0)'
                  : 'translateY(40px)',
                transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* Number */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgba(138,43,226,0.2), rgba(255,0,127,0.1))',
                  border: '2px solid rgba(138,43,226,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(138,43,226,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {step.number}
              </div>

              {/* Icon */}
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{step.icon}</div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: 'var(--text)',
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
          ))}
        </div>
      </div>
    </section>
  );
}
