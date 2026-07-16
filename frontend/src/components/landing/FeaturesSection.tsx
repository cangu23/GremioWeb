'use client';

import { useEffect, useRef, useState } from 'react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Perfiles VTuber',
    description: 'Crea un perfil único con tu personaje. Añade lore, modelo, enlaces y horarios de streams.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Eventos',
    description: 'Organiza y descubre eventos de la comunidad. Colaboraciones, streams especiales y más.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Gremios',
    description: 'Forma o únete a gremios de VTubers. Colabora, comparte recursos y construye comunidad.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
    title: 'Chat en Vivo',
    description: 'Chatea con la comunidad en tiempo real con Socket.IO. Salas globales y mensajes directos.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'Gamificación',
    description: 'Gana XP, sube de nivel, desbloquea logros y compite en el ranking de la comunidad.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    title: 'Monetización',
    description: 'Recibe apoyo de tus seguidores. Suscripciones con beneficios exclusivos para tu comunidad.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    title: 'Feed Social',
    description: 'Publica actualizaciones, comparte medios y crea encuestas. Comenta y reacciona.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: 'Moderación',
    description: 'Sistema completo de reportes para mantener un ambiente seguro y acogedor.',
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
            }, index * 60);
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
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        <div className="section-accent-line" style={{
          opacity: visibleCards.size > 0 ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }} />
        <h2 className="section-title" style={{
          opacity: visibleCards.size > 0 ? 1 : 0,
          transform: visibleCards.size > 0 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          Todo lo que necesitas
        </h2>
        <p className="section-subtitle" style={{
          opacity: visibleCards.size > 0 ? 1 : 0,
          transform: visibleCards.size > 0 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}>
          Una plataforma completa diseñada para VTubers, con todas las herramientas para gestionar tu
          presencia digital y conectar con tu audiencia.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              data-index={index}
              style={{
                padding: '24px 22px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                opacity: visibleCards.has(index) ? 1 : 0,
                transform: visibleCards.has(index) ? 'translateY(0)' : 'translateY(25px)',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.background = 'var(--bg-card-hover)';
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
                const icon = e.currentTarget.querySelector('.feature-icon') as HTMLElement;
                if (icon) icon.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.boxShadow = 'none';
                const icon = e.currentTarget.querySelector('.feature-icon') as HTMLElement;
                if (icon) icon.style.color = 'var(--text-muted)';
              }}
            >
              {/* Icon */}
              <div
                className="feature-icon"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--primary-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  marginBottom: '14px',
                  transition: 'color 0.3s ease, background 0.3s ease',
                }}
              >
                {feature.icon}
              </div>

              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text-primary)',
              }}>
                {feature.title}
              </h3>

              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
