import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('citizen' | 'contractor' | 'government' | 'admin')[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/auth'
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate(redirectTo, { replace: true, state: { from: location.pathname } });
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.user_type)) {
      navigate(`/${user.user_type}`, { replace: true });
    }
  }, [user, loading, isAuthenticated, allowedRoles, navigate, redirectTo, location.pathname]);

  // Show simple spinner only during initial load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect happening)
  if (!isAuthenticated) return null;

  // If wrong role, show nothing (redirect happening)
  if (allowedRoles && user && !allowedRoles.includes(user.user_type)) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
