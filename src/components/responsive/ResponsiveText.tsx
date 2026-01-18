
import React from 'react';
import { cn } from '@/lib/utils';
import { useAdaptiveLayout, useContentPriority } from '@/hooks/useAdaptiveLayout';

interface ResponsiveTextProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  priority?: 'primary' | 'secondary' | 'tertiary';
  truncate?: boolean;
  lines?: number;
  className?: string;
}

const ResponsiveText = ({
  children,
  as: Component = 'span',
  variant = 'body',
  priority = 'primary',
  truncate = false,
  lines,
  className
}: ResponsiveTextProps) => {
  const { typography } = useAdaptiveLayout();
  const { shouldShow } = useContentPriority();
  
  if (!shouldShow(priority)) {
    return null;
  }
  
  const variantClass = typography[variant];
  
  const truncateClass = truncate 
    ? 'truncate' 
    : lines 
      ? `line-clamp-${lines}` 
      : '';
  
  return (
    <Component 
      className={cn(
        variantClass,
        truncateClass,
        className
      )}
    >
      {children}
    </Component>
  );
};

// Mobile-first heading with responsive sizing
export const ResponsiveHeading = ({ 
  children, 
  level = 1,
  className 
}: { 
  children: React.ReactNode; 
  level?: 1 | 2 | 3 | 4;
  className?: string;
}) => {
  const headingClasses = {
    1: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold',
    2: 'text-lg sm:text-xl lg:text-2xl font-bold',
    3: 'text-base sm:text-lg lg:text-xl font-semibold',
    4: 'text-sm sm:text-base lg:text-lg font-semibold'
  };
  
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Component className={cn(headingClasses[level], 'text-foreground', className)}>
      {children}
    </Component>
  );
};

// Adaptive paragraph that adjusts line length for readability
export const AdaptiveParagraph = ({
  children,
  maxWidth = true,
  className
}: {
  children: React.ReactNode;
  maxWidth?: boolean;
  className?: string;
}) => {
  const { contentDensity } = useAdaptiveLayout();
  
  return (
    <p className={cn(
      'text-muted-foreground',
      contentDensity === 'compact' ? 'text-sm leading-relaxed' : 'text-base leading-relaxed',
      maxWidth && 'max-w-prose',
      className
    )}>
      {children}
    </p>
  );
};

export default ResponsiveText;
