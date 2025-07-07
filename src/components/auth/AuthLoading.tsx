
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface AuthLoadingProps {
  isLoading: boolean;
}

const AuthLoading: React.FC<AuthLoadingProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-md">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Processing...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthLoading;
