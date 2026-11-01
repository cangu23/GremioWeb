'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Sparkles, Zap, Star, Check } from '@/components/ui/Icons';

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

        {/* 3 Cyber-Agency Cards with Integrated Visual Previews */}
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
              padding: '32px 26px 28px',
              borderRadius: '20px',
              background: 'linear-gradient(165deg, rgba(26,22,38,0.85), rgba(15,14,22,0.95))',
              border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4), 0 0 30px rgba(139,92,246,0.08)',
              opacity: visibleSteps.has(0) ? 1 : 0,
              transform: visibleSteps.has(0) ? 'translateY(0)' : 'translateY(28px)',
              transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Top Subtle Glow Line */}
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
                color: 'rgba(167,139,250,0.06)',
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
                    width: '46px',
                    height: '46px',
                    borderRadius: '13px',
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
                Diseñado para dar vida a personajes virtuales 2D y 3D. Perfiles oficiales con historia,
                modelo, horarios de directos y portafolio de arte en un espacio propio.
              </p>
            </div>

            {/* Visual Graphic Element: Character Dossier Preview */}
            <div
              style={{
                borderRadius: '14px',
                background: 'rgba(10,10,16,0.65)',
                border: '1px solid rgba(139,92,246,0.22)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.64rem', letterSpacing: '0.08em', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase' }}>
                  DOSSIER ARCHIVE // F-01
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

              {/* Character mini badge preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: '2px solid rgba(255,255,255,0.2)',
                    flexShrink: 0,
                  }}
                >
                  ★
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Luna Astral // ルナ
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Vocalist & Gaming VTuber
                  </div>
                </div>
              </div>

              {/* Tech feature pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                  2D Live2D
                </span>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                  3D VRM
                </span>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                  Lore Oficial
                </span>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.12)', color: '#c4b5fd', fontWeight: 700 }}>
                  Galeria HD
                </span>
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
              padding: '32px 26px 28px',
              borderRadius: '20px',
              background: 'linear-gradient(165deg, rgba(20,26,38,0.85), rgba(12,17,26,0.95))',
              border: '1px solid rgba(56,189,248,0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4), 0 0 30px rgba(56,189,248,0.08)',
              opacity: visibleSteps.has(1) ? 1 : 0,
              transform: visibleSteps.has(1) ? 'translateY(0)' : 'translateY(28px)',
              transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
            }}
          >
            {/* Top Subtle Glow Line */}
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
                color: 'rgba(56,189,248,0.06)',
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
                    width: '46px',
                    height: '46px',
                    borderRadius: '13px',
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
                Sincronización automática con Twitch y YouTube. Tu comunidad sabe al instante cuándo inicias
                directo directamente desde la portada y salas temáticas de chat.
              </p>
            </div>

            {/* Visual Graphic Element: Live Radar & Equalizer Audio Visualizer */}
            <div
              style={{
                borderRadius: '14px',
                background: 'rgba(10,12,18,0.65)',
                border: '1px solid rgba(56,189,248,0.22)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'rgba(239,68,68,0.18)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    letterSpacing: '0.06em',
                  }}
                >
                  <span className="landing-live-dot" style={{ width: '5px', height: '5px' }} />
                  ON AIR // 1080p60
                </span>
                <span style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.04em' }}>
                  TWITCH × YOUTUBE
                </span>
              </div>

              {/* Stream Title & Equalizer Simulation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Charla & Karaoke Cósmico
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Salas con Socket.IO y stickers 128px
                  </div>
                </div>

                {/* Animated Equalizer Waves */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '22px' }}>
                  <span className="eq-bar eq-bar--1" />
                  <span className="eq-bar eq-bar--2" />
                  <span className="eq-bar eq-bar--3" />
                  <span className="eq-bar eq-bar--4" />
                  <span className="eq-bar eq-bar--5" />
                </div>
              </div>

              {/* Sync status pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(145,66,255,0.12)', color: '#c084fc', fontWeight: 600 }}>
                  Twitch Live API
                </span>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,0,0,0.1)', color: '#f87171', fontWeight: 600 }}>
                  YouTube Live
                </span>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(56,189,248,0.12)', color: '#38bdf8', fontWeight: 700 }}>
                  Cero Algoritmos
                </span>
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
              padding: '32px 26px 28px',
              borderRadius: '20px',
              background: 'linear-gradient(165deg, rgba(34,26,20,0.85), rgba(20,16,12,0.95))',
              border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4), 0 0 30px rgba(245,158,11,0.08)',
              opacity: visibleSteps.has(2) ? 1 : 0,
              transform: visibleSteps.has(2) ? 'translateY(0)' : 'translateY(28px)',
              transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
            }}
          >
            {/* Top Subtle Glow Line */}
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
                color: 'rgba(245,158,11,0.06)',
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
                    width: '46px',
                    height: '46px',
                    borderRadius: '13px',
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
                Monetización directa con 35% de comisión para creadores mediante Códigos de Creador,
                Pase Estelar de temporada y Stardust 100% gratuito para la comunidad.
              </p>
            </div>

            {/* Visual Graphic Element: Season Pass Ticket & Creator Code Preview */}
            <div
              style={{
                borderRadius: '14px',
                background: 'rgba(18,14,10,0.65)',
                border: '1px dashed rgba(245,158,11,0.3)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.64rem', letterSpacing: '0.08em', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                  VIP SEASON PASS // TICKET
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(245,158,11,0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                >
                  $3.99 o 2,500 ⭐
                </span>
              </div>

              {/* Creator Code simulation banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CÓDIGO:</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.08em' }}>
                    LUNA
                  </span>
                  <Check size={12} color="#10b981" />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981' }}>
                  +10% ⭐ Regalo Fan
                </span>
              </div>

              {/* Split distribution summary */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24', fontWeight: 700 }}>
                  35% Creador
                </span>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                  35% Servidores
                </span>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                  30% Premios
                </span>
                <span style={{ fontSize: '0.64rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#34d399', fontWeight: 700 }}>
                  100% Free Stardust
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styled animation for audio wave equalizer */}
      <style>{`
        .concept-card {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .concept-card:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 35px rgba(139,92,246,0.12) !important;
        }
        .eq-bar {
          width: 3px;
          border-radius: 2px;
          background: #38bdf8;
          display: inline-block;
          animation: eqPulse 1.2s ease-in-out infinite alternate;
        }
        .eq-bar--1 { height: 8px; animation-delay: 0.1s; }
        .eq-bar--2 { height: 16px; animation-delay: 0.3s; }
        .eq-bar--3 { height: 22px; animation-delay: 0.15s; }
        .eq-bar--4 { height: 12px; animation-delay: 0.4s; }
        .eq-bar--5 { height: 18px; animation-delay: 0.25s; }

        @keyframes eqPulse {
          0% { height: 4px; opacity: 0.5; }
          100% { height: 20px; opacity: 1; }
        }
      `}</style>
    </section>
  );
}
