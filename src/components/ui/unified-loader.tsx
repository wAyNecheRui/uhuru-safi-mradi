import React from 'react';
import { cn } from '@/lib/utils';

interface UnifiedLoaderProps {
  message?: string;
  submessage?: string;
  className?: string;
}

const UnifiedLoader: React.FC<UnifiedLoaderProps> = ({ 
  message = "Loading", 
  submessage,
  className 
}) => {
  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center bg-background",
      className
    )}>
      {/* Animated logo mark */}
      <div className="relative mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-md bg-primary animate-[spin_3s_linear_infinite]" />
        </div>
        {/* Orbiting dots */}
        <div className="absolute -inset-3 animate-[spin_2.5s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/60" />
        </div>
        <div className="absolute -inset-3 animate-[spin_2.5s_linear_infinite_reverse]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/40" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mb-4">
        <div className="h-full bg-primary rounded-full animate-[loading-bar_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Text */}
      <p className="text-sm font-medium text-foreground/70 tracking-wide">
        {message}
      </p>
      {submessage && (
        <p className="text-xs text-muted-foreground mt-1">
          {submessage}
        </p>
      )}
    </div>
  );
};

export default UnifiedLoader;
