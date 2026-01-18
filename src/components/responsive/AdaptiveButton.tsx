
import React from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { Button, ButtonProps } from '@/components/ui/button';

interface AdaptiveButtonProps extends ButtonProps {
  mobileFullWidth?: boolean;
  hideTextOnMobile?: boolean;
  icon?: React.ReactNode;
  priority?: 'primary' | 'secondary' | 'tertiary';
}

const AdaptiveButton = React.forwardRef<HTMLButtonElement, AdaptiveButtonProps>(({
  children,
  mobileFullWidth = false,
  hideTextOnMobile = false,
  icon,
  priority = 'primary',
  size,
  className,
  ...props
}, ref) => {
  const { isMobile, isTablet } = useViewport();
  const { touchTarget, contentDensity } = useAdaptiveLayout();
  
  // Adaptive size based on screen
  const adaptiveSize = size ?? (isMobile ? 'sm' : isTablet ? 'default' : 'default');
  
  // Ensure touch targets are accessible (44px minimum on mobile)
  const touchClass = isMobile ? touchTarget.button : '';
  
  return (
    <Button
      ref={ref}
      size={adaptiveSize}
      className={cn(
        touchClass,
        mobileFullWidth && isMobile && 'w-full',
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn(
          'flex-shrink-0',
          children && !hideTextOnMobile && 'mr-2',
          children && hideTextOnMobile && !isMobile && 'mr-2'
        )}>
          {icon}
        </span>
      )}
      {children && (
        <span className={cn(
          hideTextOnMobile && isMobile && 'sr-only'
        )}>
          {children}
        </span>
      )}
    </Button>
  );
});

AdaptiveButton.displayName = 'AdaptiveButton';

export default AdaptiveButton;
