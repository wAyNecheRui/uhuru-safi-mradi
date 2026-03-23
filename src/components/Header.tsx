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
  const { isMobile } = useViewport();

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
    <header 
      className="bg-card/95 backdrop-blur-md shadow-sm border-b sticky top-0 z-50 safe-top"
    >
      <div className={cn(
        'container mx-auto',
        isMobile ? 'px-4 py-3' : 'px-6 py-3.5'
      )}>
        <div className="flex items-center justify-between gap-3">
          {/* Logo and Title */}
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
            onClick={handleHomeClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHomeClick()}
            aria-label="Go to home"
          >
            <div className={cn(
              'rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-105',
              isMobile ? 'w-9 h-9' : 'w-10 h-10'
            )}>
              <img src={logoImg} alt="Uhuru Safi" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={cn(
                'font-bold text-foreground truncate leading-tight',
                isMobile ? 'text-base' : 'text-lg'
              )}>
                Uhuru Safi
              </h1>
              {!isMobile && (
                <p className="text-xs text-muted-foreground truncate">
                  Government Transparency Platform
                </p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
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
