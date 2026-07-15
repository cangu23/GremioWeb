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

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LiveNowSection />
      <HowItWorksSection />
      <StatsSection />
      <FeaturesSection />
      <FeaturedVtubersSection />
      <PricingSection />
      <RecentActivitySection />
      <CTASection />
      <Footer />
    </>
  );
}
