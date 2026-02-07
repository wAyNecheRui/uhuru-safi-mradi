import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './NotificationService';

// Demo mode - generates simulated M-Pesa B2C transaction reference
function generateDemoB2CRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `WB2C${timestamp}${random}`;
}

/**
 * WorkerPaymentService - Handles daily worker payments separate from contractor milestone payments.
 *
 * PAYMENT SOURCE: Contractors are the employers. They receive milestone payments from
 * the government escrow and pay workers from their earnings. Worker wages are the
 * contractor's operational cost — this system is completely independent of the
 * project escrow / milestone payment pipeline.
 *
 * FLOW:
 *  1. Contractor records daily attendance → worker_daily_records (auto-verified)
 *  2. Contractor clicks "Pay" → processDailyPayment()
 *  3. System creates worker_payments record
 *  4. System auto-simulates M-Pesa B2C (demo mode) → completes payment immediately
 *  5. worker_daily_records marked as 'paid', worker notified with reference
 */
class WorkerPaymentServiceClass {
  /**
   * Record a day of work for a hired worker
   */
  async recordDailyWork(params: {
    jobApplicationId: string;
    workerId: string;
    jobId: string;
    workDate: string;
    hoursWorked?: number;
    dailyRate: number;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const amountEarned = (params.hoursWorked || 8) * (params.dailyRate / 8);

      const { error } = await supabase
        .from('worker_daily_records')
        .insert({
          job_application_id: params.jobApplicationId,
          worker_id: params.workerId,
          job_id: params.jobId,
          work_date: params.workDate,
          hours_worked: params.hoursWorked || 8,
          daily_rate: params.dailyRate,
          amount_earned: amountEarned,
          notes: params.notes,
          verification_status: 'pending',
          payment_status: 'unpaid'
        });

      if (error) throw error;

      // Update total days worked and earned on job application
      await supabase
        .from('job_applications')
        .update({
          total_days_worked: supabase.rpc ? undefined : 1,
          total_earned: amountEarned
        })
        .eq('id', params.jobApplicationId);

      return { success: true };
    } catch (error: any) {
      console.error('Error recording daily work:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify a worker's daily record (by contractor)
   */
  async verifyDailyRecord(
    recordId: string,
    verifierId: string,
    status: 'verified' | 'disputed'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('worker_daily_records')
        .update({
          verified_by: verifierId,
          verification_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error verifying daily record:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process payment for verified daily records.
   *
   * In DEMO MODE the payment is auto-completed immediately:
   *  - A simulated M-Pesa B2C reference is generated
   *  - worker_payments status goes straight to 'completed'
   *  - worker_daily_records are marked 'paid'
   *  - Worker receives a notification with the payment reference
   *
   * The money comes from the CONTRACTOR (their milestone earnings).
   * This is completely separate from the project escrow system.
   */
  async processDailyPayment(params: {
    workerId: string;
    jobId: string;
    recordIds: string[];
    paymentMethod?: string;
  }): Promise<{ success: boolean; paymentId?: string; reference?: string; error?: string }> {
    try {
      // Get the records to pay
      const { data: records, error: fetchError } = await supabase
        .from('worker_daily_records')
        .select('*')
        .in('id', params.recordIds)
        .eq('payment_status', 'unpaid')
        .eq('verification_status', 'verified');

      if (fetchError) throw fetchError;
      if (!records || records.length === 0) {
        return { success: false, error: 'No verified unpaid records found' };
      }

      const totalAmount = records.reduce((sum, r) => sum + Number(r.amount_earned), 0);
      const periodStart = records.reduce(
        (min, r) => (r.work_date < min ? r.work_date : min),
        records[0].work_date
      );
      const periodEnd = records.reduce(
        (max, r) => (r.work_date > max ? r.work_date : max),
        records[0].work_date
      );

      // --- DEMO MODE: auto-complete immediately ---
      const transactionRef = generateDemoB2CRef();

      // 1. Create payment record as already completed
      const { data: payment, error: paymentError } = await supabase
        .from('worker_payments')
        .insert({
          worker_id: params.workerId,
          job_id: params.jobId,
          amount: totalAmount,
          payment_method: params.paymentMethod || 'mpesa',
          payment_status: 'completed',
          payment_reference: transactionRef,
          processed_at: new Date().toISOString(),
          period_start: periodStart,
          period_end: periodEnd,
          daily_records_count: records.length
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Mark all daily records as paid
      const { error: updateError } = await supabase
        .from('worker_daily_records')
        .update({
          payment_status: 'paid',
          payment_transaction_id: transactionRef,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', params.recordIds);

      if (updateError) throw updateError;

      // 3. Get job title for the notification
      let jobTitle = 'your job';
      const { data: jobData } = await supabase
        .from('workforce_jobs')
        .select('title')
        .eq('id', params.jobId)
        .maybeSingle();
      if (jobData?.title) jobTitle = jobData.title;

      // 4. Notify worker
      await NotificationService.notifyUser(
        params.workerId,
        '💰 Payment Received!',
        `You have been paid KES ${totalAmount.toLocaleString()} for ${records.length} day(s) of work on "${jobTitle}". M-Pesa Ref: ${transactionRef}`,
        'success',
        'payment',
        '/citizen/my-jobs'
      );

      console.log(
        `[WORKER-PAY] Demo B2C completed: KES ${totalAmount} → worker ${params.workerId}, ref: ${transactionRef}`
      );

      return { success: true, paymentId: payment.id, reference: transactionRef };
    } catch (error: any) {
      console.error('Error processing payment:', error);
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
