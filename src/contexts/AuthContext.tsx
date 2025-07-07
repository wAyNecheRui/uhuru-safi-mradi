
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadUserProfile } from '@/services/authService';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import type { AuthUser, AuthContextType } from '@/types/auth';

console.log('AuthContext loading...');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { signIn, signUp, signOut, loading } = useAuthOperations();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, loading profile');
          try {
            const userProfile = await loadUserProfile(session.user.id, session.user.email || '');
            if (mounted) {
              setUser(userProfile);
            }
          } catch (error) {
            console.error('Failed to load user profile:', error);
            if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.email?.split('@')[0] || 'User',
                user_type: 'citizen'
              });
            }
          }
        } else if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('User signed out');
          setUser(null);
        }
      }
    );

    console.log('Auth context initialized - waiting for explicit login');

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
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
