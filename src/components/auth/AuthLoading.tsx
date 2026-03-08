import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthLoadingProps {
  isLoading: boolean;
}

const AuthLoading: React.FC<AuthLoadingProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
    </div>
  );
};

export default AuthLoading;
