
import React from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { useAdaptiveLayout, useContentPriority } from '@/hooks/useAdaptiveLayout';

interface AdaptiveStatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  colorScheme?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  priority?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
  compact?: boolean;
}

const AdaptiveStatCard = ({
  value,
  label,
  icon,
  trend,
  colorScheme = 'primary',
  priority = 'primary',
  className,
  compact
}: AdaptiveStatCardProps) => {
  const { isMobile } = useViewport();
  const { contentDensity, useCompactCards } = useAdaptiveLayout();
  const { shouldShow, showSecondaryContent } = useContentPriority();
  
  if (!shouldShow(priority)) {
    return null;
  }
  
  const isCompact = compact ?? useCompactCards;
  
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    muted: 'bg-muted text-muted-foreground'
  };
  
  const valueClasses = {
    primary: 'text-primary',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    muted: 'text-muted-foreground'
  };
  
  return (
    <div className={cn(
      'bg-card border rounded-lg',
      isCompact ? 'p-3' : 'p-4 sm:p-5',
      className
    )}>
      <div className="flex items-start gap-3">
        {icon && showSecondaryContent && (
          <div className={cn(
            'flex-shrink-0 rounded-lg p-2',
            colorClasses[colorScheme],
            isCompact ? 'p-1.5' : 'p-2'
          )}>
            {icon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-muted-foreground truncate',
            isCompact ? 'text-xs' : 'text-xs sm:text-sm'
          )}>
            {label}
          </p>
          <p className={cn(
            'font-bold',
            valueClasses[colorScheme],
            isCompact ? 'text-lg' : 'text-xl sm:text-2xl lg:text-3xl'
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {trend && showSecondaryContent && (
            <div className={cn(
              'flex items-center gap-1 mt-1',
              isCompact ? 'text-xs' : 'text-xs sm:text-sm',
              trend.direction === 'up' && 'text-green-600',
              trend.direction === 'down' && 'text-red-600',
              trend.direction === 'neutral' && 'text-muted-foreground'
            )}>
              <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveStatCard;
