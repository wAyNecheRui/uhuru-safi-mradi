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
  demo_mode: boolean;
  transaction?: {
    id: string;
    amount: number;
    reference: string;
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
      
      // Calculate average rating from verification notes (format: "... Rating: X/5")
      let totalRating = 0;
      let ratingCount = 0;
      approvedVerifications.forEach(v => {
        const match = v.verification_notes?.match(/Rating:\s*(\d)/);
        if (match) {
          totalRating += parseInt(match[1]);
          ratingCount++;
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
   * This is called after sufficient citizen verifications are received
   */
  static async triggerAutomatedPayment(milestoneId: string): Promise<PaymentReleaseResult> {
    try {
      // First verify the milestone is ready for payment
      const verificationStatus = await this.checkVerificationStatus(milestoneId);
      
      if (!verificationStatus.canRelease) {
        return {
          success: false,
          demo_mode: false,
          message: verificationStatus.message,
          error: 'Insufficient verifications'
        };
      }

      // Get milestone details
      const { data: milestone, error: milestoneError } = await supabase
        .from('project_milestones')
        .select('*, project_id')
        .eq('id', milestoneId)
        .single();

      if (milestoneError || !milestone) {
        throw new Error('Milestone not found');
      }

      // Check if already paid
      if (milestone.status === 'paid') {
        return {
          success: true,
          demo_mode: true,
          message: 'Payment already released for this milestone'
        };
      }

      // Get escrow account
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_accounts')
        .select('*')
        .eq('project_id', milestone.project_id)
        .single();

      if (escrowError || !escrow) {
        throw new Error('Escrow account not found');
      }

      // Calculate milestone amount
      const milestoneAmount = (escrow.total_amount * milestone.payment_percentage) / 100;

      // Check if sufficient funds in escrow
      if (escrow.held_amount < milestoneAmount) {
        return {
          success: false,
          demo_mode: true,
          message: `Insufficient escrow funds. Required: KES ${milestoneAmount.toLocaleString()}, Available: KES ${escrow.held_amount.toLocaleString()}`,
          error: 'Insufficient funds'
        };
      }

      // Generate demo payment reference
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      const paymentRef = `AUTO${timestamp}${random}`;

      // Create payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          escrow_account_id: escrow.id,
          milestone_id: milestoneId,
          amount: milestoneAmount,
          transaction_type: 'release',
          payment_method: 'auto_release_demo',
          status: 'completed',
          stripe_transaction_id: paymentRef
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw new Error('Failed to create payment transaction');
      }

      // Update milestone status to 'paid'
      await supabase
        .from('project_milestones')
        .update({ 
          status: 'paid',
          verified_at: new Date().toISOString()
        })
        .eq('id', milestoneId);

      // Update escrow account
      await supabase
        .from('escrow_accounts')
        .update({
          released_amount: escrow.released_amount + milestoneAmount,
          held_amount: escrow.held_amount - milestoneAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

      // Create realtime update for transparency
      await supabase
        .from('realtime_project_updates')
        .insert({
          project_id: milestone.project_id,
          update_type: 'auto_payment_released',
          message: `Auto-payment of KES ${milestoneAmount.toLocaleString()} released for "${milestone.title}" after ${verificationStatus.approvedCount} citizen verifications (Rating: ${verificationStatus.averageRating.toFixed(1)}/5)`,
          created_by: 'system',
          metadata: {
            milestone_id: milestoneId,
            amount: milestoneAmount,
            reference: paymentRef,
            verifications: verificationStatus.approvedCount,
            average_rating: verificationStatus.averageRating,
            demo_mode: true,
            auto_triggered: true
          }
        });

      console.log(`[AUTO-PAYMENT] Released KES ${milestoneAmount} for milestone ${milestoneId}. Ref: ${paymentRef}`);

      return {
        success: true,
        demo_mode: true,
        transaction: {
          id: transaction.id,
          amount: milestoneAmount,
          reference: paymentRef
        },
        message: `🎉 Payment of KES ${milestoneAmount.toLocaleString()} automatically released! Reference: ${paymentRef}`
      };

    } catch (error: any) {
      console.error('[AUTO-PAYMENT] Error:', error);
      return {
        success: false,
        demo_mode: true,
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
