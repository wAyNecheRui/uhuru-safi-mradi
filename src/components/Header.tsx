import React from 'react';
import { Shield } from 'lucide-react';
import ProfileButton from '@/components/ProfileButton';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';

const Header = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="bg-white shadow-lg border-b-4 border-gradient-to-r from-slate-600 to-blue-600" style={{borderImage: 'linear-gradient(to right, #475569, #2563eb) 1'}}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                Uhuru Safi
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 truncate">
                Government Transparency Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated && (
              <>
                <NotificationBell />
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
