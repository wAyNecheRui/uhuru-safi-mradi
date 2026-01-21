import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 
  | 'report' 
  | 'bid' 
  | 'bidding' 
  | 'milestone' 
  | 'payment' 
  | 'escrow' 
  | 'project' 
  | 'vote' 
  | 'verification' 
  | 'issue' 
  | 'rating'
  | 'system'
  | 'general';

export interface CreateNotificationParams {
  userId?: string;
  userIds?: string[];
  targetRole?: 'citizen' | 'contractor' | 'government' | 'all';
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  actionUrl?: string;
}

/**
 * NotificationService - Central service for creating notifications
 * Uses the create-notification edge function to securely insert notifications
 */
class NotificationServiceClass {
  /**
   * Create notification(s) via edge function
   */
  async create(params: CreateNotificationParams): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-notification', {
        body: params
      });

      if (error) {
        console.error('Notification creation failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data?.count };
    } catch (error) {
      console.error('Notification service error:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  /**
   * Notify a single user
   */
  async notifyUser(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
    category: NotificationCategory = 'general',
    actionUrl?: string
  ): Promise<boolean> {
    const result = await this.create({
      userId,
      title,
      message,
      type,
      category,
      actionUrl
    });
    return result.success;
  }

  /**
   * Notify multiple users
   */
  async notifyUsers(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType = 'info',
    category: NotificationCategory = 'general',
    actionUrl?: string
  ): Promise<boolean> {
    if (userIds.length === 0) return true;
    
    const result = await this.create({
      userIds,
      title,
      message,
      type,
      category,
      actionUrl
    });
    return result.success;
  }

  /**
   * Notify all users of a specific role
   */
  async notifyRole(
    role: 'citizen' | 'contractor' | 'government' | 'all',
    title: string,
    message: string,
    type: NotificationType = 'info',
    category: NotificationCategory = 'general',
    actionUrl?: string
  ): Promise<boolean> {
    const result = await this.create({
      targetRole: role,
      title,
      message,
      type,
      category,
      actionUrl
    });
    return result.success;
  }

  // ============ CONVENIENCE METHODS ============

  /**
   * When a new problem is reported
   */
  async onProblemReported(reportTitle: string, location: string): Promise<void> {
    await this.notifyRole(
      'government',
      '🆕 New Problem Report',
      `A citizen reported: "${reportTitle}" at ${location}. Requires review.`,
      'info',
      'report',
      '/government/reports'
    );
  }

  /**
   * When a report is approved and open for bidding
   */
  async onReportApproved(reporterId: string, reportTitle: string): Promise<void> {
    // Notify reporter
    await this.notifyUser(
      reporterId,
      '✅ Your Report Was Approved!',
      `"${reportTitle}" has been approved and is now open for contractor bidding.`,
      'success',
      'report',
      '/citizen/track-reports'
    );

    // Notify all contractors
    await this.notifyRole(
      'contractor',
      '🆕 New Bidding Opportunity',
      `"${reportTitle}" is now open for bids. Submit your proposal!`,
      'info',
      'bidding',
      '/contractor/bidding'
    );
  }

  /**
   * When a bid is submitted
   */
  async onBidSubmitted(
    reporterId: string,
    governmentIds: string[],
    companyName: string,
    bidAmount: number,
    reportTitle: string
  ): Promise<void> {
    // Notify reporter
    await this.notifyUser(
      reporterId,
      '📋 New Bid on Your Report',
      `${companyName} submitted a bid of KES ${bidAmount.toLocaleString()} for "${reportTitle}"`,
      'info',
      'bid',
      '/citizen/track-reports'
    );

    // Notify government
    if (governmentIds.length > 0) {
      await this.notifyUsers(
        governmentIds.slice(0, 10),
        '📋 New Contractor Bid',
        `${companyName} bid KES ${bidAmount.toLocaleString()} for "${reportTitle}"`,
        'info',
        'bid',
        '/government/bid-approval'
      );
    }
  }

  /**
   * When a bid is selected
   */
  async onBidSelected(
    contractorId: string,
    reporterId: string,
    projectTitle: string
  ): Promise<void> {
    await this.notifyUser(
      contractorId,
      '🎉 Congratulations! Your Bid Was Selected',
      `You've been awarded the contract for "${projectTitle}". Project setup in progress.`,
      'success',
      'bid',
      '/contractor/projects'
    );

    await this.notifyUser(
      reporterId,
      '🏗️ Contractor Selected for Your Report',
      `A contractor has been selected for "${projectTitle}". Work will begin soon!`,
      'success',
      'project',
      '/citizen/projects'
    );
  }

  /**
   * When escrow is funded
   */
  async onEscrowFunded(
    contractorId: string,
    projectTitle: string,
    amount: number
  ): Promise<void> {
    await this.notifyUser(
      contractorId,
      '💰 Project Funded!',
      `KES ${amount.toLocaleString()} deposited to escrow for "${projectTitle}". You can begin work!`,
      'success',
      'escrow',
      '/contractor/projects'
    );
  }

  /**
   * When milestone is submitted for verification
   */
  async onMilestoneSubmitted(
    citizenIds: string[],
    governmentIds: string[],
    milestoneName: string,
    projectTitle: string
  ): Promise<void> {
    // Notify citizens near the project
    if (citizenIds.length > 0) {
      await this.notifyUsers(
        citizenIds.slice(0, 50),
        '📸 Milestone Ready for Verification',
        `"${milestoneName}" on "${projectTitle}" needs citizen verification. Help verify!`,
        'info',
        'milestone',
        '/citizen/projects'
      );
    }

    // Notify government
    if (governmentIds.length > 0) {
      await this.notifyUsers(
        governmentIds.slice(0, 10),
        '📋 Milestone Awaiting Verification',
        `"${milestoneName}" submitted with evidence. Citizens can now verify.`,
        'info',
        'milestone',
        '/government/milestones'
      );
    }
  }

  /**
   * When milestone is verified by citizens
   */
  async onMilestoneVerified(
    contractorId: string,
    governmentIds: string[],
    milestoneName: string,
    verificationsCount: number,
    requiredCount: number
  ): Promise<void> {
    const isComplete = verificationsCount >= requiredCount;

    await this.notifyUser(
      contractorId,
      `✅ Milestone Verified (${verificationsCount}/${requiredCount})`,
      isComplete 
        ? `"${milestoneName}" fully verified! Payment ready for release.`
        : `"${milestoneName}" received a verification. ${requiredCount - verificationsCount} more needed.`,
      isComplete ? 'success' : 'info',
      'milestone',
      '/contractor/projects'
    );

    if (isComplete && governmentIds.length > 0) {
      await this.notifyUsers(
        governmentIds.slice(0, 10),
        '💰 Milestone Ready for Payment',
        `"${milestoneName}" verified by ${verificationsCount} citizens. Automated payment processing.`,
        'success',
        'payment',
        '/government/payment-release'
      );
    }
  }

  /**
   * When payment is released
   */
  async onPaymentReleased(
    contractorId: string,
    reporterId: string,
    milestoneName: string,
    amount: number
  ): Promise<void> {
    await this.notifyUser(
      contractorId,
      '💰 Payment Released!',
      `KES ${amount.toLocaleString()} released for "${milestoneName}". Check your account!`,
      'success',
      'payment',
      '/contractor/financials'
    );

    await this.notifyUser(
      reporterId,
      '✅ Project Milestone Paid',
      `Payment of KES ${amount.toLocaleString()} released for "${milestoneName}" on your reported issue.`,
      'success',
      'payment',
      '/citizen/projects'
    );
  }

  /**
   * When project is completed
   */
  async onProjectCompleted(
    contractorId: string,
    reporterId: string,
    projectTitle: string
  ): Promise<void> {
    await this.notifyUser(
      contractorId,
      '🎉 Project Completed!',
      `Congratulations! "${projectTitle}" has been marked as complete.`,
      'success',
      'project',
      '/contractor/projects'
    );

    await this.notifyUser(
      reporterId,
      '🎉 Your Reported Issue is Resolved!',
      `"${projectTitle}" has been completed. Thank you for helping improve your community!`,
      'success',
      'project',
      '/citizen/projects'
    );
  }

  /**
   * System-wide announcement
   */
  async systemAnnouncement(
    title: string,
    message: string,
    type: NotificationType = 'info'
  ): Promise<void> {
    await this.notifyRole('all', title, message, type, 'system');
  }
}

export const NotificationService = new NotificationServiceClass();
