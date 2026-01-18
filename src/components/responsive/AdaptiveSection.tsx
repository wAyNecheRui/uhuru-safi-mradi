
import React from 'react';
import { cn } from '@/lib/utils';
import { useAdaptiveLayout, useContentPriority } from '@/hooks/useAdaptiveLayout';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AdaptiveSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  priority?: 'primary' | 'secondary' | 'tertiary';
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
}

const AdaptiveSection = ({
  title,
  subtitle,
  children,
  priority = 'primary',
  collapsible = false,
  defaultOpen = true,
  className,
  headerAction
}: AdaptiveSectionProps) => {
  const { spacing, typography, contentDensity } = useAdaptiveLayout();
  const { shouldShow } = useContentPriority();
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  // Don't render if priority is too low
  if (!shouldShow(priority)) {
    return null;
  }
  
  // On mobile, secondary sections are collapsible by default
  const isCollapsible = collapsible || (priority !== 'primary' && contentDensity === 'compact');
  
  const header = (title || subtitle) && (
    <div className={cn(
      'flex items-center justify-between',
      contentDensity === 'compact' ? 'mb-3' : 'mb-4 sm:mb-6'
    )}>
      <div className="min-w-0 flex-1">
        {title && (
          <h2 className={cn(
            typography.heading,
            'text-foreground truncate'
          )}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className={cn(
            typography.caption,
            'text-muted-foreground mt-1'
          )}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {headerAction}
        {isCollapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 h-auto"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
  
  if (isCollapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn(spacing.section, className)}>
        <CollapsibleTrigger asChild>
          {header}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }
  
  return (
    <section className={cn(spacing.section, className)}>
      {header}
      {children}
    </section>
  );
};

export default AdaptiveSection;
