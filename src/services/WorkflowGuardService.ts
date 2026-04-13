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
import LiveNotificationService from './LiveNotificationService';
import { MilestonePaymentService } from './MilestonePaymentService';

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

      // Fetch report title for notification
      const { data: report } = await supabase
        .from('problem_reports')
        .select('title')
        .eq('id', reportId)
        .single();

      // Trigger notification
      await LiveNotificationService.onThresholdReached(
        reportId,
        report?.title || 'Unknown Report',
        requirements.voteCount
      );

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
      if (requirements.currentStatus !== WORKFLOW_STATUS.UNDER_REVIEW) {
        missing.push(`Report must be in 'under_review' status (current: ${requirements.currentStatus})`);
      }

      return {
        success: false,
        error: `Cannot approve: ${missing.join(', ')}`
      };
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { success: false, error: 'Authentication required' };

    // Authenticity check: Only government users can approve
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (profile?.user_type !== 'government') {
      return { success: false, error: 'Unauthorized: Only government officials can approve reports' };
    }

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

    // Fetch report details for notification
    const { data: report } = await supabase
      .from('problem_reports')
      .select('title, reported_by')
      .eq('id', reportId)
      .single();

    // Trigger notification
    if (report) {
      await LiveNotificationService.onReportApproved(
        reportId,
        userData.user?.id || '',
        report.title,
        report.reported_by
      );
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

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { success: false, error: 'Authentication required' };

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (profile?.user_type !== 'government') {
      return { success: false, error: 'Unauthorized: Only government officials can open bidding' };
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

    // Fetch report details for notification
    const { data: report } = await supabase
      .from('problem_reports')
      .select('title, reported_by')
      .eq('id', reportId)
      .single();

    // Trigger notification
    const { data: userData } = await supabase.auth.getUser();
    if (report) {
      await LiveNotificationService.onBiddingOpened(
        reportId,
        userData.user?.id || '',
        report.title,
        report.reported_by
      );
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

    // Create approval audit record (Blockchain audit trail)
    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from('project_approval_audit')
      .insert({
        report_id: reportId,
        winning_bid_id: bidId,
        approved_by: userData.user?.id,
        approval_action: 'approve',
        justification: 'Contractor selected via automated threshold evaluation',
        bid_count: 0, // Placeholder, can be improved
        agpo_compliant: true
      });

    // Check if project already exists for this report
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('report_id', reportId)
      .single();

    let project = null;
    let projectError = null;

    if (existingProject) {
      // Update existing project with contractor
      const { data: updated, error } = await supabase
        .from('projects')
        .update({
          contractor_id: bid.contractor_id,
          budget: report.budget_allocated || bid.bid_amount,
          status: 'planning',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProject.id)
        .select()
        .single();
      project = updated;
      projectError = error;
    } else {
      // Create new project
      const { data: created, error } = await supabase
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
      project = created;
      projectError = error;
    }

    if (projectError) {
      console.error('Failed to create project:', projectError);
    }

    // Trigger notification for bid selection
    const { data: contractorProfile } = await supabase
      .from('contractor_profiles')
      .select('company_name')
      .eq('user_id', bid.contractor_id)
      .single();

    if (project) {
      await LiveNotificationService.onBidSelected(
        project.id,
        bid.contractor_id,
        contractorProfile?.company_name || 'Selected Contractor',
        bid.bid_amount,
        userData.user?.id || ''
      );
    }

    return { success: true, projectId: project?.id };
  }

  /**
   * Submit milestone evidence (Contractor action)
   */
  static async submitMilestone(
    projectId: string,
    milestoneId: string,
    milestoneTitle: string,
    contractorId: string,
    photoUrls: string[],
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('project_milestones')
      .update({
        status: 'submitted',
        evidence_urls: photoUrls,
        submitted_at: new Date().toISOString()
      })
      .eq('id', milestoneId);

    if (error) return { success: false, error: error.message };

    // Record progress update
    await supabase.from('project_progress').insert({
      project_id: projectId,
      milestone_id: milestoneId,
      updated_by: contractorId,
      update_description: description,
      photo_urls: photoUrls
    });

    // Send notifications
    await LiveNotificationService.onMilestoneProgressSubmitted(
      projectId,
      milestoneId,
      milestoneTitle,
      contractorId,
      description
    );

    return { success: true };
  }

  /**
   * Verify milestone (Citizen action)
   */
  static async verifyMilestone(
    milestoneId: string,
    projectId: string,
    citizenId: string,
    rating: number,
    notes: string,
    milestoneTitle: string,
    location?: { lat: number; lon: number }
  ): Promise<{ success: boolean; error?: string; paymentTriggered?: boolean }> {
    const verificationStatus = rating >= 3 ? 'approved' : 'rejected';
    const formattedNotes = `Rating: ${rating}/5. ${notes}`;

    // 0. Authenticity check: Only standard citizens can verify milestones
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', citizenId)
      .maybeSingle();

    if (profile?.user_type !== 'citizen') {
      return { success: false, error: 'Unauthorized: Only standard citizens can verify project milestones' };
    }

    // 1. Record verification
    const { error: verifyError } = await supabase
      .from('milestone_verifications')
      .insert({
        milestone_id: milestoneId,
        verifier_id: citizenId,
        rating,
        verification_notes: formattedNotes,
        verification_status: verificationStatus,
        verification_photos: location ? [`GPS: ${location.lat}, ${location.lon}`] : null
      });

    // 2. Log to verification audit trail (Phase D Sync)
    await supabase.from('verification_audit_log' as any).insert({
      action_type: 'milestone_verify',
      user_id: citizenId,
      milestone_id: milestoneId,
      gps_latitude: location?.lat,
      gps_longitude: location?.lon,
      result: verifyError ? (verifyError.code === '23505' ? 'denied_duplicate' : 'error') : 'allowed',
      metadata: { rating, verification_status: verificationStatus }
    });

    if (verifyError) {
      if (verifyError.code === '23505') return { success: false, error: 'ALREADY_VERIFIED' };
      return { success: false, error: verifyError.message };
    }

    // 3. Check if threshold reached for payment
    const check = await MilestonePaymentService.checkVerificationStatus(milestoneId);

    // 4. Send notifications
    await LiveNotificationService.onMilestoneVerified(
      milestoneId,
      projectId,
      citizenId,
      rating,
      milestoneTitle,
      check.approvedCount,
      check.requiredCount
    );

    let paymentTriggered = false;
    if (check.canRelease) {
      const result = await MilestonePaymentService.triggerAutomatedPayment(milestoneId);
      paymentTriggered = result.success;

      // After payment, check if project is fully completed
      if (paymentTriggered) {
        await this.checkProjectCompletion(projectId);
      }
    }

    return { success: true, paymentTriggered };
  }

  /**
   * Check if all milestones are paid and mark project as completed
   */
  static async checkProjectCompletion(projectId: string): Promise<boolean> {
    // Get all milestones for this project
    const { data: milestones, error } = await supabase
      .from('project_milestones')
      .select('status')
      .eq('project_id', projectId);

    if (error || !milestones || milestones.length === 0) return false;

    // Check if all are paid or completed
    const allPaid = milestones.every(m => m.status === 'paid' || m.status === 'completed');

    if (allPaid) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (!updateError) {
        // Find report for this project to update its status too
        const { data: project } = await supabase
          .from('projects')
          .select('report_id, title')
          .eq('id', projectId)
          .single();

        if (project?.report_id) {
          await supabase
            .from('problem_reports')
            .update({ status: 'resolved' })
            .eq('id', project.report_id);
        }

        // Notify stakeholders of project completion
        await LiveNotificationService.notify({
          userId: 'broadcast', // Hypothetical broadcast or specific logic
          title: '🎊 Project Completed!',
          message: `Work on "${project?.title || 'Project'}" has been fully verified and paid. Progress finalized!`,
          type: 'success',
          category: 'project',
          actionUrl: '/public/projects'
        });

        return true;
      }
    }

    return false;
  }

  /**
   * Get display-friendly status label
   */
  static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      [WORKFLOW_STATUS.PENDING]: 'Pending Community Votes',
      [WORKFLOW_STATUS.UNDER_REVIEW]: 'Under Government Review',
      [WORKFLOW_STATUS.APPROVED]: 'Approved - Bidding Pending',
      [WORKFLOW_STATUS.BIDDING_OPEN]: 'Bidding Open',
      [WORKFLOW_STATUS.CONTRACTOR_SELECTED]: 'Contractor Selected',
      [WORKFLOW_STATUS.IN_PROGRESS]: 'Work In Progress',
      [WORKFLOW_STATUS.UNDER_VERIFICATION]: 'Milestone Verification',
      [WORKFLOW_STATUS.COMPLETED]: 'Project Completed',
      [WORKFLOW_STATUS.REJECTED]: 'Report Rejected',
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
