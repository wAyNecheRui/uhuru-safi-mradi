import React from 'react';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main application layout wrapper that provides:
 * - Offline status banner
 * - Mobile bottom navigation
 * - Bottom padding for mobile nav
 * - Live announcer for screen readers
 */
export function AppLayout({ children, className }: AppLayoutProps) {
  const { isMobile } = useViewport();
  const { isAuthenticated } = useAuth();

  // Add bottom padding on mobile when authenticated (for bottom nav)
  const showBottomNav = isMobile && isAuthenticated;

  return (
    <>
      {/* Offline status banner */}
      <OfflineBanner />
      
      {/* Main content */}
      <div
        className={cn(
          'min-h-screen w-full overflow-x-hidden',
          showBottomNav && 'pb-16', // Space for bottom nav
          className
        )}
      >
        {children}
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Live announcer for screen readers */}
      <div
        id="live-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}