import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadUserProfile } from '@/services/authService';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import type { AuthUser, AuthContextType } from '@/types/auth';
import { RoleService, type AppRole } from '@/services/RoleService';

console.log('AuthContext loading...');

interface EnhancedAuthContextType extends AuthContextType {
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  
  // Fetch user roles
  const fetchRoles = async (userId: string) => {
    const userRoles = await RoleService.getUserRoles(userId);
    setRoles(userRoles);
  };

  const refreshRoles = async () => {
    if (user?.id) {
      await fetchRoles(user.id);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  // Create enhanced auth operations that can update user state
  const authOps = useAuthOperations();
  const enhancedSignIn = async (email: string, password: string) => {
    const result = await authOps.signIn(email, password);
    if (result.user) {
      setUser(result.user);
      await fetchRoles(result.user.id);
    }
    return result;
  };
  
  const enhancedSignOut = async () => {
    await authOps.signOut();
    setUser(null);
    setRoles([]);
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('User signed out');
          setUser(null);
          setRoles([]);
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Load user profile when signed in
          const profile = await loadUserProfile(session.user.id, session.user.email || '');
          if (mounted && profile) {
            setUser(profile);
            await fetchRoles(profile.id);
          }
        }
      }
    );

    console.log('Auth context initialized - no automatic login');

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: EnhancedAuthContextType = {
    user,
    loading: authOps.loading,
    isAuthenticated: !!user,
    signIn: enhancedSignIn,
    signUp: authOps.signUp,
    signOut: enhancedSignOut,
    roles,
    hasRole,
    refreshRoles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
