import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface UnifiedLoaderProps {
  message?: string;
  submessage?: string;
  className?: string;
}

const UnifiedLoader: React.FC<UnifiedLoaderProps> = ({ 
  message,
  submessage,
  className 
}) => {
  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center bg-background",
      className
    )}>
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
    </div>
  );
};

export default UnifiedLoader;
