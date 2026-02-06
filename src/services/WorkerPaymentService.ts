import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './NotificationService';

/**
 * WorkerPaymentService - Handles daily worker payments separate from contractor milestone payments
 * Workers are paid based on verified daily attendance records
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
          total_days_worked: supabase.rpc ? undefined : 1, // Will be handled by trigger or manual update
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
   * Process payment for verified daily records
   */
  async processDailyPayment(params: {
    workerId: string;
    jobId: string;
    recordIds: string[];
    paymentMethod?: string;
  }): Promise<{ success: boolean; paymentId?: string; error?: string }> {
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
      const periodStart = records.reduce((min, r) => r.work_date < min ? r.work_date : min, records[0].work_date);
      const periodEnd = records.reduce((max, r) => r.work_date > max ? r.work_date : max, records[0].work_date);

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('worker_payments')
        .insert({
          worker_id: params.workerId,
          job_id: params.jobId,
          amount: totalAmount,
          payment_method: params.paymentMethod || 'mpesa',
          payment_status: 'pending',
          period_start: periodStart,
          period_end: periodEnd,
          daily_records_count: records.length
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update records as processing
      const { error: updateError } = await supabase
        .from('worker_daily_records')
        .update({
          payment_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .in('id', params.recordIds);

      if (updateError) throw updateError;

      // Notify worker
      await NotificationService.notifyUser(
        params.workerId,
        'Payment Processing',
        `Your payment of KES ${totalAmount.toLocaleString()} for ${records.length} day(s) of work is being processed.`,
        'info',
        'payment',
        '/citizen/my-jobs'
      );

      return { success: true, paymentId: payment.id };
    } catch (error: any) {
      console.error('Error processing payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark payment as completed (after M-Pesa confirmation)
   */
  async completePayment(
    paymentId: string,
    transactionReference: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get payment details
      const { data: payment, error: fetchError } = await supabase
        .from('worker_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Update payment as completed
      const { error: paymentError } = await supabase
        .from('worker_payments')
        .update({
          payment_status: 'completed',
          payment_reference: transactionReference,
          processed_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update all related daily records as paid
      const { error: recordsError } = await supabase
        .from('worker_daily_records')
        .update({
          payment_status: 'paid',
          payment_transaction_id: transactionReference,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('job_id', payment.job_id)
        .eq('worker_id', payment.worker_id)
        .eq('payment_status', 'processing');

      if (recordsError) throw recordsError;

      // Notify worker
      await NotificationService.notifyUser(
        payment.worker_id,
        'Payment Received',
        `Your payment of KES ${Number(payment.amount).toLocaleString()} has been sent to your M-Pesa. Reference: ${transactionReference}`,
        'success',
        'payment',
        '/citizen/my-jobs'
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error completing payment:', error);
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
