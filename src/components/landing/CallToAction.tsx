
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Community?</h3>
      <p className="text-slate-200 mb-6">Join thousands of citizens, contractors, and officials building transparent infrastructure.</p>
      <Button 
        size="lg"
        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8"
        onClick={() => navigate('/auth')}
      >
        Join Uhuru Safi Today
      </Button>
    </div>
  );
};

export default CallToAction;
