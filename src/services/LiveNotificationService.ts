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
   * Send notification to a single user via edge function (bypasses RLS)
   */
  static async notify(payload: NotificationPayload): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('create-notification', {
        body: {
          userId: payload.userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          category: payload.category,
          actionUrl: payload.actionUrl
        }
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
   * Send notifications to multiple users via edge function (bypasses RLS)
   * Groups notifications with identical content for efficient bulk sends
   */
  static async notifyMany(payloads: NotificationPayload[]): Promise<void> {
    if (payloads.length === 0) return;

    try {
      // Group by unique content key
      const groups = new Map<string, { userIds: string[]; payload: NotificationPayload }>();
      
      for (const payload of payloads) {
        const key = `${payload.title}|${payload.message}|${payload.type}|${payload.category}|${payload.actionUrl || ''}`;
        
        if (groups.has(key)) {
          groups.get(key)!.userIds.push(payload.userId);
        } else {
          groups.set(key, { userIds: [payload.userId], payload });
        }
      }

      // Send each group as a bulk notification
      const promises = Array.from(groups.values()).map(group =>
        supabase.functions.invoke('create-notification', {
          body: {
            userIds: group.userIds,
            title: group.payload.title,
            message: group.payload.message,
            type: group.payload.type,
            category: group.payload.category,
            actionUrl: group.payload.actionUrl
          }
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
    }
  }

  /**
   * Get government user IDs (from user_profiles, not government_profiles which may be empty)
   */
  static async getGovernmentUserIds(): Promise<string[]> {
    try {
      // Query user_profiles for government users (more reliable than government_profiles)
      const { data: govUsers } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_type', 'government')
        .limit(50);

      return govUsers?.map(g => g.user_id) || [];
    } catch (error) {
      console.error('Error fetching government users:', error);
      return [];
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

      // Get government officials from user_profiles (more reliable)
      stakeholders.governmentIds = await this.getGovernmentUserIds();
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
    // Notify government officials using user_profiles (more reliable)
    const govUserIds = await this.getGovernmentUserIds();

    if (govUserIds.length > 0) {
      const notifications = govUserIds.map(userId => ({
        userId,
        title: '🆕 New Problem Report',
        message: `A citizen reported: "${title}" at ${location}. Requires review.`,
        type: 'info' as NotificationType,
        category: 'report',
        actionUrl: '/government/reports'
      }));

      await this.notifyMany(notifications);
    }

    // Note: realtime_project_updates requires a valid project_id, 
    // so we skip this for reports (they become projects after approval)
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

    // Notify government officials using user_profiles (more reliable)
    const govUserIds = await this.getGovernmentUserIds();
    govUserIds.slice(0, 10).forEach(userId => {
      notifications.push({
        userId,
        title: '📋 New Contractor Bid',
        message: `${companyName} bid KES ${bidAmount.toLocaleString()} for "${report.title}"`,
        type: 'info',
        category: 'bid',
        actionUrl: '/government/bid-approval'
      });
    });

    await this.notifyMany(notifications);
  }

  /**
   * Get citizen user IDs, optionally filtered by county
   */
  static async getCitizenUserIds(county?: string): Promise<string[]> {
    try {
      let query = supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_type', 'citizen')
        .limit(100);

      if (county) {
        query = query.eq('county', county);
      }

      const { data: citizens } = await query;
      return citizens?.map(c => c.user_id) || [];
    } catch (error) {
      console.error('Error fetching citizen users:', error);
      return [];
    }
  }

  /**
   * Get project location/county for targeted notifications
   */
  static async getProjectLocation(projectId: string): Promise<string | null> {
    try {
      // Get location from the linked problem report
      const { data: project } = await supabase
        .from('projects')
        .select('report_id')
        .eq('id', projectId)
        .single();

      if (project?.report_id) {
        const { data: report } = await supabase
          .from('problem_reports')
          .select('location, ward, constituency')
          .eq('id', project.report_id)
          .single();

        // Try to extract county from location
        if (report?.location) {
          // Extract county name if present (common format: "Location, County")
          const parts = report.location.split(',').map(s => s.trim());
          if (parts.length > 0) {
            return parts[parts.length - 1]; // Last part is usually county
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting project location:', error);
      return null;
    }
  }

  /**
   * When contractor submits milestone progress
   * Notifies: Reporter, nearby citizens (same county), government officials
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

    const projectTitle = project?.title || 'Unknown Project';

    // Get project location to notify nearby citizens
    const projectCounty = await this.getProjectLocation(projectId);

    // === PRIORITY 1: Notify the original reporter ===
    if (stakeholders.reporterId) {
      notifications.push({
        userId: stakeholders.reporterId,
        title: '📸 Milestone Ready for Your Verification!',
        message: `"${milestoneName}" on "${projectTitle}" needs verification. You reported this issue - your verification helps!`,
        type: 'info',
        category: 'milestone',
        actionUrl: '/citizen/projects'
      });
    }

    // === PRIORITY 2: Notify ALL citizens in the same county (for verification) ===
    // This ensures multiple citizens can verify (minimum 2 required)
    const citizenIds = await this.getCitizenUserIds(projectCounty || undefined);
    
    // Filter out the reporter (already notified separately with priority message)
    const otherCitizens = citizenIds.filter(id => id !== stakeholders.reporterId);
    
    // Notify up to 50 nearby citizens
    otherCitizens.slice(0, 50).forEach(citizenId => {
      notifications.push({
        userId: citizenId,
        title: '🔔 Community Verification Needed',
        message: `"${milestoneName}" on "${projectTitle}" needs citizen verification. Help ensure quality work in your area!`,
        type: 'info',
        category: 'milestone',
        actionUrl: '/citizen/projects'
      });
    });

    // === PRIORITY 3: Notify government officials ===
    if (stakeholders.governmentIds) {
      stakeholders.governmentIds.slice(0, 10).forEach(govId => {
        notifications.push({
          userId: govId,
          title: '📋 Milestone Submitted - Awaiting Citizen Verification',
          message: `"${milestoneName}" on "${projectTitle}" submitted with evidence. ${citizenIds.length} citizens notified for verification.`,
          type: 'info',
          category: 'milestone',
          actionUrl: '/government/milestones'
        });
      });
    }

    console.log(`[Notifications] Milestone "${milestoneName}" - notifying ${notifications.length} users (${citizenIds.length} citizens in ${projectCounty || 'all areas'})`);

    await this.notifyMany(notifications);

    // Create realtime update
    await supabase.from('realtime_project_updates').insert({
      project_id: projectId,
      update_type: 'milestone_submitted',
      message: `📸 Milestone "${milestoneName}" submitted - ${citizenIds.length} citizens notified for verification`,
      created_by: contractorId,
      metadata: { milestoneId, progressDescription, citizensNotified: citizenIds.length }
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
