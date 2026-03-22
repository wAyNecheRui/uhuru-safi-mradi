
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/uhuru-safi-logo.png';

const SimpleLanding = () => {
  const navigate = useNavigate();

  console.log('SimpleLanding component rendering...');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <img src={logoImg} alt="Uhuru Safi" className="w-14 h-14 object-contain" />
          <span className="text-white font-bold text-3xl">Uhuru Safi</span>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-6">
          Transparent Government
          <span className="block text-amber-400 mt-2">Project Delivery</span>
        </h1>
        
        <p className="text-xl text-slate-200 mb-8 leading-relaxed">
          Empowering citizens to identify infrastructure needs, connecting verified contractors, 
          and ensuring transparent project funding and delivery.
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
    </div>
  );
};

export default SimpleLanding;
