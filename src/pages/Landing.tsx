
import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import RoleCards from '@/components/landing/RoleCards';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CallToAction from '@/components/landing/CallToAction';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
      <LandingHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <HeroSection />
        <RoleCards />
        <FeaturesSection />
        <CallToAction />
      </main>

      <LandingFooter />
    </div>
  );
};

export default Landing;
