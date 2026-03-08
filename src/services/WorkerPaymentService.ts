import { supabase } from '@/integrations/supabase/client';

/**
 * WorkerPaymentService - Handles daily worker payments via escrow-deducted model.
 *
 * PAYMENT SOURCE: Workers are paid directly from the project escrow's worker wage
 * allocation — NOT from contractor earnings. This guarantees wage protection.
 *
 * FLOW:
 *  1. Contractor records daily attendance → worker_daily_records
 *  2. Record is auto-verified (contractor-verified by default)
 *  3. Contractor clicks "Pay" → processEscrowPayment()
 *  4. Edge function checks escrow worker_wage_allocation has funds
 *  5. System auto-simulates M-Pesa B2C (demo mode)
 *  6. Escrow worker_wage_released updated, worker notified with reference
 *  7. Transaction appears on blockchain transparency portal
 */
class WorkerPaymentServiceClass {
  /**
   * Process payment for verified daily records via escrow deduction.
   * Calls the pay-worker-from-escrow edge function which:
   *  - Validates escrow has sufficient worker wage funds
   *  - Creates worker_payments record linked to escrow
   *  - Simulates M-Pesa B2C
   *  - Updates escrow balances
   *  - Creates blockchain + transparency records
   *  - Notifies worker
   */
  async processDailyPayment(params: {
    workerId: string;
    jobId: string;
    recordIds: string[];
    paymentMethod?: string;
  }): Promise<{ success: boolean; paymentId?: string; reference?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('pay-worker-from-escrow', {
        body: {
          worker_id: params.workerId,
          job_id: params.jobId,
          record_ids: params.recordIds,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        return { success: false, error: data.error || data.message };
      }

      return {
        success: true,
        paymentId: data.payment?.id,
        reference: data.payment?.reference
      };
    } catch (error: any) {
      console.error('[WorkerPaymentService] Escrow payment error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unpaid verified records for a worker
   */
  async getUnpaidRecords(workerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('worker_daily_records')
        .select('*, workforce_jobs(title, location)')
        .eq('worker_id', workerId)
        .eq('payment_status', 'unpaid')
        .eq('verification_status', 'verified')
        .order('work_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unpaid records:', error);
      return [];
    }
  }

  /**
   * Get payment history for a worker
   */
  async getPaymentHistory(workerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('worker_payments')
        .select('*, workforce_jobs(title, location)')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }
}

export const WorkerPaymentService = new WorkerPaymentServiceClass();
