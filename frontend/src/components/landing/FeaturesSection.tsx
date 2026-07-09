'use client';

import { useEffect, useRef, useState } from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: '🎭',
    title: 'Perfiles VTuber',
    description:
      'Crea un perfil único con tu personaje. Añade lore, modelo Live2D o 3D, enlaces a tus redes, horario de streams y más.',
    gradient: 'linear-gradient(135deg, #8a2be2, #6a1cb0)',
  },
  {
    icon: '📅',
    title: 'Eventos',
    description:
      'Organiza y descubre eventos de la comunidad. Desde colaboraciones hasta streams especiales, con RSVP y notificaciones.',
    gradient: 'linear-gradient(135deg, #ff007f, #cc0066)',
  },
  {
    icon: '🏰',
    title: 'Gremios',
    description:
      'Forma o únete a gremios de VTubers. Colabora, comparte recursos y construye una comunidad alrededor de tu grupo.',
    gradient: 'linear-gradient(135deg, #00d4ff, #0099cc)',
  },
  {
    icon: '💬',
    title: 'Chat en Vivo',
    description:
      'Chatea con la comunidad en tiempo real con Socket.IO. Salas globales, mensajes directos y estado de escritura.',
    gradient: 'linear-gradient(135deg, #ff6b35, #e0552a)',
  },
  {
    icon: '🏆',
    title: 'Gamificación',
    description:
      'Gana XP, sube de nivel, desbloquea logros y compite en el ranking. Cada interacción te acerca a la cima.',
    gradient: 'linear-gradient(135deg, #f5af19, #f12711)',
  },
  {
    icon: '💝',
    title: 'Apoyo y Monetización',
    description:
      'Recibe donaciones y suscripciones de tus seguidores. Niveles de suscripción con beneficios exclusivos.',
    gradient: 'linear-gradient(135deg, #e040fb, #7c4dff)',
  },
  {
    icon: '📡',
    title: 'Feed Social',
    description:
      'Publica actualizaciones, comparte medios, crea encuestas. Comenta y reacciona a las publicaciones de otros.',
    gradient: 'linear-gradient(135deg, #00e676, #00c853)',
  },
  {
    icon: '🛡️',
    title: 'Moderación',
    description:
      'Sistema completo de reportes y moderación para mantener un ambiente seguro y acogedor para toda la comunidad.',
    gradient: 'linear-gradient(135deg, #ffd740, #ffab00)',
  },
];

export default function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setTimeout(() => {
              setVisibleCards((prev) => new Set(prev).add(index));
            }, index * 100);
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
        background:
          'linear-gradient(180deg, transparent 0%, rgba(138,43,226,0.03) 50%, transparent 100%)',
      }}
    >
      <div className="container">
        <h2 className="section-title">Todo lo que necesitas</h2>
        <p className="section-subtitle">
          Una plataforma completa diseñada para VTubers, con todas las herramientas para gestionar tu
          presencia digital y conectar con tu audiencia.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card glass"
              data-index={index}
              style={{
                padding: '32px 28px',
                borderRadius: '20px',
                transition: 'all 0.3s ease',
                cursor: 'default',
                opacity: visibleCards.has(index) ? 1 : 0,
                transform: visibleCards.has(index)
                  ? 'translateY(0) scale(1)'
                  : 'translateY(40px) scale(0.95)',
                transitionDuration: '0.6s',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(-8px) scale(1.02)';
                el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
                el.style.borderColor = 'rgba(138,43,226,0.3)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(0) scale(1)';
                el.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
                el.style.borderColor = 'var(--glass-border)';
              }}
            >
              {/* Gradient accent bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: feature.gradient,
                  borderRadius: '20px 20px 0 0',
                }}
              />

              {/* Icon */}
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '20px',
                  marginTop: '4px',
                  display: 'inline-block',
                }}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: 'var(--text)',
                }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.95rem',
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
