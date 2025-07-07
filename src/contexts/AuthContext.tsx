
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
      console.log('Loading profile for user:', userId);
      
      // Set a timeout for profile loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timeout')), 10000);
      });

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.error('Error loading profile:', error);
        // Create a minimal user object if profile loading fails
        return {
          id: userId,
          email: email,
          name: email.split('@')[0],
          user_type: 'citizen' // Default type
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

      // If no profile found, create a minimal user object
      console.warn('No profile found for user, creating minimal user object');
      return {
        id: userId,
        email: email,
        name: email.split('@')[0],
        user_type: 'citizen'
      };

    } catch (error) {
      console.error('Profile loading failed:', error);
      // Return minimal user object on any error
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
    let loadingTimeout: NodeJS.Timeout;

    // Set a maximum loading time
    loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout reached, clearing loading state');
        setLoading(false);
      }
    }, 15000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        // Clear timeout since we got an auth event
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }

        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('User signed out or no session');
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Loading user profile for authenticated user');
          try {
            const userProfile = await loadUserProfile(session.user.id, session.user.email || '');
            if (mounted) {
              setUser(userProfile);
            }
          } catch (error) {
            console.error('Failed to load user profile:', error);
            // Create minimal user on profile load failure
            if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.email?.split('@')[0] || 'User',
                user_type: 'citizen'
              });
            }
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        console.log('Initial session found, loading profile');
        loadUserProfile(session.user.id, session.user.email || '').then((userProfile) => {
          if (mounted) {
            setUser(userProfile);
            setLoading(false);
          }
        }).catch((error) => {
          console.error('Initial profile load failed:', error);
          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'User',
              user_type: 'citizen'
            });
            setLoading(false);
          }
        });
      } else {
        console.log('No initial session found');
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Session check failed:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
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
        const userProfile = await loadUserProfile(data.user.id, data.user.email || '');
        return { user: userProfile, error: null };
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
        
        // Create profile
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      console.log('Sign out successful');
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
