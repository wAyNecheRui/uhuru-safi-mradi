
import { supabase } from '@/integrations/supabase/client';
import type { AuthUser, SignUpData } from '@/types/auth';

export const loadUserProfile = async (userId: string, email: string): Promise<AuthUser | null> => {
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

export const signInUser = async (email: string, password: string) => {
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

    if (data.user && data.session) {
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

export const signUpUser = async (email: string, password: string, userData: SignUpData) => {
  try {
    console.log('Attempting sign up for:', email);
    
    const { data, error } = await supabase.auth.signUp({ 
      email: email.trim().toLowerCase(), 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
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

export const signOutUser = async () => {
  try {
    console.log('Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('Sign out successful');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};
