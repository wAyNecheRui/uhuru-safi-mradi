
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center mb-16">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
        Transparent Government
        <span className="block text-amber-400">Project Delivery</span>
      </h1>
      <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto">
        Empowering citizens to identify infrastructure needs, connecting verified contractors, 
        and ensuring transparent project funding and delivery through innovative escrow mechanisms.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg"
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8"
          onClick={() => navigate('/auth')}
        >
          Get Started Today
        </Button>
        <Button 
          size="lg"
          variant="outline"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          onClick={() => navigate('/contractor-database')}
        >
          Browse Contractors
        </Button>
      </div>
    </div>
  );
};

export default HeroSection;
