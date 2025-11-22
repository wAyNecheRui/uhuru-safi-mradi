import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadUserProfile } from '@/services/authService';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import type { AuthUser, AuthContextType } from '@/types/auth';
import { RoleService, type AppRole } from '@/services/RoleService';
import { DEV_MODE, TEST_USER } from '@/config/devMode';

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
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        // Only handle explicit sign out - no automatic login
        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('User signed out');
          setUser(null);
          setRoles([]);
        }
      }
    );

    // Dev mode: Auto-login with test user
    if (DEV_MODE) {
      console.log('🔧 DEV MODE: Auto-logging in with test user');
      supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      }).then(async ({ data, error }) => {
        if (error) {
          console.error('Dev mode auto-login failed:', error.message);
        } else if (data.user && mounted) {
          const profile = await loadUserProfile(data.user.id, data.user.email || '');
          if (profile) {
            setUser(profile);
            await fetchRoles(profile.id);
          }
        }
      });
    }

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
