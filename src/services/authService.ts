import { supabase } from '@/integrations/supabase/client';
import type { AuthUser, SignUpData } from '@/types/auth';

// This function is kept for backwards compatibility but AuthContext now handles loading directly
export const loadUserProfile = async (userId: string, email: string): Promise<AuthUser | null> => {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, user_type, phone_number, location')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      id: userId,
      email: email,
      name: profile?.full_name || email.split('@')[0],
      user_type: (profile?.user_type as 'citizen' | 'contractor' | 'government') || 'citizen',
      profile: profile ? {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        location: profile.location
      } : undefined
    };
  } catch (error) {
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
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim().toLowerCase(), 
      password 
    });
    
    if (error) {
      return { user: null, error };
    }

    if (data.user && data.session) {
      const userProfile = await loadUserProfile(data.user.id, data.user.email || '');
      return { user: userProfile, error: null };
    }

    return { user: null, error: new Error('Login failed') };
  } catch (error) {
    return { user: null, error };
  }
};

export const signUpUser = async (email: string, password: string, userData: SignUpData) => {
  try {
    const { data, error } = await supabase.auth.signUp({ 
      email: email.trim().toLowerCase(), 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          user_type: userData.type,
          full_name: userData.name,
          phone_number: userData.phone || null,
          location: userData.location || null
        }
      }
    });
    
    if (error) {
      return { error };
    }

    // If contractor, create contractor profile after signup
    if (data?.user && userData.type === 'contractor' && userData.organization) {
      await supabase.from('contractor_profiles').upsert({
        user_id: data.user.id,
        company_name: userData.organization
      });
    }
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};
