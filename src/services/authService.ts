import { supabase } from '@/integrations/supabase/client';
import type { AuthUser, SignUpData } from '@/types/auth';

// This function is kept for backwards compatibility but AuthContext now handles loading directly
export const loadUserProfile = async (userId: string, email: string): Promise<AuthUser | null> => {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, user_type, phone_number, location, county, sub_county, ward')
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
        location: profile.location,
        county: profile.county,
        sub_county: profile.sub_county,
        ward: profile.ward
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
    // SECURITY: Always register as citizen. The requested type is stored in metadata
    // for the admin approval workflow. The DB trigger handle_new_user enforces citizen.
    const { data, error } = await supabase.auth.signUp({ 
      email: email.trim().toLowerCase(), 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          user_type: userData.type, // Stored as metadata; DB trigger overrides to 'citizen'
          full_name: userData.name,
          phone_number: userData.phone || null,
          county: userData.county || null,
          sub_county: userData.sub_county || null,
          ward: userData.ward || null,
          national_id: userData.national_id || null,
          id_type: userData.id_type || 'national_id',
          gender: userData.gender || null,
          date_of_birth: userData.date_of_birth || null
        }
      }
    });
    
    if (error) {
      return { error };
    }

    // Create role-specific profiles after signup
    if (data?.user) {
      // Update user_profiles with additional Kenya-specific data
      await supabase.from('user_profiles').update({
        national_id: userData.national_id || null,
        id_type: userData.id_type || 'national_id',
        gender: userData.gender || null,
        date_of_birth: userData.date_of_birth || null,
        county: userData.county || null,
        sub_county: userData.sub_county || null,
        ward: userData.ward || null
      }).eq('user_id', data.user.id);

      // Contractor profile with all NCA and AGPO fields
      if (userData.type === 'contractor' && userData.organization) {
        const specializations = userData.specialization 
          ? [userData.specialization]
          : [];
        
        await supabase.from('contractor_profiles').upsert({
          user_id: data.user.id,
          company_name: userData.organization,
          company_registration_number: userData.company_registration_number || null,
          kra_pin: userData.kra_pin || null,
          specialization: specializations.length > 0 ? specializations : null,
          years_in_business: userData.years_in_business ? parseInt(userData.years_in_business) : null,
          is_agpo: userData.is_agpo || false,
          agpo_category: userData.is_agpo ? userData.agpo_category : null,
          // NCA category stored in max_project_capacity based on NCA limits
          max_project_capacity: getNCAMaxValue(userData.nca_category)
        });
      }
      
      // Citizen skills profile (if skills provided)
      if (userData.type === 'citizen' && userData.skills) {
        const skillsArray = userData.skills.split(',').map(s => s.trim()).filter(Boolean);
        if (skillsArray.length > 0) {
          await supabase.from('skills_profiles').upsert({
            user_id: data.user.id,
            full_name: userData.name,
            skills: skillsArray,
            location: userData.county || null,
            phone_number: userData.phone || null
          });
        }
      }
      
      // Government profile with GHRIS-aligned fields
      if (userData.type === 'government') {
        await supabase.from('government_profiles').upsert({
          user_id: data.user.id,
          department: userData.department || 'Pending Assignment',
          position: userData.position || 'Pending Assignment',
          employee_number: userData.employee_number || null,
          office_phone: userData.office_phone || null,
          supervisor_name: userData.supervisor_name || null,
          clearance_level: 'standard', // Default, to be upgraded by admin
          assigned_counties: userData.county ? [userData.county] : [],
          verified: false // Requires manual verification
        });
      }
    }
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Helper function to convert NCA category to max project value
function getNCAMaxValue(ncaCategory: string | undefined): number {
  const ncaLimits: Record<string, number> = {
    'NCA1': 999999999, // Unlimited
    'NCA2': 500000000,
    'NCA3': 300000000,
    'NCA4': 200000000,
    'NCA5': 100000000,
    'NCA6': 50000000,
    'NCA7': 20000000,
    'NCA8': 10000000,
    'pending': 5000000 // Default for pending registration
  };
  return ncaLimits[ncaCategory || 'pending'] || 5000000;
}

export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};
