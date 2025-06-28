
import React from 'react';
import { Eye, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';

const FeaturesSection = () => {
  return (
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Key Features</h2>
      <div className="grid md:grid-cols-4 gap-6">
        <div className="text-center">
          <Eye className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">Full Transparency</h4>
          <p className="text-slate-200 text-sm">Real-time project tracking and public fund visibility</p>
        </div>
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">Secure Escrow</h4>
          <p className="text-slate-200 text-sm">Guaranteed contractor payments upon milestone completion</p>
        </div>
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">Citizen Verification</h4>
          <p className="text-slate-200 text-sm">Community-validated project needs and progress</p>
        </div>
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">Data Analytics</h4>
          <p className="text-slate-200 text-sm">Comprehensive reporting and performance insights</p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
