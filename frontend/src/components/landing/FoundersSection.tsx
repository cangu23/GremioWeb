'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FourPointStar, Twitch, Youtube, Twitter, ExternalLink, Sparkles } from '@/components/ui/Icons';

export interface FounderData {
  id: string;
  name: string;
  handle?: string;
  role: string;
  badge: string;
  isIncoming?: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  themeColor: string;
  description: string;
  socials?: {
    twitch?: string;
    youtube?: string;
    twitter?: string;
  };
  profileUrl?: string;
}

const FOUNDERS: FounderData[] = [
  {
    id: 'guren',
    name: 'Guren Tatsumaki',
    handle: '@gurenvt_',
    role: 'Emperador del Imperio Carmesí',
    badge: 'Fundador Principal',
    avatarUrl: '/images/guren-avatar.jpg',
    bannerUrl: '/images/guren-banner.jpg',
    themeColor: '#E63946',
    description:
      'Soy Christend Guren Tatsumaki クリステンド 紅蓮 竜巻, Emperador del Imperio CARMESI. Fundador del Gremio Estelar, creador de contenido, directos en VRChat y líder de la comunidad astral.',
    socials: {
      twitch: 'https://www.twitch.tv/gurenvt_',
    },
    profileUrl: '/vtuber/gurenvt_',
  },
  {
    id: 'meiro',
    name: 'Meiro',
    handle: '@meiro_stelar',
    role: 'Talento Fundador',
    badge: 'Fundadora',
    themeColor: '#9D4EDD',
    description:
      'Pilar estelar y cofundadora del Gremio Estelar. Transmisiones mágicas, directos cautivadores y creadora fundamental en la expansión de nuestra constelación.',
    socials: {
      twitch: 'https://www.twitch.tv',
    },
    profileUrl: '/vtubers',
  },
  {
    id: 'alesha',
    name: 'Alesha',
    handle: '@alesha_stelar',
    role: 'Talento Fundador',
    badge: 'Fundadora',
    themeColor: '#3A86FF',
    description:
      'Pilar estelar y cofundadora del Gremio Estelar. Voz cósmica, talento artístico y chispa creadora que dio vida a los primeros pasos de nuestra comunidad.',
    socials: {
      twitch: 'https://www.twitch.tv',
    },
    profileUrl: '/vtubers',
  },
  {
    id: 'chemy',
    name: 'Chemy',
    handle: '@chemy_vt',
    role: 'En Proceso de Integración',
    badge: 'Próximamente',
    isIncoming: true,
    themeColor: '#06D6A0',
    description:
      'Futura estrella del santuario astral. Preparando su aterrizaje estelar en el Gremio para unirse a las filas de talentos principales.',
    profileUrl: '/vtubers',
  },
  {
    id: 'shinku',
    name: 'Shinku',
    handle: '@shinku_vt',
    role: 'En Proceso de Integración',
    badge: 'Próximamente',
    isIncoming: true,
    themeColor: '#FF70A6',
    description:
      'Futura estrella del santuario astral. Alistando motores y afinando su debut en las transmisiones y proyectos del Gremio.',
    profileUrl: '/vtubers',
  },
];

