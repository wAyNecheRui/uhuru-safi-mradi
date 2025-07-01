
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface EscrowAccount {
  id: string;
  project_id: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  status: 'active' | 'completed' | 'disputed' | 'cancelled';
  milestones: ProjectMilestone[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  escrow_account_id: string;
  milestone_number: number;
  description: string;
  amount: number;
  completion_criteria: string;
  status: 'pending' | 'completed' | 'verified' | 'paid';
  completed_at?: string;
  verified_at?: string;
  paid_at?: string;
}

export interface PaymentTransaction {
  id: string;
  escrow_account_id: string;
  milestone_id?: string;
  amount: number;
  transaction_type: 'deposit' | 'release' | 'refund';
  payment_method: 'mpesa' | 'bank_transfer' | 'card';
  mpesa_transaction_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export class EscrowService {
  // Create escrow account for project
  static async createEscrowAccount(projectData: {
    project_id: string;
    total_amount: number;
    milestones: Omit<ProjectMilestone, 'id' | 'escrow_account_id'>[];
  }): Promise<EscrowAccount> {
    const { data, error } = await supabase.functions.invoke('create-escrow-account', {
      body: projectData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.escrowAccount;
  }

  // Initiate M-Pesa payment
  static async initiatePayment(paymentData: {
    escrow_account_id: string;
    amount: number;
    phone_number: string;
    payment_method: 'mpesa' | 'bank_transfer';
  }): Promise<PaymentTransaction> {
    const { data, error } = await supabase.functions.invoke('initiate-payment', {
      body: paymentData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.transaction;
  }

  // Release milestone payment
  static async releaseMilestonePayment(milestoneId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('release-milestone-payment', {
      body: { milestoneId }
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Get escrow account details
  static async getEscrowAccount(projectId: string): Promise<EscrowAccount> {
    const { data, error } = await supabase
      .from('escrow_accounts')
      .select(`
        *,
        milestones:project_milestones(*)
      `)
      .eq('project_id', projectId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Get payment transactions
  static async getPaymentTransactions(escrowAccountId: string): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('escrow_account_id', escrowAccountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }
}
