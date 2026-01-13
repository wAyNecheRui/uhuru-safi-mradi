/**
 * ProjectLifecycleService - Full Project Lifecycle Management
 * 
 * Implements the complete workflow:
 * 1. Financial Activation (Escrow Funding) - Government deposits upfront
 * 2. Project Planning & Workforce Integration - Local hiring
 * 3. Execution & Real-Time Monitoring - Milestone documentation
 * 4. Milestone Verification & Payment Release - Citizen sign-off
 * 5. Project Completion & Accountability - Performance rating
 */

import { supabase } from '@/integrations/supabase/client';

export const PROJECT_LIFECYCLE_STATUS = {
  CONTRACTOR_SELECTED: 'contractor_selected',
  AWAITING_ESCROW: 'awaiting_escrow',
  ESCROW_FUNDED: 'escrow_funded',
  IN_PROGRESS: 'in_progress',
  UNDER_VERIFICATION: 'under_verification',
  COMPLETED: 'completed',
} as const;

export interface LifecycleStep {
  step: number;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  actionRequired?: string;
  actionBy?: 'government' | 'contractor' | 'citizen';
}

export interface ProjectLifecycleState {
  projectId: string;
  currentPhase: string;
  escrowFunded: boolean;
  escrowAmount: number;
  fundedAmount: number;
  workCanStart: boolean;
  milestonesTotal: number;
  milestonesCompleted: number;
  milestonesVerified: number;
  milestonesPaid: number;
  citizenVerificationsRequired: number;
  citizenVerificationsReceived: number;
  contractorRating: number | null;
  steps: LifecycleStep[];
}

export class ProjectLifecycleService {
  /**
   * Get the full lifecycle state for a project
   */
  static async getProjectLifecycleState(projectId: string): Promise<ProjectLifecycleState | null> {
    try {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) return null;

      // Fetch escrow account
      const { data: escrow } = await supabase
        .from('escrow_accounts')
        .select('*')
        .eq('project_id', projectId)
        .single();

      // Fetch milestones
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId);

      // Fetch verifications
      const { data: verifications } = await supabase
        .from('milestone_verifications')
        .select('*, project_milestones!inner(project_id)')
        .eq('project_milestones.project_id', projectId);

      // Fetch contractor rating
      const { data: ratings } = await supabase
        .from('contractor_ratings')
        .select('rating')
        .eq('project_id', projectId);

      // Calculate states
      const escrowFunded = escrow ? escrow.held_amount >= escrow.total_amount : false;
      const fundedAmount = escrow?.held_amount || 0;
      const escrowAmount = escrow?.total_amount || project.budget || 0;
      
      const milestonesTotal = milestones?.length || 0;
      const milestonesCompleted = milestones?.filter(m => 
        ['submitted', 'verified', 'paid'].includes(m.status)
      ).length || 0;
      const milestonesVerified = milestones?.filter(m => 
        ['verified', 'paid'].includes(m.status)
      ).length || 0;
      const milestonesPaid = milestones?.filter(m => m.status === 'paid').length || 0;

      // Each milestone needs at least 2 citizen verifications
      const citizenVerificationsRequired = milestonesTotal * 2;
      const citizenVerificationsReceived = verifications?.filter(v => 
        v.verification_status === 'approved'
      ).length || 0;

      const avgRating = ratings && ratings.length > 0
        ? ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / ratings.length
        : null;

      // Determine current phase
      let currentPhase = project.status || 'planning';
      if (!escrowFunded && project.contractor_id) {
        currentPhase = PROJECT_LIFECYCLE_STATUS.AWAITING_ESCROW;
      } else if (escrowFunded && project.status === 'planning') {
        currentPhase = PROJECT_LIFECYCLE_STATUS.ESCROW_FUNDED;
      }

      const workCanStart = escrowFunded && !!project.contractor_id;

      // Build lifecycle steps
      const steps = this.buildLifecycleSteps({
        contractorSelected: !!project.contractor_id,
        escrowFunded,
        fundedPercentage: escrowAmount > 0 ? (fundedAmount / escrowAmount) * 100 : 0,
        workStarted: ['in_progress', 'under_verification', 'completed'].includes(project.status),
        milestonesSubmitted: milestonesCompleted > 0,
        milestonesVerified: milestonesVerified > 0,
        allMilestonesVerified: milestonesVerified === milestonesTotal && milestonesTotal > 0,
        projectCompleted: project.status === 'completed',
        hasRating: avgRating !== null
      });

