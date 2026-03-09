import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import UnifiedLoader from '@/components/ui/unified-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('citizen' | 'contractor' | 'government' | 'admin')[];
  redirectTo?: string;
}

/**
 * ProtectedRoute with enhanced security:
 * 1. Clears cached data on user change to prevent data leakage
 * 2. Shows nothing until user is fully validated
 * 3. Validates user type OR user roles matches allowed roles before rendering
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/auth'
}) => {
  const { user, loading, isAuthenticated, roles, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Track previous user to detect user switches
  const prevUserIdRef = useRef<string | null>(null);
  const [isUserValidated, setIsUserValidated] = useState(false);

  // Check if user passes role requirements via user_type OR roles array
  const userPassesRoleCheck = (allowedRoles: ('citizen' | 'contractor' | 'government' | 'admin')[]): boolean => {
    if (!user) return false;
    // Check user_type first (covers citizen, contractor, government)
    if (allowedRoles.includes(user.user_type)) return true;
    // Then check roles array (covers 'admin' and elevated roles from user_roles table)
    return allowedRoles.some(role => hasRole(role as any));
  };

  // SECURITY: Clear cache when user changes
  useEffect(() => {
    if (loading) return;
    
    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;
    
    // If user changed (login, logout, or switch), clear ALL cached data
    if (prevUserId !== null && currentUserId !== prevUserId) {
      console.log('[ProtectedRoute Security] User changed, clearing cache');
      queryClient.clear();
      queryClient.resetQueries();
    }
    
    prevUserIdRef.current = currentUserId;
  }, [user?.id, loading, queryClient]);

  // Handle redirects
  useEffect(() => {
    if (loading) {
      setIsUserValidated(false);
      return;
    }

    if (!isAuthenticated) {
      setIsUserValidated(false);
      navigate(redirectTo, { replace: true, state: { from: location.pathname } });
      return;
    }

    if (allowedRoles && user && !userPassesRoleCheck(allowedRoles)) {
      setIsUserValidated(false);
      navigate(`/${user.user_type}`, { replace: true });
      return;
    }

    // Only mark as validated when all checks pass
    if (isAuthenticated && user) {
      // Small delay to ensure state is stable
      const timer = setTimeout(() => {
        setIsUserValidated(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [user, loading, isAuthenticated, allowedRoles, roles, navigate, redirectTo, location.pathname]);

  if (loading) {
    return <UnifiedLoader />;
  }

  if (!isAuthenticated || !user || !isUserValidated) {
    return <UnifiedLoader />;
  }

  // If wrong role, show nothing (redirect is happening)
  if (allowedRoles && !userPassesRoleCheck(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
