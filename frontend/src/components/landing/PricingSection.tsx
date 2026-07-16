'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  subtitle: string;
  price: string;
  period: string;
  description: string;
  icon: string;
  features: PlanFeature[];
  cta: { label: string; href: string };
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Gratuito',
    subtitle: 'Para empezar',
    price: 'Gratis',
    period: 'siempre',
    description: 'Perfecto para explorar la plataforma y conectar con la comunidad.',
    icon: '✦',
    features: [
      { text: 'Perfil básico', included: true },
      { text: 'Feed social', included: true },
      { text: 'Unirse a gremios', included: true },
      { text: 'Asistir a eventos', included: true },
      { text: 'Chat global', included: true },
      { text: 'Perfil VTuber personalizado', included: false },
      { text: 'Tema de color personalizado', included: false },
      { text: 'Monetización y donaciones', included: false },
    ],
    cta: { label: 'Crear cuenta', href: '/register' },
  },
  {
    name: 'VTuber',
    subtitle: 'Para creadores',
    price: 'Gratis',
    period: 'por ahora',
    description: 'Todo lo que necesitas para brillar como creador de contenido virtual.',
    icon: '🎭',
    highlighted: true,
    features: [
      { text: 'Todo lo del plan Gratuito', included: true },
      { text: 'Perfil VTuber completo', included: true },
      { text: 'Lore e historia de personaje', included: true },
      { text: 'Tema de color personalizado', included: true },
      { text: 'Redes sociales en perfil', included: true },
      { text: 'Horario de streams', included: true },
      { text: 'Insignia VTuber Oficial', included: true },
      { text: 'Galería de imágenes', included: true },
    ],
    cta: { label: 'Unirse gratis', href: '/register' },
  },
  {
    name: 'Pro',
    subtitle: 'Para profesionales',
    price: 'Próximamente',
    period: '',
    description: 'Lleva tu carrera al siguiente nivel con herramientas profesionales.',
    icon: '🌟',
    features: [
      { text: 'Todo lo del plan VTuber', included: true },
      { text: 'Estadísticas y análisis', included: true },
      { text: 'Publicaciones destacadas', included: true },
      { text: 'Soporte prioritario', included: true },
      { text: 'Más espacio en galería', included: true },
      { text: 'Badge exclusivo Pro', included: true },
      { text: 'Acceso anticipado a funciones', included: true },
      { text: 'Monetización y donaciones', included: false },
    ],
    cta: { label: 'Notificarme', href: '/support' },
  },
  {
    name: 'Empresarial',
    subtitle: 'Para agencias',
    price: 'A medida',
    period: '',
    description: 'Solución completa para agencias y grupos de gestión de VTubers.',
    icon: '🏢',
    features: [
      { text: 'Todo lo del plan Pro', included: true },
      { text: 'Múltiples perfiles', included: true },
      { text: 'Panel de administración', included: true },
      { text: 'API personalizada', included: true },
      { text: 'Soporte dedicado 24/7', included: true },
      { text: 'Integraciones personalizadas', included: true },
      { text: 'White label', included: true },
      { text: 'SLA garantizado', included: true },
    ],
    cta: { label: 'Contactar', href: '/support' },
  },
];

export default function PricingSection() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setTimeout(() => {
              setVisibleCards((prev) => new Set(prev).add(index));
            }, index * 120);
          }
        }
      },
      { threshold: 0.2 }
    );

    const cards = sectionRef.current?.querySelectorAll('.pricing-card');
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section"
      id="pricing"
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        <div className="section-accent-line" />
        <h2 className="section-title">Planes y Precios</h2>
        <p className="section-subtitle">
          Todos los planes son completamente gratuitos. Estamos construyendo la plataforma
          y queremos que seas parte desde el inicio.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          alignItems: 'stretch',
        }}>
          {plans.map((plan, index) => {
            const isVisible = visibleCards.has(index);
            const isHovered = hoveredCard === index;
            const isHighlighted = plan.highlighted;

            return (
              <div
                key={index}
                className="pricing-card"
                data-index={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: 'relative',
                  padding: '28px 22px',
                  borderRadius: '12px',
                  background: isHighlighted ? 'rgba(139,92,246,0.04)' : 'var(--bg-card)',
                  border: isHighlighted
                    ? '1px solid rgba(139,92,246,0.2)'
                    : '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? isHovered ? 'translateY(-4px)' : 'translateY(0)'
                    : 'translateY(25px)',
                  boxShadow: isHovered ? '0 8px 32px rgba(0,0,0,0.35)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Highlighted badge */}
                {isHighlighted && (
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    right: '-24px',
                    transform: 'rotate(45deg)',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '3px 32px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Popular
                  </div>
                )}

                {/* Top accent bar */}
                <div style={{
                  width: '24px',
                  height: '2px',
                  background: 'var(--primary)',
                  borderRadius: '1px',
                  marginBottom: '14px',
                  opacity: isHovered ? 0.8 : 0.4,
                  transition: 'opacity 0.3s ease',
                }} />

                {/* Icon and name */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>
                    {plan.icon}
                  </div>
                  <h3 style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '2px',
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                  }}>
                    {plan.subtitle}
                  </div>
                </div>

                {/* Price */}
                <div style={{
                  marginBottom: '14px',
                  paddingBottom: '14px',
                  borderBottom: '1px solid var(--glass-border)',
                }}>
                  <span style={{
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      marginLeft: '4px',
                    }}>
                      /{plan.period}
                    </span>
                  )}
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginTop: '6px',
                    lineHeight: 1.5,
                  }}>
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '20px',
                }}>
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        color: feature.included ? 'var(--text-secondary)' : 'var(--text-muted)',
                        opacity: feature.included ? 1 : 0.45,
                      }}
                    >
                      <span style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        background: feature.included ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
                        color: feature.included ? 'var(--primary)' : 'var(--text-muted)',
                      }}>
                        {feature.included ? '✓' : '−'}
                      </span>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={plan.cta.href}
                  className="btn"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    background: isHighlighted ? 'var(--primary)' : 'var(--bg-card)',
                    color: isHighlighted ? '#fff' : 'var(--text-secondary)',
                    border: isHighlighted ? 'none' : '1px solid var(--glass-border)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isHighlighted) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isHighlighted) {
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {plan.cta.label}
                </Link>
              </div>
            );
          })}
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '28px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          Todos los planes son completamente gratuitos durante esta fase beta. 🚀
        </p>
      </div>
    </section>
  );
}
