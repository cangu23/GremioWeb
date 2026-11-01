'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { User, Sparkles, Zap, Check, Twitch, ExternalLink, Shield } from '@/components/ui/Icons';

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
            }, index * 120);
          }
        }
      },
      { threshold: 0.15 }
    );

    const cards = sectionRef.current?.querySelectorAll('.concept-card');
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section"
      id="concept"
      style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}
    >
      <div className="container" style={{ position: 'relative' }}>
        {/* Section Header with LeFolk Bilingual Japanese Agency Style */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '46px',
            opacity: visibleSteps.size > 0 ? 1 : 0,
            transform: visibleSteps.size > 0 ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <span className="landing-eyebrow" style={{ marginBottom: '14px' }}>
            CONCEPT // コンセプト
          </span>

          <h2
            className="section-title"
            style={{
              maxWidth: '820px',
              marginBottom: '14px',
              letterSpacing: '-0.025em',
            }}
          >
            Nuestra Filosofía y <span className="landing-gradient-text">Propósito</span>
          </h2>
          <p
            className="section-subtitle"
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Nacimos con la misión de impulsar a talentos virtuales y creadores en español.
            Uniendo el espíritu de las agencias de VTubers con una comunidad abierta, participativa y transparente.
          </p>
        </div>

        {/* 3 Cyber-Agency Concept Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {/* ═════════════════════════════════════════════════════════════════════════
              CARD 01: Identidad & Lore (CREATIVE & CHARACTER // 01)
              ═════════════════════════════════════════════════════════════════════════ */}
          <div
            className="concept-card"
            data-index={0}
            style={{
              padding: '30px 24px 26px',
              borderRadius: '20px',
              background: 'linear-gradient(165deg, rgba(26,20,32,0.92), rgba(15,12,20,0.98))',
              border: '1px solid rgba(139,92,246,0.28)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45), 0 0 30px rgba(139,92,246,0.08)',
              opacity: visibleSteps.has(0) ? 1 : 0,
              transform: visibleSteps.has(0) ? 'translateY(0)' : 'translateY(28px)',
              transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Top Glow Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)',
                opacity: 0.8,
              }}
            />

            {/* Ghost Kanji Watermark */}
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '16px',
                fontSize: '4.8rem',
                fontWeight: 900,
                lineHeight: 1,
                color: 'rgba(167,139,250,0.05)',
                pointerEvents: 'none',
                userSelect: 'none',
                fontFamily: '"Noto Sans JP", sans-serif',
              }}
            >
              創造
            </span>

            {/* Card Content Top */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(139,92,246,0.14)',
                    border: '1px solid rgba(139,92,246,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={22} color="#a78bfa" />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color: '#a78bfa',
                    letterSpacing: '0.12em',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}
                >
                  // 01
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#a78bfa',
                  fontWeight: 800,
                  marginBottom: '6px',
                }}
              >
                CREATIVE & CHARACTER // 創造
              </div>

              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '10px',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Creación de Identidad & Lore
              </h3>

              <p
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  marginBottom: '22px',
                }}
              >
                Espacio oficial diseñado para talentos virtuales 2D y 3D. Tu modelo, biografía, horarios de
                directos y portafolio de arte en un perfil de agencia sin algoritmos que te oculten.
              </p>
            </div>

            {/* Visual Graphic Element: Official Talent ID Dossier (GurenVT_) */}
            <div
              style={{
                borderRadius: '14px',
                background: 'rgba(12,10,18,0.75)',
                border: '1px solid rgba(139,92,246,0.25)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header: Talent Archive status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '0.64rem', letterSpacing: '0.08em', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase' }}>
                  TALENT DOSSIER // 所属タレント
                </span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16,185,129,0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }} />
                  VERIFICADO
                </span>
              </div>

              {/* Creator identity row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px solid rgba(239,68,68,0.75)',
                    boxShadow: '0 0 16px rgba(239,68,68,0.35)',
                    flexShrink: 0,
                    background: '#1a1016',
                  }}
                >
                  <Image
                    src="/images/guren-avatar.jpg"
                    alt="GurenVT_"
                    fill
                    sizes="46px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                    <span>Christend Guren</span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(239,68,68,0.9)', fontWeight: 600 }}>
                      // 紅蓮 竜巻
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    Emperador del Imperio Carmesí · VTuber
                  </div>
                </div>
              </div>

              {/* Technical Specifications Grid (Clean 2x2 Key-Value) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Soporte de Modelo
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Live2D & 3D VRM</span>
                </div>
                <div style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Afiliación
                  </span>
                  <span style={{ color: '#fca5a5', fontWeight: 700 }}>Imperio Carmesí</span>
                </div>
                <div style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Plataforma Principal
                  </span>
                  <span style={{ color: '#c084fc', fontWeight: 600 }}>Twitch · VRChat</span>
                </div>
                <div style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Lore & Historia
                  </span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Oficial en Gremio</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════
              CARD 02: Transmisión & Escenarios en Vivo (LIVE BROADCAST & SYNC // 02)
              ═════════════════════════════════════════════════════════════════════════ */}
          <div
            className="concept-card"
            data-index={1}
            style={{
              padding: '30px 24px 26px',
              borderRadius: '20px',
              background: 'linear-gradient(165deg, rgba(20,26,38,0.92), rgba(12,17,26,0.98))',
              border: '1px solid rgba(56,189,248,0.28)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45), 0 0 30px rgba(56,189,248,0.08)',
              opacity: visibleSteps.has(1) ? 1 : 0,
              transform: visibleSteps.has(1) ? 'translateY(0)' : 'translateY(28px)',
              transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
            }}
          >
            {/* Top Glow Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
                opacity: 0.8,
              }}
            />

            {/* Ghost Kanji Watermark */}
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '16px',
                fontSize: '4.8rem',
                fontWeight: 900,
                lineHeight: 1,
                color: 'rgba(56,189,248,0.05)',
                pointerEvents: 'none',
                userSelect: 'none',
                fontFamily: '"Noto Sans JP", sans-serif',
              }}
            >
              配信
            </span>

            {/* Card Content Top */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(56,189,248,0.14)',
                    border: '1px solid rgba(56,189,248,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={22} color="#38bdf8" />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color: '#38bdf8',
                    letterSpacing: '0.12em',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(56,189,248,0.1)',
                    border: '1px solid rgba(56,189,248,0.25)',
                  }}
                >
                  // 02
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#38bdf8',
                  fontWeight: 800,
                  marginBottom: '6px',
                }}
              >
                LIVE BROADCAST & SYNC // 配信
              </div>

              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '10px',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Transmisión & Escenarios en Vivo
              </h3>

              <p
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  marginBottom: '22px',
                }}
              >
                Detección automática en tiempo real con Twitch y YouTube. Tu comunidad recibe alertas al
                instante y tus directos se integran al escenario principal sin algoritmos que te oculten.
              </p>
            </div>

            {/* Visual Graphic Element: Accurate Stream Pipeline Monitor (Real Sync Status) */}
            <div
              style={{
                borderRadius: '14px',
                background: 'rgba(10,12,18,0.75)',
                border: '1px solid rgba(56,189,248,0.25)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header: Sincronización de canal & Estado Real */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href="https://www.twitch.tv/gurenvt_"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.66rem',
                    color: '#a78bfa',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'color 0.2s',
                  }}
                >
                  <Twitch size={13} color="#9146ff" />
                  <span>twitch.tv/gurenvt_</span>
                  <ExternalLink size={11} color="var(--text-muted)" />
                </a>

                {/* Accurate Status Indicator: STANDBY / OFFLINE (Accurate when not live) */}
                <div
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(56,189,248,0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 6px #38bdf8',
                    }}
                  />
                  <span>STANDBY // 待機中</span>
                </div>
              </div>

              {/* Stream Signal Details */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Última Emisión Detectada
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    Buenos días, criaturitas del Señor | VRChat
                  </div>
                </div>

                {/* Radar breathing indicator */}
                <div
                  title="Radar de sincronización activo"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56,189,248,0.08)',
                  }}
                >
                  <span className="radar-wave" style={{ width: '3px', height: '10px', background: '#38bdf8', borderRadius: '1px' }} />
                  <span className="radar-wave" style={{ width: '3px', height: '16px', background: '#38bdf8', borderRadius: '1px', animationDelay: '0.2s' }} />
                  <span className="radar-wave" style={{ width: '3px', height: '8px', background: '#38bdf8', borderRadius: '1px', animationDelay: '0.4s' }} />
                </div>
              </div>

              {/* Pipeline Capabilities Matrix */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Sincronización
                  </span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>API Twitch (60s)</span>
                </div>
                <div style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Escenario en Vivo
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Player + Chat Real</span>
                </div>
                <div style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Notificaciones
                  </span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Automáticas a Fans</span>
                </div>
                <div style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Monetización Externa
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Cero Anuncios Extra</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════
              CARD 03: Economía Justa & Pase Estelar (CREATOR ECONOMY & PASS // 03)
              ═════════════════════════════════════════════════════════════════════════ */}
          <div
            className="concept-card"
            data-index={2}
            style={{
              padding: '30px 24px 26px',
              borderRadius: '20px',
              background: 'linear-gradient(165deg, rgba(34,26,18,0.92), rgba(20,15,10,0.98))',
              border: '1px solid rgba(245,158,11,0.28)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45), 0 0 30px rgba(245,158,11,0.08)',
              opacity: visibleSteps.has(2) ? 1 : 0,
              transform: visibleSteps.has(2) ? 'translateY(0)' : 'translateY(28px)',
              transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
            }}
          >
            {/* Top Glow Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
                opacity: 0.8,
              }}
            />

            {/* Ghost Kanji Watermark */}
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '16px',
                fontSize: '4.8rem',
                fontWeight: 900,
                lineHeight: 1,
                color: 'rgba(245,158,11,0.05)',
                pointerEvents: 'none',
                userSelect: 'none',
                fontFamily: '"Noto Sans JP", sans-serif',
              }}
            >
              経済
            </span>

            {/* Card Content Top */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(245,158,11,0.14)',
                    border: '1px solid rgba(245,158,11,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={22} color="#f59e0b" />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color: '#f59e0b',
                    letterSpacing: '0.12em',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.25)',
                  }}
                >
                  // 03
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#f59e0b',
                  fontWeight: 800,
                  marginBottom: '6px',
                }}
              >
                CREATOR ECONOMY & PASS // 経済
              </div>

              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '10px',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Economía Justa & Pase Estelar
              </h3>

              <p
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  marginBottom: '22px',
                }}
              >
                35% de comisión neta directa para creadores mediante Código de Creador, Pase Estelar de temporada
                y Stardust 100% gratuito para la comunidad por interactuar en directos y eventos.
              </p>
            </div>

            {/* Visual Graphic Element: Creator Code & Revenue Split Breakdown */}
            <div
              style={{
                borderRadius: '14px',
                background: 'rgba(16,12,8,0.75)',
                border: '1px solid rgba(245,158,11,0.25)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header: Pass & Direct Share */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '0.64rem', letterSpacing: '0.08em', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                  REVENUE SHARE // 収益還元
                </span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(245,158,11,0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                >
                  35% COMISIÓN NETA
                </span>
              </div>

              {/* Creator Code voucher box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Código:
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.12em' }}>
                    GUREN
                  </span>
                  <Check size={14} color="#10b981" />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981' }}>
                  +10% Polvo Estelar
                </span>
              </div>

              {/* Revenue Distribution Visual Bar */}
              <div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    display: 'flex',
                    background: 'rgba(255,255,255,0.06)',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ width: '35%', background: '#f59e0b' }} title="35% Creador" />
                  <div style={{ width: '35%', background: '#a78bfa' }} title="35% Servidores e Infraestructura" />
                  <div style={{ width: '30%', background: '#10b981' }} title="30% Fondo de Recompensas y Comunidad" />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '4px',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', display: 'block' }}>35%</span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Creador (@GurenVT_)</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa', display: 'block' }}>35%</span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Servidores & CDN</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', display: 'block' }}>30%</span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Premios y Fans</span>
                  </div>
                </div>
              </div>

              {/* Bottom Agency Guarantee */}
              <div
                style={{
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.64rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Shield size={13} color="#34d399" />
                <span>100% de propiedad sobre tu modelo, nombre y contenido.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styled animation for radar indicator */}
      <style>{`
        .concept-card {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .concept-card:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 35px rgba(139,92,246,0.12) !important;
        }
        .radar-wave {
          display: inline-block;
          animation: radarWave 1.4s ease-in-out infinite alternate;
        }
        @keyframes radarWave {
          0% { height: 6px; opacity: 0.4; }
          100% { height: 18px; opacity: 1; }
        }
      `}</style>
    </section>
  );
}
