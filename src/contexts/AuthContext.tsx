
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
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ user: AuthUser | null; error: any }>;
  register: (userData: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider initializing...');

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile && !error) {
        return {
          id: userId,
          email: email,
          name: profile.full_name || email,
          user_type: profile.user_type as 'citizen' | 'contractor' | 'government',
          profile: {
            full_name: profile.full_name,
            phone_number: profile.phone_number,
            location: profile.location
          }
        };
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    return null;
  };

  useEffect(() => {
    console.log('AuthProvider useEffect running...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'User present' : 'No user');
        
        setSession(session);
        if (session?.user) {
          const userProfile = await loadUserProfile(session.user.id, session.user.email || '');
          setUser(userProfile);
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
          const userProfile = await loadUserProfile(session.user.id, session.user.email || '');
          setUser(userProfile);
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    }

    if (data.user) {
      const userProfile = await loadUserProfile(data.user.id, data.user.email || '');
      return { user: userProfile, error: null };
    }

    return { user: null, error: new Error('Login failed') };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('Sign up attempt for:', email, 'as', userData.type);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          user_type: userData.type,
          full_name: userData.name
        }
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
      return { error };
    }

    // Create user profile after successful signup
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            full_name: userData.name,
            phone_number: userData.phone || null,
            location: userData.location || null,
            user_type: userData.type
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      } catch (profileError) {
        console.error('Profile creation failed:', profileError);
      }
    }
    
    return { error: null };
  };

  const signOut = async () => {
    console.log('Sign out attempt');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    setUser(null);
    setSession(null);
  };

  // Alias methods for compatibility
  const login = async (email: string, password: string) => {
    return signIn(email, password);
  };

  const register = async (userData: any) => {
    return signUp(userData.email, userData.password, userData);
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

  console.log('AuthProvider rendering with user:', user ? `${user.name} (${user.user_type})` : 'None', 'loading:', loading);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
