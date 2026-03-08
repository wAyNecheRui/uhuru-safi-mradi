import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkflowGuardService, WORKFLOW_STATUS } from '@/services/WorkflowGuardService';
import { useRealtimeSubscription, REALTIME_PRESETS } from '@/hooks/useRealtimeSubscription';
import { isProjectEffectivelyCompleted } from '@/utils/progressCalculation';

export const useGovernmentDashboard = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [assignedCounties, setAssignedCounties] = useState<string[]>([]);
  const [budgetOverview, setBudgetOverview] = useState({
    totalAllocated: 'KES 0',
    totalSpent: 'KES 0', 
    totalCommitted: 'KES 0',
    available: 'KES 0',
    utilizationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user and their assigned counties
      const { data: { user } } = await supabase.auth.getUser();
      
      let counties: string[] = [];
      if (user) {
        const { data: govProfile } = await supabase
          .from('government_profiles')
          .select('assigned_counties')
          .eq('user_id', user.id)
          .single();
        
        counties = govProfile?.assigned_counties || [];
        setAssignedCounties(counties);
      }

      // Build query for problem reports - filter by assigned counties if set
      let pendingQuery = supabase
        .from('problem_reports')
        .select(`
          *,
          contractor_bids(*),
          community_votes(vote_type)
        `)
        .eq('status', WORKFLOW_STATUS.UNDER_REVIEW)
        .order('priority_score', { ascending: false });

      // If government official has assigned counties, filter by those
      // If no counties assigned, they can see all (national level access)
      if (counties.length > 0) {
        // Filter reports where location contains any of the assigned counties
        // or ward/constituency is in the assigned counties
        pendingQuery = pendingQuery.or(
          counties.map(county => `location.ilike.%${county}%`).join(',')
        );
      }

      const { data: pendingData } = await pendingQuery;

      // Fetch active projects - also filtered by counties if applicable
      let projectQuery = supabase
        .from('projects')
        .select(`
          *,
          problem_reports(title, location, reported_by),
          contractor_bids(contractor_id, bid_amount)
        `)
        .in('status', ['in_progress', 'planning'])
        .order('created_at', { ascending: false });

      const { data: activeData } = await projectQuery;

      // Calculate budget overview from projects with milestone-based completion
      const { data: budgetData } = await supabase
        .from('projects')
        .select('id, budget, status');

      if (budgetData) {
        // Fetch milestones for all projects to determine effective completion
        const projectIds = budgetData.map(p => p.id);
        const { data: allMilestones } = await supabase
          .from('project_milestones')
          .select('project_id, status')
          .in('project_id', projectIds);

        // Group milestones by project
        const milestonesByProject: Record<string, {status: string}[]> = {};
        (allMilestones || []).forEach(m => {
          if (!milestonesByProject[m.project_id]) {
            milestonesByProject[m.project_id] = [];
          }
          milestonesByProject[m.project_id].push({ status: m.status });
        });

        const totalAllocated = budgetData.reduce((sum, project) => sum + (project.budget || 0), 0);
        
        // Count spent as projects that are effectively completed
        const totalSpent = budgetData
          .filter(p => isProjectEffectivelyCompleted(p.status, milestonesByProject[p.id] || []))
          .reduce((sum, project) => sum + (project.budget || 0), 0);
        
        // Count committed as projects still in progress (not completed)
        const totalCommitted = budgetData
          .filter(p => !isProjectEffectivelyCompleted(p.status, milestonesByProject[p.id] || []) && 
                       ['in_progress', 'planning'].includes(p.status))
          .reduce((sum, project) => sum + (project.budget || 0), 0);
        
        setBudgetOverview({
          totalAllocated: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(totalAllocated),
          totalSpent: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(totalSpent),
          totalCommitted: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(totalCommitted),
          available: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(totalAllocated - totalSpent - totalCommitted),
          utilizationRate: totalAllocated > 0 ? Math.round(((totalSpent + totalCommitted) / totalAllocated) * 100) : 0
        });
      }

      // Add vote counts to pending data
      const pendingWithVotes = (pendingData || []).map((report: any) => ({
        ...report,
        vote_count: report.community_votes?.length || 0,
        upvotes: report.community_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0
      }));

      setPendingApprovals(pendingWithVotes);
      setActiveProjects(activeData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Set up real-time subscriptions for live updates
  useRealtimeSubscription({
    subscriptions: REALTIME_PRESETS.governmentDashboard,
    onDataChange: fetchDashboardData,
    channelPrefix: 'gov-dashboard'
  });

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApproval = async (projectId: string, action: 'approve' | 'reject' | 'request_more_info') => {
    try {
      if (action === 'approve') {
        // Use WorkflowGuardService to ensure proper transition
        const result = await WorkflowGuardService.approveReport(projectId);
        
        if (!result.success) {
          toast({
            title: "Cannot Approve",
            description: result.error,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Report Approved",
          description: "The report has been approved. You can now open bidding for this project.",
        });
      } else if (action === 'reject') {
        // Update to rejected status
        const { error } = await supabase
          .from('problem_reports')
          .update({ 
            status: WORKFLOW_STATUS.REJECTED,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);

        if (error) throw error;

        toast({
          title: "Report Rejected",
          description: "The report has been rejected. Community and reporter will be notified.",
        });
      } else {
        toast({
          title: "Information Requested",
          description: "Additional information has been requested from the reporter.",
        });
      }

      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error handling approval:', error);
      toast({
        title: "Error", 
        description: "Failed to process approval",
        variant: "destructive"
      });
    }
  };

  const openBidding = async (reportId: string) => {
    const result = await WorkflowGuardService.openBidding(reportId);
    
    if (!result.success) {
      toast({
        title: "Cannot Open Bidding",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    // Fire notifications to contractors and reporter NOW (correct lifecycle moment)
    try {
      const { data: report } = await supabase
        .from('problem_reports')
        .select('title, reported_by')
        .eq('id', reportId)
        .single();

      const { data: { user } } = await supabase.auth.getUser();

      if (report && user) {
        const { LiveNotificationService } = await import('@/services/LiveNotificationService');
        await LiveNotificationService.onBiddingOpened(
          reportId,
          user.id,
          report.title,
          report.reported_by
        );
      }
    } catch (notifErr) {
      console.warn('Bidding-open notifications failed (non-blocking):', notifErr);
    }

    toast({
      title: "Bidding Opened",
      description: "Contractors can now submit bids for this project.",
    });
    
    fetchDashboardData();
    return true;
  };

  return {
    pendingApprovals,
    activeProjects,
    assignedCounties,
    budgetOverview,
    loading,
    handleApproval,
    openBidding,
    refreshData: fetchDashboardData
  };
};