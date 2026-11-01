'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Sparkles, Zap } from '@/components/ui/Icons';

const STEPS = [
  {
    number: '01',
    title: 'Únete a la Comunidad',
    description:
      'Regístrate gratis en segundos como fan, artista o streamer. Configura tu perfil básico y descubre un espacio diseñado exclusivamente para la cultura virtual.',
    icon: <User size={24} color="#fff" />,
  },
  {
    number: '02',
    title: 'Configura tu Identidad',
    description:
      'Si eres VTuber, añade tu lore, modelo 2D/3D y canales de Twitch o YouTube para activar alertas en vivo. Si eres fan, personaliza tu avatar, marcos y títulos.',
    icon: <Sparkles size={24} color="#fff" />,
  },
  {
    number: '03',
    title: 'Participa, Apoya y Crece',
    description:
      'Gana Stardust gratuito al comentar y ver streams, únete a gremios, apoya a tus creadores favoritos con Códigos de Creador y desbloquea el Pase Estelar.',
    icon: <Zap size={24} color="#fff" />,
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
            }, index * 160);
          }
        }
      },
      { threshold: 0.25 }
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: visibleSteps.size > 0 ? 1 : 0,
            transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <span className="landing-eyebrow" style={{ marginBottom: '16px' }}>Primeros Pasos</span>
        </div>
        <h2
          className="section-title"
          style={{
            opacity: visibleSteps.size > 0 ? 1 : 0,
            transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.05s',
          }}
        >
          Cómo <span className="landing-gradient-text">funciona</span>
        </h2>
        <p
          className="section-subtitle"
          style={{
            opacity: visibleSteps.size > 0 ? 1 : 0,
            transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
          }}
        >
          Tanto si vienes a compartir tus transmisiones como creador o a apoyar como fan,
          en tres sencillos pasos formas parte del Gremio Estelar.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
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
                  <div
                    className="landing-step-connector"
                    style={{
                      left: 'calc(50% + 32px)',
                      width: 'calc(100% - 64px)',
                      opacity: 0.5,
                    }}
                  />
                )}

                {/* Big ghost number */}
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '14px',
                    fontSize: '3.4rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: isVisible ? 'rgba(139,92,246,0.08)' : 'transparent',
                    transition: 'color 0.6s ease',
                    letterSpacing: '-0.03em',
                    pointerEvents: 'none',
                  }}
                >
                  {step.number}
                </span>

                {/* Step icon with glow ring */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-8px',
                      borderRadius: '18px',
                      background: isVisible
                        ? 'radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%)'
                        : 'transparent',
                      transition: 'opacity 0.5s ease',
                    }}
                  />
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: isVisible
                        ? 'linear-gradient(135deg, var(--secondary), var(--primary))'
                        : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      position: 'relative',
                      boxShadow: isVisible ? '0 10px 30px rgba(139,92,246,0.35)' : 'none',
                      transition: 'all 0.5s ease',
                    }}
                  >
                    {step.icon}
                  </div>
                </div>

                {/* Label */}
                <span
                  style={{
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
                  }}
                >
                  Paso {step.number}
                </span>

                <h3
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'color 0.4s ease',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.88rem',
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
