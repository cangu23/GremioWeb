'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ClientOnly from '@/lib/ClientOnly';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { hasAnyRole } from '@gremio-estelar/shared';

/* ─────────── Color Theme (Estelar + Café Crema) ─────────── */
const theme = {
  bg: '#140f0c',
  bgLight: '#221914',
  bgCard: 'rgba(38, 29, 23, 0.85)',
  bgCardHover: 'rgba(48, 38, 30, 0.95)',
  cream: '#f5e6d3',
  creamLight: '#faf0e6',
  creamDark: '#d4c4b0',
  brown: '#8B6914',
  brownLight: '#a0782c',
  brownDark: '#6b4f10',
  accent: '#c4956a',
  accentLight: '#d4a87a',
  accentDark: '#a07050',
  text: '#f5e6d3',
  textMuted: '#b8a898',
  textDark: '#7a6a5a',
  gold: '#d4a030',
  goldLight: '#e8c060',
  purple: '#c084fc',
  purpleLight: '#e9d5ff',
  border: 'rgba(212, 160, 48, 0.18)',
  borderHover: 'rgba(212, 160, 48, 0.4)',
};

/* ─────────── SVG Icons ─────────── */
const ICONS = {
  vrchat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10s3-4 10-4 10 4 10 4" />
      <path d="M2 14s3 4 10 4 10-4 10-4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.gold} stroke={theme.gold} strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  globe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z" />
    </svg>
  ),
  discord: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.0371 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  ),
  sparkles: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M6 16l1 2.5L9.5 19l-2.5 1L6 22.5 5 20 2.5 19 5 18z" />
      <path d="M16 4l.5 1.5L18 6l-1.5.5L16 8l-.5-1.5L14 6l1.5-.5z" />
    </svg>
  ),
  music: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.purple} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  tea: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h.01M12 8h.01M7 8h.01" />
      <path d="M5 8h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />
      <path d="M19 11h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2" />
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.gold} stroke={theme.gold} strokeWidth="1">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  gamepad: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="11" r="1" />
      <circle cx="17" cy="13" r="1" />
      <rect x="2" y="6" width="20" height="12" rx="6" />
    </svg>
  ),
  camera: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 12 11 15 16 9" />
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