export default function FoundersSection() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeFounders = FOUNDERS.filter((f) => !f.isIncoming);
  const incomingFounders = FOUNDERS.filter((f) => f.isIncoming);

  return (
    <section
      id="founders"
      className="section"
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '70px 0 80px',
        overflow: 'hidden',
      }}
    >
      {/* Background starlight ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70vw',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.07) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '44px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(232, 199, 122, 0.08)',
              border: '1px solid rgba(232, 199, 122, 0.28)',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.24em',
              color: '#E8C77A',
              textTransform: 'uppercase',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <FourPointStar size={10} color="#F5E7B0" />
            PILARES DEL GREMIO
            <FourPointStar size={10} color="#F5E7B0" />
          </span>

          <h2 className="section-title" style={{ maxWidth: '780px', marginBottom: '14px' }}>
            Nuestros <span className="landing-gradient-text">Talentos Fundadores</span>
          </h2>

          <p className="section-subtitle" style={{ maxWidth: '640px', margin: 0 }}>
            Las estrellas originarias que dieron vida al Gremio Estelar. Creadores, pioneros y líderes
            que forjan la leyenda de nuestro santuario.
          </p>
        </div>

        {/* Primary Founders Row (Guren, Meiro, Alesha) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          {activeFounders.map((founder) => {
            const isHovered = hoveredId === founder.id;
            return (
              <div
                key={founder.id}
                onMouseEnter={() => setHoveredId(founder.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: 'relative',
                  borderRadius: '20px',
                  background: 'linear-gradient(165deg, rgba(14, 18, 38, 0.88) 0%, rgba(8, 11, 24, 0.94) 100%)',
                  border: `1px solid ${isHovered ? 'rgba(232, 199, 122, 0.55)' : 'rgba(232, 199, 122, 0.22)'}`,
                  boxShadow: isHovered
                    ? '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.16), inset 0 1px 0 rgba(255, 248, 225, 0.15)'
                    : '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 248, 225, 0.08)',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Banner / Cover */}
                <div
                  style={{
                    position: 'relative',
                    height: '140px',
                    width: '100%',
                    background: founder.bannerUrl
                      ? `url(${founder.bannerUrl}) center/cover`
                      : `linear-gradient(135deg, ${founder.themeColor}33 0%, rgba(8, 11, 24, 0.95) 100%)`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(5,7,18,0.2) 0%, rgba(8, 11, 24, 0.96) 100%)',
                    }}
                  />

                  {/* Top Badge: Fundador */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      zIndex: 2,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: 'rgba(8, 11, 24, 0.82)',
                        border: '1px solid rgba(232, 199, 122, 0.45)',
                        backdropFilter: 'blur(8px)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: '#F5E7B0',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                      }}
                    >
                      <FourPointStar size={9} color="#F5E7B0" />
                      {founder.badge}
                    </span>
                  </div>
                </div>

                {/* Content body */}
                <div
                  style={{
                    padding: '0 24px 24px',
                    marginTop: '-44px',
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}
                >
                  {/* Avatar Portrait */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background: founder.avatarUrl
                          ? `url(${founder.avatarUrl}) center/cover`
                          : `linear-gradient(135deg, ${founder.themeColor} 0%, #0c1024 100%)`,
                        border: '2px solid rgba(232, 199, 122, 0.65)',
                        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px ${founder.themeColor}44`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F9F5EA',
                        fontWeight: 800,
                        fontSize: '1.6rem',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {!founder.avatarUrl && founder.name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.22rem',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                          color: '#FAF6EE',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {founder.name}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '3px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            color: '#E8C77A',
                            textTransform: 'uppercase',
                          }}
                        >
                          {founder.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio / Description */}
                  <p
                    style={{
                      margin: '0 0 20px',
                      fontSize: '0.86rem',
                      lineHeight: 1.6,
                      color: 'rgba(245, 239, 223, 0.72)',
                      flex: 1,
                    }}
                  >
                    {founder.description}
                  </p>

                  {/* Actions / Socials */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(232, 199, 122, 0.14)',
                    }}
                  >
                    {/* Social icons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {founder.socials?.twitch && (
                        <a
                          href={founder.socials.twitch}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Canal de Twitch"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(145, 70, 255, 0.15)',
                            border: '1px solid rgba(145, 70, 255, 0.35)',
                            color: '#C084FC',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Twitch size={16} color="currentColor" />
                        </a>
                      )}
                      {founder.socials?.youtube && (
                        <a
                          href={founder.socials.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Canal de YouTube"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#F87171',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Youtube size={16} color="currentColor" />
                        </a>
                      )}
                      {founder.socials?.twitter && (
                        <a
                          href={founder.socials.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Perfil de X"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.18)',
                            color: '#FAF6EE',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Twitter size={16} color="currentColor" />
                        </a>
                      )}
                    </div>

                    {/* View Profile Link */}
                    {founder.profileUrl && (
                      <Link
                        href={founder.profileUrl}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: 'rgba(232, 199, 122, 0.12)',
                          border: '1px solid rgba(232, 199, 122, 0.3)',
                          color: '#F5E7B0',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Ver Perfil
                        <ExternalLink size={12} color="#F5E7B0" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Incoming Founders Section (Chemy, Shinku) */}
        <div
          style={{
            marginTop: '28px',
            padding: '24px 28px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(14, 18, 38, 0.6) 0%, rgba(8, 11, 24, 0.75) 100%)',
            border: '1px dashed rgba(232, 199, 122, 0.3)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FourPointStar size={12} color="#E8C77A" />
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#F5E7B0',
                }}
              >
                Próximas Integraciones Estelares
              </span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'rgba(245, 239, 223, 0.5)',
                letterSpacing: '0.04em',
              }}
            >
              En proceso de unirse oficialmente a la constelación
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {incomingFounders.map((incoming) => (
              <div
                key={incoming.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(232, 199, 122, 0.16)',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Avatar with soft glow */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${incoming.themeColor} 0%, #0d122b 100%)`,
                    border: '1.5px solid rgba(232, 199, 122, 0.4)',
                    boxShadow: `0 0 16px ${incoming.themeColor}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FAF6EE',
                    fontWeight: 800,
                    fontSize: '1.15rem',
                    flexShrink: 0,
                  }}
                >
                  {incoming.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#FAF6EE' }}>
                      {incoming.name}
                    </h4>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        background: 'rgba(232, 199, 122, 0.14)',
                        color: '#E8C77A',
                        border: '1px solid rgba(232, 199, 122, 0.25)',
                      }}
                    >
                      {incoming.badge}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '3px 0 0',
                      fontSize: '0.76rem',
                      color: 'rgba(245, 239, 223, 0.6)',
                      lineHeight: 1.4,
                    }}
                  >
                    {incoming.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
