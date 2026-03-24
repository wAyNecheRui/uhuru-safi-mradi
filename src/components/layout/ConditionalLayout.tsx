import React from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

const DASHBOARD_PREFIXES = ['/citizen', '/contractor', '/government', '/settings', '/contractor-database', '/workforce', '/analytics', '/disputes'];

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isDashboardRoute = DASHBOARD_PREFIXES.some(prefix => location.pathname.startsWith(prefix));

  if (isDashboardRoute && isAuthenticated) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return <>{children}</>;
}
