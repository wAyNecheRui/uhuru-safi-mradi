
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
  const [loading, setLoading] = useState(false); // Start as false - no auto-loading

  const loadUserProfile = async (userId: string, email: string): Promise<AuthUser | null> => {
    try {
      console.log('Loading profile for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return {
          id: userId,
          email: email,
          name: email.split('@')[0],
          user_type: 'citizen'
        };
      }

      if (profile) {
        console.log('Profile loaded successfully:', profile);
        return {
          id: userId,
          email: email,
          name: profile.full_name || email.split('@')[0],
          user_type: profile.user_type as 'citizen' | 'contractor' | 'government',
          profile: {
            full_name: profile.full_name,
            phone_number: profile.phone_number,
            location: profile.location
          }
        };
      }

      return {
        id: userId,
        email: email,
        name: email.split('@')[0],
        user_type: 'citizen'
      };

    } catch (error) {
      console.error('Profile loading failed:', error);
      return {
        id: userId,
        email: email,
        name: email.split('@')[0],
        user_type: 'citizen'
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    // Only listen for auth changes, don't automatically load existing sessions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        // Only process SIGNED_IN events, ignore initial session checks
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, loading profile');
          setLoading(true);
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
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        } else if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('User signed out');
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Do NOT check for existing session on mount - require explicit login
    console.log('Auth context initialized - waiting for explicit login');

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setLoading(false);
        return { user: null, error };
      }

      if (data.user && data.session) {
        console.log('Sign in successful for:', data.user.email);
        const userProfile = await loadUserProfile(data.user.id, data.user.email || '');
        setLoading(false);
        return { user: userProfile, error: null };
      }

      setLoading(false);
      return { user: null, error: new Error('Login failed') };
    } catch (error) {
      console.error('Sign in exception:', error);
      setLoading(false);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('Attempting sign up for:', email);
      
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signUp({ 
        email: email.trim().toLowerCase(), 
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

      if (data.user) {
        console.log('Sign up successful for:', data.user.email);
        
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
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setLoading(false);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      setLoading(false);
      throw error;
    }
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
