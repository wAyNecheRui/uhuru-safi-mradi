import { supabase } from '@/integrations/supabase/client';
import { 
  WorkflowStep, 
  WorkflowState, 
  ProjectStatus,
  CommunityVote,
  ContractorBid,
  ProjectMilestone,
  MilestoneVerification,
  EscrowAccount
} from '@/types/workflow';

export class WorkflowService {
  // STEP 1: Problem Identification
  static async submitProblemReport(reportData: {
    title: string;
    description: string;
    category: string;
    location: string;
    coordinates?: string;
    estimated_cost?: number;
    affected_population?: number;
    photo_urls?: string[];
  }) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('problem_reports')
      .insert({
        ...reportData,
        reported_by: user.id,
        status: 'submitted',
        priority: 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // STEP 2: Community Validation
  static async submitVote(reportId: string, voteType: 'upvote' | 'downvote', comment?: string) {
    const { data, error } = await supabase
      .from('community_votes')
      .upsert({
        report_id: reportId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        vote_type: voteType,
        comment
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getVotesForReport(reportId: string): Promise<CommunityVote[]> {
    const { data, error } = await supabase
      .from('community_votes')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CommunityVote[];
  }

  static async getCommunityRankedProblems() {
    const { data, error } = await supabase
      .from('problem_reports')
      .select(`
        *,
        user_profiles!reported_by(full_name, location)
      `)
      .eq('status', 'submitted')
      .order('priority_score', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // STEP 3: Government Approval & Budget Allocation
  static async approveReport(reportId: string, budgetAmount: number) {
    const user = (await supabase.auth.getUser()).data.user;
    
    const { data, error } = await supabase
      .from('problem_reports')
      .update({
        status: 'approved',
        budget_allocated: budgetAmount,
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createEscrowAccount(projectId: string, totalAmount: number): Promise<EscrowAccount> {
    const { data, error } = await supabase
      .from('escrow_accounts')
      .insert({
        project_id: projectId,
        total_amount: totalAmount,
        held_amount: totalAmount,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data as EscrowAccount;
  }

  // STEP 4: Contractor Bidding
  static async submitBid(bidData: {
    report_id: string;
    bid_amount: number;
    proposal: string;
    estimated_duration: number;
    technical_approach?: string;
  }): Promise<ContractorBid> {
    const user = (await supabase.auth.getUser()).data.user;
    
    const { data, error } = await supabase
      .from('contractor_bids')
      .insert({
        ...bidData,
        contractor_id: user?.id,
        status: 'submitted'
      })
      .select()
      .single();

    if (error) throw error;
    return data as ContractorBid;
  }

  static async getBidsForReport(reportId: string): Promise<ContractorBid[]> {
    const { data, error } = await supabase
      .from('contractor_bids')
      .select(`
        *,
        user_profiles!contractor_id(full_name, location)
      `)
      .eq('report_id', reportId)
      .order('bid_amount', { ascending: true });

    if (error) throw error;
    return (data || []) as ContractorBid[];
  }

  static async selectBid(bidId: string) {
    // First reject all other bids for this report
    const { data: bid } = await supabase
      .from('contractor_bids')
      .select('report_id')
      .eq('id', bidId)
      .single();

    if (bid) {
      await supabase
        .from('contractor_bids')
        .update({ status: 'rejected' })
        .eq('report_id', bid.report_id)
        .neq('id', bidId);
    }

    // Select the winning bid
    const { data, error } = await supabase
      .from('contractor_bids')
      .update({
        status: 'selected',
        selected_at: new Date().toISOString()
      })
      .eq('id', bidId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // STEP 5: Project Execution & Milestone Management
  static async createProjectMilestones(projectId: string, milestones: Omit<ProjectMilestone, 'id' | 'project_id' | 'created_at'>[]) {
    const milestonesWithProject = milestones.map(milestone => ({
      ...milestone,
      project_id: projectId
    }));

    const { data, error } = await supabase
      .from('project_milestones')
      .insert(milestonesWithProject)
      .select();

    if (error) throw error;
    return data;
  }

  static async submitMilestoneEvidence(milestoneId: string, evidenceUrls: string[]) {
    const { data, error } = await supabase
      .from('project_milestones')
      .update({
        status: 'submitted',
        evidence_urls: evidenceUrls,
        submitted_at: new Date().toISOString()
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async verifyMilestone(milestoneId: string, verificationData: {
    verification_status: 'approved' | 'rejected' | 'needs_clarification';
    verification_notes?: string;
    verification_photos?: string[];
  }): Promise<MilestoneVerification> {
    const user = (await supabase.auth.getUser()).data.user;
    
    const { data, error } = await supabase
      .from('milestone_verifications')
      .upsert({
        milestone_id: milestoneId,
        verifier_id: user?.id,
        ...verificationData,
        verified_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as MilestoneVerification;
  }

  static async getMilestoneVerifications(milestoneId: string): Promise<MilestoneVerification[]> {
    const { data, error } = await supabase
      .from('milestone_verifications')
      .select('*')
      .eq('milestone_id', milestoneId);

    if (error) throw error;
    return (data || []) as MilestoneVerification[];
  }

  // STEP 6: Payment Processing
  static async processMilestonePayment(milestoneId: string) {
    // Get milestone and check verification status
    const verifications = await this.getMilestoneVerifications(milestoneId);
    const approvedVerifications = verifications.filter(v => v.verification_status === 'approved');
    const totalVerifications = verifications.length;
    
    if (totalVerifications === 0 || (approvedVerifications.length / totalVerifications) < 0.7) {
      throw new Error('Insufficient verifications for payment release');
    }

    // Update milestone status
    const { data: milestone, error: milestoneError } = await supabase
      .from('project_milestones')
      .update({
        status: 'paid',
        verified_at: new Date().toISOString()
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (milestoneError) throw milestoneError;

    // Create payment transaction record
    const { data: project } = await supabase
      .from('projects')
      .select('escrow_accounts(*)')
      .eq('id', milestone.project_id)
      .single();

    if (project?.escrow_accounts?.[0]) {
      const paymentAmount = (milestone.payment_percentage / 100) * project.escrow_accounts[0].total_amount;
      
      await supabase
        .from('payment_transactions')
        .insert({
          escrow_account_id: project.escrow_accounts[0].id,
          milestone_id: milestoneId,
          amount: paymentAmount,
          transaction_type: 'release',
          status: 'completed'
        });

      // Update escrow amounts
      await supabase
        .from('escrow_accounts')
        .update({
          held_amount: project.escrow_accounts[0].held_amount - paymentAmount,
          released_amount: project.escrow_accounts[0].released_amount + paymentAmount
        })
        .eq('id', project.escrow_accounts[0].id);
    }

    return milestone;
  }

  // Workflow State Management
  static async getWorkflowState(reportId: string): Promise<WorkflowState> {
    const { data: report } = await supabase
      .from('problem_reports')
      .select(`
        *,
        projects(*),
        community_votes(count),
        contractor_bids(count)
      `)
      .eq('id', reportId)
      .single();

    if (!report) {
      throw new Error('Report not found');
    }

    const completedSteps: WorkflowStep[] = ['problem_identification'];
    let currentStep: WorkflowStep = 'community_validation';
    let canProceed = false;
    const requirements: string[] = [];

    // Determine current step and completion status
    if (report.status === 'submitted') {
      currentStep = 'community_validation';
      canProceed = (report.priority_score || 0) >= 3; // Minimum 3 votes threshold for testing
      if (!canProceed) requirements.push('Needs at least 3 community votes');
    } else if (report.status === 'community_review') {
      completedSteps.push('community_validation');
      currentStep = 'government_approval';
      canProceed = true;
    } else if (report.status === 'approved') {
      completedSteps.push('community_validation', 'government_approval');
      currentStep = 'contractor_bidding';
      canProceed = report.contractor_bids && report.contractor_bids.length > 0;
      if (!canProceed) requirements.push('Waiting for contractor bids');
    } else if (report.status === 'contractor_selected') {
      completedSteps.push('community_validation', 'government_approval', 'contractor_bidding');
      currentStep = 'project_execution';
      canProceed = true;
    } else if (report.status === 'completed') {
      completedSteps.push('community_validation', 'government_approval', 'contractor_bidding', 'project_execution', 'final_verification');
      currentStep = 'final_verification';
      canProceed = true;
    }

    return {
      currentStep,
      canProceed,
      requirements,
      completedSteps
    };
  }

  // Notifications
  static async createNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'report' | 'project' | 'payment' | 'verification' | 'system';
    action_url?: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        ...notification
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  static async markNotificationRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }
}