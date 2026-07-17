'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ClientOnly from '@/lib/ClientOnly';
import { apiFetch } from '@/lib/api';

/* ─────────── Color Theme (café crema) ─────────── */
const theme = {
  bg: '#1a1410',
  bgLight: '#2a221c',
  bgCard: 'rgba(45, 38, 32, 0.85)',
  bgCardHover: 'rgba(55, 48, 42, 0.9)',
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
  border: 'rgba(180, 150, 120, 0.15)',
  borderHover: 'rgba(180, 150, 120, 0.3)',
};

/* ─────────── SVG Icons ─────────── */
const ICONS = {
  coffee: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.gold} stroke={theme.gold} strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  globe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  discord: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.0371 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
  ),
  heart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={theme.gold} stroke={theme.gold} strokeWidth="1">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  music: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  cat: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5c-4 0-7 3-7 7v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4c0-4-3-7-7-7z"/><path d="M8 12h.01M16 12h.01"/><circle cx="9" cy="11" r="0.5"/><circle cx="15" cy="11" r="0.5"/><path d="M9 16c1.5 1 4.5 1 6 0"/>
    </svg>
  ),
  tea: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h.01M12 8h.01M7 8h.01"/><rect x="4" y="2" width="16" height="20" rx="3"/><line x1="12" y1="12" x2="12" y2="18"/><path d="M8 18h8"/>
    </svg>
  ),
  lounge: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20"/><path d="M6 12v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><path d="M6 18h12"/><path d="M9 18v2"/><path d="M15 18v2"/>
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 12 11 15 16 9"/>
    </svg>
  ),
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  sparkles: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M6 16l1 2.5L9.5 19l-2.5 1L6 22.5 5 20 2.5 19 5 18z"/><path d="M16 4l.5 1.5L18 6l-1.5.5L16 8l-.5-1.5L14 6l1.5-.5z"/>
    </svg>
  ),
};

