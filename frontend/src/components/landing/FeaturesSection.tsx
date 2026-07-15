'use client';

import { useEffect, useRef, useState } from 'react';
import { useParallaxChildren } from '@/lib/useScrollParallax';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

const FEATURES: Feature[] = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M12 11l-2 3h4l-2 3" />
      </svg>
    ),
    title: 'Perfiles VTuber',
    description: 'Crea un perfil único con tu personaje. Añade lore, modelo Live2D o 3D, enlaces a tus redes, horario de streams y más.',
    gradient: 'linear-gradient(135deg, #8a2be2, #6a1cb0)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="12" cy="15" r="1" />
        <circle cx="16" cy="15" r="1" />
        <circle cx="8" cy="15" r="1" />
      </svg>
    ),
    title: 'Eventos',
    description: 'Organiza y descubre eventos de la comunidad. Desde colaboraciones hasta streams especiales, con RSVP y notificaciones.',
    gradient: 'linear-gradient(135deg, #ff007f, #cc0066)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Gremios',
    description: 'Forma o únete a gremios de VTubers. Colabora, comparte recursos y construye una comunidad alrededor de tu grupo.',
    gradient: 'linear-gradient(135deg, #00d4ff, #0099cc)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
    title: 'Chat en Vivo',
    description: 'Chatea con la comunidad en tiempo real con Socket.IO. Salas globales, mensajes directos y estado de escritura.',
    gradient: 'linear-gradient(135deg, #ff6b35, #e0552a)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        <line x1="12" y1="6" x2="12" y2="12" />
        <line x1="12" y1="12" x2="15" y2="14" />
      </svg>
    ),
    title: 'Gamificación',
    description: 'Gana XP, sube de nivel, desbloquea logros y compite en el ranking. Cada interacción te acerca a la cima.',
    gradient: 'linear-gradient(135deg, #f5af19, #f12711)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
        <path d="M12 2v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M19.07 4.93l-2.83 2.83" />
      </svg>
    ),
    title: 'Apoyo y Monetización',
    description: 'Recibe donaciones y suscripciones de tus seguidores. Niveles de suscripción con beneficios exclusivos.',
    gradient: 'linear-gradient(135deg, #e040fb, #7c4dff)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    title: 'Feed Social',
    description: 'Publica actualizaciones, comparte medios, crea encuestas. Comenta y reacciona a las publicaciones de otros.',
    gradient: 'linear-gradient(135deg, #00e676, #00c853)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: 'Moderación',
    description: 'Sistema completo de reportes y moderación para mantener un ambiente seguro y acogedor para toda la comunidad.',
    gradient: 'linear-gradient(135deg, #ffd740, #ffab00)',
  },
];

export default function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  useParallaxChildren(sectionRef);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setTimeout(() => {
              setVisibleCards((prev) => new Set(prev).add(index));
            }, index * 80);
          }
        }
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('.feature-card');
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section"
      id="features"
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(138,43,226,0.03) 50%, transparent 100%)',
      }}
    >
      {/* Decorative blob (with parallax) */}
      <div data-parallax-speed="-0.08" style={{
        position: 'absolute', top: '30%', left: '10%',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.04), transparent 70%)',
        pointerEvents: 'none', zIndex: -1, willChange: 'transform',
      }} />
      {/* Section divider decorative */}
      <div className="section-accent-top" />

      <div className="container">
        <h2 className="section-title" style={{
          opacity: visibleCards.size > 0 ? 1 : 0,
          transform: visibleCards.size > 0 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          Todo lo que necesitas
        </h2>
        <p className="section-subtitle" style={{
          opacity: visibleCards.size > 0 ? 1 : 0,
          transform: visibleCards.size > 0 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          Una plataforma completa diseñada para VTubers, con todas las herramientas para gestionar tu
          presencia digital y conectar con tu audiencia.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="feature-card glass"
              data-index={index}
              style={{
                padding: '28px 24px',
                borderRadius: '20px',
                transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                cursor: 'default',
                opacity: visibleCards.has(index) ? 1 : 0,
                transform: visibleCards.has(index)
                  ? 'translateY(0) scale(1)'
                  : 'translateY(40px) scale(0.95)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(-8px) scale(1.02)';
                el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
                el.style.borderColor = 'rgba(138,43,226,0.3)';
                const icon = el.querySelector('.feature-icon') as HTMLElement;
                if (icon) icon.style.transform = 'scale(1.1) rotate(3deg)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(0) scale(1)';
                el.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
                el.style.borderColor = 'var(--glass-border)';
                const icon = el.querySelector('.feature-icon') as HTMLElement;
                if (icon) icon.style.transform = 'scale(1) rotate(0deg)';
              }}
            >
              {/* Gradient accent bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: feature.gradient,
                  borderRadius: '20px 20px 0 0',
                }}
              />

              {/* Icon container */}
              <div
                className="feature-icon"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: `${feature.gradient}20`,
                  border: `1px solid ${feature.gradient.includes('#') ? 'rgba(138,43,226,0.15)' : 'rgba(138,43,226,0.15)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: feature.gradient.includes('#ff007f') ? '#ff007f'
                    : feature.gradient.includes('#00d4ff') ? '#00d4ff'
                    : feature.gradient.includes('#ff6b35') ? '#ff6b35'
                    : feature.gradient.includes('#f5af19') ? '#f5af19'
                    : feature.gradient.includes('#e040fb') ? '#e040fb'
                    : feature.gradient.includes('#00e676') ? '#00e676'
                    : feature.gradient.includes('#ffd740') ? '#ffd740'
                    : 'var(--primary)',
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                }}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  marginBottom: '10px',
                  color: 'var(--text)',
                }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
