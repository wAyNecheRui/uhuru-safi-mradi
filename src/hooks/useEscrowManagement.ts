import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEscrowManagement = () => {
  const [escrowProjects, setEscrowProjects] = useState([]);
  const [blockchainTransactions, setBlockchainTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEscrowData();
  }, []);

  const fetchEscrowData = async () => {
    try {
      setLoading(true);

      // Fetch escrow accounts with project details
      const { data: escrowData } = await supabase
        .from('escrow_accounts')
        .select(`
          *,
          projects(
            *,
            problem_reports(title, location, reported_by),
            project_milestones(*)
          )
        `)
        .eq('status', 'active');

      // Fetch payment transactions for blockchain trail
      const { data: transactionData } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          escrow_accounts(
            projects(title)
          ),
          project_milestones(title)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      setEscrowProjects(escrowData || []);
      setBlockchainTransactions(transactionData || []);
    } catch (error) {
      console.error('Error fetching escrow data:', error);
      toast({
        title: "Error",
        description: "Failed to load escrow data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFunds = async (projectId: string, milestoneId: string) => {
    try {
      // Create payment transaction
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('payment_transactions')
        .insert({
          escrow_account_id: projectId,
          milestone_id: milestoneId,
          amount: 0, // TODO: Get amount from milestone
          transaction_type: 'milestone_payment',
          status: 'completed'
        });

      toast({
        title: "Funds released successfully!",
        description: `Phase payment has been released to contractor. Transaction recorded.`,
      });

      fetchEscrowData(); // Refresh data
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast({
        title: "Error",
        description: "Failed to release funds",
        variant: "destructive"
      });
    }
  };

  return {
    escrowProjects,
    blockchainTransactions,
    loading,
    handleReleaseFunds
  };
};