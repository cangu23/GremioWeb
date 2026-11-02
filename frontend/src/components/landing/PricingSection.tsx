'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Star, Crown, Shield } from '@/components/ui/Icons';

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
  icon: React.ReactNode;
  features: PlanFeature[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
}

const plans: Plan[] = [
  {
    name: 'Explorer',
    subtitle: 'Para fans & miembros',
    price: 'Gratis',
    period: 'siempre',
    description: 'Disfruta de la comunidad, sigue a tus VTubers favoritos y gana recompensas sin pagar nada.',
    icon: <Sparkles size={22} color="var(--primary)" />,
    features: [
      { text: 'Feed social sin algoritmos opacos', included: true },
      { text: 'Acceso a streams en directo', included: true },
      { text: 'Chat global y salas de gremios', included: true },
      { text: 'Gana Stardust diario por participar', included: true },
      { text: 'Misiones y progreso de nivel', included: true },
      { text: 'Asistir a eventos comunitarios', included: true },
      { text: 'Perfil oficial de Creador VTuber', included: false },
      { text: 'Código de Creador con 35% comisión', included: false },
    ],
    cta: { label: 'Crear cuenta gratis', href: '/register' },
  },
  {
    name: 'Creador VTuber',
    subtitle: 'Para talentos & streamers',
    price: 'Gratis',
    period: 'siempre',
    description: 'Herramientas para potenciar tu identidad virtual, transmitir y monetizar con tu comunidad.',
    icon: <Star size={22} color="var(--primary)" />,
    highlighted: true,
    badge: 'Popular',
    features: [
      { text: 'Todo lo del plan Explorer', included: true },
      { text: 'Perfil VTuber con lore y modelo 2D/3D', included: true },
      { text: 'Alertas automáticas de en vivo (Twitch/YT)', included: true },
      { text: 'Código de Creador con 35% comisión directa', included: true },
      { text: 'Galería de arte y redes integradas', included: true },
      { text: 'Horario y agenda de directos semanal', included: true },
      { text: 'Insignia de Creador Verificado', included: true },
      { text: 'Panel de estadísticas y ganancias', included: true },
    ],
    cta: { label: 'Registrarme como Creador', href: '/register' },
  },
  {
    name: 'Pase Estelar VIP',
    subtitle: 'Pase de temporada',
    price: '$3.99',
    period: 'temporada o 2,500 Stardust',
    description: 'Desbloquea cosméticos de edición limitada, marcos dinámicos y títulos de honor exclusivos.',
    icon: <Crown size={22} color="#f59e0b" />,
    badge: 'Temporada',
    features: [
      { text: '30+ niveles con cosméticos exclusivos', included: true },
      { text: 'Marcos animados para tu avatar', included: true },
      { text: 'Títulos de perfil y prestigio legendario', included: true },
      { text: 'Stickers gigantes HD para el chat', included: true },
      { text: '+10% Stardust usando Código de Creador', included: true },
      { text: 'Canjeable 100% gratis con 2,500 Stardust', included: true },
      { text: 'Emblema de la temporada activa', included: true },
      { text: 'Conserva todas tus recompensas para siempre', included: true },
    ],
    cta: { label: 'Ver Pase Estelar', href: '/pass' },
  },
  {
    name: 'Membresías VIP',
    subtitle: 'Astro, Nova & Stellar',
    price: 'Desde $2.99',
    period: 'mes',
    description: 'Multiplicadores de XP y Stardust, personalización holográfica y apoyo directo a la plataforma.',
    icon: <Shield size={22} color="#60a5fa" />,
    features: [
      { text: 'Multiplicador de Stardust y XP (+20% a +100%)', included: true },
      { text: 'Marcos de perfil holográficos dinámicos', included: true },
      { text: 'Insignia de patrocinador VIP en chat y perfil', included: true },
      { text: '35% va a tu creador favorito con su código', included: true },
      { text: '35% a infraestructura y 30% a la comunidad', included: true },
      { text: 'Prioridad en eventos especiales y gremios', included: true },
      { text: 'Acceso anticipado a nuevas funciones', included: true },
      { text: 'Soporte prioritario del staff', included: true },
    ],
    cta: { label: 'Ver Membresías VIP', href: '/premium' },
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
            }, index * 100);
          }
        }
      },
      { threshold: 0.15 }
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4px' }}>
          <span className="landing-eyebrow" style={{ marginBottom: '16px' }}>Planes & Membresías</span>
        </div>
        <h2 className="section-title">Opciones para <span className="landing-gradient-text">Fans y Creadores</span></h2>
        <p className="section-subtitle">
          Elige cómo quieres vivir el Gremio Estelar. Disfruta de forma 100% gratuita o apoya el ecosistema
          y a tus talentos favoritos con cosméticos exclusivos y comisiones directas.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px',
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
                  borderRadius: '16px',
                  background: isHighlighted
                    ? 'linear-gradient(170deg, rgba(139,92,246,0.12), rgba(25,25,30,0.85))'
                    : 'rgba(28,28,34,0.65)',
                  border: isHighlighted
                    ? '1px solid rgba(139,92,246,0.32)'
                    : '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? isHovered ? 'translateY(-6px)' : 'translateY(0)'
                    : 'translateY(25px)',
                  boxShadow: isHovered
                    ? '0 16px 48px rgba(0,0,0,0.45)'
                    : isHighlighted ? '0 12px 40px rgba(139,92,246,0.14)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Animated gradient border for highlighted plan */}
                {isHighlighted && <div className="landing-price-glow" />}

                {/* Highlighted badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    right: '-24px',
                    transform: 'rotate(45deg)',
                    background: isHighlighted
                      ? 'linear-gradient(135deg, var(--secondary), var(--primary))'
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '3px 32px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    zIndex: 1,
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Top accent bar */}
                <div style={{
                  width: '28px',
                  height: '2px',
                  background: 'var(--primary)',
                  borderRadius: '1px',
                  marginBottom: '14px',
                  opacity: isHovered ? 0.9 : 0.4,
                  transition: 'opacity 0.3s ease',
                }} />

                {/* Icon and name */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    {plan.icon}
                  </div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '2px',
                    letterSpacing: '-0.01em',
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
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '1.7rem',
                      fontWeight: 800,
                      color: isHighlighted ? 'var(--primary-hover)' : 'var(--text-primary)',
                    }}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                      }}>
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
                    lineHeight: 1.55,
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
                  marginBottom: '22px',
                }}>
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '0.8rem',
                        color: feature.included ? 'var(--text-secondary)' : 'var(--text-muted)',
                        opacity: feature.included ? 1 : 0.45,
                        lineHeight: 1.45,
                      }}
                    >
                      <span style={{
                        width: '15px',
                        height: '15px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.52rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '2px',
                        background: feature.included ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)',
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
                  className={`btn ${isHighlighted ? 'btn--shine' : ''}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '11px',
                    borderRadius: '9px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    background: isHighlighted ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                    color: isHighlighted ? '#fff' : 'var(--text-secondary)',
                    border: isHighlighted ? 'none' : '1px solid var(--glass-border)',
                    textDecoration: 'none',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isHighlighted) {
                      e.currentTarget.style.background = 'rgba(139,92,246,0.12)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--primary-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isHighlighted) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
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
          marginTop: '32px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          ✦ Todos los pagos son transparentes: 35% va al creador mediante su código, 35% al hosting de servidores y 30% al fondo de la comunidad.
        </p>
      </div>
    </section>
  );
}
