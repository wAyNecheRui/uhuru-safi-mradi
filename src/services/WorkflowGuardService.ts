/**
 * WorkflowGuardService - Ensures proper workflow state transitions
 * 
 * WORKFLOW STATES:
 * 1. pending        → Initial state when citizen reports a problem
 * 2. under_review   → Auto-transitions when votes reach MIN_VOTES_THRESHOLD (3 for testing)
 * 3. approved       → Government approves (only if under_review + all checks pass)
 * 4. bidding_open   → Government opens bidding (auto or manual after approval)
 * 5. contractor_selected → Government selects a contractor bid
 * 6. in_progress    → Project work has started
 * 7. under_verification → Work completed, awaiting final verification
 * 8. completed      → Project finished and verified
 * 9. rejected       → Government rejected the report
 */

import { supabase } from '@/integrations/supabase/client';

export const WORKFLOW_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review', 
  APPROVED: 'approved',
  BIDDING_OPEN: 'bidding_open',
  CONTRACTOR_SELECTED: 'contractor_selected',
  IN_PROGRESS: 'in_progress',
  UNDER_VERIFICATION: 'under_verification',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

export const MIN_VOTES_THRESHOLD = 3;

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  [WORKFLOW_STATUS.PENDING]: [WORKFLOW_STATUS.UNDER_REVIEW, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.UNDER_REVIEW]: [WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.APPROVED]: [WORKFLOW_STATUS.BIDDING_OPEN, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.BIDDING_OPEN]: [WORKFLOW_STATUS.CONTRACTOR_SELECTED],
  [WORKFLOW_STATUS.CONTRACTOR_SELECTED]: [WORKFLOW_STATUS.IN_PROGRESS],
  [WORKFLOW_STATUS.IN_PROGRESS]: [WORKFLOW_STATUS.UNDER_VERIFICATION],
  [WORKFLOW_STATUS.UNDER_VERIFICATION]: [WORKFLOW_STATUS.COMPLETED, WORKFLOW_STATUS.IN_PROGRESS],
  [WORKFLOW_STATUS.COMPLETED]: [],
  [WORKFLOW_STATUS.REJECTED]: [],
};

export interface WorkflowValidation {
  canTransition: boolean;
  reason?: string;
  requirements?: string[];
}

export interface ReportWithVotes {
  id: string;
  status: string;
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  hasGPS: boolean;
  hasMedia: boolean;
}

export class WorkflowGuardService {
  /**
   * Check if a status transition is valid
   */
  static isValidTransition(currentStatus: string, newStatus: string): boolean {
    const validNextStates = VALID_TRANSITIONS[currentStatus] || [];
    return validNextStates.includes(newStatus);
  }

  /**
   * Get the workflow requirements for a report
   */
  static async getWorkflowRequirements(reportId: string): Promise<{
    meetsVoteThreshold: boolean;
    hasGPS: boolean;
    hasMedia: boolean;
    voteCount: number;
    upvotes: number;
    downvotes: number;
    canApprove: boolean;
    canOpenBidding: boolean;
    currentStatus: string;
  }> {
    // Fetch report with votes
    const { data: report, error } = await supabase
      .from('problem_reports')
      .select(`
        *,
        community_votes(vote_type)
      `)
      .eq('id', reportId)
      .single();

    if (error || !report) {
      throw new Error('Report not found');
    }

    const upvotes = report.community_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0;
    const downvotes = report.community_votes?.filter((v: any) => v.vote_type === 'downvote').length || 0;
    const totalVotes = upvotes + downvotes;

    const meetsVoteThreshold = totalVotes >= MIN_VOTES_THRESHOLD;
    const hasGPS = !!(report.gps_coordinates || report.coordinates);
    const hasMedia = (report.photo_urls?.length > 0) || (report.video_urls?.length > 0);
    // Can approve only if in under_review status and meets all requirements
    const canApprove = report.status === WORKFLOW_STATUS.UNDER_REVIEW && 
                       meetsVoteThreshold && hasGPS && hasMedia;

    // Can open bidding only if already approved
    const canOpenBidding = report.status === WORKFLOW_STATUS.APPROVED;

    return {
      meetsVoteThreshold,
      hasGPS,
      hasMedia,
      voteCount: totalVotes,
      upvotes,
      downvotes,
      canApprove,
      canOpenBidding,
      currentStatus: report.status || WORKFLOW_STATUS.PENDING,
    };
  }

