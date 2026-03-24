import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileButton from '@/components/ProfileButton';
import logoImg from '@/assets/uhuru-safi-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import RealtimeStatusIndicator from '@/components/realtime/RealtimeStatusIndicator';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';
import { useInDashboardLayout } from '@/components/layout/DashboardLayout';

const Header = () => {
  const inDashboard = useInDashboardLayout();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useViewport();

  // When inside DashboardLayout, the layout provides its own header
  if (inDashboard) return null;

  const handleHomeClick = () => {
    if (isAuthenticated && user) {
      switch (user.user_type) {
        case 'citizen': navigate('/citizen'); break;
        case 'contractor': navigate('/contractor'); break;
        case 'government': navigate('/government'); break;
        default: navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <header className="bg-card/95 backdrop-blur-xl border-b border-border/60 sticky top-0 z-50 safe-top">
      <div className={cn(
        'container mx-auto',
        isMobile ? 'px-4 py-2.5' : 'px-6 py-3'
      )}>
        <div className="flex items-center justify-between gap-3">
          {/* Logo and Title */}
          <div 
            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
            onClick={handleHomeClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHomeClick()}
            aria-label="Go to home"
          >
            <div className={cn(
              'rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden transition-transform duration-150 group-hover:scale-105',
              isMobile ? 'w-8 h-8' : 'w-9 h-9'
            )}>
              <img src={logoImg} alt="Uhuru Safi" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={cn(
                'font-bold font-display text-foreground truncate leading-tight',
                isMobile ? 'text-sm' : 'text-base'
              )}>
                Uhuru Safi
              </h1>
              {!isMobile && (
                <p className="text-[11px] text-muted-foreground truncate leading-tight">
                  Government Transparency Platform
                </p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          {isAuthenticated && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <RealtimeStatusIndicator />
              <NotificationCenter />
              <ProfileButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