/* ─────────── Floating Stars Particle Component ─────────── */
function FloatingStars({ count = 25 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 4 + 2,
        delay: `${Math.random() * 5}s`,
        duration: `${3 + Math.random() * 4}s`,
        opacity: 0.2 + Math.random() * 0.4,
      })),
    [count]
  );

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: theme.gold,
            opacity: star.opacity,
            animation: `starFloat ${star.duration} ease-in-out ${star.delay} infinite`,
            boxShadow: `0 0 ${star.size * 2}px ${theme.gold}40`,
          }}
        />
      ))}
      <style>{`
        @keyframes starFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(212,160,48,0.2), 0 0 60px rgba(212,160,48,0.05); }
          50% { box-shadow: 0 0 40px rgba(212,160,48,0.4), 0 0 80px rgba(212,160,48,0.1); }
        }
        @keyframes floatUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─────────── Fast & Resilient Image Component ─────────── */
function SafeImage({
  src,
  alt,
  fallbackSrc = '/hoshi.png',
  style,
  className,
}: {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>(() => src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      loading="lazy"
      decoding="async"
      style={style}
      className={className}
    />
  );
}

/* ─────────── Photo Carousel Component ─────────── */
function PhotoCarousel({ images }: { images: { url: string; title?: string; caption?: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fallback default images if user hasn't added photos yet
  const slides = useMemo(() => {
    if (images && images.length > 0) return images;
    return [
      {
        url: '/hoshi.png',
        title: 'Galería VRChat Hoshizora',
        caption: 'Explora nuestros momentos especiales, eventos y reuniones en VRChat.',
      },
      {
        url: '/hoshi.png',
        title: 'Noches de Karaoke & Shows',
        caption: 'Disfruta de la música en vivo y la compañía de nuestras maids.',
      },
      {
        url: '/hoshi.png',
        title: 'Instancias & Espacios VIP',
        caption: 'Un ambiente acogedor preparado con cariño para toda la comunidad.',
      },
    ];
  }, [images]);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, slides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section id="galeria" style={{ padding: '60px 24px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span
            style={{
              color: theme.gold,
              fontWeight: 800,
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {ICONS.camera} Galería de Recuerdos VRChat {ICONS.sparkles}
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: theme.cream, marginTop: '8px' }}>
            Galería <span style={{ color: theme.gold }}>Hoshizora</span>
          </h2>
          <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '4px' }}>
            Capturas y momentos especiales dentro de nuestro mundo en VRChat
          </p>
        </div>

        {/* Main Carousel Frame */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '440px',
            borderRadius: '24px',
            overflow: 'hidden',
            border: `1px solid ${theme.border}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(212,160,48,0.12)',
            background: '#1a1410',
          }}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Slide items */}
          {slides.map((slide, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: idx === currentIndex ? 1 : 0,
                transform: `scale(${idx === currentIndex ? 1 : 1.05})`,
                transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: idx === currentIndex ? 'auto' : 'none',
              }}
            >
              {/* Background Image with Safe Fallback */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                <SafeImage
                  src={slide.url}
                  alt={slide.title || 'Foto de Galería'}
                  fallbackSrc="/hoshi.png"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.75) contrast(1.05)',
                  }}
                />
              </div>

              {/* Gradient overlays for cinematic contrast */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(20,15,12,0.95) 0%, rgba(20,15,12,0.4) 40%, rgba(20,15,12,0.2) 100%)',
                }}
              />

              {/* Slide Caption Box */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '36px',
                  left: '36px',
                  right: '36px',
                  zIndex: 3,
                  maxWidth: '650px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: 'rgba(212,160,48,0.2)',
                    border: '1px solid rgba(212,160,48,0.4)',
                    color: theme.gold,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                  }}
                >
                  {idx + 1} / {slides.length} • Momento VRChat
                </div>
                <h3 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800, color: theme.cream, marginBottom: '6px' }}>
                  {slide.title || 'Hoshizora Maid Café'}
                </h3>
                <p style={{ fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.6, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  {slide.caption || 'Recuerdos de nuestras aperturas y eventos en VRChat.'}
                </p>
              </div>
            </div>
          ))}

          {/* Navigation Controls (Arrows) */}
          {slides.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                aria-label="Anterior foto"
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(38, 29, 23, 0.75)',
                  border: `1px solid ${theme.border}`,
                  color: theme.cream,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212,160,48,0.3)';
                  e.currentTarget.style.borderColor = theme.gold;
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(38, 29, 23, 0.75)';
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                onClick={handleNext}
                aria-label="Siguiente foto"
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(38, 29, 23, 0.75)',
                  border: `1px solid ${theme.border}`,
                  color: theme.cream,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212,160,48,0.3)';
                  e.currentTarget.style.borderColor = theme.gold;
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(38, 29, 23, 0.75)';
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {/* Dots Indicators */}
          {slides.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '18px',
                right: '36px',
                zIndex: 5,
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Ver foto ${idx + 1}`}
                  style={{
                    width: idx === currentIndex ? '28px' : '9px',
                    height: '9px',
                    borderRadius: '5px',
                    background: idx === currentIndex ? theme.gold : 'rgba(255,255,255,0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: idx === currentIndex ? '0 0 10px rgba(212,160,48,0.6)' : 'none',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Experiencias VRChat Data ─────────── */
interface VrExperience {
  id: string;
  name: string;
  category: 'anfitrionia' | 'shows' | 'juegos';
  desc: string;
  badge: string;
  icon: React.ReactNode;
  highlights: string[];
}

const VR_EXPERIENCES: VrExperience[] = [
  {
    id: 'anfitrionia-1',
    name: 'Anfitrionía & Reservados Privados',
    category: 'anfitrionia',
    desc: 'Atención dedicada de nuestras maids en los reservados del café en VRChat. Espacios tranquilos para platicar y pasar un momento acogedor.',
    badge: 'Atención VRChat',
    icon: ICONS.heart,
    highlights: ['Conversación amena', 'Acompañamiento VIP', 'Ambiente relajado'],
  },
  {
    id: 'shows-1',
    name: 'Shows de Canto & Karaoke en Vivo',
    category: 'shows',
    desc: 'Presentaciones musicales en el escenario principal del mapa de VRChat. Disfruta de canciones interpretadas por las maids o únete a la tarima.',
    badge: 'Espectáculo VR',
    icon: ICONS.music,
    highlights: ['Música en vivo', 'Karaoke grupal', 'Luces y escenario estelar'],
  },
  {
    id: 'juegos-1',
    name: 'Dinámicas & Mini-Juegos VR',
    category: 'juegos',
    desc: 'Juegos interactivos, trivias anime y competencias amistosas dentro del mundo virtual en VRChat.',
    badge: 'Interactividad',
    icon: ICONS.gamepad,
    highlights: ['Trivias en equipo', 'Rallys virtuales', 'Premios del Gremio'],
  },
  {
    id: 'anfitrionia-2',
    name: 'Ceremonia del Té Virtual',
    category: 'anfitrionia',
    desc: 'Una experiencia guiada para compartir un momento de serenidad y charla tradicional alrededor de la mesa estelar.',
    badge: 'Experiencia Kawaii',
    icon: ICONS.tea,
    highlights: ['Ritual de bienvenida', 'Charlas guiadas', 'Ambiente tradicional'],
  },
  {
    id: 'anfitrionia-3',
    name: 'Hechizo Estelar (Moe Moe Kyun! ✨)',
    category: 'anfitrionia',
    desc: 'Bendición kawaii y rituales de roleplay para animar tu día y desearte la mejor de las suertes en tus aventuras virtuales.',
    badge: 'Roleplay Maid',
    icon: ICONS.sparkles,
    highlights: ['Encanto kawaii', 'Roleplay interactivo', 'Fotografía especial'],
  },
  {
    id: 'shows-2',
    name: 'Sesión Fotográfica & Recuerdos Estelares',
    category: 'shows',
    desc: 'Posa junto a tus maids favoritas en las zonas temáticas del mapa de VRChat para conservar un recuerdo fotográfico.',
    badge: 'Fotografía VR',
    icon: ICONS.camera,
    highlights: ['Zonas temáticas', 'Fotos de recuerdo', 'Publicación en comunidad'],
  },
];

interface StaffMember {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  displayedRole?: string;
  status?: string;
  vtuberProfile?: {
    displayName: string;
    avatarUrl: string | null;
    description: string | null;
    isVerified: boolean;
    isApproved: boolean;
    streamSchedule?: string | null;
    twitchUrl?: string | null;
    youtubeUrl?: string | null;
  } | null;
}

const fallbackStaff: StaffMember[] = [
  {
    id: '1',
    username: 'hana_hoshizora',
    role: 'MAID',
    vtuberProfile: {
      displayName: 'Hoshizora Hana',
      avatarUrl: null,
      description: 'Fundadora y Head Maid. Te da la bienvenida con calidez y dedicación a nuestra casa en VRChat.',
      isVerified: true,
      isApproved: true,
    },
  },
  {
    id: '2',
    username: 'luna_tsukino',
    role: 'MAID',
    vtuberProfile: {
      displayName: 'Luna Tsukino',
      avatarUrl: null,
      description: 'Anfitriona estelar especialista en dinámicas de canto, karaoke y charlas nocturnas acogedoras.',
      isVerified: true,
      isApproved: true,
    },
  },
  {
    id: '3',
    username: 'sora_aoi',
    role: 'MAID',
    vtuberProfile: {
      displayName: 'Sora Aoi',
      avatarUrl: null,
      description: 'Creadora de eventos interactivos y guías de bienvenida para los nuevos visitantes de VRChat.',
      isVerified: true,
      isApproved: true,
    },
  },
  {
    id: '4',
    username: 'rin_kagamine',
    role: 'MAID',
    vtuberProfile: {
      displayName: 'Rin Star',
      avatarUrl: null,
      description: 'La alegría del café. Siempre lista para hacer sonreír a cada cliente en el escenario.',
      isVerified: true,
      isApproved: true,
    },
  },
];

/* ─────────── Glass Card Container ─────────── */
function GlassCard({
  children,
  style,
  hoverable = true,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  hoverable?: boolean;
  delay?: number;
}) {
  return (
    <div
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: '20px',
        padding: '28px',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `floatUp 0.6s ease ${delay}s forwards`,
        opacity: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = theme.borderHover;
          e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(212,160,48,0.1)';
          e.currentTarget.style.background = theme.bgCardHover;
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.background = theme.bgCard;
        }
      }}
    >
      {children}
    </div>
  );
}

/* ─────────── Staff Member Card Widget ─────────── */
function StaffCard({ member, index }: { member: StaffMember; index: number }) {
  const displayName = member.vtuberProfile?.displayName || member.displayName || member.username;
  const avatarUrl = member.vtuberProfile?.avatarUrl || member.avatarUrl;
  const description = member.vtuberProfile?.description || member.bio || 'Anfitriona Maid en el espacio virtual de VRChat.';
  const isVerified = member.vtuberProfile?.isVerified || false;
  const isRealUser = member.id.length > 5;

  const card = (
    <GlassCard delay={0.1 + index * 0.08} style={{ textAlign: 'center', padding: '32px 24px', position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          width: '86px',
          height: '86px',
          borderRadius: '50%',
          margin: '0 auto 16px',
          overflow: 'hidden',
          border: `2px solid ${theme.gold}`,
          boxShadow: '0 0 20px rgba(212,160,48,0.2)',
        }}
      >
        <SafeImage src={avatarUrl} alt={displayName} fallbackSrc="/hoshi.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {isVerified && (
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#1d9bf0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #140f0c',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: theme.cream, marginBottom: '4px' }}>
        {displayName}
      </h4>

      <div
        style={{
          display: 'inline-block',
          fontSize: '0.72rem',
          color: theme.purpleLight,
          fontWeight: 700,
          marginBottom: '12px',
          padding: '2px 10px',
          borderRadius: '12px',
          background: 'rgba(192,132,252,0.12)',
          border: '1px solid rgba(192,132,252,0.25)',
          letterSpacing: '0.04em',
        }}
      >
        Maid Staff VRChat
      </div>

      <p style={{ fontSize: '0.84rem', color: theme.textMuted, lineHeight: 1.7, minHeight: '3.4em' }}>
        {description}
      </p>

      {isRealUser && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: theme.gold,
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(212,160,48,0.1)',
              border: `1px solid rgba(212,160,48,0.25)`,
              transition: 'all 0.2s ease',
            }}
          >
            Ver Perfil {ICONS.arrowRight}
          </span>
        </div>
      )}
    </GlassCard>
  );

  return isRealUser ? (
    <Link key={member.id} href={`/profile/${member.username}`} style={{ textDecoration: 'none' }}>
      {card}
    </Link>
  ) : (
    card
  );
}

/* ─────────── Hoshizora Maid Content Component ─────────── */
function HoshizoraMaidContent() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'anfitrionia' | 'shows' | 'juegos'>('all');
  const [now, setNow] = useState(() => Date.now());
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(fallbackStaff);
  const [staffLoading, setStaffLoading] = useState(true);
  const [copiedWorld, setCopiedWorld] = useState(false);

  // Settings fetched from backend
  const [cafeSettings, setCafeSettings] = useState({
    cafe_tagline: 'Tu hogar estelar de convivencia, experiencias y magia maid en VRChat',
    cafe_description:
      'Un espacio acogedor en VRChat creado por el Gremio Estelar donde combinamos entretenimiento virtual, eventos kawaii y momentos mágicos junto a nuestras maids.',
    cafe_welcome_message: '¡Bienvenido a Hoshizora Maid Café! ✨ Toma asiento en nuestras instancias virtuales y déjate consentir por nuestras maids.',
    cafe_vrchat_world: 'Hoshizora Maid Café (VRChat)',
    cafe_schedule: 'Instancias VRChat activas los fines de semana y eventos especiales programados.',
    cafe_discord_url: 'https://discord.gg/hoshizora',
    cafe_twitter_url: 'https://twitter.com/hoshizora_maid',
    cafe_carousel_images: '',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load real data from API
  useEffect(() => {
    (async () => {
      try {
        const [maidsData, settingsData] = await Promise.allSettled([
          apiFetch('/users/role/MAID', {}),
          apiFetch('/admin/settings', {}),
        ]);

        if (maidsData.status === 'fulfilled' && Array.isArray(maidsData.value) && maidsData.value.length > 0) {
          setStaffMembers(maidsData.value);
        }

        if (settingsData.status === 'fulfilled' && settingsData.value?.settings) {
          const s = settingsData.value.settings;
          setCafeSettings((prev) => ({
            ...prev,
            cafe_tagline: s.cafe_tagline || prev.cafe_tagline,
            cafe_description: s.cafe_description || prev.cafe_description,
            cafe_welcome_message: s.cafe_welcome_message || prev.cafe_welcome_message,
            cafe_vrchat_world: s.cafe_vrchat_world || prev.cafe_vrchat_world,
            cafe_schedule: s.cafe_schedule || prev.cafe_schedule,
            cafe_discord_url: s.cafe_discord_url || prev.cafe_discord_url,
            cafe_twitter_url: s.cafe_twitter_url || prev.cafe_twitter_url,
            cafe_carousel_images: s.cafe_carousel_images || prev.cafe_carousel_images,
          }));
        }
      } catch {
        // Fallback initialized
      } finally {
        setStaffLoading(false);
      }
    })();
  }, []);

  const handleCopyWorld = () => {
    navigator.clipboard.writeText(cafeSettings.cafe_vrchat_world);
    setCopiedWorld(true);
    setTimeout(() => setCopiedWorld(false), 2500);
  };

  const carouselImages = useMemo(() => {
    if (!cafeSettings.cafe_carousel_images) return [];
    return cafeSettings.cafe_carousel_images
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, i) => ({
        url,
        title: `Foto ${i + 1} — VRChat Hoshizora`,
        caption: 'Fotografía de nuestros eventos e instancias en VRChat.',
      }));
  }, [cafeSettings.cafe_carousel_images]);

  const filteredExperiences =
    selectedCategory === 'all'
      ? VR_EXPERIENCES
      : VR_EXPERIENCES.filter((exp) => exp.category === selectedCategory);

  const events = [
    {
      day: 'Viernes',
      date: 'Cada semana',
      title: 'Noche de Karaoke & Canto',
      desc: 'Sube a la tarima del mapa de VRChat o apoya a nuestras maids en vivo. Una noche llena de música anime, J-Pop y talento.',
      color: '#e040fb',
      bgColor: 'rgba(224,64,251,0.08)',
      borderColor: 'rgba(224,64,251,0.25)',
      icon: ICONS.music,
      tags: ['VRChat', 'Karaoke', 'Música En Vivo'],
    },
    {
      day: 'Sábado',
      date: 'Especial temático',
      title: 'Cat Café & Noche Kawaii',
      desc: 'Edición especial con avatares temáticos, diademas de orejitas y dinámicas exclusivas dentro del servidor VRChat.',
      color: '#ff9800',
      bgColor: 'rgba(255,152,0,0.08)',
      borderColor: 'rgba(255,152,0,0.25)',
      icon: ICONS.sparkles,
      tags: ['Roleplay', 'Kawaii', 'VRChat'],
    },
    {
      day: 'Jueves',
      date: 'Cada 2 semanas',
      title: 'Ceremonia del Té & Charlas',
      desc: 'Una velada serena para conversar, conocer a los miembros de la comunidad y relajarse en los reservados virtuales.',
      color: '#4caf50',
      bgColor: 'rgba(76,175,80,0.08)',
      borderColor: 'rgba(76,175,80,0.25)',
      icon: ICONS.tea,
      tags: ['Charla', 'Relax', 'VIP Lounge'],
    },
    {
      day: 'Domingo',
      date: 'Cierre de semana',
      title: 'Lounge Estelar Nocturno',
      desc: 'Luz tenue, música ambiente y momentos acogedores para cerrar el fin de semana junto al staff Maid.',
      color: '#64b5f6',
      bgColor: 'rgba(100,181,246,0.08)',
      borderColor: 'rgba(100,181,246,0.25)',
      icon: ICONS.vrchat,
      tags: ['Comunidad', 'Social', 'VRChat'],
    },
  ];

  // Countdown calculations
  const nextEvent = useMemo(() => {
    const d = new Date(now);
    const today = d.getDay();
    const eventDays = [4, 5, 6, 0];
    const eventNames = ['Ceremonia del Té', 'Noche de Karaoke', 'Cat Café Kawaii', 'Lounge Estelar'];
    const eventColors = ['#4caf50', '#e040fb', '#ff9800', '#64b5f6'];

    let nextIdx = -1;
    let minDays = 8;
    for (let i = 0; i < eventDays.length; i++) {
      let diff = eventDays[i] - today;
      if (diff <= 0) diff += 7;
      if (diff < minDays) {
        minDays = diff;
        nextIdx = i;
      }
    }

    if (nextIdx === -1) return null;
    return { name: eventNames[nextIdx], color: eventColors[nextIdx], days: minDays };
  }, [now]);

  const getSectionStyle = (from: string, to: string) => ({
    padding: '80px 24px',
    background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
  });

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text }}>
      {/* █████████████████████ HERO SECTION (2-Column Split) █████████████████████ */}
      <section
        style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `radial-gradient(ellipse at top left, #2c1a3b 0%, #1c1319 55%, #100b08 100%)`,
          overflow: 'hidden',
          padding: '60px 24px',
        }}
      >
        <FloatingStars count={35} />

        {/* Dynamic Glow Nebulas */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '-5%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(192,132,252,0.14), transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '-5%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,160,48,0.14), transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          {/* LEFT COLUMN: Main Copy & Actions */}
          <div
            style={{
              animation: 'floatUp 0.8s ease 0.2s forwards',
              opacity: 0,
            }}
          >
            {/* Top Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'rgba(212,160,48,0.12)',
                  border: '1px solid rgba(212,160,48,0.3)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: theme.gold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {ICONS.sparkles}
                <span>Gremio Estelar Oficial</span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(76,175,80,0.12)',
                  border: '1px solid rgba(76,175,80,0.3)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#81c784',
                  letterSpacing: '0.04em',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4caf50', display: 'inline-block', boxShadow: '0 0 8px #4caf50' }} />
                <span>Instancia VRChat Activa</span>
              </div>
            </div>

            {/* Main Heading */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: '20px',
                color: theme.cream,
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #f5e6d3 0%, #e8c060 50%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Hoshizora Maid Café
              </span>
            </h1>

            {/* Subtitle / Tagline */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
                color: theme.textMuted,
                lineHeight: 1.8,
                marginBottom: '32px',
                maxWidth: '560px',
              }}
            >
              {cafeSettings.cafe_tagline}
            </p>

            {/* VRChat World Name Copy Card */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                borderRadius: '16px',
                background: 'rgba(38, 29, 23, 0.85)',
                border: `1px solid ${theme.border}`,
                marginBottom: '36px',
                maxWidth: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ICONS.vrchat}
                <span style={{ fontSize: '0.82rem', color: theme.textMuted, fontWeight: 600 }}>Mundo:</span>
                <strong style={{ fontSize: '0.92rem', color: theme.cream }}>{cafeSettings.cafe_vrchat_world}</strong>
              </div>
              <button
                onClick={handleCopyWorld}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: copiedWorld ? 'rgba(76,175,80,0.25)' : 'rgba(212,160,48,0.18)',
                  border: `1px solid ${copiedWorld ? 'rgba(76,175,80,0.5)' : 'rgba(212,160,48,0.35)'}`,
                  color: copiedWorld ? '#81c784' : theme.gold,
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {copiedWorld ? ICONS.check : ICONS.copy}
                {copiedWorld ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                href="#galeria"
                scroll={false}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 36px',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #d4a030, #c4956a)',
                  color: '#140f0c',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 4px 24px rgba(212,160,48,0.35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 36px rgba(212,160,48,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,160,48,0.35)';
                }}
              >
                {ICONS.camera} Explorar Galería
              </Link>

              <a
                href={cafeSettings.cafe_discord_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  border: '1px solid rgba(88,101,242,0.4)',
                  background: 'rgba(88,101,242,0.18)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(88,101,242,0.35)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(88,101,242,0.18)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {ICONS.discord} Comunidad en Discord
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Feature Showcase Card */}
          <div
            style={{
              position: 'relative',
              animation: 'floatUp 0.8s ease 0.4s forwards',
              opacity: 0,
            }}
          >
            {/* Ambient Card Shadow Ring */}
            <div
              style={{
                position: 'absolute',
                inset: '-10px',
                borderRadius: '32px',
                background: 'linear-gradient(135deg, rgba(212,160,48,0.25), rgba(192,132,252,0.25))',
                filter: 'blur(20px)',
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                background: 'rgba(30, 22, 17, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212,160,48,0.3)',
                borderRadius: '28px',
                padding: '32px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              {/* Top Maid Avatar & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    border: '2px solid #d4a030',
                    boxShadow: '0 0 20px rgba(212,160,48,0.3)',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <Image src="/hoshi.png" alt="Hoshizora Maid" fill style={{ objectFit: 'cover' }} priority />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.cream, marginBottom: '4px' }}>
                    Hoshizora Maid Café
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: theme.gold, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {ICONS.sparkles} VRChat Roleplay & Entertainment
                  </span>
                </div>
              </div>

              {/* Live Info Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                {nextEvent && (
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '16px',
                      background: `${nextEvent.color}15`,
                      border: `1px solid ${nextEvent.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: nextEvent.color, fontWeight: 800, textTransform: 'uppercase' }}>
                        Próxima Noche de Evento
                      </span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: theme.cream, marginTop: '2px' }}>
                        {nextEvent.name}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '10px',
                        background: `${nextEvent.color}25`,
                        color: nextEvent.color,
                        fontSize: '0.78rem',
                        fontWeight: 800,
                      }}
                    >
                      {nextEvent.days === 0 ? '¡Hoy!' : nextEvent.days === 1 ? 'Mañana' : `En ${nextEvent.days} días`}
                    </span>
                  </div>
                )}

                {/* Staff Highlights */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                      Staff Anfitrionas
                    </span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: theme.cream, marginTop: '2px' }}>
                      {staffMembers.length} Maids Registradas
                    </div>
                  </div>

                  {/* Avatars Stack */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {staffMembers.slice(0, 4).map((m, idx) => (
                      <div
                        key={m.id}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid #1e1611',
                          marginLeft: idx > 0 ? '-10px' : '0',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #d4a030, #c084fc)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#fff',
                        }}
                      >
                        <SafeImage
                          src={m.vtuberProfile?.avatarUrl || m.avatarUrl}
                          alt={m.username}
                          fallbackSrc="/hoshi.png"
                          style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags bar */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['#VRChatWorld', '#LiveKaraoke', '#MaidRoleplay', '#GremioEstelar'].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: theme.purpleLight,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'rgba(192,132,252,0.1)',
                      border: '1px solid rgba(192,132,252,0.2)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* █████████████████████ STATS / SUMMARY BAR █████████████████████ */}
      <section style={{ padding: '0 24px', marginTop: '-50px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { icon: ICONS.vrchat, value: 'VRChat', label: 'Plataforma Virtual Oficial' },
            { icon: ICONS.heart, value: `${staffMembers.length} Maids`, label: 'Staff Reales Activas' },
            { icon: ICONS.music, value: 'Semanales', label: 'Eventos & Karaoke en Vivo' },
            { icon: ICONS.globe, value: 'Comunidad', label: 'Acceso por Discord Oficial' },
          ].map((stat, i) => (
            <GlassCard key={i} delay={0.2 + i * 0.1} style={{ textAlign: 'center', padding: '24px 18px' }}>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: theme.gold, marginBottom: '2px' }}>{stat.value}</div>
              <div style={{ fontSize: '0.82rem', color: theme.textMuted }}>{stat.label}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* █████████████████████ PHOTO CAROUSEL / BANNER DE FOTOS █████████████████████ */}
      <PhotoCarousel images={carouselImages} />

      {/* █████████████████████ SOBRE EL CAFÉ VIRTUAL █████████████████████ */}
      <section id="about" style={getSectionStyle(theme.bg, theme.bgLight)}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: theme.gold, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Experiencia Virtual
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: theme.cream, marginBottom: '16px', marginTop: '8px' }}>
              Bienvenido a <span style={{ color: theme.gold }}>Hoshizora Maid Café</span>
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.98rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.8 }}>
              {cafeSettings.cafe_description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              {
                icon: ICONS.vrchat,
                title: 'Instancias & Mapa en VRChat',
                desc: 'Un mundo diseñado para el roleplay, con zonas privadas, escenario musical, barra de acompañamiento y decoración estelar.',
              },
              {
                icon: ICONS.heart,
                title: 'Anfitrionía & Atención Cálida',
                desc: 'Nuestras maids están preparadas para brindarte momentos agradables, pláticas amables y actividades dentro del servidor.',
              },
              {
                icon: ICONS.shield,
                title: 'Espacio Seguro & Respetuoso',
                desc: 'Garantizamos una convivencia sana bajo normas de respeto, consentimiento y cordialidad en todas las aperturas.',
              },
            ].map((item, i) => (
              <GlassCard key={i} delay={0.2 + i * 0.08}>
                <div style={{ marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.cream, marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ fontSize: '0.88rem', color: theme.textMuted, lineHeight: 1.8 }}>{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* █████████████████████ EXPERIENCIAS & ATENCIONES (Sin bebidas físicas) █████████████████████ */}
      <section id="experiencias" style={getSectionStyle(theme.bgLight, theme.bg)}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: theme.gold, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {ICONS.sparkles} Atenciones en VRChat {ICONS.sparkles}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: theme.cream, marginTop: '8px', marginBottom: '8px' }}>
              Experiencias & Dinámicas
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.92rem' }}>
              Todas nuestras actividades están diseñadas para disfrutarse dentro del mundo virtual en VRChat
            </p>
          </div>

          {/* Categorías */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '36px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Todas las Experiencias' },
              { id: 'anfitrionia', label: 'Anfitrionía & Reservados' },
              { id: 'shows', label: 'Shows & Fotografía' },
              { id: 'juegos', label: 'Dinámicas VR' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: selectedCategory === cat.id ? `2px solid ${theme.gold}` : `1px solid ${theme.border}`,
                  background: selectedCategory === cat.id ? 'rgba(212,160,48,0.15)' : 'rgba(38,29,23,0.6)',
                  color: selectedCategory === cat.id ? theme.gold : theme.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grilla de Experiencias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
            {filteredExperiences.map((exp, i) => (
              <GlassCard key={exp.id} delay={0.1 + i * 0.05} style={{ padding: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(212,160,48,0.12)',
                      border: '1px solid rgba(212,160,48,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {exp.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: theme.gold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(212,160,48,0.1)',
                      }}
                    >
                      {exp.badge}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: theme.cream, marginTop: '4px' }}>{exp.name}</h4>
                  </div>
                </div>

                <p style={{ fontSize: '0.86rem', color: theme.textMuted, lineHeight: 1.7, marginBottom: '16px' }}>{exp.desc}</p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {exp.highlights.map((h, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        color: theme.creamDark,
                        padding: '3px 9px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      • {h}
                    </span>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* █████████████████████ STAFF MAIDS REALES █████████████████████ */}
      <section style={getSectionStyle(theme.bg, theme.bgLight)}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: theme.gold, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {ICONS.sparkles} Staff de la Comunidad {ICONS.sparkles}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: theme.cream, marginTop: '8px', marginBottom: '8px' }}>
              Nuestras Maids Reales
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.92rem' }}>
              Conoce al equipo de anfitrionas que hacen posible cada apertura en VRChat
            </p>
          </div>

          {staffLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4].map((i) => (
                <GlassCard key={i} delay={0.1 * i} hoverable={false} style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      margin: '0 auto 16px',
                      background: 'rgba(255,255,255,0.03)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                  <div style={{ height: '16px', width: '120px', margin: '0 auto 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)' }} />
                  <div style={{ height: '12px', width: '80px', margin: '0 auto 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }} />
                </GlassCard>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {staffMembers.map((member, i) => (
                <StaffCard key={member.id} member={member} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* █████████████████████ EVENTOS EN VRCHAT █████████████████████ */}
      <section id="events" style={getSectionStyle(theme.bgLight, theme.bg)}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: theme.gold, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Calendario Virtual
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: theme.cream, marginTop: '8px', marginBottom: '8px' }}>
              Eventos en VRChat
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.92rem' }}>
              Revisa nuestras actividades semanales en el mundo del café
            </p>

            {nextEvent && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  padding: '8px 20px',
                  borderRadius: '14px',
                  background: `${nextEvent.color}15`,
                  border: `1px solid ${nextEvent.color}35`,
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: nextEvent.color,
                }}
              >
                {ICONS.clock}
                <span>Próximo Evento:</span>
                <span>{nextEvent.name}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{nextEvent.days === 0 ? '¡Hoy!' : nextEvent.days === 1 ? 'Mañana' : `En ${nextEvent.days} días`}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map((event, i) => (
              <GlassCard
                key={i}
                delay={0.1 + i * 0.08}
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '28px',
                  background: event.bgColor,
                  border: `1px solid ${event.borderColor}`,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px', padding: '6px 0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: event.color, marginBottom: '6px' }}>
                    {event.day}
                  </span>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '14px',
                      background: `${event.color}20`,
                      border: `2px solid ${event.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {event.icon}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: theme.textMuted, marginTop: '8px', textAlign: 'center' }}>{event.date}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: theme.cream }}>{event.title}</h3>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: theme.textMuted, lineHeight: 1.7 }}>{event.desc}</p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${theme.border}`,
                          fontSize: '0.7rem',
                          color: theme.textMuted,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* █████████████████████ REGLAS DE CONVIVENCIA VRCHAT █████████████████████ */}
      <section style={{ padding: '80px 24px', background: theme.bg }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: theme.gold, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Convivencia Sana
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: theme.cream, marginTop: '8px', marginBottom: '8px' }}>
              Reglas de Respeto en VRChat
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.92rem' }}>
              Para asegurar una experiencia cómoda para todos nuestros visitantes y maids
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {[
              {
                title: '1. Respeto al Espacio Personal',
                desc: 'Evita acosar, invadir el espacio virtual sin consentimiento o realizar gestos inapropiados en VRChat.',
              },
              {
                title: '2. Tono de Voz Cordial',
                desc: 'Mantén un volumen moderado en el micrófono para permitir que todos puedan platicar y disfrutar la velada.',
              },
              {
                title: '3. Magia del Roleplay',
                desc: 'Disfruta la temática del café con buena actitud y respeta el trabajo de las maids y moderadores.',
              },
            ].map((rule, idx) => (
              <GlassCard key={idx} delay={0.1 * idx} style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: theme.gold, marginBottom: '8px' }}>{rule.title}</h3>
                <p style={{ fontSize: '0.86rem', color: theme.textMuted, lineHeight: 1.7 }}>{rule.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* █████████████████████ ÚNETE COMO MAID / POSTULACIÓN █████████████████████ */}
      <section style={{ padding: '80px 24px', background: theme.bgLight }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <GlassCard style={{ textAlign: 'center', padding: '44px 32px', background: 'linear-gradient(135deg, rgba(38,29,23,0.9), rgba(192,132,252,0.08))' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                margin: '0 auto 20px',
                background: 'rgba(192,132,252,0.15)',
                border: '2px solid rgba(192,132,252,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {ICONS.heart}
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: theme.cream, marginBottom: '12px' }}>
              ¿Te gustaría unirte como Maid en VRChat?
            </h3>
            <p style={{ color: theme.textMuted, fontSize: '0.94rem', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto 28px' }}>
              Si eres VTuber, creadora de contenido o apasionada de la cultura Maid Café y VRChat, únete a nuestro equipo de anfitrionas oficiales.
            </p>

            <a
              href={cafeSettings.cafe_discord_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 32px',
                borderRadius: '14px',
                fontSize: '0.92rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #c084fc, #a0782c)',
                color: '#ffffff',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(192,132,252,0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(192,132,252,0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(192,132,252,0.3)';
              }}
            >
              {ICONS.discord} Postularse en Discord
            </a>
          </GlassCard>
        </div>
      </section>

      {/* █████████████████████ FOOTER FINAL CTA █████████████████████ */}
      <section
        style={{
          padding: '100px 24px',
          background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bgLight} 50%, ${theme.bg} 100%)`,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <FloatingStars count={15} />
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: '90px',
              height: '90px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(212,160,48,0.25)',
            }}
          >
            <Image src="/hoshi.png" alt="Hoshizora Maid" width={90} height={90} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          </div>

          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: theme.cream, marginBottom: '16px' }}>
            Te Esperamos en el Mundo Virtual ✨
          </h2>
          <p style={{ color: theme.textMuted, fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '28px' }}>
            {cafeSettings.cafe_welcome_message}
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 30px',
                borderRadius: '14px',
                fontSize: '0.9rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #d4a030, #c4956a)',
                color: '#140f0c',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {ICONS.home} Volver al Inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────── Coming Soon Component (Normal Users when under construction) ─────────── */
function ComingSoonContent() {
  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 20px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,160,48,0.18) 0%, rgba(192,132,252,0.12) 40%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '680px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(20, 15, 12, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 160, 48, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 160, 48, 0.15)',
          borderRadius: '32px',
          padding: '48px 32px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '20px',
            background: 'rgba(212, 160, 48, 0.12)',
            border: '1px solid rgba(212, 160, 48, 0.35)',
            color: '#e8c060',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}
        >
          <span>✨ PRÓXIMAMENTE VRCHAT ✨</span>
        </div>

        <div
          style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            margin: '0 auto 28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212,160,48,0.25), rgba(192,132,252,0.25))',
            border: '2px solid rgba(212, 160, 48, 0.5)',
            boxShadow: '0 0 35px rgba(212, 160, 48, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Image src="/hoshi.png" alt="Hoshizora Maid Logo" width={130} height={130} style={{ objectFit: 'contain' }} priority />
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            color: '#f5e6d3',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          Preparando el Espacio Virtual ☕🌸
        </h1>

        <p
          style={{
            color: '#b8a898',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            maxWidth: '520px',
            margin: '0 auto 36px',
          }}
        >
          El equipo del <strong>Hoshizora Maid Café</strong> está preparando una experiencia única en VRChat, llena de eventos en vivo, atenciones exclusivas y momentos mágicos para la comunidad.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 26px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #d4a030, #a0782c)',
              color: '#140f0c',
              fontWeight: 800,
              fontSize: '0.92rem',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(212, 160, 48, 0.35)',
            }}
          >
            🏠 Volver al Inicio
          </Link>

          <Link
            href="/vtubers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 26px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f5e6d3',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
            }}
          >
            ✨ Creadores de Contenido
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Export Wrapper ─────────── */
export default function HoshizoraMaidPage() {
  const { user } = useAuth();

  const isAuthorized = user && hasAnyRole(user.role, ['ADMIN', 'BETA_TESTER', 'MODERATOR', 'STAFF']);

  return (
    <ClientOnly fallback={<div style={{ minHeight: '100vh', background: theme.bg }} />}>
      {isAuthorized ? (
        <>
          <div
            style={{
              background: 'linear-gradient(90deg, #8a2be2, #d4a030)',
              color: '#fff',
              textAlign: 'center',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              position: 'sticky',
              top: '70px',
              zIndex: 90,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            🛡️ VISTA PREVIA EXCLUSIVA ADMIN / BETA TESTER: Estás viendo la versión completa remodelada de Hoshizora Maid Café VRChat.
          </div>
          <HoshizoraMaidContent />
        </>
      ) : (
        <ComingSoonContent />
      )}
    </ClientOnly>
  );
}