      return {
        projectId,
        currentPhase,
        escrowFunded,
        escrowAmount,
        fundedAmount,
        workCanStart,
        milestonesTotal,
        milestonesCompleted,
        milestonesVerified,
        milestonesPaid,
        citizenVerificationsRequired,
        citizenVerificationsReceived,
        contractorRating: avgRating,
        steps
      };
    } catch (error) {
      console.error('Error getting project lifecycle state:', error);
      return null;
    }
  }

  /**
   * Build lifecycle steps based on current state
   */
  private static buildLifecycleSteps(state: {
    contractorSelected: boolean;
    escrowFunded: boolean;
    fundedPercentage: number;
    workStarted: boolean;
    milestonesSubmitted: boolean;
    milestonesVerified: boolean;
    allMilestonesVerified: boolean;
    projectCompleted: boolean;
    hasRating: boolean;
  }): LifecycleStep[] {
    const steps: LifecycleStep[] = [
      {
        step: 1,
        name: 'Contractor Selection',
        description: 'Government selects winning contractor bid',
        status: state.contractorSelected ? 'completed' : 'current',
        actionBy: 'government'
      },
      {
        step: 2,
        name: 'Escrow Funding',
        description: 'Government deposits full project amount into secure escrow',
        status: state.escrowFunded ? 'completed' : (state.contractorSelected ? 'current' : 'pending'),
        actionRequired: state.contractorSelected && !state.escrowFunded 
          ? `Fund escrow (${state.fundedPercentage.toFixed(0)}% funded)`
          : undefined,
        actionBy: 'government'
      },
      {
        step: 3,
        name: 'Work Commencement',
        description: 'Contractor begins project execution with local workforce',
        status: state.workStarted ? 'completed' : (state.escrowFunded ? 'current' : 'pending'),
        actionRequired: state.escrowFunded && !state.workStarted 
          ? 'Start project execution'
          : undefined,
        actionBy: 'contractor'
      },
      {
        step: 4,
        name: 'Milestone Documentation',
        description: 'Contractor submits photo/video evidence for milestones',
        status: state.milestonesSubmitted ? 'completed' : (state.workStarted ? 'current' : 'pending'),
        actionRequired: state.workStarted && !state.milestonesSubmitted 
          ? 'Submit milestone evidence'
          : undefined,
        actionBy: 'contractor'
      },
      {
        step: 5,
        name: 'Citizen Verification',
        description: 'Citizens verify milestone completion on-site',
        status: state.milestonesVerified ? 'completed' : (state.milestonesSubmitted ? 'current' : 'pending'),
        actionRequired: state.milestonesSubmitted && !state.milestonesVerified 
          ? 'Verify work quality on-site'
          : undefined,
        actionBy: 'citizen'
      },
      {
        step: 6,
        name: 'Payment Release',
        description: 'Escrow releases payment for verified milestones',
        status: state.allMilestonesVerified ? 'completed' : (state.milestonesVerified ? 'current' : 'pending'),
        actionBy: 'government'
      },
      {
        step: 7,
        name: 'Project Completion',
        description: 'Final sign-off and contractor performance rating',
        status: state.projectCompleted ? 'completed' : (state.allMilestonesVerified ? 'current' : 'pending'),
        actionRequired: state.allMilestonesVerified && !state.projectCompleted 
          ? 'Complete project and rate contractor'
          : undefined,
        actionBy: 'government'
      }
    ];

    return steps;
  }

  /**
   * Check if contractor can start work
   */
  static async canContractorStartWork(projectId: string): Promise<{
    allowed: boolean;
    reason?: string;
    escrowStatus?: { funded: number; required: number };
  }> {
    const { data: escrow } = await supabase
      .from('escrow_accounts')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!escrow) {
      return {
        allowed: false,
        reason: 'Escrow account not created. Government must set up escrow first.',
        escrowStatus: { funded: 0, required: 0 }
      };
    }

    const isFunded = escrow.held_amount >= escrow.total_amount;
    
    if (!isFunded) {
      return {
        allowed: false,
        reason: `Awaiting escrow funding. ${((escrow.held_amount / escrow.total_amount) * 100).toFixed(0)}% funded.`,
        escrowStatus: { funded: escrow.held_amount, required: escrow.total_amount }
      };
    }

    return {
      allowed: true,
      escrowStatus: { funded: escrow.held_amount, required: escrow.total_amount }
    };
  }

  /**
   * Check if milestone can be paid (requires citizen verification)
   */
  static async canReleaseMilestonePayment(milestoneId: string): Promise<{
    allowed: boolean;
    reason?: string;
    verificationsRequired: number;
    verificationsReceived: number;
  }> {
    // Get verifications for this milestone
    const { data: verifications } = await supabase
      .from('milestone_verifications')
      .select('*')
      .eq('milestone_id', milestoneId)
      .eq('verification_status', 'approved');

    const approvedCount = verifications?.length || 0;
    const requiredCount = 2; // Minimum citizen verifications required

    if (approvedCount < requiredCount) {
      return {
        allowed: false,
        reason: `Requires ${requiredCount} citizen verifications. Currently has ${approvedCount}.`,
        verificationsRequired: requiredCount,
        verificationsReceived: approvedCount
      };
    }

    // Check milestone status
    const { data: milestone } = await supabase
      .from('project_milestones')
      .select('status')
      .eq('id', milestoneId)
      .single();

    if (!milestone || milestone.status !== 'submitted') {
      return {
        allowed: false,
        reason: 'Milestone must be submitted before payment can be released.',
        verificationsRequired: requiredCount,
        verificationsReceived: approvedCount
      };
    }

    return {
      allowed: true,
      verificationsRequired: requiredCount,
      verificationsReceived: approvedCount
    };
  }

  /**
   * Complete project and update records
   */
  static async completeProject(projectId: string, contractorRating: {
    rating: number;
    work_quality: number;
    communication: number;
    completion_timeliness: number;
    review?: string;
  }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get project and contractor info
      const { data: project } = await supabase
        .from('projects')
        .select('contractor_id, title, budget')
        .eq('id', projectId)
        .single();

      if (!project || !project.contractor_id) {
        throw new Error('Project or contractor not found');
      }

      // Update project status to completed
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Add contractor rating
      const { error: ratingError } = await supabase
        .from('contractor_ratings')
        .insert({
          contractor_id: project.contractor_id,
          project_id: projectId,
          rated_by: user.id,
          rating: contractorRating.rating,
          work_quality: contractorRating.work_quality,
          communication: contractorRating.communication,
          completion_timeliness: contractorRating.completion_timeliness,
          review: contractorRating.review
        });

      if (ratingError) throw ratingError;

      // Update contractor profile average rating
      const { data: allRatings } = await supabase
        .from('contractor_ratings')
        .select('rating')
        .eq('contractor_id', project.contractor_id);

      if (allRatings && allRatings.length > 0) {
        const avgRating = allRatings.reduce((acc, r) => acc + (r.rating || 0), 0) / allRatings.length;
        
        await supabase
          .from('contractor_profiles')
          .update({ 
            average_rating: avgRating,
            previous_projects_count: allRatings.length
          })
          .eq('user_id', project.contractor_id);
      }

      // Create notification for contractor
      await supabase.from('notifications').insert({
        user_id: project.contractor_id,
        title: 'Project Completed',
        message: `Your project "${project.title}" has been marked as complete. You received a ${contractorRating.rating}/5 rating.`,
        type: 'success',
        category: 'project'
      });

      // Create realtime update
      await supabase.from('realtime_project_updates').insert({
        project_id: projectId,
        update_type: 'project_completed',
        message: `Project completed with contractor rating: ${contractorRating.rating}/5`,
        created_by: user.id,
        metadata: {
          final_rating: contractorRating.rating,
          budget: project.budget
        }
      });

      return true;
    } catch (error) {
      console.error('Error completing project:', error);
      return false;
    }
  }

  /**
   * Get workforce jobs for a project
   */
  static async getProjectWorkforceJobs(projectId: string) {
    const { data, error } = await supabase
      .from('workforce_jobs')
      .select(`
        *,
        job_applications(id, status, applicant_id)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create workforce job for project
   */
  static async createWorkforceJob(projectId: string, jobData: {
    title: string;
    description: string;
    location: string;
    required_skills: string[];
    wage_min?: number;
    wage_max?: number;
    duration_days?: number;
    positions_available: number;
  }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('workforce_jobs')
        .insert({
          ...jobData,
          project_id: projectId,
          created_by: user.id,
          status: 'open'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating workforce job:', error);
      return false;
    }
  }

  /**
   * Get transparency data for public portal
   */
  static async getTransparencyData(projectId: string) {
    const lifecycle = await this.getProjectLifecycleState(projectId);
    
    // Get project details
    const { data: project } = await supabase
      .from('projects')
      .select(`
        *,
        problem_reports(location, category, affected_population)
      `)
      .eq('id', projectId)
      .single();

    // Get all transactions
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('escrow_account_id', projectId)
      .order('created_at', { ascending: false });

    // Get blockchain records
    const { data: blockchain } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    return {
      lifecycle,
      project,
      transactions,
      blockchain
    };
  }
}
