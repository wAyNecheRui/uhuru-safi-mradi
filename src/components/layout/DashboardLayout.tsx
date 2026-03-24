import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { BottomNavBar } from './BottomNavBar';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import RealtimeStatusIndicator from '@/components/realtime/RealtimeStatusIndicator';
import ProfileButton from '@/components/ProfileButton';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/uhuru-safi-logo.png';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const { isMobile } = useViewport();
  const navigate = useNavigate();

  if (!isAuthenticated) return <>{children}</>;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        {/* Desktop sidebar */}
        <DashboardSidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header bar */}
          <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/60 safe-top">
            <div className={cn('flex items-center justify-between gap-3', isMobile ? 'px-3 py-2' : 'px-5 py-2.5')}>
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                {isMobile && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      const base = user?.user_type === 'admin' ? 'government' : user?.user_type || '';
                      navigate(`/${base}`);
                    }}
                  >
                    <img src={logoImg} alt="Uhuru Safi" className="w-7 h-7 rounded-md object-contain" />
                    <span className="font-bold text-sm text-foreground">Uhuru Safi</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <RealtimeStatusIndicator />
                <NotificationCenter />
                <ProfileButton />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className={cn('flex-1', isMobile && 'pb-20')}>
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNavBar />
      </div>
    </SidebarProvider>
  );
}
