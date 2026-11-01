'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Tag, Crown, Zap, Server, Users, Sparkles, Shield, ArrowRight, Check } from '@/components/ui/Icons';

interface Pillar {
  icon: React.ReactNode;
  badge: string;
  metric: string;
  title: string;
  description: string;
  highlight?: boolean;
}

const PILLARS: Pillar[] = [
  {
    icon: <Tag size={24} color="#a78bfa" />,
    badge: 'Comisión Directa',
    metric: '35%',
    title: 'Para los Creadores',
    description:
      'Cada vez que un fan utiliza el Código de Creador de su VTuber favorito al adquirir un Pase Estelar o membresía, el 35% neto va directo a su balance retirable.',
    highlight: true,
  },
  {
    icon: <Zap size={24} color="#f59e0b" />,
    badge: 'Bonus para Fans',
    metric: '+10%',
    title: 'Stardust de Regalo',
    description:
      'Apoyar a tu creador favorito te premia al instante. Recibes un 10% adicional de Stardust extra para canjear en la tienda por marcos, títulos y cosméticos.',
  },
  {
    icon: <Server size={24} color="#60a5fa" />,
    badge: 'Infraestructura',
    metric: '35%',
    title: 'Servidores & Cloud',
    description:
      'Mantenimiento de servidores, ancho de banda para transmisiones, base de datos y alojamiento de modelos y multimedia para mantener la plataforma rápida y estable.',
  },
  {
    icon: <Users size={24} color="#34d399" />,
    badge: 'Comunidad',
    metric: '30%',
    title: 'Desarrollo & Eventos',
    description:
      'Premios para torneos del gremio, mejoras de la plataforma, nuevos stickers en alta resolución y soporte activo para la comunidad hispanohablante.',
  },
];

