import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollGlobe, type ScrollGlobeSection } from '@/components/ui/landing-page';
import logoImg from '@/assets/uhuru-safi-logo.png';
import MobileNavigation from '@/components/MobileNavigation';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const Landing = () => {
  const navigate = useNavigate();

  const sections: ScrollGlobeSection[] = [
    {
      id: "hero",
      badge: "Uhuru Safi",
      title: "Transparent",
      subtitle: "Governance",
      description: "Empowering Kenyan citizens to identify infrastructure needs, connecting verified contractors, and ensuring transparent project funding and delivery through innovative escrow mechanisms.",
      align: "left",
      actions: [
        { label: "Get Started", variant: "primary", onClick: () => navigate('/auth') },
        { label: "View Transparency Portal", variant: "secondary", onClick: () => navigate('/transparency') },
      ]
    },
    {
      id: "citizens",
      badge: "Citizens",
      title: "Community Driven",
      description: "Report infrastructure problems in your community, verify project progress on the ground, participate in community voting for priorities, and register your skills for local workforce opportunities.",
      align: "center",
      features: [
        { title: "Report Issues", description: "Identify and report infrastructure problems with photo evidence and GPS location" },
        { title: "Verify Progress", description: "Validate milestone completion by being physically present at project sites" },
        { title: "Community Voting", description: "Vote on project priorities to ensure resources go where they're needed most" },
      ]
    },
    {
      id: "contractors",
      badge: "Contractors",
      title: "Build With",
      subtitle: "Confidence",
      description: "Access pre-verified legitimate projects, submit competitive bids, deliver quality work with milestone tracking, and receive guaranteed payments through our secure escrow system.",
      align: "left",
      features: [
        { title: "Secure Escrow", description: "Guaranteed payments released upon verified milestone completion" },
        { title: "Reputation System", description: "Build trust through transparent performance tracking and ratings" },
        { title: "Fair Bidding", description: "Compete on merit with AGPO compliance and transparent evaluation" },
      ]
    },
    {
      id: "government",
      badge: "Government",
      title: "Accountable",
      subtitle: "Leadership",
      description: "Oversee projects with full transparency, manage budgets with data-driven insights, ensure AGPO compliance, and build public trust through open governance processes and blockchain-verified records.",
      align: "center",
      actions: [
        { label: "Sign Up Now", variant: "primary", onClick: () => navigate('/auth') },
        { label: "How It Works", variant: "secondary", onClick: () => navigate('/how-it-works') },
      ]
    }
  ];

  const globeConfig = {
    positions: [
      { top: "50%", left: "80%", scale: 1.4 },
      { top: "30%", left: "50%", scale: 0.9 },
      { top: "20%", left: "85%", scale: 1.8 },
      { top: "50%", left: "50%", scale: 2 },
    ]
  };

  return (
    <div className="relative">
      {/* Floating Header */}
      <nav className="fixed top-0 left-0 right-0 bg-black/20 backdrop-blur-md border-b border-white/10 z-[60]">
        <ResponsiveContainer>
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-3">
              <img src={logoImg} alt="Uhuru Safi" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <span className="text-white font-bold text-lg sm:text-xl">Uhuru Safi</span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <button className="text-white/70 hover:text-white transition-colors text-sm" onClick={() => navigate('/transparency')}>Transparency</button>
              <button className="text-white/70 hover:text-white transition-colors text-sm" onClick={() => navigate('/about')}>About</button>
              <button className="text-white/70 hover:text-white transition-colors text-sm" onClick={() => navigate('/how-it-works')}>How it Works</button>
              <button className="text-white/70 hover:text-white transition-colors text-sm" onClick={() => navigate('/contact')}>Contact</button>
              <button
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </button>
            </div>

            <MobileNavigation />
          </div>
        </ResponsiveContainer>
      </nav>

      <ScrollGlobe sections={sections} globeConfig={globeConfig} />

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-[#030712] py-6 sm:py-8">
        <ResponsiveContainer>
          <div className="text-center">
            <p className="text-white/40 text-xs sm:text-sm">
              Built for transparency in Kenyan governance • Empowering communities through technology
            </p>
          </div>
        </ResponsiveContainer>
      </footer>
    </div>
  );
};

export default Landing;
