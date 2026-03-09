import { supabase } from '@/integrations/supabase/client';
import LiveNotificationService from './LiveNotificationService';
export type AppRole = 'citizen' | 'contractor' | 'government' | 'admin';

export interface RoleAssignment {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_at: string;
  assigned_by?: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  requested_role: AppRole;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  supporting_documents?: string[];
  justification?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export class RoleService {
  /**
   * Check if a user has a specific role
   */
  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: role });

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Get all roles for a user
   */
  static async getUserRoles(userId: string): Promise<AppRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return data?.map(r => r.role as AppRole) || [];
  }

  /**
   * Request a role upgrade (e.g., citizen -> contractor/government)
   */
  static async requestRoleUpgrade(
    requestedRole: AppRole,
    justification: string,
    supportingDocuments?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('verification_requests')
      .insert({
        user_id: user.id,
        requested_role: requestedRole,
        justification,
        supporting_documents: supportingDocuments,
        status: 'pending'
      });

    if (error) {
      console.error('Error creating verification request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get verification requests for current user
   */
  static async getMyVerificationRequests(): Promise<VerificationRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification requests:', error);
      return [];
    }

    return (data || []) as VerificationRequest[];
  }

  /**
   * Get all pending verification requests (Admin only)
   */
  static async getPendingVerificationRequests(): Promise<VerificationRequest[]> {
    const { data, error } = await supabase
      .from('verification_requests')
      .select(`
        *,
        user_profiles!verification_requests_user_id_fkey(full_name, phone_number, location)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }

    return (data || []) as any as VerificationRequest[];
  }

  /**
   * Approve a verification request (Admin only)
   */
  static async approveVerificationRequest(
    requestId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get the request to find out which role to assign
    const { data: request, error: fetchError } = await supabase
      .from('verification_requests')
      .select('user_id, requested_role')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return { success: false, error: 'Request not found' };
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('verification_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      })
      .eq('id', requestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Assign the role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: request.user_id,
        role: request.requested_role,
        assigned_by: user.id
      });

    if (roleError && roleError.code !== '23505') { // Ignore duplicate key error
      return { success: false, error: roleError.message };
    }

    // SECURITY: Update user_profiles.user_type to match the approved role
    // This enables correct dashboard routing now that the role is verified.
    await supabase
      .from('user_profiles')
      .update({ user_type: request.requested_role })
      .eq('user_id', request.user_id);

    // Send live notification to the user
    await LiveNotificationService.notify({
      userId: request.user_id,
      title: '🎉 Role Verification Approved!',
      message: `Your ${request.requested_role} role request has been approved. You now have access to ${request.requested_role} features.`,
      type: 'success',
      category: 'verification',
      actionUrl: request.requested_role === 'contractor' ? '/contractor' : '/government'
    });

    return { success: true };
  }

  /**
   * Reject a verification request (Admin only)
   */
  static async rejectVerificationRequest(
    requestId: string,
    reviewNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get the request to find out the user
    const { data: request } = await supabase
      .from('verification_requests')
      .select('user_id, requested_role')
      .eq('id', requestId)
      .single();

    const { error } = await supabase
      .from('verification_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Send live notification to the user if request exists
    if (request) {
      await LiveNotificationService.notify({
        userId: request.user_id,
        title: '❌ Role Verification Not Approved',
        message: `Your ${request.requested_role} role request was not approved. Reason: ${reviewNotes}`,
        type: 'warning',
        category: 'verification',
        actionUrl: '/dashboard'
      });
    }

    return { success: true };
  }
}
