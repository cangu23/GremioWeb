'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import LazyMount from '@/components/ui/LazyMount';

// ⚡ OPTIMIZACIÓN DE CARGA:
// - next/dynamic: las secciones bajo el pliegue van en chunks separados
//   (el bundle inicial del landing se reduce mucho).
// - LazyMount: además se montan solo cuando se acercan al viewport, así que
//   sus fetches (/vtubers/live, /activity, /stats…) no compiten con el
//   render del Hero.
// HeroSection queda eager porque es lo primero que ve el usuario.
import HeroSection from '@/components/landing/HeroSection';

const LiveNowSection = dynamic(() => import('@/components/landing/LiveNowSection'), { ssr: false });
const HowItWorksSection = dynamic(() => import('@/components/landing/HowItWorksSection'), { ssr: false });
const StatsSection = dynamic(() => import('@/components/landing/StatsSection'), { ssr: false });
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection'), { ssr: false });
const FeaturedVtubersSection = dynamic(() => import('@/components/landing/FeaturedVtubersSection'), { ssr: false });
const PricingSection = dynamic(() => import('@/components/landing/PricingSection'), { ssr: false });
const RecentActivitySection = dynamic(() => import('@/components/landing/RecentActivitySection'), { ssr: false });
const CTASection = dynamic(() => import('@/components/landing/CTASection'), { ssr: false });

// Authenticated feed: también lazy, porque solo se renderiza para usuarios
// logueados (antes su chunk pesado viajaba en el bundle inicial para todos).
const HomeContent = dynamic(() => import('@/components/feed/FeedPage'), { ssr: false });

// ==========================================================================
// Section Divider
// ==========================================================================
function SectionDivider() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '12px', padding: '0 20px', opacity: 0.2,
    }}>
      <div style={{
        flex: 1, maxWidth: '120px', height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--glass-border))',
      }} />
      <div style={{
        width: '3px', height: '3px', borderRadius: '50%', background: 'var(--primary)',
      }} />
      <div style={{
        flex: 1, maxWidth: '120px', height: '1px',
        background: 'linear-gradient(90deg, var(--glass-border), transparent)',
      }} />
    </div>
  );
}

// ==========================================================================
// Landing Page (public, non-authenticated)
// ==========================================================================
function LandingPage() {
  return (
    <>
      <HeroSection />
      <SectionDivider />
      <LazyMount minHeight={420}><LiveNowSection /></LazyMount>
      <SectionDivider />
      <LazyMount minHeight={500}><HowItWorksSection /></LazyMount>
      <SectionDivider />
      <LazyMount minHeight={300}><StatsSection /></LazyMount>
      <SectionDivider />
      <LazyMount minHeight={500}><FeaturesSection /></LazyMount>
      <SectionDivider />
      <LazyMount minHeight={500}><FeaturedVtubersSection /></LazyMount>
      <SectionDivider />
      <LazyMount minHeight={600}><PricingSection /></LazyMount>
      <SectionDivider />
      <LazyMount minHeight={450}><RecentActivitySection /></LazyMount>
      <SectionDivider />
      <LazyMount minHeight={300}><CTASection /></LazyMount>
    </>
  );
}

function MainContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p>Espera estamos trabajando en ello...</p>
      </div>
    );
  }

  if (!user) return <LandingPage />;
  return <HomeContent />;
}

// ==========================================================================
// Page Entry Point — routes to Landing or Feed based on auth state
// ==========================================================================
export default function HomePage() {
  return (
    <ClientOnly fallback={
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p>Espera estamos trabajando en ello...</p>
      </div>
    }>
      <MainContent />
    </ClientOnly>
  );
}
