'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import LazyMount from '@/components/ui/LazyMount';

// ⚡ OPTIMIZACIÓN DE CARGA:
// - HeroSection queda eager porque es lo primero que ve el usuario y los motores de búsqueda.
import HeroSection from '@/components/landing/HeroSection';

const LiveNowSection = dynamic(() => import('@/components/landing/LiveNowSection'), { ssr: false });
const HowItWorksSection = dynamic(() => import('@/components/landing/HowItWorksSection'), { ssr: false });
const StatsSection = dynamic(() => import('@/components/landing/StatsSection'), { ssr: false });
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection'), { ssr: false });
const CreatorEconomySection = dynamic(() => import('@/components/landing/CreatorEconomySection'), { ssr: false });
const FeaturedVtubersSection = dynamic(() => import('@/components/landing/FeaturedVtubersSection'), { ssr: false });
const PricingSection = dynamic(() => import('@/components/landing/PricingSection'), { ssr: false });
const RecentActivitySection = dynamic(() => import('@/components/landing/RecentActivitySection'), { ssr: false });
const CTASection = dynamic(() => import('@/components/landing/CTASection'), { ssr: false });
const PlatformsStrip = dynamic(() => import('@/components/landing/PlatformsStrip'), { ssr: false });

// Authenticated feed: lazy para usuarios logueados
const HomeContent = dynamic(() => import('@/components/feed/FeedPage'), { ssr: false });

// ==========================================================================
// Section Divider
// ==========================================================================
function SectionDivider() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '0 20px',
        opacity: 0.2,
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--glass-border))',
        }}
      />
      <div
        style={{
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: 'var(--primary)',
        }}
      />
      <div
        style={{
          flex: 1,
          maxWidth: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, var(--glass-border), transparent)',
        }}
      />
    </div>
  );
}

// ==========================================================================
// Landing Page (public, non-authenticated & SSR fallback for SEO)
// ==========================================================================
function LandingPage() {
  return (
    <>
      <HeroSection />
      <SectionDivider />
      <LazyMount minHeight={160}>
        <PlatformsStrip />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={420}>
        <LiveNowSection />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={500}>
        <HowItWorksSection />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={300}>
        <StatsSection />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={500}>
        <FeaturesSection />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={500}>
        <CreatorEconomySection />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={500}>
        <FeaturedVtubersSection />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={600}>
        <PricingSection />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={450}>
        <RecentActivitySection />
      </LazyMount>
      <SectionDivider />
      <LazyMount minHeight={300}>
        <CTASection />
      </LazyMount>
    </>
  );
}

function MainContent() {
  const { user, isLoading } = useAuth();

  // Mientras valida sesión o si no está autenticado, muestra la Landing Page
  if (isLoading || !user) {
    return <LandingPage />;
  }

  return <HomeContent />;
}

// ==========================================================================
// Page Entry Point — routes to Landing or Feed based on auth state
// SSR renders LandingPage directly for crawlers, SEO, and fast first paint
// ==========================================================================
export default function HomePage() {
  return (
    <ClientOnly fallback={<LandingPage />}>
      <MainContent />
    </ClientOnly>
  );
}