/* ─────────── Floating Stars Particle Component ─────────── */
function FloatingStars({ count = 20 }: { count?: number }) {
  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
      opacity: 0.2 + Math.random() * 0.4,
    })),
  [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map(star => (
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

/* ─────────── Menu data ─────────── */
const menuItems = [
  { name: 'Latte Estelar', desc: 'Espresso con leche cremosa y un toque de canela', price: '5.50', cat: 'drinks' },
  { name: 'Matcha Starlight', desc: 'Té matcha premium con leche de almendras', price: '6.00', cat: 'drinks' },
  { name: 'Café de la Galaxia', desc: 'Café cold brew con crema batida y estrellas comestibles', price: '7.50', cat: 'drinks' },
  { name: 'Chocolate Caliente Celestial', desc: 'Chocolate belga con malvaviscos y crema batida', price: '5.00', cat: 'drinks' },
  { name: 'Té de Luna Llena', desc: 'Infusión floral de jazmín y lavanda', price: '4.50', cat: 'drinks' },
  { name: 'Frappé Nebulosa', desc: 'Frappé de vainilla con caramelo y crema', price: '6.50', cat: 'drinks' },
  { name: 'Pastel de la Osa Mayor', desc: 'Pastel de zanahoria con glaseado de queso crema', price: '4.50', cat: 'desserts' },
  { name: 'Galletas de la Vía Láctea', desc: 'Galletas de avena con chispas de chocolate blanco', price: '3.50', cat: 'desserts' },
  { name: 'Macarons Estelares', desc: 'Macarons artesanales de frambuesa y pistacho', price: '5.00', cat: 'desserts' },
  { name: 'Parfait Nebula', desc: 'Parfait de yogur con granola, frutas y miel de estrellas', price: '6.00', cat: 'desserts' },
];

interface StaffMember {
  id: string;
  username: string;
  role: string;
  vtuberProfile?: {
    displayName: string;
    avatarUrl: string | null;
    description: string | null;
    isVerified: boolean;
    isApproved: boolean;
  } | null;
}

const fallbackStaff: StaffMember[] = [
  { id: '1', username: 'hana_hoshizora', role: 'MAID', vtuberProfile: { displayName: 'Hoshizora Hana', avatarUrl: null, description: 'La estrella que guía este café con su calidez y dedicación.', isVerified: true, isApproved: true } },
  { id: '2', username: 'luna_tsukino', role: 'MAID', vtuberProfile: { displayName: 'Luna Tsukino', avatarUrl: null, description: 'Especialista en postres celestiales y conversaciones acogedoras.', isVerified: true, isApproved: true } },
  { id: '3', username: 'sora_aoi', role: 'MAID', vtuberProfile: { displayName: 'Sora Aoi', avatarUrl: null, description: 'Maestra del café y creadora de las bebidas más artísticas.', isVerified: true, isApproved: true } },
  { id: '4', username: 'rin_kagamine', role: 'MAID', vtuberProfile: { displayName: 'Rin Kagamine', avatarUrl: null, description: 'La sonrisa que recibe a cada cliente al entrar.', isVerified: true, isApproved: true } },
];

/* ─────────── Glass Card Widget ─────────── */
function GlassCard({ children, style, hoverable = true, delay = 0 }: {
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
        borderRadius: '18px',
        padding: '28px',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `floatUp 0.6s ease ${delay}s forwards`,
        opacity: 0,
        ...style,
      }}
      onMouseEnter={e => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = theme.borderHover;
          e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.4), 0 0 20px rgba(212,160,48,0.05)';
          e.currentTarget.style.background = theme.bgCardHover;
        }
      }}
      onMouseLeave={e => {
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

/* ─────────── Widget: Staff Card ─────────── */
function StaffCard({ member, index }: { member: StaffMember; index: number }) {
  const displayName = member.vtuberProfile?.displayName || member.username;
  const avatarUrl = member.vtuberProfile?.avatarUrl;
  const description = member.vtuberProfile?.description || 'Miembro del equipo Hoshizora Maid.';
  const isVerified = member.vtuberProfile?.isVerified || false;
  const staffRoles: Record<string, string> = {
    'hana_hoshizora': 'Head Maid / Fundadora',
    'luna_tsukino': 'Maid de Sala',
    'sora_aoi': 'Barista',
    'rin_kagamine': 'Maid de Recepción',
  };
  const staffRole = staffRoles[member.username] || 'Maid';
  const isRealUser = member.id.length > 5;

  const card = (
    <GlassCard key={member.id} delay={0.1 + index * 0.08} style={{ textAlign: 'center', padding: '32px 24px' }}>
      <div style={{
        position: 'relative',
        width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
        overflow: 'hidden',
      }}>
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, rgba(212,160,48,0.25), rgba(196,149,106,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 'bold', color: theme.gold,
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {isVerified && (
          <div style={{
            position: 'absolute', bottom: '0', right: '0',
            width: '22px', height: '22px',
          }}>
            <svg viewBox="0 0 24 24" fill="#1d9bf0">
              <circle cx="12" cy="12" r="10" />
              <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: theme.cream, marginBottom: '4px' }}>
        {displayName}
      </h4>
      <p style={{ fontSize: '0.78rem', color: theme.gold, fontWeight: 600, marginBottom: '10px', letterSpacing: '0.02em' }}>
        {staffRole}
      </p>
      <p style={{ fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.7 }}>
        {description}
      </p>
      {isRealUser && (
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '0.72rem', color: theme.gold, fontWeight: 600,
            padding: '4px 12px', borderRadius: '8px',
            background: 'rgba(212,160,48,0.1)',
            border: `1px solid rgba(212,160,48,0.15)`,
          }}>
            {ICONS.arrowRight} Ver Perfil
          </span>
        </div>
      )}
    </GlassCard>
  );

  return isRealUser ? (
    <Link key={member.id} href={`/profile/${member.id}`} style={{ textDecoration: 'none' }}>
      {card}
    </Link>
  ) : card;
}

/* ─────────── Hoshizora Maid Page ─────────── */
function HoshizoraMaidContent() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [now, setNow] = useState(() => Date.now());
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(fallbackStaff);
  const [staffLoading, setStaffLoading] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => { setNow(Date.now()); }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/users/role/MAID', {});
        if (Array.isArray(data) && data.length > 0) {
          setStaffMembers(data);
        }
      } catch {
        // fallback
      } finally {
        setStaffLoading(false);
      }
    })();
  }, []);

  const categories = [
    { id: 'all', label: 'Todo el Menú' },
    { id: 'drinks', label: 'Bebidas' },
    { id: 'desserts', label: 'Postres' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(i => i.cat === selectedCategory);

  const events = [
    {
      day: 'Viernes', date: 'Cada semana',
      title: 'Noche de Karaoke',
      desc: 'Sube al escenario y canta tus canciones favoritas con nuestras maids. Todos los viernes a las 20:00 VRChat.',
      color: '#e040fb',
      bgColor: 'rgba(224,64,251,0.08)',
      borderColor: 'rgba(224,64,251,0.2)',
      icon: ICONS.music,
      tags: ['Maid Cafe', 'Karaoke', 'Música'],
    },
    {
      day: 'Sábado', date: '1 vez al mes',
      title: 'Cat Café Day',
      desc: 'Día temático con orejas de gato, bebidas especiales color crema y un ambiente super kawaii.',
      color: '#ff9800',
      bgColor: 'rgba(255,152,0,0.08)',
      borderColor: 'rgba(255,152,0,0.2)',
      icon: ICONS.cat,
      tags: ['Temático', 'Kawaii', 'Disfraces'],
    },
    {
      day: 'Jueves', date: 'Cada 2 semanas',
      title: 'Ceremonia de Té Estelar',
      desc: 'Una noche de tranquilidad y tradición. Disfruta de tés premium japoneses mientras aprendes sobre la cultura del té.',
      color: '#4caf50',
      bgColor: 'rgba(76,175,80,0.08)',
      borderColor: 'rgba(76,175,80,0.2)',
      icon: ICONS.tea,
      tags: ['Cultural', 'Té', 'Tradición'],
    },
    {
      day: 'Domingo', date: 'Último domingo del mes',
      title: 'Lounge Estelar',
      desc: 'Una velada relajada con música ambiente, luces tenues y conversaciones acogedoras.',
      color: '#64b5f6',
      bgColor: 'rgba(100,181,246,0.08)',
      borderColor: 'rgba(100,181,246,0.2)',
      icon: ICONS.lounge,
      tags: ['Relax', 'Música', 'Social'],
    },
  ];

  // Next event countdown
  const nextEvent = useMemo(() => {
    const d = new Date(now);
    const today = d.getDay();
    const eventDays = [4, 5, 6, 0];
    const eventNames = ['Ceremonia de Té', 'Noche de Karaoke', 'Cat Café Day', 'Lounge Estelar'];
    const eventColors = ['#4caf50', '#e040fb', '#ff9800', '#64b5f6'];

    let nextIdx = -1;
    let minDays = 8;
    for (let i = 0; i < eventDays.length; i++) {
      let diff = eventDays[i] - today;
      if (diff <= 0) diff += 7;
      if (diff < minDays) { minDays = diff; nextIdx = i; }
    }

    if (nextIdx === -1) return null;
    return { name: eventNames[nextIdx], color: eventColors[nextIdx], days: minDays };
  }, [now]);

  const getSectionStyle = (from: string, to: string) => ({
    padding: '80px 24px',
    background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
  });

  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      {/* █████████████████████ HERO █████████████████████ */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.bg} 0%, #2a1f18 30%, #3d2b1f 60%, ${theme.bgLight} 100%)`,
        overflow: 'hidden',
      }}>
        <FloatingStars count={30} />

        {/* Decorative glow orbs */}
        <div style={{
          position: 'absolute', top: '5%', left: '3%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,160,48,0.08), transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulseGlow 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,149,106,0.06), transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulseGlow 5s ease-in-out 2s infinite',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '700px', height: '700px', borderRadius: '50%',
          border: '1px solid rgba(212,160,48,0.05)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center', padding: '0 24px',
          maxWidth: '700px',
          animation: 'floatUp 0.8s ease 0.2s forwards',
          opacity: 0,
        }}>
          {/* Logo — hoshi.png */}
          <div style={{
            position: 'relative',
            width: '140px', height: '140px',
            margin: '0 auto 28px',
            animation: 'pulseGlow 3s ease-in-out infinite',
          }}>
            <Image
              src="/hoshi.png"
              alt="Hoshizora Maid"
              width={140}
              height={140}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
              priority
            />
            {/* Decorative ring */}
            <div style={{
              position: 'absolute', inset: '-6px',
              borderRadius: '50%',
              border: '2px solid rgba(212,160,48,0.2)',
              animation: 'pulseGlow 3s ease-in-out infinite',
            }} />
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 16px', borderRadius: '20px',
            background: 'rgba(212,160,48,0.1)',
            border: '1px solid rgba(212,160,48,0.2)',
            marginBottom: '20px',
            fontSize: '0.75rem', fontWeight: 600, color: theme.gold,
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>
            {ICONS.sparkles}
            <span>Rama Oficial del Gremio Estelar</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 800,
            lineHeight: 1.05, letterSpacing: '-0.03em',
            marginBottom: '20px',
            color: theme.cream,
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #e8c060, #f5e6d3, #c4956a)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Hoshizora Maid
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
            color: theme.textMuted,
            maxWidth: '560px', margin: '0 auto 36px',
            lineHeight: 1.8,
          }}>
            Un espacio acogedor en VRChat donde el arte del café se encuentra con el encanto de una maid café japonesa. 
            Bienvenido a tu hogar estelar.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="#menu"
              scroll={false}
              onClick={e => { e.preventDefault(); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '16px 36px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #d4a030, #c4956a)', color: '#1a1410',
                textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 4px 24px rgba(212,160,48,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(212,160,48,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,160,48,0.3)'; }}
            >
              {ICONS.home} Ver Menú
            </Link>
            <Link
              href="#events"
              scroll={false}
              onClick={e => { e.preventDefault(); document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '16px 36px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 600,
                border: `2px solid ${theme.borderHover}`, color: theme.cream,
                textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                background: 'rgba(45,38,32,0.5)', backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(55,48,42,0.7)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = theme.gold; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,38,32,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = theme.borderHover; }}
            >
              {ICONS.sparkles} Eventos
            </Link>
          </div>

          {/* Scroll indicator */}
          <div style={{
            marginTop: '60px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            color: theme.textMuted, fontSize: '0.7rem', fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            animation: 'floatUp 0.6s ease 1s forwards', opacity: 0,
          }}>
            <span>Descubre más</span>
            <div style={{
              width: '1px', height: '30px',
              background: `linear-gradient(180deg, ${theme.gold}80, transparent)`,
              animation: 'starFloat 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* █████████████████████ STATS WIDGETS █████████████████████ */}
      <section style={{
        padding: '0 24px',
        marginTop: '-60px',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { icon: ICONS.coffee, value: '15+', label: 'Bebidas Especiales' },
            { icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2"/><path d="M3 21h18"/><path d="M4 21V13a8 8 0 0 1 16 0v8"/><line x1="12" y1="7" x2="12" y2="11"/><path d="M7 13c0 2 2 3 5 3s5-1 5-3"/><path d="M7 17c0 2 2 3 5 3s5-1 5-3"/>
              </svg>
            ), value: '10+', label: 'Postres Artesanales' },
            { icon: ICONS.star, value: '4.9★', label: 'Calificación Estelar' },
            { icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ), value: '500+', label: 'Visitantes Felices' },
          ].map((stat, i) => (
            <GlassCard key={i} delay={0.3 + i * 0.1} style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: theme.gold, marginBottom: '2px' }}>{stat.value}</div>
              <div style={{ fontSize: '0.82rem', color: theme.textMuted }}>{stat.label}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* █████████████████████ ABOUT █████████████████████ */}
      <section id="about" style={getSectionStyle(theme.bg, theme.bgLight)}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: theme.gold, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Bienvenido a
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: theme.cream, marginBottom: '16px', marginTop: '8px' }}>
              Nuestro <span style={{ color: theme.gold }}>Espacio Estelar</span>
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.95rem', maxWidth: '620px', margin: '0 auto', lineHeight: 1.9 }}>
              Un espacio acogedor dentro de VRChat donde combinamos el arte del café con el encanto de una maid café japonesa. 
              Somos parte del Gremio Estelar, dedicados a brindar entretenimiento y servicio al cliente de primera calidad.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                ),
                title: 'Ambiente Acogedor',
                desc: 'Un espacio virtual diseñado para que te sientas como en casa, con una decoración cálida y atención personalizada.',
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
                  </svg>
                ),
                title: 'Comunidad Activa',
                desc: 'Más de 500 miembros activos que comparten su amor por el café, la cultura maid y los espacios sociales en VRChat.',
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ),
                title: 'Servicio Estelar',
                desc: 'Nuestras maids están entrenadas para brindar la mejor experiencia, combinando carisma, profesionalismo y calidez.',
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

      {/* █████████████████████ MENU █████████████████████ */}
      <section id="menu" style={getSectionStyle(theme.bgLight, theme.bg)}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: theme.gold, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {ICONS.sparkles} Nuestro Menú {ICONS.sparkles}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: theme.cream, marginTop: '8px', marginBottom: '8px' }}>
              Delicias Estelares
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>
              Preparado con cariño por nuestras maids para ti
            </p>
          </div>

          {/* Category filter */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '10px 24px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600,
                  border: selectedCategory === cat.id ? `2px solid ${theme.gold}` : `1px solid ${theme.border}`,
                  background: selectedCategory === cat.id ? 'rgba(212,160,48,0.12)' : 'rgba(45,38,32,0.5)',
                  color: selectedCategory === cat.id ? theme.gold : theme.textMuted,
                  cursor: 'pointer', transition: 'all 0.25s ease',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => { if (selectedCategory !== cat.id) { e.currentTarget.style.background = 'rgba(55,48,42,0.7)'; e.currentTarget.style.color = theme.cream; } }}
                onMouseLeave={e => { if (selectedCategory !== cat.id) { e.currentTarget.style.background = 'rgba(45,38,32,0.5)'; e.currentTarget.style.color = theme.textMuted; } }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px' }}>
            {filteredItems.map((item, i) => (
              <GlassCard key={i} delay={0.1 + i * 0.04} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: theme.cream, marginBottom: '4px' }}>{item.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                  <span style={{
                    fontSize: '1rem', fontWeight: 800, color: theme.gold,
                    whiteSpace: 'nowrap', flexShrink: 0,
                    padding: '2px 10px', borderRadius: '8px',
                    background: 'rgba(212,160,48,0.08)',
                  }}>
                    ${item.price}
                  </span>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '3px' }}>
                  {[...Array(5)].map((_, s) => (
                    <span key={s}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={theme.gold} stroke={theme.gold} strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </span>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* █████████████████████ STAFF █████████████████████ */}
      <section style={getSectionStyle(theme.bg, theme.bgLight)}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: theme.gold, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {ICONS.sparkles} Conoce a Nuestro Staff {ICONS.sparkles}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: theme.cream, marginTop: '8px', marginBottom: '8px' }}>
              Las Estrellas del Café
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>
              Conoce a las maids que hacen de Hoshizora Maid un lugar especial
            </p>
          </div>

          {staffLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4].map(i => (
                <GlassCard key={i} delay={0.1 * i} hoverable={false} style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: '16px', width: '120px', margin: '0 auto 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)' }} />
                  <div style={{ height: '12px', width: '80px', margin: '0 auto 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }} />
                  <div style={{ height: '32px', width: '160px', margin: '0 auto', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }} />
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

      {/* █████████████████████ EVENTS █████████████████████ */}
      <section id="events" style={getSectionStyle(theme.bgLight, theme.bg)}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: theme.gold, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Eventos Especiales
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: theme.cream, marginTop: '8px', marginBottom: '8px' }}>
              Experiencias Únicas
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>
              Cada semana traemos algo nuevo y especial para ti
            </p>

            {/* Next event widget */}
            {nextEvent && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                marginTop: '16px', padding: '8px 18px', borderRadius: '12px',
                background: `${nextEvent.color}15`,
                border: `1px solid ${nextEvent.color}30`,
                fontSize: '0.8rem', fontWeight: 700, color: nextEvent.color,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Próximo:</span>
                <span style={{ fontWeight: 800 }}>{nextEvent.name}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ fontWeight: 800 }}>
                  {nextEvent.days === 0 ? '¡Hoy!' : nextEvent.days === 1 ? 'Mañana' : `En ${nextEvent.days} días`}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map((event, i) => (
              <GlassCard key={i} delay={0.1 + i * 0.08}
                style={{
                  display: 'flex', gap: '20px', padding: '28px',
                  background: event.bgColor,
                  border: `1px solid ${event.borderColor}`,
                }}
              >
                {/* Date column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px', padding: '6px 0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: event.color, marginBottom: '4px' }}>
                    {event.day}
                  </span>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `${event.color}15`,
                    border: `2px solid ${event.borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {event.icon}
                  </div>
                  <span style={{ fontSize: '0.6rem', color: theme.textMuted, marginTop: '6px', textAlign: 'center', lineHeight: 1.3 }}>
                    {event.date}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: theme.cream }}>{event.title}</h3>
                    <span style={{
                      padding: '2px 10px', borderRadius: '8px',
                      background: `${event.color}20`,
                      border: `1px solid ${event.borderColor}`,
                      fontSize: '0.68rem', fontWeight: 600, color: event.color,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {event.day}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: theme.textMuted, lineHeight: 1.8 }}>
                    {event.desc}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {event.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '2px 10px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${theme.border}`,
                        fontSize: '0.68rem', color: theme.textMuted,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: event.color, opacity: 0.5 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Suggest event CTA */}
          <GlassCard delay={0.5} style={{ textAlign: 'center', marginTop: '32px', padding: '32px' }}>
            <p style={{ fontSize: '0.9rem', color: theme.textMuted, marginBottom: '16px' }}>
              ¿Tienes una idea para un evento especial? ¡Queremos escucharla!
            </p>
            <a href="#" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #d4a030, #c4956a)', color: '#1a1410',
              textDecoration: 'none', transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,160,48,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Sugerir Evento
            </a>
          </GlassCard>
        </div>
      </section>

      {/* █████████████████████ SCHEDULE / INFO WIDGETS █████████████████████ */}
      <section style={{ padding: '80px 24px', background: theme.bgLight }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 700, color: theme.cream, marginBottom: '8px' }}>
              Información
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>
              Todo lo que necesitas saber para visitarnos
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Hours */}
            <GlassCard delay={0.1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(212,160,48,0.1)',
                  border: `1px solid rgba(212,160,48,0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {ICONS.clock}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: theme.cream }}>Horario</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { day: 'Lunes - Viernes', hours: '18:00 - 23:00 VRChat' },
                  { day: 'Sábado', hours: '16:00 - 01:00 VRChat' },
                  { day: 'Domingo', hours: '14:00 - 22:00 VRChat' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <span style={{ color: theme.cream, fontSize: '0.85rem', fontWeight: 500 }}>{s.day}</span>
                    <span style={{ color: theme.gold, fontSize: '0.82rem', fontWeight: 600 }}>{s.hours}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Location */}
            <GlassCard delay={0.2}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(212,160,48,0.1)',
                  border: `1px solid rgba(212,160,48,0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {ICONS.globe}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: theme.cream }}>Ubicación</h3>
              </div>
              <p style={{ color: theme.textMuted, fontSize: '0.88rem', lineHeight: 1.8, marginBottom: '16px' }}>
                Nos encontramos en VRChat, mundo: <strong style={{ color: theme.cream }}>Hoshizora Maid Café</strong>
              </p>
              <div style={{
                padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(212,160,48,0.06)',
                border: `1px solid rgba(212,160,48,0.12)`,
              }}>
                <p style={{ fontSize: '0.78rem', color: theme.gold, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ICONS.check} Abierto todos los días, ven a visitarnos
                </p>
              </div>
            </GlassCard>

            {/* Discord */}
            <GlassCard delay={0.3} style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(88,101,242,0.15)',
                border: '2px solid rgba(88,101,242,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ICONS.discord}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: theme.cream, marginBottom: '8px' }}>Únete a nuestro Discord</h3>
              <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.7 }}>
                Sé parte de la comunidad, entérate de eventos especiales y horarios.
              </p>
              <a href="#" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700,
                background: '#5865F2', color: '#fff', textDecoration: 'none',
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#4752c4'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(88,101,242,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {ICONS.discord} Unirse al Discord
              </a>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* █████████████████████ FINAL CTA █████████████████████ */}
      <section style={{
        padding: '120px 24px',
        background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bgLight} 50%, ${theme.bg} 100%)`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <FloatingStars count={15} />
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Big logo */}
          <div style={{
            width: '100px', height: '100px', margin: '0 auto 24px',
            borderRadius: '50%', overflow: 'hidden',
            boxShadow: '0 0 40px rgba(212,160,48,0.2)',
            animation: 'pulseGlow 3s ease-in-out infinite',
          }}>
            <Image src="/hoshi.png" alt="Hoshizora Maid" width={100} height={100} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          </div>

          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: theme.cream, marginBottom: '16px' }}>
            Te Esperamos con una Taza de <span style={{ color: theme.gold }}>Estrellas</span>
          </h2>
          <p style={{ color: theme.textMuted, fontSize: '0.95rem', lineHeight: 1.9, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Ya sea para disfrutar un café, conocer nuevas amistades o simplemente relajarte en un ambiente acogedor, 
            Hoshizora Maid es tu hogar estelar en VRChat.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '14px 32px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #d4a030, #c4956a)', color: '#1a1410',
              textDecoration: 'none', transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(212,160,48,0.3)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(212,160,48,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,160,48,0.3)'; }}
            >
              {ICONS.home} Ir al Inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────── Export wrapper ─────────── */
export default function HoshizoraMaidPage() {
  return (
    <ClientOnly fallback={<div style={{ minHeight: '100vh', background: theme.bg }} />}>
      <HoshizoraMaidContent />
    </ClientOnly>
  );
}
