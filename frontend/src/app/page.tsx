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

function SectionDivider() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '0 20px',
      opacity: 0.2,
    }}>
      <div style={{
        flex: 1,
        maxWidth: '120px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--glass-border))',
      }} />
      <div style={{
        width: '3px',
        height: '3px',
        borderRadius: '50%',
        background: 'var(--primary)',
      }} />
      <div style={{
        flex: 1,
        maxWidth: '120px',
        height: '1px',
        background: 'linear-gradient(90deg, var(--glass-border), transparent)',
      }} />
    </div>
  );
}

export default function HomePage() {
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
