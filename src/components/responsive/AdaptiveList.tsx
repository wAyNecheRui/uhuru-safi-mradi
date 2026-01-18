
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAdaptiveLayout, useContentPriority } from '@/hooks/useAdaptiveLayout';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ListItem {
  id: string | number;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  tertiary?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
}

interface AdaptiveListProps {
  items: ListItem[];
  maxVisibleMobile?: number;
  maxVisibleTablet?: number;
  maxVisibleDesktop?: number;
  showMoreLabel?: string;
  showLessLabel?: string;
  emptyMessage?: string;
  className?: string;
  variant?: 'default' | 'cards' | 'compact';
}

const AdaptiveList = ({
  items,
  maxVisibleMobile = 3,
  maxVisibleTablet = 5,
  maxVisibleDesktop = 10,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  emptyMessage = 'No items to display',
  className,
  variant = 'default'
}: AdaptiveListProps) => {
  const { contentDensity, spacing } = useAdaptiveLayout();
  const { showSecondaryContent, showDetailedInfo } = useContentPriority();
  const [expanded, setExpanded] = useState(false);
  
  const maxVisible = contentDensity === 'compact' 
    ? maxVisibleMobile 
    : contentDensity === 'comfortable'
      ? maxVisibleTablet
      : maxVisibleDesktop;
  
  const visibleItems = expanded ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;
  
  if (items.length === 0) {
    return (
      <div className={cn(
        'text-center py-8 text-muted-foreground',
        contentDensity === 'compact' ? 'text-sm' : 'text-base'
      )}>
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-2', className)}>
      <ul className={cn(
        variant === 'cards' ? 'space-y-3' : 'divide-y divide-border'
      )}>
        {visibleItems.map((item) => (
          <li
            key={item.id}
            className={cn(
              'flex items-start gap-3',
              variant === 'cards' && 'bg-card rounded-lg border p-3 sm:p-4',
              variant === 'compact' && 'py-2',
              variant === 'default' && 'py-3 sm:py-4',
              item.onClick && 'cursor-pointer hover:bg-muted/50 transition-colors'
            )}
            onClick={item.onClick}
          >
            {/* Icon */}
            {item.icon && (
              <div className={cn(
                'flex-shrink-0',
                contentDensity === 'compact' ? 'mt-0.5' : 'mt-1'
              )}>
                {item.icon}
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Primary content - always visible */}
              <div className={cn(
                'font-medium text-foreground',
                contentDensity === 'compact' ? 'text-sm' : 'text-base'
              )}>
                {item.primary}
              </div>
              
              {/* Secondary content - hidden on compact */}
              {item.secondary && showSecondaryContent && (
                <div className={cn(
                  'text-muted-foreground mt-1',
                  contentDensity === 'compact' ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'
                )}>
                  {item.secondary}
                </div>
              )}
              
              {/* Tertiary content - only on desktop */}
              {item.tertiary && showDetailedInfo && (
                <div className="text-xs text-muted-foreground mt-2">
                  {item.tertiary}
                </div>
              )}
            </div>
            
            {/* Badge */}
            {item.badge && (
              <div className="flex-shrink-0">{item.badge}</div>
            )}
            
            {/* Action */}
            {item.action && showSecondaryContent && (
              <div className="flex-shrink-0 ml-2">{item.action}</div>
            )}
          </li>
        ))}
      </ul>
      
      {/* Show more/less button */}
      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-primary hover:text-primary/80"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                {showLessLabel}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {showMoreLabel} ({items.length - maxVisible} more)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdaptiveList;
