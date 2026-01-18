
import React from 'react';
import { cn } from '@/lib/utils';
import { useAdaptiveGrid, useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';

interface AdaptiveGridProps {
  children: React.ReactNode;
  type?: 'cards' | 'stats' | 'actions' | 'list';
  className?: string;
  minChildWidth?: string;
  gap?: 'tight' | 'normal' | 'loose';
}

const AdaptiveGrid = ({
  children,
  type = 'cards',
  className,
  gap = 'normal'
}: AdaptiveGridProps) => {
  const gridClass = useAdaptiveGrid(type);
  const { contentDensity } = useAdaptiveLayout();
  
  const gapClass = {
    tight: contentDensity === 'compact' ? 'gap-2' : 'gap-3',
    normal: contentDensity === 'compact' ? 'gap-3' : 'gap-4 sm:gap-6',
    loose: contentDensity === 'compact' ? 'gap-4' : 'gap-6 sm:gap-8'
  }[gap];
  
  return (
    <div className={cn('grid', gridClass, gapClass, className)}>
      {children}
    </div>
  );
};

export default AdaptiveGrid;
