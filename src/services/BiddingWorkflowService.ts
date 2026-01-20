import { supabase } from '@/integrations/supabase/client';

export interface BidRequirements {
  meets_requirements: boolean;
  bid_count: number;
  min_required: number;
  agpo_bids: number;
  agpo_required: number;
  can_approve: boolean;
  extension_count: number;
  days_remaining: number;
  status_message: string;
}

export interface TopBid {
  bid_id: string;
  contractor_id: string;
  contractor_name: string;
  bid_amount: number;
  estimated_duration: number;
  price_score: number;
  technical_score: number;
  experience_score: number;
  agpo_bonus: number;
  total_score: number;
  is_agpo: boolean;
  agpo_category: string | null;
  years_in_business: number | null;
  previous_projects_count: number | null;
  max_project_capacity: number | null;
  rank: number;
}

export interface BidEvaluationResult {
  bid_id: string;
  price_score: number;
  technical_score: number;
  experience_score: number;
  agpo_bonus: number;
  total_score: number;
}

export class BiddingWorkflowService {
  /**
   * Check if a project meets Kenya Public Procurement Act requirements
   */
  static async checkBidRequirements(reportId: string): Promise<BidRequirements | null> {
    const { data, error } = await supabase
      .rpc('check_bid_requirements', { p_report_id: reportId });

    if (error) {
      console.error('Error checking bid requirements:', error);
      return null;
    }

    return data?.[0] || null;
  }

  /**
   * Open bidding for an approved project (7-day window)
   */
  static async openBiddingForProject(reportId: string): Promise<boolean> {
    const { error } = await supabase
      .rpc('open_bidding_for_project', { p_report_id: reportId });

    if (error) {
      console.error('Error opening bidding:', error);
      return false;
    }

    return true;
  }

