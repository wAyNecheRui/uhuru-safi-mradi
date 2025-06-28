
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const LandingHeader = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-white font-bold text-xl">Uhuru Safi</span>
          </div>
          <div className="hidden md:flex space-x-4">
            <button className="text-white hover:text-slate-200 transition-colors">About</button>
            <button className="text-white hover:text-slate-200 transition-colors">How it Works</button>
            <button className="text-white hover:text-slate-200 transition-colors">Contact</button>
            <Button 
              variant="outline" 
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingHeader;
