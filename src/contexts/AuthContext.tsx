
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

console.log('AuthContext loading...');

interface AuthUser {
  id: string;
  email: string;
  name: string;
  user_type: 'citizen' | 'contractor' | 'government';
  profile?: {
    full_name?: string;
    phone_number?: string;
    location?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  supabase: typeof supabase;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: AuthUser['user_type']) => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string, userType: AuthUser['user_type']) => Promise<void>;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider initializing...');

  useEffect(() => {
    console.log('AuthProvider useEffect running...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'User present' : 'No user');
        
        setSession(session);
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            user_type: session.user.user_metadata?.user_type || 'citizen',
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', session ? 'Found' : 'None');
        
        setSession(session);
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            user_type: session.user.user_metadata?.user_type || 'citizen',
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Sign in attempt for:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userType: AuthUser['user_type']) => {
    console.log('Sign up attempt for:', email, 'as', userType);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          user_type: userType
        }
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('Sign out attempt');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Alias methods for compatibility
  const login = async (email: string, password: string, userType: AuthUser['user_type']) => {
    return signIn(email, password);
  };

  const register = async (userData: any) => {
    return signUp(userData.email, userData.password, userData.type);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    supabase,
    signIn,
    signUp,
    signOut,
    login,
    register,
  };

  console.log('AuthProvider rendering with user:', user ? 'Present' : 'None', 'loading:', loading);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
