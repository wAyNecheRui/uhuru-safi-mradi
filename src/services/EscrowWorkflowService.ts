import { supabase } from '@/integrations/supabase/client';

export interface ProjectEscrowStatus {
  projectId: string;
  projectTitle: string;
  totalBudget: number;
  escrowId: string | null;
  escrowStatus: 'not_created' | 'pending_funding' | 'partially_funded' | 'fully_funded' | 'completed';
  heldAmount: number;
  releasedAmount: number;
  fundingPercentage: number;
  canStartWork: boolean;
  requiresFunding: boolean;
  contractorId: string | null;
}

export interface WorkflowStep {
  step: number;
  name: string;
  status: 'completed' | 'current' | 'pending';
  description: string;
}

export class EscrowWorkflowService {
  /**
   * Get the escrow status for a project
   */
  static async getProjectEscrowStatus(projectId: string): Promise<ProjectEscrowStatus | null> {
    try {
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) return null;

      // Get escrow account
      const { data: escrow } = await supabase
        .from('escrow_accounts')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const totalBudget = project.budget || 0;
      const heldAmount = escrow?.held_amount || 0;
      const releasedAmount = escrow?.released_amount || 0;
      
      // Total funded = held + released (money in escrow + money already paid out to contractor)
      const totalFunded = heldAmount + releasedAmount;
      const fundingPercentage = totalBudget > 0 ? Math.round((totalFunded / totalBudget) * 100) : 0;

      let escrowStatus: ProjectEscrowStatus['escrowStatus'] = 'not_created';
      if (escrow) {
        if (escrow.status === 'completed') {
          escrowStatus = 'completed';
        } else if (totalFunded >= totalBudget) {
          // Fully funded if total funded (held + released) equals or exceeds budget
          escrowStatus = 'fully_funded';
        } else if (totalFunded > 0) {
          escrowStatus = 'partially_funded';
        } else {
          escrowStatus = 'pending_funding';
        }
      }

      // Work can start only when escrow is fully funded
      const canStartWork = escrowStatus === 'fully_funded' || escrowStatus === 'completed';
      const requiresFunding = escrowStatus !== 'fully_funded' && escrowStatus !== 'completed';

      return {
        projectId: project.id,
        projectTitle: project.title,
        totalBudget,
        escrowId: escrow?.id || null,
        escrowStatus,
        heldAmount,
        releasedAmount,
        fundingPercentage,
        canStartWork,
        requiresFunding,
        contractorId: project.contractor_id
      };
    } catch (error) {
      console.error('Error getting project escrow status:', error);
      return null;
    }
  }

  /**
   * Check if a contractor can work on a project
   */
  static async canContractorWork(projectId: string): Promise<{ allowed: boolean; reason: string }> {
    const status = await this.getProjectEscrowStatus(projectId);
    
    if (!status) {
      return { allowed: false, reason: 'Project not found' };
    }

    if (!status.contractorId) {
      return { allowed: false, reason: 'No contractor assigned to this project' };
    }

    if (status.escrowStatus === 'not_created') {
      return { 
        allowed: false, 
        reason: 'Escrow account has not been created. Government must set up escrow first.' 
      };
    }

    if (status.escrowStatus === 'pending_funding') {
      return { 
        allowed: false, 
        reason: 'Escrow account is pending funding. Government must deposit funds before work can begin.' 
      };
    }

    if (status.escrowStatus === 'partially_funded') {
      return { 
        allowed: false, 
        reason: `Escrow is only ${status.fundingPercentage}% funded. Full funding required before work can begin.` 
      };
    }

    return { allowed: true, reason: 'Project is fully funded and ready for work' };
  }

  /**
   * Get the workflow steps for a project
   */
  static async getWorkflowSteps(projectId: string): Promise<WorkflowStep[]> {
    const status = await this.getProjectEscrowStatus(projectId);
    
    const steps: WorkflowStep[] = [
      {
        step: 1,
        name: 'Contractor Selected',
        status: status?.contractorId ? 'completed' : 'pending',
        description: 'Government selects winning contractor from bids'
      },
      {
        step: 2,
        name: 'Escrow Created',
        status: status?.escrowId ? 'completed' : (status?.contractorId ? 'current' : 'pending'),
        description: 'Government creates escrow account for project funds'
      },
      {
        step: 3,
        name: 'Escrow Funded',
        status: status?.escrowStatus === 'fully_funded' || status?.escrowStatus === 'completed' 
          ? 'completed' 
          : (status?.escrowId ? 'current' : 'pending'),
        description: 'Government deposits full project budget into escrow'
      },
      {
        step: 4,
        name: 'Work Begins',
        status: status?.canStartWork ? 'completed' : 'pending',
        description: 'Contractor begins work on project milestones'
      },
      {
        step: 5,
        name: 'Milestone Verification',
        status: 'pending',
        description: 'Citizens verify completed milestones'
      },
      {
        step: 6,
        name: 'Payment Release',
        status: status?.releasedAmount && status.releasedAmount > 0 ? 'completed' : 'pending',
        description: 'Funds released to contractor per verified milestone'
      }
    ];

    // Adjust current step
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].status === 'completed' && i < steps.length - 1 && steps[i + 1].status === 'pending') {
        steps[i + 1].status = 'current';
        break;
      }
    }

    return steps;
  }

  /**
   * Create escrow account and milestones for a project
   */
  static async createEscrowForProject(projectId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) throw new Error('Project not found');

      // Create default milestones
      const defaultMilestones = [
        { milestone_number: 1, description: 'Project Initiation & Site Preparation', payment_percentage: 20 },
        { milestone_number: 2, description: 'Foundation & Core Work', payment_percentage: 30 },
        { milestone_number: 3, description: 'Main Construction Phase', payment_percentage: 30 },
        { milestone_number: 4, description: 'Finishing & Quality Inspection', payment_percentage: 20 }
      ];

      const { data, error } = await supabase.functions.invoke('create-escrow-account', {
        body: {
          project_id: projectId,
          total_amount: project.budget || 0,
          milestones: defaultMilestones
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating escrow:', error);
      return false;
    }
  }

  /**
   * Get projects awaiting escrow setup
   */
  static async getProjectsAwaitingEscrow(): Promise<any[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .not('contractor_id', 'is', null)
        .in('status', ['in_progress', 'planning']);

      if (error) throw error;

      const projectsWithoutEscrow = [];
      for (const project of projects || []) {
        const { data: escrow } = await supabase
          .from('escrow_accounts')
          .select('id')
          .eq('project_id', project.id)
          .single();

        if (!escrow) {
          projectsWithoutEscrow.push(project);
        }
      }

      return projectsWithoutEscrow;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Get projects awaiting funding
   */
  static async getProjectsAwaitingFunding(): Promise<any[]> {
    try {
      const { data: escrows, error } = await supabase
        .from('escrow_accounts')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('status', 'active');

      if (error) throw error;

      return (escrows || [])
        .filter(e => {
          // Project needs funding if total funded (held + released) is less than total
          const totalFunded = e.held_amount + e.released_amount;
          return totalFunded < e.total_amount;
        })
        .map(e => ({
          ...e.project,
          escrow: {
            id: e.id,
            total_amount: e.total_amount,
            held_amount: e.held_amount,
            released_amount: e.released_amount,
            status: e.status,
            funding_percentage: Math.round(((e.held_amount + e.released_amount) / e.total_amount) * 100)
          }
        }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }
}