  /**
   * Check and update report status based on vote count
   * Called after each vote to auto-transition from pending to under_review
   */
  static async checkAndUpdateStatusAfterVote(reportId: string): Promise<{
    statusChanged: boolean;
    newStatus?: string;
  }> {
    const requirements = await this.getWorkflowRequirements(reportId);

    // If pending and meets vote threshold, transition to under_review
    if (requirements.currentStatus === WORKFLOW_STATUS.PENDING && 
        requirements.meetsVoteThreshold) {
      
      const { error } = await supabase
        .from('problem_reports')
        .update({ 
          status: WORKFLOW_STATUS.UNDER_REVIEW,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        console.error('Failed to update status:', error);
        return { statusChanged: false };
      }

      return { statusChanged: true, newStatus: WORKFLOW_STATUS.UNDER_REVIEW };
    }

    return { statusChanged: false };
  }

  /**
   * Transition report to approved status (government action)
   */
  static async approveReport(reportId: string, budgetAmount?: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    const requirements = await this.getWorkflowRequirements(reportId);

    // Validate the transition
    if (!requirements.canApprove) {
      const missing: string[] = [];
      if (!requirements.meetsVoteThreshold) {
        missing.push(`Need ${MIN_VOTES_THRESHOLD - requirements.voteCount} more votes`);
      }
      if (!requirements.hasGPS) missing.push('Missing GPS coordinates');
      if (!requirements.hasMedia) missing.push('Missing photo/video evidence');
      if (!requirements.hasBudget) missing.push('Missing budget estimate');
      if (requirements.currentStatus !== WORKFLOW_STATUS.UNDER_REVIEW) {
        missing.push(`Report must be in 'under_review' status (current: ${requirements.currentStatus})`);
      }

      return {
        success: false,
        error: `Cannot approve: ${missing.join(', ')}`
      };
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('problem_reports')
      .update({
        status: WORKFLOW_STATUS.APPROVED,
        approved_at: new Date().toISOString(),
        approved_by: userData.user?.id,
        budget_allocated: budgetAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Open bidding for an approved report
   */
  static async openBidding(reportId: string, durationDays: number = 14): Promise<{
    success: boolean;
    error?: string;
  }> {
    const requirements = await this.getWorkflowRequirements(reportId);

    if (!requirements.canOpenBidding) {
      return {
        success: false,
        error: `Cannot open bidding: Report must be in 'approved' status (current: ${requirements.currentStatus})`
      };
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const { error } = await supabase
      .from('problem_reports')
      .update({
        status: WORKFLOW_STATUS.BIDDING_OPEN,
        bidding_status: 'open',
        bidding_start_date: startDate.toISOString(),
        bidding_end_date: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Select a contractor bid (government action)
   */
  static async selectContractorBid(reportId: string, bidId: string): Promise<{
    success: boolean;
    projectId?: string;
    error?: string;
  }> {
    // Verify current status
    const { data: report } = await supabase
      .from('problem_reports')
      .select('status, title, description, budget_allocated')
      .eq('id', reportId)
      .single();

    if (!report || report.status !== WORKFLOW_STATUS.BIDDING_OPEN) {
      return {
        success: false,
        error: `Cannot select contractor: Report must be in 'bidding_open' status`
      };
    }

    // Get the bid details
    const { data: bid } = await supabase
      .from('contractor_bids')
      .select('contractor_id, bid_amount')
      .eq('id', bidId)
      .single();

    if (!bid) {
      return { success: false, error: 'Bid not found' };
    }

    // Reject all other bids
    await supabase
      .from('contractor_bids')
      .update({ status: 'rejected' })
      .eq('report_id', reportId)
      .neq('id', bidId);

    // Select the winning bid
    await supabase
      .from('contractor_bids')
      .update({ 
        status: 'selected',
        selected_at: new Date().toISOString()
      })
      .eq('id', bidId);

    // Update report status
    await supabase
      .from('problem_reports')
      .update({
        status: WORKFLOW_STATUS.CONTRACTOR_SELECTED,
        bidding_status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        report_id: reportId,
        title: report.title,
        description: report.description,
        budget: report.budget_allocated || bid.bid_amount,
        contractor_id: bid.contractor_id,
        status: 'planning'
      })
      .select()
      .single();

    if (projectError) {
      console.error('Failed to create project:', projectError);
    }

    return { success: true, projectId: project?.id };
  }

  /**
   * Get display-friendly status label
   */
  static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      [WORKFLOW_STATUS.PENDING]: 'Pending Review',
      [WORKFLOW_STATUS.UNDER_REVIEW]: 'Under Community Review',
      [WORKFLOW_STATUS.APPROVED]: 'Approved - Awaiting Bidding',
      [WORKFLOW_STATUS.BIDDING_OPEN]: 'Open for Bidding',
      [WORKFLOW_STATUS.CONTRACTOR_SELECTED]: 'Contractor Selected',
      [WORKFLOW_STATUS.IN_PROGRESS]: 'In Progress',
      [WORKFLOW_STATUS.UNDER_VERIFICATION]: 'Under Verification',
      [WORKFLOW_STATUS.COMPLETED]: 'Completed',
      [WORKFLOW_STATUS.REJECTED]: 'Rejected',
    };
    return labels[status] || status;
  }

  /**
   * Get status badge color class
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      [WORKFLOW_STATUS.PENDING]: 'bg-gray-100 text-gray-800',
      [WORKFLOW_STATUS.UNDER_REVIEW]: 'bg-blue-100 text-blue-800',
      [WORKFLOW_STATUS.APPROVED]: 'bg-green-100 text-green-800',
      [WORKFLOW_STATUS.BIDDING_OPEN]: 'bg-purple-100 text-purple-800',
      [WORKFLOW_STATUS.CONTRACTOR_SELECTED]: 'bg-indigo-100 text-indigo-800',
      [WORKFLOW_STATUS.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [WORKFLOW_STATUS.UNDER_VERIFICATION]: 'bg-orange-100 text-orange-800',
      [WORKFLOW_STATUS.COMPLETED]: 'bg-emerald-100 text-emerald-800',
      [WORKFLOW_STATUS.REJECTED]: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}
