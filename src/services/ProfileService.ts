import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  phone_number?: string;
  location?: string;
  user_type: string;
  national_id?: string;
  id_type?: string;
  date_of_birth?: string;
  gender?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  postal_address?: string;
  email_verified: boolean;
  phone_verified: boolean;
  profile_completed: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractorProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_registration_number?: string;
  kra_pin?: string;
  tax_compliance_certificate_url?: string;
  business_permit_url?: string;
  years_in_business?: number;
  number_of_employees?: number;
  specialization?: string[];
  previous_projects_count: number;
  total_contract_value: number;
  average_rating: number;
  verified: boolean;
  verification_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GovernmentProfile {
  id: string;
  user_id: string;
  department: string;
  position: string;
  employee_number?: string;
  office_location?: string;
  office_phone?: string;
  supervisor_name?: string;
  supervisor_contact?: string;
  clearance_level: string;
  verified: boolean;
  verification_date?: string;
  created_at: string;
  updated_at: string;
}

export class ProfileService {
  /**
   * Get user profile
   */
  static async getUserProfile(userId?: string): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get contractor profile
   */
  static async getContractorProfile(userId?: string): Promise<ContractorProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching contractor profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Create or update contractor profile
   */
  static async upsertContractorProfile(profile: Partial<ContractorProfile>): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // First check if profile exists
    const { data: existing } = await supabase
      .from('contractor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing profile
      const { error } = await supabase
        .from('contractor_profiles')
        .update({
          company_name: profile.company_name,
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating contractor profile:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Insert new profile
      const { error } = await supabase
        .from('contractor_profiles')
        .insert({
          user_id: user.id,
          company_name: profile.company_name || '',
          ...profile
        });

      if (error) {
        console.error('Error inserting contractor profile:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  }

  /**
   * Get government profile
   */
  static async getGovernmentProfile(userId?: string): Promise<GovernmentProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('government_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching government profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Create or update government profile
   */
  static async upsertGovernmentProfile(profile: Partial<GovernmentProfile>): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // First check if profile exists
    const { data: existing } = await supabase
      .from('government_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing profile
      const { error } = await supabase
        .from('government_profiles')
        .update({
          department: profile.department,
          position: profile.position,
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating government profile:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Insert new profile
      const { error } = await supabase
        .from('government_profiles')
        .insert({
          user_id: user.id,
          department: profile.department || '',
          position: profile.position || '',
          ...profile
        });

      if (error) {
        console.error('Error inserting government profile:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  }

  /**
   * Check if profile is complete
   */
  static async checkProfileCompletion(): Promise<boolean> {
    const profile = await this.getUserProfile();
    
    if (!profile) return false;

    const requiredFields = [
      'full_name',
      'phone_number',
      'county',
      'location'
    ];

    return requiredFields.every(field => profile[field as keyof UserProfile]);
  }

  /**
   * Mark profile as complete
   */
  static async markProfileComplete(): Promise<{ success: boolean; error?: string }> {
    return this.updateUserProfile({ profile_completed: true });
  }
}