  /**
   * Extend bidding window by 7 days (max 2 extensions allowed)
   */
  static async extendBiddingWindow(reportId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('extend_bidding_window', { p_report_id: reportId });

    if (error) {
      console.error('Error extending bidding:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Evaluate a bid using the 40-30-30 scoring system
   */
  static async evaluateBid(bidId: string, notes?: string): Promise<BidEvaluationResult | null> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const { data, error } = await supabase
      .rpc('evaluate_bid', { 
        p_bid_id: bidId, 
        p_evaluator_id: user.id,
        p_notes: notes || null
      });

    if (error) {
      console.error('Error evaluating bid:', error);
      return null;
    }

    return data?.[0] || null;
  }

  /**
   * Evaluate all bids for a report
   */
  static async evaluateAllBids(reportId: string): Promise<number> {
    const { data: bids, error } = await supabase
      .from('contractor_bids')
      .select('id')
      .eq('report_id', reportId)
      .eq('status', 'submitted');

    if (error || !bids) return 0;

    let evaluated = 0;
    for (const bid of bids) {
      const result = await this.evaluateBid(bid.id);
      if (result) evaluated++;
    }

    return evaluated;
  }

  /**
   * Get top 3 bids for government approval
   */
  static async getTopBidsForApproval(reportId: string): Promise<TopBid[]> {
    const { data, error } = await supabase
      .rpc('get_top_bids_for_approval', { p_report_id: reportId });

    if (error) {
      console.error('Error getting top bids:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Select winning bid and create/update project with contractor
   */
  static async selectWinningBid(
    reportId: string, 
    bidId: string, 
    justification: string
  ): Promise<boolean> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    try {
      // Get the bid details first
      const { data: selectedBidData, error: bidFetchError } = await supabase
        .from('contractor_bids')
        .select('*')
        .eq('id', bidId)
        .single();

      if (bidFetchError || !selectedBidData) {
        console.error('Error fetching bid:', bidFetchError);
        return false;
      }

      // Get the report details for project creation
      const { data: reportData, error: reportFetchError } = await supabase
        .from('problem_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportFetchError || !reportData) {
        console.error('Error fetching report:', reportFetchError);
        return false;
      }

      // First, reject all other bids
      await supabase
        .from('contractor_bids')
        .update({ status: 'rejected' })
        .eq('report_id', reportId)
        .neq('id', bidId);

      // Select the winning bid
      const { error: bidError } = await supabase
        .from('contractor_bids')
        .update({
          status: 'selected',
          selected_at: new Date().toISOString()
        })
        .eq('id', bidId);

      if (bidError) throw bidError;

      // Check if project already exists for this report
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('report_id', reportId)
        .single();

      if (existingProject) {
        // Update existing project with contractor
        const { error: updateProjectError } = await supabase
          .from('projects')
          .update({
            contractor_id: selectedBidData.contractor_id,
            budget: selectedBidData.bid_amount,
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProject.id);

        if (updateProjectError) {
          console.error('Error updating project:', updateProjectError);
        }
      } else {
        // Create new project
        const { error: createProjectError } = await supabase
          .from('projects')
          .insert({
            report_id: reportId,
            title: reportData.title,
            description: reportData.description,
            budget: selectedBidData.bid_amount,
            contractor_id: selectedBidData.contractor_id,
            status: 'in_progress'
          });

        if (createProjectError) {
          console.error('Error creating project:', createProjectError);
        }
      }

      // Update report status
      await supabase
        .from('problem_reports')
        .update({
          status: 'contractor_selected',
          bidding_status: 'closed'
        })
        .eq('id', reportId);

      // Create approval audit record
      await supabase
        .from('project_approval_audit')
        .insert({
          report_id: reportId,
          winning_bid_id: bidId,
          approved_by: user.id,
          approval_action: 'approve',
          justification,
          bid_count: await this.getBidCount(reportId),
          agpo_compliant: true
        });

      // Create notification for the contractor
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedBidData.contractor_id,
          title: 'Bid Selected!',
          message: `Congratulations! Your bid for "${reportData.title}" has been selected. You can now start working on the project.`,
          type: 'success',
          category: 'bidding'
        });

      return true;
    } catch (error) {
      console.error('Error selecting winning bid:', error);
      return false;
    }
  }

  /**
   * Request direct procurement exception (for < 3 bids after extensions)
   */
  static async requestDirectProcurement(
    reportId: string, 
    justification: string
  ): Promise<boolean> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    try {
      await supabase
        .from('problem_reports')
        .update({
          direct_procurement_approved: false,
          direct_procurement_justification: justification
        })
        .eq('id', reportId);

      await supabase
        .from('project_approval_audit')
        .insert({
          report_id: reportId,
          approved_by: user.id,
          approval_action: 'request_exception',
          justification,
          bid_count: await this.getBidCount(reportId)
        });

      return true;
    } catch (error) {
      console.error('Error requesting direct procurement:', error);
      return false;
    }
  }

  /**
   * Get bid count for a report
   */
  static async getBidCount(reportId: string): Promise<number> {
    const { count } = await supabase
      .from('contractor_bids')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', reportId);

    return count || 0;
  }

  /**
   * Get projects open for bidding
   */
  static async getOpenBiddingProjects() {
    const { data, error } = await supabase
      .from('problem_reports')
      .select(`
        *,
        contractor_bids(count)
      `)
      .eq('status', 'approved')
      .eq('bidding_status', 'open')
      .order('bidding_end_date', { ascending: true });

    if (error) {
      console.error('Error fetching open bidding projects:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get projects ready for bid selection
   */
  static async getProjectsReadyForSelection() {
    const { data, error } = await supabase
      .from('problem_reports')
      .select(`
        *,
        contractor_bids(*)
      `)
      .eq('status', 'approved')
      .eq('bidding_status', 'open');

    if (error) {
      console.error('Error fetching projects for selection:', error);
      return [];
    }

    // Filter to only include projects with minimum bids
    const readyProjects = [];
    for (const project of data || []) {
      const requirements = await this.checkBidRequirements(project.id);
      if (requirements?.meets_requirements) {
        readyProjects.push({
          ...project,
          requirements
        });
      }
    }

    return readyProjects;
  }

  /**
   * Get projects with insufficient bids
   */
  static async getProjectsWithInsufficientBids() {
    const { data, error } = await supabase
      .from('problem_reports')
      .select(`
        *,
        contractor_bids(count)
      `)
      .eq('status', 'approved')
      .eq('bidding_status', 'open');

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    const insufficientProjects = [];
    for (const project of data || []) {
      const requirements = await this.checkBidRequirements(project.id);
      if (requirements && !requirements.meets_requirements) {
        insufficientProjects.push({
          ...project,
          requirements
        });
      }
    }

    return insufficientProjects;
  }

  /**
   * Format currency in KES
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get minimum bid requirements based on project value
   */
  static getMinBidRequirements(estimatedCost: number, isEmergency: boolean): number {
    if (isEmergency) return 2;
    if (estimatedCost > 1000000000) return 5; // > 1B KES
    return 3;
  }

  /**
   * Get AGPO bid requirements based on project value
   */
  static getAGPORequirements(estimatedCost: number): number {
    if (estimatedCost > 1000000000) return 3;
    if (estimatedCost > 500000000) return 2;
    return 1;
  }
}
