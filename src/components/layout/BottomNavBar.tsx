import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, AlertTriangle, FileText, Map, Users,
  Briefcase, Eye, FolderOpen, Wallet,
  Shield, CheckCircle, BarChart3
} from 'lucide-react';

interface BottomNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const citizenBottomNav: BottomNavItem[] = [
  { title: 'Home', url: '/citizen', icon: LayoutDashboard },
  { title: 'Report', url: '/citizen/report', icon: AlertTriangle },
  { title: 'Projects', url: '/citizen/projects', icon: Map },
  { title: 'Track', url: '/citizen/track', icon: FileText },
  { title: 'More', url: '/citizen/transparency', icon: Eye },
];

const contractorBottomNav: BottomNavItem[] = [
  { title: 'Home', url: '/contractor', icon: LayoutDashboard },
  { title: 'Bids', url: '/contractor/bidding', icon: Briefcase },
  { title: 'Projects', url: '/contractor/projects', icon: FolderOpen },
  { title: 'Finance', url: '/contractor/financials', icon: Wallet },
  { title: 'Stats', url: '/contractor/performance', icon: BarChart3 },
];

const governmentBottomNav: BottomNavItem[] = [
  { title: 'Home', url: '/government', icon: LayoutDashboard },
  { title: 'Projects', url: '/government/projects', icon: FolderOpen },
  { title: 'Approve', url: '/government/approvals', icon: CheckCircle },
  { title: 'Escrow', url: '/government/escrow', icon: Shield },
  { title: 'Analytics', url: '/government/analytics', icon: BarChart3 },
];

export function BottomNavBar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userType = user?.user_type || 'citizen';
  const items = userType === 'government' || userType === 'admin'
    ? governmentBottomNav
    : userType === 'contractor'
      ? contractorBottomNav
      : citizenBottomNav;

  const isActive = (url: string) => {
    const baseUrl = `/${userType === 'admin' ? 'government' : userType}`;
    if (url === baseUrl) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/60 safe-bottom">
      <div className="flex items-stretch justify-around h-16 px-1">
        {items.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 transition-colors duration-150',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                active && 'bg-primary/10 scale-105'
              )}>
                <item.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              </div>
              <span className={cn(
                'text-[10px] leading-tight truncate max-w-full px-1',
                active ? 'font-semibold' : 'font-medium'
              )}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
