export const dynamic = 'force-dynamic';

import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import LiveNowSection from '@/components/landing/LiveNowSection';
import FeaturedVtubersSection from '@/components/landing/FeaturedVtubersSection';
import PricingSection from '@/components/landing/PricingSection';
import RecentActivitySection from '@/components/landing/RecentActivitySection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

function SectionDivider() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '0 20px',
      opacity: 0.3,
    }}>
      <div style={{
        flex: 1,
        maxWidth: '200px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--primary))',
      }} />
      <div style={{
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: 'var(--primary)',
        animation: 'section-divider-pulse 3s ease-in-out infinite',
      }} />
      <div style={{
        flex: 1,
        maxWidth: '200px',
        height: '1px',
        background: 'linear-gradient(90deg, var(--primary), transparent)',
      }} />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
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
      <Footer />
    </>
  );
}
