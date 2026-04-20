
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { isRouteAllowed } from '@/config/governmentRoles';
import UnifiedLoader from '@/components/ui/unified-loader';
import { toast } from 'sonner';

interface GovernmentRoleGuardProps {
    children: React.ReactNode;
}

/**
 * Institutional Route Guard for Kenya Government Modules.
 * Ensures users only access pages authorized for their specific department.
 */
const GovernmentRoleGuard: React.FC<GovernmentRoleGuardProps> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const { governmentProfile, loading: profileLoading } = useProfile();
    const location = useLocation();

    if (authLoading || profileLoading) {
        return <UnifiedLoader />;
    }

    // Only apply to government users. Allow admins to bypass.
    const userType = user?.user_type as string;
    if (userType !== 'government' && userType !== 'admin') {
        return <>{children}</>;
    }

    // Admins bypass all institutional checks
    if (userType === 'admin') {
        return <>{children}</>;
    }

    const department = governmentProfile?.department || 'Pending Assignment';
    const allowed = isRouteAllowed(department, location.pathname);

    if (!allowed) {
        console.warn(`[Institutional Security] Access denied to ${location.pathname} for department: ${department}`);

        // Show a polite institutional rejection
        toast.error(`Restricted Access. This module is not authorized for personnel from: ${department}`, {
            id: 'rbac-security-warning'
        });

        // Sub-route check: if they are in government area, send them back to the main gov dashboard
        return <Navigate to="/government" replace />;
    }

    return <>{children}</>;
};

export default GovernmentRoleGuard;
