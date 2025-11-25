import React, { createContext, useContext, useState } from 'react';
import type { AuthUser, AuthContextType } from '@/types/auth';
import type { AppRole } from '@/services/RoleService';
import { MOCK_USER } from '@/config/devMode';

console.log('AuthContext loading with mock authentication - app is public');

interface EnhancedAuthContextType extends AuthContextType {
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock user - authentication is disabled
  const [user] = useState<AuthUser | null>(MOCK_USER);
  const [roles] = useState<AppRole[]>([]);

  // Clear any existing Supabase auth session on mount
  React.useEffect(() => {
    const clearAuth = async () => {
      try {
        localStorage.removeItem('supabase.auth.token');
        // Don't call signOut as it will trigger API calls
      } catch (error) {
        // Ignore errors
      }
    };
    clearAuth();
  }, []);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const refreshRoles = async () => {
    // No-op in public mode
  };

  // Mock auth operations - all are no-ops
  const mockSignIn = async (email: string, password: string) => {
    return { user: MOCK_USER, error: null };
  };

  const mockSignUp = async (email: string, password: string, userData: any) => {
    return { error: null };
  };
  
  const mockSignOut = async () => {
    // No-op in public mode
  };

  const value: EnhancedAuthContextType = {
    user,
    loading: false,
    isAuthenticated: true, // Always authenticated in public mode
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
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