export default function CreatorEconomySection() {
  const [visible, setVisible] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('GUREN');
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section"
      id="creator-economy"
      style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}
    >
      {/* Background ambient orbs */}
      <div
        className="landing-orb"
        style={{
          width: 480,
          height: 480,
          left: '-160px',
          top: '25%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.14), transparent 65%)',
          animation: 'landingFloat 13s ease-in-out infinite',
        }}
      />
      <div
        className="landing-orb"
        style={{
          width: 420,
          height: 420,
          right: '-140px',
          bottom: '10%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08), transparent 65%)',
          animation: 'landingFloat 15s ease-in-out infinite reverse',
        }}
      />

      <div className="container" style={{ position: 'relative' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '46px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <span className="landing-eyebrow" style={{ marginBottom: '16px' }}>
            ECONOMY & PASS // 経済圏・パス
          </span>
          <h2 className="section-title" style={{ maxWidth: '780px', marginBottom: '14px' }}>
            Un Modelo <span className="landing-gradient-text">Justo y Transparente</span> para Creadores y Fans
          </h2>
          <p className="section-subtitle" style={{ maxWidth: '680px', marginBottom: 0 }}>
            Sin algoritmos opacos ni comisiones abusivas. En Gremio Estelar apoyar a tus streamers
            y VTubers favoritos beneficia a todos: el creador gana comisiones directas y el fan recibe recompensas exclusivas.
          </p>
        </div>

        {/* 4 Distribution Pillars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
            marginBottom: '42px',
          }}
        >
          {PILLARS.map((p, idx) => (
            <div
              key={idx}
              className="landing-card"
              style={{
                padding: '28px 24px',
                borderRadius: '16px',
                background: p.highlight
                  ? 'linear-gradient(165deg, rgba(139,92,246,0.12), rgba(26,26,32,0.85))'
                  : 'rgba(28,28,34,0.65)',
                border: p.highlight
                  ? '1px solid rgba(139,92,246,0.32)'
                  : '1px solid var(--glass-border)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + idx * 0.08}s`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {p.highlight && <div className="landing-price-glow" />}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {p.icon}
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: p.highlight ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)',
                    color: p.highlight ? 'var(--primary-hover)' : 'var(--text-muted)',
                    border: p.highlight ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                  }}
                >
                  {p.badge}
                </span>
              </div>

              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  marginBottom: '8px',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.03em',
                  color: p.highlight ? 'var(--primary-hover)' : 'var(--text-primary)',
                }}
              >
                {p.metric}
              </div>

              <h3
                style={{
                  fontSize: '1.08rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {p.title}
              </h3>

              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* Feature Split Showcase: Season Pass & Creator Code in Action */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '36px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
          }}
        >
          {/* Card 1: Pase Estelar VIP */}
          <div
            style={{
              padding: '32px 28px',
              borderRadius: '18px',
              background: 'linear-gradient(155deg, rgba(30,27,46,0.7), rgba(22,20,32,0.9))',
              border: '1px solid rgba(139,92,246,0.22)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(139,92,246,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Crown size={20} color="#a78bfa" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary-hover)', fontWeight: 700 }}>
                    Temporada Activa
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    Pase Estelar VIP
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '20px' }}>
                Desbloquea una senda con más de 30 niveles cargados de cosméticos de edición limitada,
                marcos de perfil animados, títulos de prestigio y stickers gigantes para el chat.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {[
                  'Desbloqueable con dinero ($3.99) o 100% gratis con 2,500 ⭐ Stardust',
                  'Cosméticos y marcos de avatar exclusivos que conservas para siempre',
                  'Gana XP al comentar, asistir a streams y completar misiones del gremio',
                  '+10% de Stardust extra de regalo al canjear con un Código de Creador',
                ].map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--primary-hover)', marginTop: '2px' }}><Check size={14} /></span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-hover)' }}>$3.99</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>USD o 2,500 ⭐</span>
              </div>
              <Link href="/pass" className="btn btn--sm btn--shine" style={{ padding: '8px 18px', fontWeight: 700 }}>
                Explorar el Pase <ArrowRight size={14} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
          </div>

          {/* Card 2: Código de Creador Interactivo */}
          <div
            style={{
              padding: '32px 28px',
              borderRadius: '18px',
              background: 'linear-gradient(155deg, rgba(28,28,34,0.7), rgba(20,20,24,0.9))',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(245,158,11,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Tag size={20} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f59e0b', fontWeight: 700 }}>
                    Apoyo a VTubers
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    Códigos de Creador
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '20px' }}>
                Todos los creadores verificados de Gremio Estelar pueden activar su propio código único.
                Tus seguidores te apoyan de forma transparente en cada compra.
              </p>

              {/* Simulated Creator Code Box */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px dashed rgba(139,92,246,0.3)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                  Prueba el simulador de código:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={simulatedCode}
                    onChange={(e) => setSimulatedCode(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO"
                    maxLength={16}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--primary-hover)',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                    }}
                  />
                  <div
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'rgba(139,92,246,0.15)',
                      color: 'var(--primary-hover)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    35% Activo
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} />
                  <span>Código válido: Tu VTuber recibe 35% de comisión y tú ganas +10% Stardust</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div>1. El streamer comparte su código en su stream o perfil.</div>
                <div>2. El fan lo ingresa al adquirir su Pase Estelar o Membresía.</div>
                <div>3. ¡Comisión depositada y Stardust de regalo asignado!</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', marginTop: '20px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ¿Eres VTuber o Streamer?
              </span>
              <Link href="/register" className="btn btn--outline btn--sm" style={{ padding: '8px 16px', fontWeight: 600 }}>
                Solicitar Perfil Creador
              </Link>
            </div>
          </div>
        </div>

        {/* Free-to-play Stardust Promise Banner */}
        <div
          style={{
            padding: '24px 30px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.06))',
            border: '1px solid rgba(245,158,11,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px', flex: 1 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(245,158,11,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} color="#f59e0b" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ⭐ Stardust 100% Gratuito: Gana participando en la comunidad
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                No necesitas pagar para progresar. Comenta publicaciones, asiste a streams de VTubers, haz tu check-in diario
                y canjea el Pase Estelar VIP con 2,500 Stardust ganados sin gastar dinero real.
              </p>
            </div>
          </div>

          <Link
            href="/stardust"
            className="btn btn--outline btn--sm"
            style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b', whiteSpace: 'nowrap' }}
          >
            Cómo ganar Stardust
          </Link>
        </div>
      </div>
    </section>
  );
}

