import { supabase } from '@/integrations/supabase/client';

export interface C2BFundingRequest {
  project_id: string;
  amount: number;
  treasury_reference?: string;
}

export interface B2CPaymentRequest {
  milestone_id: string;
  contractor_phone?: string;
}

export interface MpesaTransactionResult {
  success: boolean;
  message: string;
  transaction?: {
    id: string;
    mpesa_reference: string;
    amount: number;
    status: string;
  };
  mpesa_response?: Record<string, unknown>;
}

/**
 * M-Pesa Payment Service
 * 
 * Demo mode implementation following the project workflow:
 * 1. Citizen reports problem
 * 2. Government approves
 * 3. Treasury funds escrow (C2B)
 * 4. Contractor executes
 * 5. Citizens verify milestone
 * 6. Government approves
 * 7. System pays contractor (B2C)
 * 8. Transparency dashboard updates
 */
export class MpesaPaymentService {
  
  /**
   * Fund escrow account via M-Pesa C2B (Customer to Business)
   * Used when: Treasury funds a project after government approval
   */
  static async fundEscrowC2B(request: C2BFundingRequest): Promise<MpesaTransactionResult> {
    try {
      const { data, error } = await supabase.functions.invoke('fund-escrow-c2b', {
        body: request
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('[MpesaPaymentService] C2B funding error:', error);
      throw error;
    }
  }

  /**
   * Pay contractor via M-Pesa B2C (Business to Customer)
   * Used when: Government releases milestone payment after citizen verification
   */
  static async payContractorB2C(request: B2CPaymentRequest): Promise<MpesaTransactionResult> {
    try {
      const { data, error } = await supabase.functions.invoke('pay-contractor-b2c', {
        body: request
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('[MpesaPaymentService] B2C payment error:', error);
      throw error;
    }
  }

  /**
   * Get payment workflow status for a project
   */
  static async getPaymentWorkflowStatus(projectId: string) {
    try {
      // Get escrow account
      const { data: escrow } = await supabase
        .from('escrow_accounts')
        .select('*')
        .eq('project_id', projectId)
        .single();

      // Get milestones with payment status
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_number');

      // Get payment transactions
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('escrow_account_id', escrow?.id)
        .order('created_at', { ascending: false });

      // Calculate workflow status
      const totalMilestones = milestones?.length || 0;
      const paidMilestones = milestones?.filter(m => m.status === 'paid').length || 0;
      const pendingMilestones = milestones?.filter(m => m.status === 'pending').length || 0;
      const inProgressMilestones = milestones?.filter(m => m.status === 'in_progress' || m.status === 'submitted').length || 0;

      return {
        escrow: escrow ? {
          id: escrow.id,
          total_amount: escrow.total_amount,
          held_amount: escrow.held_amount,
          released_amount: escrow.released_amount,
          status: escrow.status,
          funded: escrow.held_amount > 0 || escrow.released_amount > 0
        } : null,
        milestones: milestones || [],
        transactions: transactions || [],
        summary: {
          total_milestones: totalMilestones,
          paid_milestones: paidMilestones,
          pending_milestones: pendingMilestones,
          in_progress_milestones: inProgressMilestones,
          completion_percentage: totalMilestones > 0 ? Math.round((paidMilestones / totalMilestones) * 100) : 0
        },
        workflow_stage: this.determineWorkflowStage(escrow, milestones)
      };
    } catch (error) {
      console.error('[MpesaPaymentService] Workflow status error:', error);
      throw error;
    }
  }

  /**
   * Determine current workflow stage
   */
  private static determineWorkflowStage(escrow: any, milestones: any[]): string {
    if (!escrow) return 'awaiting_escrow_creation';
    if (escrow.held_amount === 0 && escrow.released_amount === 0) return 'awaiting_treasury_funding';
    
    const hasPendingMilestones = milestones?.some(m => m.status === 'pending');
    const hasSubmittedMilestones = milestones?.some(m => m.status === 'submitted');
    const hasInProgressMilestones = milestones?.some(m => m.status === 'in_progress');
    const allMilestonesPaid = milestones?.every(m => m.status === 'paid');

    if (allMilestonesPaid) return 'project_completed';
    if (hasSubmittedMilestones) return 'awaiting_verification';
    if (hasInProgressMilestones) return 'contractor_executing';
    if (hasPendingMilestones && escrow.held_amount > 0) return 'ready_for_execution';
    
    return 'in_progress';
  }

  /**
   * Get blockchain transparency records for a project
   */
  static async getBlockchainRecords(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('blockchain_transactions')
        .select(`
          *,
          payment_transactions (
            *,
            project_milestones (title)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[MpesaPaymentService] Blockchain records error:', error);
      throw error;
    }
  }
}
