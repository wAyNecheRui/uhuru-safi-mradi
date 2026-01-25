import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Bell, User, Search, Plus, Briefcase, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useViewport } from '@/hooks/useViewport';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isMobile } = useViewport();

  // Don't show on desktop or when not authenticated
  if (!isMobile || !isAuthenticated || !user) return null;

  // Role-specific navigation items
  const getNavItems = (): NavItem[] => {
    switch (user.user_type) {
      case 'citizen':
        return [
          { icon: Home, label: 'Home', path: '/citizen' },
          { icon: Plus, label: 'Report', path: '/citizen/report-issue' },
          { icon: Search, label: 'Projects', path: '/citizen/projects' },
          { icon: Bell, label: 'Alerts', path: '/citizen/notifications' },
          { icon: User, label: 'Profile', path: '/citizen' },
        ];
      case 'contractor':
        return [
          { icon: Home, label: 'Home', path: '/contractor' },
          { icon: Briefcase, label: 'Bids', path: '/contractor/bidding' },
          { icon: FileText, label: 'Projects', path: '/contractor/projects' },
          { icon: Bell, label: 'Alerts', path: '/contractor/notifications' },
          { icon: User, label: 'Profile', path: '/contractor' },
        ];
      case 'government':
        return [
          { icon: Home, label: 'Home', path: '/government' },
          { icon: FileText, label: 'Reports', path: '/government/reports' },
          { icon: Building2, label: 'Projects', path: '/government/portfolio' },
          { icon: Bell, label: 'Alerts', path: '/government/notifications' },
          { icon: User, label: 'Profile', path: '/government' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === '/citizen' || path === '/contractor' || path === '/government') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card border-t border-border',
        'safe-bottom',
        'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-full h-full',
                'touch-target',
                'transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-5 w-5 mb-1',
                  active && 'scale-110'
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                active && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;