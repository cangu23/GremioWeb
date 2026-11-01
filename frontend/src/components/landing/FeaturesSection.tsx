'use client';

import { useEffect, useRef, useState } from 'react';
import {
  User,
  LiveDot,
  Crown,
  Tag,
  Sparkles,
  Users,
  Shield,
  MessageCircle,
} from '@/components/ui/Icons';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <User size={22} color="var(--primary-hover)" />,
    title: 'Perfiles VTuber & Lore',
    description:
      'Crea una ficha interactiva para tu personaje 2D o 3D. Añade historia, biografía, redes sociales, horarios de directo y galería de arte.',
  },
  {
    icon: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <LiveDot size={10} color="#ff4757" pulse />
      </div>
    ),
    title: 'Monitor de Streams en Vivo',
    description:
      'Conexión automática con Twitch y YouTube. Tu audiencia sabe en tiempo real cuándo estás en directo directamente desde la portada.',
  },
  {
    icon: <Crown size={22} color="#f59e0b" />,
    title: 'Pase Estelar de Temporada',
    description:
      'Completa misiones diarias y semanales con tu comunidad para subir de nivel y desbloquear cosméticos, marcos dinámicos y títulos únicos.',
  },
  {
    icon: <Tag size={22} color="var(--primary-hover)" />,
    title: 'Códigos de Creador',
    description:
      'Monetización justa con 35% de comisión neta directa para el streamer y +10% de Stardust extra de regalo para el fan en cada compra.',
  },
  {
    icon: <Sparkles size={22} color="#f59e0b" />,
    title: 'Stickers Gigantes HD',
    description:
      'Expresa emociones con stickers de alta definición de 128px creados por artistas de la comunidad para chats y publicaciones del feed.',
  },
  {
    icon: <Users size={22} color="#34d399" />,
    title: 'Gremios & Colaboraciones',
    description:
      'Forma alianzas entre streamers, artistas y fans. Organiza eventos colaborativos, comparte audiencia y construye proyectos conjuntos.',
  },
  {
    icon: <Shield size={22} color="#60a5fa" />,
    title: 'Feed sin Algoritmos Opacos',
    description:
      'Tus seguidores ven lo que publicas sin intermediarios que penalicen tu alcance. Un muro social limpio, cronológico y comunitario.',
  },
  {
    icon: <MessageCircle size={22} color="var(--primary-hover)" />,
    title: 'Chat en Vivo & Salas Globales',
    description:
      'Salas temáticas en tiempo real con Socket.IO para interactuar antes, durante y después de los streams con la comunidad hispanohablante.',
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

    const cards = sectionRef.current?.querySelectorAll('.landing-card');
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  const handleSpotlight = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <section
      ref={sectionRef}
      className="section"
      id="features"
      style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}
    >
      <div
        className="landing-orb"
        style={{
          width: 420,
          height: 420,
          right: '-180px',
          top: '10%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 65%)',
          animation: 'landingFloat 12s ease-in-out infinite',
        }}
      />
      <div className="container" style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: visibleCards.size > 0 ? 1 : 0,
            transform: visibleCards.size > 0 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <span className="landing-eyebrow" style={{ marginBottom: '16px' }}>FEATURES // システム</span>
        </div>
        <h2
          className="section-title"
          style={{
            opacity: visibleCards.size > 0 ? 1 : 0,
            transform: visibleCards.size > 0 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.05s',
          }}
        >
          Todo lo que la comunidad <span className="landing-gradient-text">necesita</span>
        </h2>
        <p
          className="section-subtitle"
          style={{
            opacity: visibleCards.size > 0 ? 1 : 0,
            transform: visibleCards.size > 0 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
          }}
        >
          Diseñado a la medida para streamers, VTubers, artistas y fans. Herramientas reales para conectar,
          hacer crecer tu canal y formar una comunidad sólida.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
          }}
        >
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="landing-card"
              data-index={index}
              onMouseMove={handleSpotlight}
              style={{
                padding: '26px 24px',
                opacity: visibleCards.has(index) ? 1 : 0,
                transform: visibleCards.has(index) ? 'translateY(0)' : 'translateY(25px)',
                transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                cursor: 'default',
              }}
            >
              <div className="landing-spotlight" />

              {/* Icon */}
              <div
                className="feature-icon"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '13px',
                  background: 'linear-gradient(135deg, var(--primary-muted), rgba(108,180,238,0.06))',
                  border: '1px solid rgba(139,92,246,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-hover)',
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 0 rgba(139,92,246,0)',
                }}
              >
                {feature.icon}
              </div>

              <h3
                style={{
                  fontSize: '1.02rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {feature.title}
              </h3>

              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  margin: 0,
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
