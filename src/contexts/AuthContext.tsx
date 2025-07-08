
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadUserProfile } from '@/services/authService';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import type { AuthUser, AuthContextType } from '@/types/auth';

console.log('AuthContext loading...');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  
  // Create enhanced auth operations that can update user state
  const authOps = useAuthOperations();
  const enhancedSignIn = async (email: string, password: string) => {
    const result = await authOps.signIn(email, password);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  };
  
  const enhancedSignOut = async () => {
    await authOps.signOut();
    setUser(null);
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
        }
      }
    );

    console.log('Auth context initialized - no automatic login');

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading: authOps.loading,
    isAuthenticated: !!user,
    signIn: enhancedSignIn,
    signUp: authOps.signUp,
    signOut: enhancedSignOut,
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
