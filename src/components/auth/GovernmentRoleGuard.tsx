import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { isRouteAllowed } from '@/config/governmentRoles';
import UnifiedLoader from '@/components/ui/unified-loader';
import { toast } from 'sonner';

interface GovernmentRoleGuardProps {
    children: React.ReactNode;
}

/**
 * Institutional Route Guard for Kenya Government Modules.
 * Ensures users only access pages authorized for their specific department.
 *
 * Safe-by-default rules:
 *  - Admins bypass all checks
 *  - Users with "Pending Assignment" can only see /government (home) — never bounced into a loop
 *  - Already on /government? Never redirect again, just toast
 */
const GovernmentRoleGuard: React.FC<GovernmentRoleGuardProps> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const { governmentProfile, loading: profileLoading } = useProfile();
    const { isAdmin, loading: roleLoading } = useUserRole();
    const location = useLocation();

    // Notify pending users once (not every render)
    useEffect(() => {
        if (
            user?.user_type === 'government' &&
            governmentProfile?.department === 'Pending Assignment' &&
            location.pathname === '/government'
        ) {
            toast.info(
                'Your government account is awaiting administrator verification. Module access will unlock once your department is assigned.',
                { id: 'gov-pending-assignment', duration: 6000 }
            );
        }
    }, [user?.user_type, governmentProfile?.department, location.pathname]);

    if (authLoading || profileLoading || roleLoading) {
        return <UnifiedLoader />;
    }

    const userType = user?.user_type as string;
    if (userType !== 'government' && userType !== 'admin') {
        return <>{children}</>;
    }

    // Admins bypass institutional checks
    if (isAdmin || userType === 'admin') {
        return <>{children}</>;
    }

    const department = governmentProfile?.department || 'Pending Assignment';

    // Loop-prevention: if already at /government, never redirect — just render
    if (location.pathname === '/government') {
        return <>{children}</>;
    }

    const allowed = isRouteAllowed(department, location.pathname);
    if (!allowed) {
        const msg = department === 'Pending Assignment'
            ? 'Awaiting verification — module access locked until an administrator assigns your department.'
            : `Restricted Access. This module is not authorized for personnel from: ${department}`;
        toast.error(msg, { id: 'rbac-security-warning' });
        return <Navigate to="/government" replace />;
    }

    return <>{children}</>;
};

export default GovernmentRoleGuard;
