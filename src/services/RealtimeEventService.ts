// Real-time event handler for triggering system alerts based on database changes
import { SystemAlertService } from '@/services/SystemAlertService';
import { supabase } from '@/integrations/supabase/client';

type EventHandler = (payload: any) => void;

class RealtimeEventServiceClass {
  private isSetup = false;
  private channelName = 'realtime-events';
  private handlers: Map<string, EventHandler[]> = new Map();

  // Set up listeners for database events and convert to system alerts
  setupEventListeners(userId: string, userType: string): () => void {
    if (this.isSetup) return () => {};

    console.log('[RealtimeEvents] Setting up event listeners for:', userType);

    const channel = supabase
      .channel(this.channelName)
      // Project status changes
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'projects' }, 
        (payload) => this.handleProjectUpdate(payload, userId, userType)
      )
      // New bids submitted
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'contractor_bids' }, 
        (payload) => this.handleNewBid(payload, userId, userType)
      )
      // Bid status changes
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'contractor_bids' }, 
        (payload) => this.handleBidUpdate(payload, userId, userType)
      )
      // Milestone updates
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'project_milestones' }, 
        (payload) => this.handleMilestoneUpdate(payload, userId, userType)
      )
      // Payment transactions
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'payment_transactions' }, 
        (payload) => this.handlePaymentTransaction(payload, userId, userType)
      )
      // Escrow funding
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'escrow_accounts' }, 
        (payload) => this.handleEscrowUpdate(payload, userId, userType)
      )
      // Report status changes
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'problem_reports' }, 
        (payload) => this.handleReportUpdate(payload, userId, userType)
      )
      // Milestone verifications
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'milestone_verifications' }, 
        (payload) => this.handleMilestoneVerification(payload, userId, userType)
      )
      .subscribe((status) => {
        console.log('[RealtimeEvents] Subscription status:', status);
      });

    this.isSetup = true;

    return () => {
      supabase.removeChannel(channel);
      this.isSetup = false;
    };
  }

  private async handleProjectUpdate(payload: any, userId: string, userType: string) {
    const { new: project, old: oldProject } = payload;
    
    if (project.status !== oldProject?.status) {
      // Check if user is related to this project
      const isContractor = project.contractor_id === userId;
      
      if (isContractor || userType === 'government') {
        await SystemAlertService.projectStatusChanged(
          project.id,
          project.title,
          project.status,
          userType === 'contractor' ? '/contractor/projects' : '/government/projects'
        );
      }
    }
  }

  private async handleNewBid(payload: any, userId: string, userType: string) {
    const bid = payload.new;
    
    // Government users see all new bids
    if (userType === 'government') {
      // Fetch report details
      const { data: report } = await supabase
        .from('problem_reports')
        .select('title')
        .eq('id', bid.report_id)
        .single();

      // Fetch contractor name
      const { data: profile } = await supabase
        .from('contractor_profiles')
        .select('company_name')
        .eq('user_id', bid.contractor_id)
        .single();

      await SystemAlertService.bidReceived(
        bid.report_id,
        report?.title || 'Project',
        profile?.company_name || 'Contractor'
      );
    }
  }

  private async handleBidUpdate(payload: any, userId: string, userType: string) {
    const { new: bid, old: oldBid } = payload;
    
    // Notify contractor when their bid status changes
    if (bid.contractor_id === userId && bid.status !== oldBid?.status) {
      if (bid.status === 'selected') {
        // Fetch report details
        const { data: report } = await supabase
          .from('problem_reports')
          .select('title')
          .eq('id', bid.report_id)
          .single();

        await SystemAlertService.bidSelected(report?.title || 'Project', true);
      } else if (bid.status === 'rejected') {
        const { data: report } = await supabase
          .from('problem_reports')
          .select('title')
          .eq('id', bid.report_id)
          .single();

        await SystemAlertService.bidSelected(report?.title || 'Project', false);
      }
    }
  }

  private async handleMilestoneUpdate(payload: any, userId: string, userType: string) {
    const { new: milestone, old: oldMilestone } = payload;
    
    if (milestone.status !== oldMilestone?.status) {
      // Fetch project details
      const { data: project } = await supabase
        .from('projects')
        .select('title, contractor_id')
        .eq('id', milestone.project_id)
        .single();

      const isContractor = project?.contractor_id === userId;
      
      if (milestone.status === 'verified' && (isContractor || userType === 'government')) {
        await SystemAlertService.milestoneCompleted(
          project?.title || 'Project',
          milestone.title
        );
      }

      // Alert citizens for verification opportunities
      if (milestone.status === 'submitted' && userType === 'citizen') {
        await SystemAlertService.verificationRequired(
          project?.title || 'Project',
          milestone.title,
          milestone.project_id
        );
      }
    }
  }

  private async handlePaymentTransaction(payload: any, userId: string, userType: string) {
    const transaction = payload.new;
    
    if (transaction.status === 'completed' && transaction.transaction_type === 'release') {
      // Fetch project details via escrow
      const { data: escrow } = await supabase
        .from('escrow_accounts')
        .select('project_id, projects(title, contractor_id)')
        .eq('id', transaction.escrow_account_id)
        .single();

      if (escrow?.projects) {
        const project = escrow.projects as any;
        const isContractor = project.contractor_id === userId;

        if (isContractor) {
          // Fetch milestone name if available
          let milestoneName = 'Milestone';
          if (transaction.milestone_id) {
            const { data: milestone } = await supabase
              .from('project_milestones')
              .select('title')
              .eq('id', transaction.milestone_id)
              .single();
            milestoneName = milestone?.title || milestoneName;
          }

          await SystemAlertService.paymentReleased(
            project.title,
            Number(transaction.amount),
            milestoneName
          );
        }
      }
    }
  }

  private async handleEscrowUpdate(payload: any, userId: string, userType: string) {
    const { new: escrow, old: oldEscrow } = payload;
    
    // Check if funds were added
    if (escrow.held_amount > (oldEscrow?.held_amount || 0)) {
      const addedAmount = escrow.held_amount - (oldEscrow?.held_amount || 0);
      
      // Fetch project
      const { data: project } = await supabase
        .from('projects')
        .select('title, contractor_id')
        .eq('id', escrow.project_id)
        .single();

      if (project?.contractor_id === userId) {
        await SystemAlertService.workflowUpdate(
          'Escrow Funded',
          `KES ${addedAmount.toLocaleString()} added to escrow for "${project.title}"`,
          '/contractor/financials'
        );
      }
    }
  }

  private async handleReportUpdate(payload: any, userId: string, userType: string) {
    const { new: report, old: oldReport } = payload;
    
    // Notify reporter of status changes
    if (report.reported_by === userId && report.status !== oldReport?.status) {
      const statusMessages: Record<string, string> = {
        'approved': 'Your report has been approved and will move to bidding',
        'bidding': 'Contractors are now bidding on your reported issue',
        'in_progress': 'Work has started on your reported issue',
        'completed': 'The issue you reported has been resolved',
        'rejected': 'Your report was not approved'
      };

      const message = statusMessages[report.status] || `Status changed to ${report.status}`;
      
      await SystemAlertService.workflowUpdate(
        `Report Status: ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}`,
        message,
        '/citizen/track'
      );
    }
  }

  private async handleMilestoneVerification(payload: any, userId: string, userType: string) {
    const verification = payload.new;
    
    if (userType === 'contractor' || userType === 'government') {
      // Fetch milestone and project details
      const { data: milestone } = await supabase
        .from('project_milestones')
        .select('title, project_id, projects(title, contractor_id)')
        .eq('id', verification.milestone_id)
        .single();

      if (milestone?.projects) {
        const project = milestone.projects as any;
        
        if (project.contractor_id === userId || userType === 'government') {
          await SystemAlertService.workflowUpdate(
            'Milestone Verified by Citizen',
            `${milestone.title} on "${project.title}" received a ${verification.verification_status} verification`,
            '/contractor/projects'
          );
        }
      }
    }
  }

  // Register custom event handler
  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
    
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  // Emit custom event
  emit(event: string, data: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

export const RealtimeEventService = new RealtimeEventServiceClass();
