import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CTASection from '@/components/landing/CTASection';
import FeaturedVtubersSection from '@/components/landing/FeaturedVtubersSection';
import RecentActivitySection from '@/components/landing/RecentActivitySection';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturedVtubersSection />
      <RecentActivitySection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </>
  );
}
