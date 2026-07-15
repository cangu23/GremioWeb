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
  gradient: string;
  accentColor: string;
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
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    accentColor: '#8b5cf6',
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
    gradient: 'linear-gradient(135deg, #8a2be2, #ff007f)',
    accentColor: '#ff007f',
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
    gradient: 'linear-gradient(135deg, #f5af19, #f12711)',
    accentColor: '#f5af19',
    icon: '🌟',
    features: [
      { text: 'Todo lo del plan VTuber', included: true },
      { text: 'Estadísticas y análisis', included: true },
      { text: 'Publicaciones destacadas', included: true },
      { text: 'Soporte prioritario', included: true },
      { text: 'Más espacio en galería', included: true },
      { text: 'Badge exclusivo Pro', included: true },
      { text: 'Acceso anticipo a funciones', included: true },
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
    gradient: 'linear-gradient(135deg, #00d4ff, #7c4dff)',
    accentColor: '#00d4ff',
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
            }, index * 150);
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
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,0,127,0.02) 50%, transparent 100%)',
      }}
    >
      {/* Decorative background blobs */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(138,43,226,0.06), transparent 70%)',
        pointerEvents: 'none', zIndex: -1,
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,0,127,0.05), transparent 70%)',
        pointerEvents: 'none', zIndex: -1,
      }} />

      <div className="container">
        <h2 className="section-title">Planes y Precios</h2>
        <p className="section-subtitle">
          Todos los planes son completamente gratuitos. Estamos construyendo la plataforma
          y queremos que seas parte desde el inicio. Elige el plan que mejor se adapte a ti.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
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
                  padding: '32px 24px',
                  borderRadius: '20px',
                  background: isHighlighted
                    ? 'linear-gradient(135deg, rgba(138,43,226,0.08), rgba(255,0,127,0.05))'
                    : 'var(--card-bg)',
                  border: isHighlighted
                    ? '1px solid rgba(138,43,226,0.25)'
                    : '1px solid var(--glass-border)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? isHovered
                      ? 'translateY(-8px) scale(1.02)'
                      : 'translateY(0) scale(1)'
                    : 'translateY(40px) scale(0.95)',
                  boxShadow: isHighlighted && isVisible
                    ? '0 0 30px rgba(138,43,226,0.1)'
                    : isHovered
                      ? '0 20px 60px rgba(0,0,0,0.4)'
                      : '0 8px 32px rgba(0,0,0,0.37)',
                  overflow: 'hidden',
                }}
              >
                {/* Highlighted badge */}
                {isHighlighted && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '-28px',
                    transform: 'rotate(45deg)',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '4px 36px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 10px rgba(138,43,226,0.3)',
                  }}>
                    Popular
                  </div>
                )}

                {/* Top accent bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: plan.gradient,
                  borderRadius: '20px 20px 0 0',
                  opacity: isHovered ? 1 : 0.6,
                  transition: 'opacity 0.3s ease',
                }} />

                {/* Icon and name */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    marginBottom: '8px',
                  }}>
                    {plan.icon}
                  </div>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: 'var(--text)',
                    marginBottom: '2px',
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                  }}>
                    {plan.subtitle}
                  </div>
                </div>

                {/* Price */}
                <div style={{
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--glass-border)',
                }}>
                  <span style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    background: plan.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      marginLeft: '4px',
                    }}>
                      /{plan.period}
                    </span>
                  )}
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
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
                  gap: '10px',
                  marginBottom: '24px',
                }}>
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.85rem',
                        color: feature.included ? 'var(--text)' : 'var(--text-muted)',
                        opacity: feature.included ? 1 : 0.5,
                      }}
                    >
                      <span style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        background: feature.included
                          ? `${plan.accentColor}20`
                          : 'rgba(255,255,255,0.05)',
                        color: feature.included ? plan.accentColor : 'var(--text-muted)',
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
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    background: isHighlighted
                      ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                      : `linear-gradient(135deg, ${plan.accentColor}25, ${plan.accentColor}10)`,
                    color: isHighlighted ? '#fff' : plan.accentColor,
                    border: isHighlighted ? 'none' : `1px solid ${plan.accentColor}30`,
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isHighlighted) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${plan.accentColor}40, ${plan.accentColor}20)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isHighlighted) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${plan.accentColor}25, ${plan.accentColor}10)`;
                    }
                  }}
                >
                  {plan.cta.label}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p style={{
          textAlign: 'center',
          marginTop: '32px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}>
          Todos los planes son completamente gratuitos durante esta fase beta.
          Queremos que formes parte de la comunidad desde el principio. 🚀
        </p>
      </div>
    </section>
  );
}
