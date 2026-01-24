import React from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full' | 'prose';
  mobileFullWidth?: boolean;
  adaptivePadding?: boolean;
  centered?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const ResponsiveContainer = ({ 
  children, 
  className, 
  maxWidth = '7xl',
  mobileFullWidth = false,
  adaptivePadding = true,
  centered = true,
  as: Component = 'div'
}: ResponsiveContainerProps) => {
  const { isMobile, isTablet } = useViewport();
  const { contentDensity } = useAdaptiveLayout();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
    'prose': 'max-w-prose'
  };

  // Adaptive padding based on screen size and content density
  const paddingClasses = adaptivePadding 
    ? contentDensity === 'compact'
      ? 'px-3 sm:px-4' 
      : contentDensity === 'comfortable'
        ? 'px-4 sm:px-6' 
        : 'px-4 sm:px-6 lg:px-8'
    : 'px-4 sm:px-6 lg:px-8';

  const widthClass = mobileFullWidth && isMobile 
    ? 'max-w-full' 
    : maxWidthClasses[maxWidth];

  return (
    <Component className={cn(
      centered && 'mx-auto',
      paddingClasses,
      widthClass,
      'w-full',
      // Add overflow protection
      'overflow-x-hidden',
      'max-w-[100vw]',
      className
    )}>
      {children}
    </Component>
  );
};

export default ResponsiveContainer;
