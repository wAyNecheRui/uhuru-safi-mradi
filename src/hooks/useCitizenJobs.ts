import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { HiredJobWithDetails, WorkerDailyRecord, WorkerPayment } from '@/types/workforce';

export const useCitizenJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hiredJobs, setHiredJobs] = useState<HiredJobWithDetails[]>([]);
  const [pendingApplications, setPendingApplications] = useState<HiredJobWithDetails[]>([]);
  const [dailyRecords, setDailyRecords] = useState<WorkerDailyRecord[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<WorkerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    pendingPayment: 0,
    paidAmount: 0,
    daysWorked: 0
  });

  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch all job applications for this user
      const { data: applications, error: appsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          workforce_jobs (*)
        `)
        .eq('applicant_id', user.id)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      // Separate hired jobs from pending applications
      const hired: HiredJobWithDetails[] = [];
      const pending: HiredJobWithDetails[] = [];

      (applications || []).forEach((app: any) => {
        const jobWithDetails: HiredJobWithDetails = {
          ...app,
          job: app.workforce_jobs
        };

        if (app.status === 'accepted') {
          hired.push(jobWithDetails);
        } else if (app.status === 'pending') {
          pending.push(jobWithDetails);
        }
      });

      setHiredJobs(hired);
      setPendingApplications(pending);

      // Fetch daily records for hired jobs
      if (hired.length > 0) {
        const { data: records, error: recordsError } = await supabase
          .from('worker_daily_records')
          .select('*')
          .eq('worker_id', user.id)
          .order('work_date', { ascending: false });

        if (!recordsError && records) {
          setDailyRecords(records as WorkerDailyRecord[]);

          // Calculate earnings
          const totalEarned = records.reduce((sum, r) => sum + Number(r.amount_earned), 0);
          const paidAmount = records
            .filter(r => r.payment_status === 'paid')
            .reduce((sum, r) => sum + Number(r.amount_earned), 0);
          const pendingPayment = totalEarned - paidAmount;
          const daysWorked = records.length;

          setEarnings({
            totalEarned,
            pendingPayment,
            paidAmount,
            daysWorked
          });
        }
      }

      // Fetch payment history (completed batch payments with references)
      const { data: payments, error: paymentsError } = await supabase
        .from('worker_payments')
        .select('*')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (!paymentsError && payments) {
        setPaymentHistory(payments as WorkerPayment[]);
      }
    } catch (error: any) {
      console.error('Error fetching citizen jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your job applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Set up real-time subscription for job application updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('citizen-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `applicant_id=eq.${user.id}`
        },
        () => {
          fetchJobs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_daily_records',
          filter: `worker_id=eq.${user.id}`
        },
        () => {
          fetchJobs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_payments',
          filter: `worker_id=eq.${user.id}`
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchJobs]);

  return {
    hiredJobs,
    pendingApplications,
    dailyRecords,
    paymentHistory,
    earnings,
    loading,
    refetch: fetchJobs
  };
};
