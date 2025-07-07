
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
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        // Return basic user info if profile doesn't exist yet
        return {
          id: userId,
          email: email,
          name: email,
          user_type: 'citizen' // default type
        };
      }

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

      // Return basic user info if no profile found
      return {
        id: userId,
        email: email,
        name: email,
        user_type: 'citizen'
      };
    } catch (error) {
      console.error('Error loading profile:', error);
      // Return basic user info on error
      return {
        id: userId,
        email: email,
        name: email,
        user_type: 'citizen'
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        if (session?.user) {
          // Load profile in background, don't block auth state
          setTimeout(async () => {
            if (mounted) {
              const userProfile = await loadUserProfile(session.user.id, session.user.email || '');
              if (mounted) {
                setUser(userProfile);
              }
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        // Load profile in background
        setTimeout(async () => {
          if (mounted) {
            const userProfile = await loadUserProfile(session.user.id, session.user.email || '');
            if (mounted) {
              setUser(userProfile);
            }
          }
        }, 0);
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { user: null, error };
      }

      if (data.user) {
        console.log('Sign in successful for:', data.user.email);
        // Don't load profile here, let the auth state change handler do it
        return { user: null, error: null };
      }

      return { user: null, error: new Error('Login failed') };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('Attempting sign up for:', email);
      
      const redirectUrl = `${window.location.origin}/`;
      
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
        
        // Create profile in background
        setTimeout(async () => {
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
        }, 0);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
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
