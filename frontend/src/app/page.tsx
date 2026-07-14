export const dynamic = 'force-dynamic';

import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import FeaturedVtubersSection from '@/components/landing/FeaturedVtubersSection';
import RecentActivitySection from '@/components/landing/RecentActivitySection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <StatsSection />
      <FeaturesSection />
      <FeaturedVtubersSection />
      <RecentActivitySection />
      <CTASection />
      <Footer />
    </>
  );
}
