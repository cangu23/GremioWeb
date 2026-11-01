'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Sparkles, Zap } from '@/components/ui/Icons';

const PILLARS = [
  {
    code: '01',
    kanji: '創造',
    title: 'Creación de Identidad & Lore',
    sub: 'CREATIVE & CHARACTER',
    description:
      'Diseñado para dar vida a personajes virtuales 2D y 3D. Perfiles oficiales con historia, modelo, horarios de directos y portafolio de arte en un espacio propio.',
    icon: <User size={24} color="#a78bfa" />,
    badgeColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  {
    code: '02',
    kanji: '配信',
    title: 'Transmisión & Escenarios en Vivo',
    sub: 'LIVE BROADCAST & SYNC',
    description:
      'Sincronización automática con Twitch y YouTube. Tu comunidad sabe al instante cuándo inicias directo directamente desde la portada y salas temáticas.',
    icon: <Sparkles size={24} color="#38bdf8" />,
    badgeColor: 'rgba(56,189,248,0.15)',
    borderColor: 'rgba(56,189,248,0.3)',
  },
  {
    code: '03',
    kanji: '経済',
    title: 'Economía Justa & Pase Estelar',
    sub: 'CREATOR ECONOMY & PASS',
    description:
      'Monetización directa con 35% de comisión para creadores mediante Códigos de Creador, Pase Estelar de temporada y Stardust 100% gratuito para la comunidad.',
    icon: <Zap size={24} color="#f59e0b" />,
    badgeColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.3)',
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
            }, index * 140);
          }
        }
      },
      { threshold: 0.2 }
    );

    const cards = sectionRef.current?.querySelectorAll('.step-card');
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section"
      id="concept"
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        {/* Section Header with LeFolk Bilingual Style */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            opacity: visibleSteps.size > 0 ? 1 : 0,
            transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            marginBottom: '42px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="landing-eyebrow">
              CONCEPT // コンセプト
            </span>
          </div>

          <h2
            className="section-title"
            style={{
              opacity: visibleSteps.size > 0 ? 1 : 0,
              transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.05s',
              maxWidth: '740px',
            }}
          >
            Nuestra Filosofía y <span className="landing-gradient-text">Propósito</span>
          </h2>
          <p
            className="section-subtitle"
            style={{
              opacity: visibleSteps.size > 0 ? 1 : 0,
              transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            Nacimos con la misión de impulsar a talentos virtuales y creadores en español.
            Uniendo el espíritu de las agencias de VTubers con una comunidad abierta, participativa y transparente.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '24px',
            position: 'relative',
          }}
        >
          {PILLARS.map((pillar, index) => {
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
                    ? 'linear-gradient(170deg, rgba(22,22,30,0.85), rgba(16,16,22,0.95))'
                    : 'rgba(255,255,255,0.01)',
                  border: isVisible ? `1px solid ${pillar.borderColor}` : '1px solid transparent',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isVisible ? '0 16px 40px rgba(0,0,0,0.35)' : 'none',
                }}
              >
                {/* Kanji Ghost Watermark in Background */}
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '12px',
                    fontSize: '4.5rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: isVisible ? 'rgba(255,255,255,0.03)' : 'transparent',
                    transition: 'color 0.6s ease',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    fontFamily: '"Noto Sans JP", sans-serif',
                  }}
                >
                  {pillar.kanji}
                </span>

                {/* Top header: Code & Subtitle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: pillar.badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${pillar.borderColor}`,
                    }}
                  >
                    {pillar.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.12em',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    // {pillar.code}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '0.68rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--primary-hover)',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  {pillar.sub}
                </div>

                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    marginBottom: '12px',
                    color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'color 0.4s ease',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {pillar.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
