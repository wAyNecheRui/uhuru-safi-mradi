
import React from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl';
  mobileFullWidth?: boolean;
  adaptivePadding?: boolean;
}

const ResponsiveContainer = ({ 
  children, 
  className, 
  maxWidth = '7xl',
  mobileFullWidth = false,
  adaptivePadding = true
}: ResponsiveContainerProps) => {
  const { isMobile, isTablet } = useViewport();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl'
  };

  const paddingClasses = adaptivePadding 
    ? isMobile 
      ? 'px-3' 
      : isTablet 
        ? 'px-4 sm:px-6' 
        : 'px-4 sm:px-6 lg:px-8'
    : 'px-4 sm:px-6 lg:px-8';

  return (
    <div className={cn(
      'mx-auto',
      paddingClasses,
      mobileFullWidth && isMobile ? 'max-w-full' : maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;
