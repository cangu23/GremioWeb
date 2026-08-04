'use client';

import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';

// Landing sections (for non-authenticated users)
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import LiveNowSection from '@/components/landing/LiveNowSection';
import FeaturedVtubersSection from '@/components/landing/FeaturedVtubersSection';
import PricingSection from '@/components/landing/PricingSection';
import RecentActivitySection from '@/components/landing/RecentActivitySection';
import CTASection from '@/components/landing/CTASection';

// Authenticated feed
import HomeContent from '@/components/feed/FeedPage';

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
      <LiveNowSection />
      <SectionDivider />
      <HowItWorksSection />
      <SectionDivider />
      <StatsSection />
      <SectionDivider />
      <FeaturesSection />
      <SectionDivider />
      <FeaturedVtubersSection />
      <SectionDivider />
      <PricingSection />
      <SectionDivider />
      <RecentActivitySection />
      <SectionDivider />
      <CTASection />
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
