import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MpesaPaymentService } from '@/services/MpesaPaymentService';

interface EscrowProject {
  id: string;
  project_id: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  status: string;
  projects: {
    id: string;
    title: string;
    description: string;
    budget: number;
    contractor_id: string | null;
    status: string;
    problem_reports?: {
      title: string;
      location: string;
      reported_by: string;
    };
  } | null;
  project_milestones: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    payment_percentage: number;
    milestone_number: number;
  }>;
}

export const useEscrowManagement = () => {
  const [escrowProjects, setEscrowProjects] = useState<EscrowProject[]>([]);
  const [readyForEscrowProjects, setReadyForEscrowProjects] = useState<any[]>([]);
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

      // Fetch existing escrow accounts with project details
      const { data: escrowData, error: escrowError } = await supabase
        .from('escrow_accounts')
        .select(`
          *,
          projects(
            id,
            title,
            description,
            budget,
            contractor_id,
            status,
            problem_reports(title, location, reported_by)
          )
        `)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (escrowError) {
        console.error('Error fetching escrow accounts:', escrowError);
      }

      // Get milestones for escrow projects
      const escrowProjectIds = (escrowData || []).map((e: any) => e.project_id).filter(Boolean);
      let milestonesData: any[] = [];
      
      if (escrowProjectIds.length > 0) {
        const { data: milestones, error: milestonesError } = await supabase
          .from('project_milestones')
          .select('*')
          .in('project_id', escrowProjectIds)
          .order('milestone_number');
        
        if (!milestonesError) {
          milestonesData = milestones || [];
        }
      }

      // Also fetch projects that are ready for escrow (contractor selected, no escrow yet)
      const { data: readyProjects, error: readyError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          budget,
          contractor_id,
          status,
          report_id,
          problem_reports(
            title,
            location,
            status,
            bidding_status
          )
        `)
        .not('contractor_id', 'is', null)
        .is('deleted_at', null);

      if (readyError) {
        console.error('Error fetching ready projects:', readyError);
      }

      // Filter projects that don't have escrow accounts yet
      const existingEscrowProjectIds = (escrowData || []).map((e: any) => e.project_id);
      const projectsNeedingEscrow = (readyProjects || []).filter(
        (p: any) => !existingEscrowProjectIds.includes(p.id)
      );

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
        project_milestones: milestonesData.filter(m => m.project_id === escrow.project_id)
      }));

      setEscrowProjects(mappedEscrowProjects);
      setReadyForEscrowProjects(projectsNeedingEscrow);
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
   * Create escrow account for a project
   */
  const createEscrowForProject = async (projectId: string, budget: number) => {
    try {
      setProcessingPayment(projectId);
      
      // Create escrow account
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_accounts')
        .insert({
          project_id: projectId,
          total_amount: budget,
          held_amount: 0,
          released_amount: 0,
          status: 'active'
        })
        .select()
        .single();

      if (escrowError) throw escrowError;

      // Create default milestones (can be customized later)
      const defaultMilestones = [
        { title: 'Project Initiation', description: 'Site preparation and mobilization', payment_percentage: 20, milestone_number: 1 },
        { title: 'Construction Phase', description: 'Main construction work', payment_percentage: 50, milestone_number: 2 },
        { title: 'Completion & Handover', description: 'Final inspection and project completion', payment_percentage: 30, milestone_number: 3 }
      ];

      const { error: milestonesError } = await supabase
        .from('project_milestones')
        .insert(
          defaultMilestones.map(m => ({
            ...m,
            project_id: projectId,
            status: 'pending'
          }))
        );

      if (milestonesError) {
        console.error('Error creating milestones:', milestonesError);
      }

      toast({
        title: "Escrow Account Created",
        description: `Escrow account created for project with KES ${budget?.toLocaleString() || 0} budget.`,
      });

      fetchEscrowData(); // Refresh data
      return escrow;
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create escrow account",
        variant: "destructive"
      });
      throw error;
    } finally {
      setProcessingPayment(null);
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
    readyForEscrowProjects,
    blockchainTransactions,
    loading,
    processingPayment,
    createEscrowForProject,
    handleFundEscrow,
    handleReleaseFunds,
    getProjectWorkflowStatus,
    refreshData: fetchEscrowData
  };
};