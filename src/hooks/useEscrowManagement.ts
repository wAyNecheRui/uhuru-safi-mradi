import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MpesaPaymentService } from '@/services/MpesaPaymentService';

export const useEscrowManagement = () => {
  const [escrowProjects, setEscrowProjects] = useState([]);
  const [blockchainTransactions, setBlockchainTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEscrowData();
  }, []);

  const fetchEscrowData = async () => {
    try {
      setLoading(true);

      // Fetch escrow accounts with project details
      const { data: escrowData, error: escrowError } = await supabase
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

      if (escrowError) {
        console.error('Error fetching escrow accounts:', escrowError);
      }

      // Fetch blockchain transactions for transparency trail
      const { data: transactionData, error: txError } = await supabase
        .from('blockchain_transactions')
        .select(`
          *,
          payment_transactions(
            *,
            project_milestones(title)
          )
        `)
        .eq('network_status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (txError) {
        console.error('Error fetching blockchain transactions:', txError);
      }

      // Map escrow projects to include milestones directly
      const mappedEscrowProjects = (escrowData || []).map((escrow: any) => ({
        ...escrow,
        project_milestones: escrow.projects?.project_milestones || []
      }));

      setEscrowProjects(mappedEscrowProjects);
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

  /**
   * Fund escrow account via M-Pesa C2B
   * Workflow step: Government approves → Treasury funds escrow
   */
  const handleFundEscrow = async (projectId: string, amount: number, treasuryReference?: string) => {
    try {
      setProcessingPayment(projectId);
      
      const result = await MpesaPaymentService.fundEscrowC2B({
        project_id: projectId,
        amount,
        treasury_reference: treasuryReference
      });

      toast({
        title: "Escrow Funded Successfully!",
        description: `KES ${amount.toLocaleString()} funded via M-Pesa C2B. Ref: ${result.transaction?.mpesa_reference}`,
      });

      fetchEscrowData(); // Refresh data
      return result;
    } catch (error: any) {
      console.error('Error funding escrow:', error);
      toast({
        title: "Funding Failed",
        description: error.message || "Failed to fund escrow account",
        variant: "destructive"
      });
      throw error;
    } finally {
      setProcessingPayment(null);
    }
  };

  /**
   * Release milestone payment to contractor via M-Pesa B2C
   * Workflow step: Citizens verify → Government approves → System pays contractor
   */
  const handleReleaseFunds = async (projectId: string, milestoneId: string, contractorPhone?: string) => {
    try {
      setProcessingPayment(milestoneId);
      
      const result = await MpesaPaymentService.payContractorB2C({
        milestone_id: milestoneId,
        contractor_phone: contractorPhone
      });

      toast({
        title: "Contractor Paid Successfully!",
        description: `Payment released via M-Pesa B2C. Ref: ${result.transaction?.mpesa_reference}`,
      });

      fetchEscrowData(); // Refresh data
      return result;
    } catch (error: any) {
      console.error('Error releasing funds:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to release payment",
        variant: "destructive"
      });
      throw error;
    } finally {
      setProcessingPayment(null);
    }
  };

  /**
   * Get workflow status for a specific project
   */
  const getProjectWorkflowStatus = async (projectId: string) => {
    try {
      return await MpesaPaymentService.getPaymentWorkflowStatus(projectId);
    } catch (error) {
      console.error('Error getting workflow status:', error);
      throw error;
    }
  };

  return {
    escrowProjects,
    blockchainTransactions,
    loading,
    processingPayment,
    handleFundEscrow,
    handleReleaseFunds,
    getProjectWorkflowStatus,
    refreshData: fetchEscrowData
  };
};
