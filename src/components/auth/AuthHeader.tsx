
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import logoImg from '@/assets/uhuru-safi-logo.png';

const AuthHeader: React.FC = () => {
  return (
    <CardHeader className="text-center bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
      <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Shield className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-2xl font-bold text-slate-900">
        Uhuru Safi Platform
      </CardTitle>
      <p className="text-slate-600 mt-2">Transparent Government Project Delivery</p>
    </CardHeader>
  );
};

export default AuthHeader;
