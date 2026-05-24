import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleService, type AppRole } from '@/services/RoleService';

/**
 * Returns the set of roles assigned to the current user (from user_roles table).
 * Use isAdmin to gate admin-only UI controls.
 */
export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    RoleService.getUserRoles(user.id).then((r) => {
      if (!cancelled) {
        setRoles(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return {
    roles,
    loading,
    isAdmin: roles.includes('admin'),
    isAuditor: roles.includes('auditor' as AppRole),
    hasRole: (r: AppRole) => roles.includes(r),
  };
};
