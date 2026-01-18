import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: string;
  actionUrl?: string;
}

export interface ProjectStakeholders {
  reporterId?: string;
  contractorId?: string;
  governmentIds?: string[];
  projectId?: string;
}

/**
 * LiveNotificationService - Centralized service for broadcasting real-time notifications
 * to all relevant stakeholders when actions happen in the system.
 */
export class LiveNotificationService {
  /**
   * Send notification to a single user
   */
  static async notify(payload: NotificationPayload): Promise<boolean> {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        category: payload.category,
        action_url: payload.actionUrl || null
      });

      if (error) {
        console.error('Failed to create notification:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  }

  /**
   * Send notifications to multiple users
   */
  static async notifyMany(payloads: NotificationPayload[]): Promise<void> {
    const notifications = payloads.map(p => ({
      user_id: p.userId,
      title: p.title,
      message: p.message,
      type: p.type,
      category: p.category,
      action_url: p.actionUrl || null
    }));

    try {
      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
    }
  }

  /**
   * Get all stakeholders for a project (reporter, contractor, government officials)
   */
  static async getProjectStakeholders(projectId: string): Promise<ProjectStakeholders> {
    const stakeholders: ProjectStakeholders = { projectId };

    try {
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('contractor_id, report_id')
        .eq('id', projectId)
        .single();

      if (project) {
        stakeholders.contractorId = project.contractor_id || undefined;

        // Get reporter from problem report
        if (project.report_id) {
          const { data: report } = await supabase
            .from('problem_reports')
            .select('reported_by')
            .eq('id', project.report_id)
            .single();

          if (report) {
            stakeholders.reporterId = report.reported_by;
          }
        }
      }

      // Get government officials (verified government users)
      const { data: govUsers } = await supabase
        .from('government_profiles')
        .select('user_id')
        .eq('verified', true)
        .limit(50);

      if (govUsers) {
        stakeholders.governmentIds = govUsers.map(g => g.user_id);
      }
    } catch (error) {
      console.error('Error fetching stakeholders:', error);
    }

    return stakeholders;
  }

  // ============ CITIZEN ACTIONS ============

  /**
   * When a citizen reports a new problem
   */
  static async onProblemReported(
    reportId: string,
    reporterId: string,
    title: string,
    location: string
  ): Promise<void> {
    // Notify government officials
    const { data: govUsers } = await supabase
      .from('government_profiles')
      .select('user_id')
      .eq('verified', true);

    if (govUsers && govUsers.length > 0) {
      const notifications = govUsers.map(gov => ({
        userId: gov.user_id,
        title: '🆕 New Problem Report',
        message: `A citizen reported: "${title}" at ${location}. Requires review.`,
        type: 'info' as NotificationType,
        category: 'report',
        actionUrl: '/government/reports'
      }));

      await this.notifyMany(notifications);
    }

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: reportId, // Using report_id temporarily
      update_type: 'problem_reported',
      message: `New infrastructure issue reported: "${title}"`,
      created_by: reporterId,
      metadata: { location, reportId }
    });
  }

  /**
   * When a citizen votes on a report
   */
  static async onCitizenVote(
    reportId: string,
    voterId: string,
    voteType: string,
    reportTitle: string
  ): Promise<void> {
    // Get report owner
    const { data: report } = await supabase
      .from('problem_reports')
      .select('reported_by')
      .eq('id', reportId)
      .single();

    if (report && report.reported_by !== voterId) {
      await this.notify({
        userId: report.reported_by,
        title: voteType === 'upvote' ? '👍 Your Report Got Support!' : '📊 New Vote on Your Report',
        message: `A citizen ${voteType === 'upvote' ? 'verified' : 'voted on'} your report: "${reportTitle}"`,
        type: 'info',
        category: 'vote',
        actionUrl: '/citizen/track-reports'
      });
    }
  }

  /**
   * When a citizen verifies a milestone
   */
  static async onMilestoneVerified(
    milestoneId: string,
    projectId: string,
    verifierId: string,
    rating: number,
    milestoneName: string,
    verificationsCount: number,
    requiredCount: number
  ): Promise<void> {
    const stakeholders = await this.getProjectStakeholders(projectId);
    const notifications: NotificationPayload[] = [];

    // Notify contractor
    if (stakeholders.contractorId) {
      notifications.push({
        userId: stakeholders.contractorId,
        title: `✅ Milestone Verified (${verificationsCount}/${requiredCount})`,
        message: `A citizen verified "${milestoneName}" with ${rating}⭐. ${verificationsCount >= requiredCount ? 'Payment ready for release!' : `${requiredCount - verificationsCount} more verifications needed.`}`,
        type: verificationsCount >= requiredCount ? 'success' : 'info',
        category: 'milestone',
        actionUrl: '/contractor/projects'
      });
    }

    // Notify government if threshold reached
    if (verificationsCount >= requiredCount && stakeholders.governmentIds) {
      stakeholders.governmentIds.slice(0, 10).forEach(govId => {
        notifications.push({
          userId: govId,
          title: '💰 Milestone Ready for Payment',
          message: `"${milestoneName}" has been verified by ${verificationsCount} citizens. Automated payment processing.`,
          type: 'success',
          category: 'payment',
          actionUrl: '/government/payment-release'
        });
      });
    }

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'milestone_verified',
      message: `Milestone "${milestoneName}" verified by citizen (${verificationsCount}/${requiredCount} verifications)`,
      created_by: verifierId,
      metadata: { milestoneId, rating, verificationsCount, requiredCount }
    });
  }

  /**
   * When a citizen reports a project issue
   */
  static async onProjectIssueReported(
    projectId: string,
    reporterId: string,
    issueType: string,
    description: string,
    severity: string
  ): Promise<void> {
    const stakeholders = await this.getProjectStakeholders(projectId);
    const notifications: NotificationPayload[] = [];

    // Get project title
    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    const projectTitle = project?.title || 'Unknown Project';

    // Notify contractor
    if (stakeholders.contractorId) {
      notifications.push({
        userId: stakeholders.contractorId,
        title: `⚠️ Issue Reported: ${issueType}`,
        message: `A citizen reported a ${severity} issue on "${projectTitle}": ${description.slice(0, 100)}...`,
        type: severity === 'critical' ? 'error' : 'warning',
        category: 'issue',
        actionUrl: '/contractor/projects'
      });
    }

    // Notify government
    if (stakeholders.governmentIds) {
      stakeholders.governmentIds.slice(0, 10).forEach(govId => {
        notifications.push({
          userId: govId,
          title: `🚨 Project Issue: ${issueType}`,
          message: `${severity.toUpperCase()} issue on "${projectTitle}": ${description.slice(0, 100)}...`,
          type: severity === 'critical' ? 'error' : 'warning',
          category: 'issue',
          actionUrl: '/government/projects'
        });
      });
    }

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'issue_reported',
      message: `⚠️ ${severity.toUpperCase()} Issue: ${issueType} - ${description.slice(0, 100)}`,
      created_by: reporterId,
      metadata: { issueType, severity }
    });
  }

  /**
   * When a citizen rates project quality
   */
  static async onQualityRated(
    projectId: string,
    raterId: string,
    overallRating: number,
    categories: Record<string, number>
  ): Promise<void> {
    const stakeholders = await this.getProjectStakeholders(projectId);
    const notifications: NotificationPayload[] = [];

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    const projectTitle = project?.title || 'Unknown Project';

    // Notify contractor
    if (stakeholders.contractorId) {
      notifications.push({
        userId: stakeholders.contractorId,
        title: `⭐ New Quality Rating: ${overallRating.toFixed(1)}/5`,
        message: `A citizen rated "${projectTitle}" quality. Check detailed feedback.`,
        type: overallRating >= 4 ? 'success' : overallRating >= 3 ? 'info' : 'warning',
        category: 'rating',
        actionUrl: '/contractor/performance'
      });
    }

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'quality_rated',
      message: `Project quality rated ${overallRating.toFixed(1)}/5 stars by citizen`,
      created_by: raterId,
      metadata: { overallRating, categories }
    });
  }

  // ============ CONTRACTOR ACTIONS ============

  /**
   * When contractor submits a bid
   */
  static async onBidSubmitted(
    reportId: string,
    contractorId: string,
    companyName: string,
    bidAmount: number
  ): Promise<void> {
    // Get report details
    const { data: report } = await supabase
      .from('problem_reports')
      .select('reported_by, title')
      .eq('id', reportId)
      .single();

    if (!report) return;

    const notifications: NotificationPayload[] = [];

    // Notify reporter
    notifications.push({
      userId: report.reported_by,
      title: '📋 New Bid on Your Report',
      message: `${companyName} submitted a bid of KES ${bidAmount.toLocaleString()} for "${report.title}"`,
      type: 'info',
      category: 'bid',
      actionUrl: '/citizen/track-reports'
    });

    // Notify government officials
    const { data: govUsers } = await supabase
      .from('government_profiles')
      .select('user_id')
      .eq('verified', true);

    if (govUsers) {
      govUsers.slice(0, 10).forEach(gov => {
        notifications.push({
          userId: gov.user_id,
          title: '📋 New Contractor Bid',
          message: `${companyName} bid KES ${bidAmount.toLocaleString()} for "${report.title}"`,
          type: 'info',
          category: 'bid',
          actionUrl: '/government/bid-approval'
        });
      });
    }

    await this.notifyMany(notifications);
  }

  /**
   * When contractor submits milestone progress
   */
  static async onMilestoneProgressSubmitted(
    projectId: string,
    milestoneId: string,
    milestoneName: string,
    contractorId: string,
    progressDescription: string
  ): Promise<void> {
    const stakeholders = await this.getProjectStakeholders(projectId);
    const notifications: NotificationPayload[] = [];

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    // Notify reporter
    if (stakeholders.reporterId) {
      notifications.push({
        userId: stakeholders.reporterId,
        title: '📸 Milestone Submitted for Verification',
        message: `"${milestoneName}" on "${project?.title}" needs citizen verification. View evidence and verify!`,
        type: 'info',
        category: 'milestone',
        actionUrl: '/citizen/projects'
      });
    }

    // Notify government
    if (stakeholders.governmentIds) {
      stakeholders.governmentIds.slice(0, 5).forEach(govId => {
        notifications.push({
          userId: govId,
          title: '📋 Milestone Awaiting Verification',
          message: `"${milestoneName}" submitted with evidence. Citizens can now verify.`,
          type: 'info',
          category: 'milestone',
          actionUrl: '/government/milestones'
        });
      });
    }

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'milestone_submitted',
      message: `📸 Milestone "${milestoneName}" submitted with evidence - ready for citizen verification`,
      created_by: contractorId,
      metadata: { milestoneId, progressDescription }
    });
  }

  // ============ GOVERNMENT ACTIONS ============

  /**
   * When government approves a report
   */
  static async onReportApproved(
    reportId: string,
    approvedBy: string,
    reportTitle: string,
    reporterId: string
  ): Promise<void> {
    // Notify reporter
    await this.notify({
      userId: reporterId,
      title: '✅ Your Report Was Approved!',
      message: `"${reportTitle}" has been approved and is now open for contractor bidding.`,
      type: 'success',
      category: 'report',
      actionUrl: '/citizen/track-reports'
    });

    // Notify all contractors
    const { data: contractors } = await supabase
      .from('contractor_profiles')
      .select('user_id')
      .eq('verified', true);

    if (contractors && contractors.length > 0) {
      const notifications = contractors.map(c => ({
        userId: c.user_id,
        title: '🆕 New Bidding Opportunity',
        message: `"${reportTitle}" is now open for bids. Submit your proposal!`,
        type: 'info' as NotificationType,
        category: 'bidding',
        actionUrl: '/contractor/bidding'
      }));

      await this.notifyMany(notifications);
    }

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: reportId,
      update_type: 'report_approved',
      message: `Report "${reportTitle}" approved - bidding now open`,
      created_by: approvedBy,
      metadata: { reportId }
    });
  }

  /**
   * When government selects a contractor bid
   */
  static async onBidSelected(
    projectId: string,
    contractorId: string,
    contractorName: string,
    bidAmount: number,
    selectedBy: string
  ): Promise<void> {
    const stakeholders = await this.getProjectStakeholders(projectId);
    const notifications: NotificationPayload[] = [];

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    // Notify winning contractor
    notifications.push({
      userId: contractorId,
      title: '🎉 Congratulations! Bid Selected!',
      message: `Your bid for "${project?.title}" (KES ${bidAmount.toLocaleString()}) has been selected!`,
      type: 'success',
      category: 'bid',
      actionUrl: '/contractor/projects'
    });

    // Notify reporter
    if (stakeholders.reporterId) {
      notifications.push({
        userId: stakeholders.reporterId,
        title: '🏗️ Contractor Selected for Your Report',
        message: `${contractorName} has been selected to work on "${project?.title}". Track progress!`,
        type: 'success',
        category: 'project',
        actionUrl: '/citizen/projects'
      });
    }

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'contractor_selected',
      message: `🏗️ ${contractorName} selected as contractor (KES ${bidAmount.toLocaleString()})`,
      created_by: selectedBy,
      metadata: { contractorId, bidAmount }
    });
  }

  /**
   * When government funds escrow
   */
  static async onEscrowFunded(
    projectId: string,
    amount: number,
    fundedBy: string
  ): Promise<void> {
    const stakeholders = await this.getProjectStakeholders(projectId);
    const notifications: NotificationPayload[] = [];

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    // Notify contractor
    if (stakeholders.contractorId) {
      notifications.push({
        userId: stakeholders.contractorId,
        title: '💰 Escrow Funded - Start Work!',
        message: `KES ${amount.toLocaleString()} funded for "${project?.title}". You can now begin work.`,
        type: 'success',
        category: 'escrow',
        actionUrl: '/contractor/projects'
      });
    }

    // Notify reporter
    if (stakeholders.reporterId) {
      notifications.push({
        userId: stakeholders.reporterId,
        title: '💵 Project Funded',
        message: `KES ${amount.toLocaleString()} has been secured in escrow for "${project?.title}". Work begins soon!`,
        type: 'success',
        category: 'escrow',
        actionUrl: '/citizen/projects'
      });
    }

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'escrow_funded',
      message: `💰 Escrow funded: KES ${amount.toLocaleString()} secured for project`,
      created_by: fundedBy,
      metadata: { amount }
    });
  }

  /**
   * When milestone payment is released
   */
  static async onPaymentReleased(
    projectId: string,
    milestoneId: string,
    milestoneName: string,
    amount: number,
    releasedBy: string
  ): Promise<void> {
    const stakeholders = await this.getProjectStakeholders(projectId);
    const notifications: NotificationPayload[] = [];

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    // Notify contractor
    if (stakeholders.contractorId) {
      notifications.push({
        userId: stakeholders.contractorId,
        title: '💸 Payment Released!',
        message: `KES ${amount.toLocaleString()} released for "${milestoneName}" on "${project?.title}"`,
        type: 'success',
        category: 'payment',
        actionUrl: '/contractor/financials'
      });
    }

    // Notify reporter
    if (stakeholders.reporterId) {
      notifications.push({
        userId: stakeholders.reporterId,
        title: '💳 Milestone Payment Made',
        message: `KES ${amount.toLocaleString()} paid to contractor for "${milestoneName}"`,
        type: 'info',
        category: 'payment',
        actionUrl: '/citizen/projects'
      });
    }

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'payment_released',
      message: `💸 Payment released: KES ${amount.toLocaleString()} for "${milestoneName}"`,
      created_by: releasedBy,
      metadata: { milestoneId, amount }
    });
  }

  /**
   * When project is completed
   */
  static async onProjectCompleted(
    projectId: string,
    projectTitle: string,
    contractorRating: number,
    completedBy: string
  ): Promise<void> {
    const stakeholders = await this.getProjectStakeholders(projectId);
    const notifications: NotificationPayload[] = [];

    // Notify contractor
    if (stakeholders.contractorId) {
      notifications.push({
        userId: stakeholders.contractorId,
        title: '🏆 Project Completed!',
        message: `"${projectTitle}" is complete! You received a ${contractorRating}/5 rating.`,
        type: 'success',
        category: 'project',
        actionUrl: '/contractor/performance'
      });
    }

    // Notify reporter
    if (stakeholders.reporterId) {
      notifications.push({
        userId: stakeholders.reporterId,
        title: '🎉 Your Reported Issue is Fixed!',
        message: `"${projectTitle}" has been completed. Thank you for helping improve infrastructure!`,
        type: 'success',
        category: 'project',
        actionUrl: '/citizen/projects'
      });
    }

    // Notify all government
    if (stakeholders.governmentIds) {
      stakeholders.governmentIds.slice(0, 10).forEach(govId => {
        notifications.push({
          userId: govId,
          title: '✅ Project Completed',
          message: `"${projectTitle}" finished with ${contractorRating}/5 contractor rating.`,
          type: 'success',
          category: 'project',
          actionUrl: '/government/portfolio'
        });
      });
    }

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'project_completed',
      message: `🏆 Project "${projectTitle}" completed! Contractor rating: ${contractorRating}/5`,
      created_by: completedBy,
      metadata: { contractorRating }
    });
  }
}

export default LiveNotificationService;
