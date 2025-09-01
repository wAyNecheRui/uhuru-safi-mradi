import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGovernmentDashboard = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [budgetOverview, setBudgetOverview] = useState({
    totalAllocated: 'KES 0',
    totalSpent: 'KES 0', 
    totalCommitted: 'KES 0',
    available: 'KES 0',
    utilizationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch pending approvals (reports with bids)
      const { data: pendingData } = await supabase
        .from('problem_reports')
        .select(`
          *,
          contractor_bids(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch active projects
      const { data: activeData } = await supabase
        .from('projects')
        .select(`
          *,
          problem_reports(title, location, reported_by),
          contractor_bids(contractor_id, bid_amount)
        `)
        .in('status', ['in_progress', 'planning'])
        .order('created_at', { ascending: false });

      // Calculate budget overview from projects and reports
      const { data: budgetData } = await supabase
        .from('projects')
        .select('budget, status');

      if (budgetData) {
        const totalAllocated = budgetData.reduce((sum, project) => sum + (project.budget || 0), 0);
        const totalSpent = budgetData
          .filter(p => p.status === 'completed')
          .reduce((sum, project) => sum + (project.budget || 0), 0);
        const totalCommitted = budgetData
          .filter(p => ['in_progress', 'planning'].includes(p.status))
          .reduce((sum, project) => sum + (project.budget || 0), 0);
        
        setBudgetOverview({
          totalAllocated: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(totalAllocated),
          totalSpent: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(totalSpent),
          totalCommitted: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(totalCommitted),
          available: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(totalAllocated - totalSpent - totalCommitted),
          utilizationRate: totalAllocated > 0 ? Math.round(((totalSpent + totalCommitted) / totalAllocated) * 100) : 0
        });
      }

      setPendingApprovals(pendingData || []);
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
  };

  const handleApproval = async (projectId: string, action: 'approve' | 'reject' | 'request_more_info') => {
    try {
      const actionMessages = {
        approve: 'Project approved! Escrow funds will be released to contractor.',
        reject: 'Project rejected. Community and contractor will be notified.',
        request_more_info: 'Additional information requested from contractor.'
      };

      // Update report status
      await supabase
        .from('problem_reports')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          approved_by: action === 'approve' ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', projectId);

      toast({
        title: `Project ${action.replace('_', ' ')}`,
        description: actionMessages[action],
      });

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

  return {
    pendingApprovals,
    activeProjects,
    budgetOverview,
    loading,
    handleApproval
  };
};