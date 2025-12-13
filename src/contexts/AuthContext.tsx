import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadUserProfile } from '@/services/authService';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import type { AuthUser, AuthContextType } from '@/types/auth';
import { RoleService, type AppRole } from '@/services/RoleService';

interface EnhancedAuthContextType extends AuthContextType {
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [initializing, setInitializing] = useState(true);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  
  // Fetch user roles with caching
  const fetchRoles = useCallback(async (userId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    try {
      const userRoles = await RoleService.getUserRoles(userId);
      if (mountedRef.current) {
        setRoles(userRoles);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user?.id) {
      await fetchRoles(user.id);
    }
  }, [user?.id, fetchRoles]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  // Create enhanced auth operations
  const authOps = useAuthOperations();
  
  const enhancedSignIn = useCallback(async (email: string, password: string) => {
    const result = await authOps.signIn(email, password);
    if (result.user && mountedRef.current) {
      setUser(result.user);
      await fetchRoles(result.user.id);
    }
    return result;
  }, [authOps, fetchRoles]);
  
  const enhancedSignOut = useCallback(async () => {
    await authOps.signOut();
    if (mountedRef.current) {
      setUser(null);
      setRoles([]);
    }
  }, [authOps]);

  useEffect(() => {
    mountedRef.current = true;

    // Check initial session quickly
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mountedRef.current) {
          const profile = await loadUserProfile(session.user.id, session.user.email || '');
          if (mountedRef.current && profile) {
            setUser(profile);
            await fetchRoles(profile.id);
          }
        }
      } finally {
        if (mountedRef.current) {
          setInitializing(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setRoles([]);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const profile = await loadUserProfile(session.user.id, session.user.email || '');
          if (mountedRef.current && profile) {
            setUser(profile);
            await fetchRoles(profile.id);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchRoles]);

  const value = useMemo<EnhancedAuthContextType>(() => ({
    user,
    loading: authOps.loading || initializing,
    isAuthenticated: !!user,
    signIn: enhancedSignIn,
    signUp: authOps.signUp,
    signOut: enhancedSignOut,
    roles,
    hasRole,
    refreshRoles,
  }), [user, authOps.loading, initializing, enhancedSignIn, authOps.signUp, enhancedSignOut, roles, hasRole, refreshRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
