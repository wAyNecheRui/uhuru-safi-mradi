import { supabase } from '@/integrations/supabase/client';

// Constants for verification requirements
export const REQUIRED_CITIZEN_VERIFICATIONS = 2;
export const MINIMUM_APPROVAL_RATING = 3;

interface VerificationCheck {
  canRelease: boolean;
  approvedCount: number;
  requiredCount: number;
  averageRating: number;
  message: string;
}

interface PaymentReleaseResult {
  success: boolean;
  demo_mode?: boolean;
  alreadyPaid?: boolean;
  transaction?: {
    id: string;
    amount: number;
    reference: string;
  };
  verificationDetails?: {
    approvedCount: number;
    requiredCount: number;
    averageRating: number;
  };
  message: string;
  error?: string;
}

export class MilestonePaymentService {
  /**
   * Check if a milestone has sufficient citizen verifications for payment release
   */
  static async checkVerificationStatus(milestoneId: string): Promise<VerificationCheck> {
    try {
      // Get all verifications for this milestone
      const { data: verifications, error } = await supabase
        .from('milestone_verifications')
        .select('*')
        .eq('milestone_id', milestoneId);

      if (error) throw error;

      // Count approved verifications with sufficient rating
      const approvedVerifications = verifications?.filter(
        v => v.verification_status === 'approved'
      ) || [];

      const approvedCount = approvedVerifications.length;
      
      // Calculate average rating from verification notes (format: "... Rating: X/5" or "Rating: 3.8/5")
      let totalRating = 0;
      let ratingCount = 0;
      approvedVerifications.forEach(v => {
        // Match both integer and decimal ratings
        const match = v.verification_notes?.match(/Rating:\s*([\d.]+)/);
        if (match) {
          const rating = parseFloat(match[1]);
          if (!isNaN(rating) && rating >= 1 && rating <= 5) {
            totalRating += rating;
            ratingCount++;
          }
        }
      });
      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      const canRelease = approvedCount >= REQUIRED_CITIZEN_VERIFICATIONS && averageRating >= MINIMUM_APPROVAL_RATING;

      let message = '';
      if (canRelease) {
        message = `✅ Milestone verified by ${approvedCount} citizens with ${averageRating.toFixed(1)}/5 average rating. Ready for payment release.`;
      } else if (approvedCount < REQUIRED_CITIZEN_VERIFICATIONS) {
        message = `⏳ ${approvedCount}/${REQUIRED_CITIZEN_VERIFICATIONS} citizen verifications received. Need ${REQUIRED_CITIZEN_VERIFICATIONS - approvedCount} more.`;
      } else {
        message = `⚠️ Average rating (${averageRating.toFixed(1)}/5) below required threshold (${MINIMUM_APPROVAL_RATING}/5).`;
      }

      return {
        canRelease,
        approvedCount,
        requiredCount: REQUIRED_CITIZEN_VERIFICATIONS,
        averageRating,
        message
      };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return {
        canRelease: false,
        approvedCount: 0,
        requiredCount: REQUIRED_CITIZEN_VERIFICATIONS,
        averageRating: 0,
        message: 'Error checking verification status'
      };
    }
  }

  /**
   * Trigger automated payment release for a verified milestone
   * This calls the edge function which uses service role to bypass RLS
   */
  static async triggerAutomatedPayment(milestoneId: string): Promise<PaymentReleaseResult> {
    try {
      console.log(`[AUTO-PAYMENT] Triggering automated payment for milestone: ${milestoneId}`);
      
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'Authentication required',
          error: 'No active session'
        };
      }

      // Call edge function which has service role access
      const { data, error } = await supabase.functions.invoke('auto-release-milestone-payment', {
        body: { milestoneId }
      });

      if (error) {
        console.error('[AUTO-PAYMENT] Edge function error:', error);
        return {
          success: false,
          message: error.message || 'Payment release failed',
          error: error.message
        };
      }

      if (!data.success) {
        console.log('[AUTO-PAYMENT] Payment conditions not met:', data.message);
        return {
          success: false,
          message: data.message || 'Payment conditions not met',
          error: data.error
        };
      }

      console.log('[AUTO-PAYMENT] ✅ Payment released successfully:', data);
      
      return {
        success: true,
        alreadyPaid: data.alreadyPaid,
        transaction: data.transaction,
        verificationDetails: data.verificationDetails,
        message: data.message
      };

    } catch (error: any) {
      console.error('[AUTO-PAYMENT] Error:', error);
      return {
        success: false,
        message: 'Payment release failed',
        error: error.message
      };
    }
  }

  /**
   * Get verification history for a milestone
   */
  static async getVerificationHistory(milestoneId: string) {
    const { data, error } = await supabase
      .from('milestone_verifications')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('verified_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification history:', error);
      return [];
    }

    return data || [];
  }
}
