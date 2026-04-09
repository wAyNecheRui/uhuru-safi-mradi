import React from 'react';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { cn } from '@/lib/utils';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import FeedbackButton from '@/components/feedback/FeedbackButton';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main application layout wrapper that provides:
 * - Offline status banner
 * - Live announcer for screen readers
 */
export function AppLayout({ children, className }: AppLayoutProps) {
  useIdleTimeout();

  return (
    <>
      {/* Offline status banner */}
      <OfflineBanner />
      
      {/* Main content */}
      <div
        className={cn(
          'min-h-screen w-full overflow-x-hidden',
          className
        )}
      >
        {children}
      </div>

      {/* Live announcer for screen readers */}
      <div
        id="live-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* In-app feedback button */}
      <FeedbackButton />
    </>
  );
}