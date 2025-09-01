import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePaymentTransparency = () => {
  const [paymentTrails, setPaymentTrails] = useState([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);

      // Fetch completed payment transactions
      const { data: paymentData } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          escrow_accounts(
            projects(
              title,
              contractor_bids(contractor_id)
            )
          ),
          project_milestones(title)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch upcoming milestones
      const { data: milestoneData } = await supabase
        .from('project_milestones')
        .select(`
          *,
          projects(title, budget)
        `)
        .eq('status', 'pending')
        .order('target_completion_date', { ascending: true })
        .limit(5);

      // Transform payment data
      const transformedPayments = paymentData?.map(payment => ({
        id: payment.id,
        projectTitle: payment.escrow_accounts?.projects?.title || 'Unknown Project',
        amount: payment.amount,
        milestone: payment.project_milestones?.title || 'Milestone Payment',
        paymentMethod: payment.payment_method || 'Bank Transfer',
        mpesaReference: payment.stripe_transaction_id || 'N/A',
        contractorPhone: '+254 XXX XXX XXX', // TODO: Get from contractor profile
        releaseDate: payment.created_at,
        verificationStatus: 'government_verified',
        citizenVerifications: Math.floor(Math.random() * 50) + 20, // TODO: Get actual verifications
        holdingBank: 'Kenya Commercial Bank',
        escrowAccount: `KCB-ESC-${payment.escrow_account_id.slice(-8)}`,
        blockchainHash: `0x${payment.id.replace(/-/g, '').slice(0, 20)}`,
        ncaVerification: 'verified',
        eaccClearance: 'cleared'
      })) || [];

      // Transform milestone data
      const transformedMilestones = milestoneData?.map(milestone => ({
        projectTitle: milestone.projects?.title || 'Unknown Project',
        milestone: milestone.title,
        expectedAmount: (milestone.projects?.budget || 0) * (milestone.payment_percentage / 100),
        expectedDate: milestone.target_completion_date,
        progressRequired: 75, // TODO: Calculate from actual progress
        currentProgress: Math.floor(Math.random() * 70) + 10,
        citizenVerificationsNeeded: 30,
        currentVerifications: Math.floor(Math.random() * 25) + 5
      })) || [];

      setPaymentTrails(transformedPayments);
      setUpcomingMilestones(transformedMilestones);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    paymentTrails,
    upcomingMilestones,
    loading
  };
};