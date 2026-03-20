import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileButton from '@/components/ProfileButton';
import logoImg from '@/assets/uhuru-safi-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import RealtimeStatusIndicator from '@/components/realtime/RealtimeStatusIndicator';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

const Header = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useViewport();

  const handleHomeClick = () => {
    if (isAuthenticated && user) {
      // Navigate to user's respective dashboard
      switch (user.user_type) {
        case 'citizen':
          navigate('/citizen');
          break;
        case 'contractor':
          navigate('/contractor');
          break;
        case 'government':
          navigate('/government');
          break;
        default:
          navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <header 
      className={cn(
        'bg-card shadow-lg border-b-4 sticky top-0 z-50 safe-top',
        'border-primary'
      )}
    >
      <div className={cn(
        'container mx-auto',
        isMobile ? 'px-3 py-3' : 'px-4 sm:px-6 py-4 sm:py-5'
      )}>
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo and Title */}
          <div 
            className={cn(
              'flex items-center flex-1 min-w-0 cursor-pointer',
              isMobile ? 'gap-2' : 'gap-3 sm:gap-4'
            )}
            onClick={handleHomeClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHomeClick()}
            aria-label="Go to home"
          >
            <div className={cn(
              'bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0',
              isMobile ? 'w-9 h-9' : 'w-10 h-10 sm:w-12 sm:h-12'
            )}>
              <Shield className={cn(
                'text-primary-foreground',
                isMobile ? 'h-5 w-5' : 'h-5 w-5 sm:h-6 sm:w-6'
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={cn(
                'font-bold text-foreground truncate',
                isMobile ? 'text-base' : 'text-lg sm:text-xl lg:text-2xl'
              )}>
                Uhuru Safi
              </h1>
              {!isMobile && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Government Transparency Platform
                </p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className={cn(
            'flex items-center flex-shrink-0',
            isMobile ? 'gap-1' : 'gap-2 sm:gap-3'
          )}>
            {isAuthenticated && (
              <>
                <RealtimeStatusIndicator />
                <NotificationCenter />
                <ProfileButton />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
