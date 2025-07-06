
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
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string, email: string): Promise<AuthUser | null> => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
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
      console.error('Error loading profile:', error);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          const userProfile = await loadUserProfile(session.user.id, session.user.email || '');
          if (mounted) {
            setUser(userProfile);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          const userProfile = await loadUserProfile(session.user.id, session.user.email || '');
          if (mounted) {
            setUser(userProfile);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { user: null, error };
    }

    if (data.user) {
      const userProfile = await loadUserProfile(data.user.id, data.user.email || '');
      return { user: userProfile, error: null };
    }

    return { user: null, error: new Error('Login failed') };
  };

  const signUp = async (email: string, password: string, userData: any) => {
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
      return { error };
    }

    // Create user profile
    if (data.user) {
      try {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            full_name: userData.name,
            phone_number: userData.phone || null,
            location: userData.location || null,
            user_type: userData.type
          });
      } catch (profileError) {
        console.error('Profile creation failed:', profileError);
      }
    }
    
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

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
