
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdaptiveLayout, useContentPriority } from '@/hooks/useAdaptiveLayout';

interface AdaptiveCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  priority?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}

const AdaptiveCard = ({
  title,
  description,
  icon,
  children,
  footer,
  priority = 'primary',
  className,
  compact,
  onClick
}: AdaptiveCardProps) => {
  const { spacing, useCompactCards, contentDensity } = useAdaptiveLayout();
  const { shouldShow, truncateText } = useContentPriority();
  
  // Don't render if priority is too low for current screen
  if (!shouldShow(priority)) {
    return null;
  }
  
  const isCompact = compact ?? useCompactCards;
  const isClickable = !!onClick;
  
  return (
    <Card 
      className={cn(
        'transition-all duration-200',
        isCompact ? 'p-3' : spacing.card.split(' ')[0],
        isClickable && 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {(title || icon) && (
        <CardHeader className={cn(
          isCompact ? 'p-0 pb-2' : 'pb-2',
          contentDensity === 'compact' && 'space-y-1'
        )}>
          <CardTitle className={cn(
            'flex items-center gap-2',
            isCompact ? 'text-sm font-semibold' : 'text-base sm:text-lg font-bold'
          )}>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {title && <span className="truncate">{truncateText(title)}</span>}
          </CardTitle>
          {description && (
            <CardDescription className={cn(
              isCompact ? 'text-xs line-clamp-1' : 'text-xs sm:text-sm line-clamp-2'
            )}>
              {truncateText(description, 'secondary')}
            </CardDescription>
          )}
        </CardHeader>
      )}
      
      <CardContent className={cn(
        isCompact ? 'p-0' : 'p-0',
        !(title || icon) && (isCompact ? 'pt-0' : 'pt-4')
      )}>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className={cn(
          isCompact ? 'p-0 pt-2' : 'pt-4',
          'flex-wrap gap-2'
        )}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};

export default AdaptiveCard;
