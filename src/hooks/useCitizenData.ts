import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGlobalRealtimeRefresh } from '@/contexts/RealtimeContext';

export interface CitizenReport {
  id: string;
  title: string;
  description: string;
  priority: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
  reported_by: string;
  // Enriched project data
  project_id?: string;
  project_status?: string;
  effective_status?: string;
  photo_urls?: string[];
  category?: string;
  estimated_cost?: number;
  affected_population?: number;
}

export interface CitizenStats {
  totalReports: number;
  activeReports: number;
  completedReports: number;
  communityVotes: number;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

export const useCitizenData = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // SECURITY: Only use stable user ID after auth is complete
  const stableUserId = !authLoading && user?.id ? user.id : null;

  // Set up real-time refresh for citizen data
  useGlobalRealtimeRefresh(
    ['problem_reports', 'community_votes', 'projects'],
    () => {
      if (stableUserId) {
        queryClient.invalidateQueries({ queryKey: ['citizenReports', stableUserId] });
        queryClient.invalidateQueries({ queryKey: ['citizenStats', stableUserId] });
      }
    },
    !!stableUserId
  );

  // Fetch citizen's reports with linked project data
  // SECURITY: Use stableUserId to prevent fetching with stale/wrong user
  const {
    data: reports = [],
    isLoading: reportsLoading,
    error: reportsError
  } = useQuery({
    queryKey: ['citizenReports', stableUserId],
    queryFn: async () => {
      // SECURITY: Double-check user ID is valid before fetching
      if (!stableUserId) return [];
      
      // Fetch reports - ALWAYS filter by the authenticated user's ID
      const { data: reportsData, error } = await supabase
        .from('problem_reports')
        .select('*')
        .eq('reported_by', stableUserId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching citizen reports:', error);
        throw error;
      }

      if (!reportsData || reportsData.length === 0) return [];

      // Fetch linked projects for these reports
      const reportIds = reportsData.map(r => r.id);
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, report_id, status')
        .in('report_id', reportIds)
        .is('deleted_at', null);

      // Create a map of report_id to project data
      const projectMap = new Map<string, { id: string; status: string }>();
      projectsData?.forEach(p => {
        if (p.report_id) {
          projectMap.set(p.report_id, { id: p.id, status: p.status || 'planning' });
        }
      });

      // Enrich reports with project status
      return reportsData.map(report => {
        const project = projectMap.get(report.id);
        let effectiveStatus = report.status;
        
        // Use project status if available and more advanced
        if (project) {
          if (project.status === 'completed') {
            effectiveStatus = 'completed';
          } else if (project.status === 'in_progress' && report.status !== 'completed') {
            effectiveStatus = 'in_progress';
          }
        }

        return {
          ...report,
          project_id: project?.id,
          project_status: project?.status,
          effective_status: effectiveStatus
        } as CitizenReport;
      });
    },
    enabled: !!stableUserId, // SECURITY: Only enable when user is stable
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch citizen statistics with accurate project-based completion counting
  // SECURITY: Use stableUserId to prevent fetching with stale/wrong user
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['citizenStats', stableUserId],
    queryFn: async () => {
      // SECURITY: Double-check user ID is valid
      if (!stableUserId) return {
        totalReports: 0,
        activeReports: 0,
        completedReports: 0,
        communityVotes: 0,
        verificationStatus: 'unverified' as const
      };
      
      try {
        // Get reports with their IDs and statuses - ALWAYS filter by user ID
        const { data: reportsData } = await supabase
          .from('problem_reports')
          .select('id, status')
          .eq('reported_by', stableUserId)
          .is('deleted_at', null);
        
        const reportIds = reportsData?.map(r => r.id) || [];
        
        // Get linked projects to check actual completion status
        let completedFromProjects = 0;
        if (reportIds.length > 0) {
          const { data: projectsData } = await supabase
            .from('projects')
            .select('report_id, status')
            .in('report_id', reportIds)
            .is('deleted_at', null);
          
          // Count projects that are completed
          completedFromProjects = projectsData?.filter(p => p.status === 'completed').length || 0;
        }
        
        // Get verification status from user_verifications table
        const { data: verifications } = await supabase
          .from('user_verifications')
          .select('status')
          .eq('user_id', stableUserId)
          .eq('verification_type', 'citizen_id');
        
        const totalReports = reportsData?.length || 0;
        
        // Active = has a project that's not completed OR report status indicates active workflow
        const activeStatuses = ['pending', 'under_review', 'approved', 'bidding_open', 'contractor_selected', 'in_progress'];
        const completedStatuses = ['completed', 'resolved'];
        
        // Count completed as: report status is completed OR linked project is completed
        const directlyCompleted = reportsData?.filter(r => completedStatuses.includes(r.status || '')).length || 0;
        const completedReports = Math.max(directlyCompleted, completedFromProjects);
        
        // Active = total - completed - rejected
        const rejectedReports = reportsData?.filter(r => r.status === 'rejected').length || 0;
        const activeReports = totalReports - completedReports - rejectedReports;
        
        // Count user's community votes - SECURITY: filter by user ID
        const { data: votesData } = await supabase
          .from('community_votes')
          .select('id')
          .eq('user_id', stableUserId);
        
        const communityVotes = votesData?.length || 0;
        
        const verificationStatus = verifications?.some(v => v.status === 'verified') 
          ? 'verified' 
          : verifications?.some(v => v.status === 'pending')
          ? 'pending'
          : 'unverified';
        
        return {
          totalReports,
          activeReports: Math.max(0, activeReports),
          completedReports,
          communityVotes,
          verificationStatus
        };
      } catch (error) {
        console.error('Error fetching citizen stats:', error);
        throw error;
      }
    },
    enabled: !!stableUserId, // SECURITY: Only enable when user is stable
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Submit a vote on a report (placeholder functionality)
  const submitVote = useMutation({
    mutationFn: async ({ reportId, voteType }: { reportId: string; voteType: 'upvote' | 'downvote' }) => {
      if (!stableUserId) throw new Error('User not authenticated');
      
      // For now, just simulate the vote since we don't have community_votes table
      console.log('Vote submitted:', { reportId, voteType, userId: stableUserId });
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Vote submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['citizenStats', stableUserId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to submit vote: ${error.message}`);
    }
  });

  // Soft delete a report (uses soft_delete_record function)
  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      if (!stableUserId) throw new Error('User not authenticated');
      
      // Use soft delete instead of hard delete
      const { data, error } = await supabase
        .rpc('soft_delete_record', {
          p_table_name: 'problem_reports',
          p_record_id: reportId
        });
      
      if (error) throw error;
      if (!data) throw new Error('Report not found or already deleted');
    },
    onSuccess: () => {
      toast.success('Report deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['citizenReports', stableUserId] });
      queryClient.invalidateQueries({ queryKey: ['citizenStats', stableUserId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete report: ${error.message}`);
    }
  });

  return {
    // Data
    reports,
    stats,
    
    // Loading states - SECURITY: Include authLoading to prevent showing stale data
    reportsLoading: reportsLoading || authLoading,
    statsLoading: statsLoading || authLoading,
    isLoading: reportsLoading || statsLoading || authLoading,
    
    // Errors
    reportsError,
    statsError,
    hasError: !!reportsError || !!statsError,
    
    // Actions
    submitVote: submitVote.mutate,
    isSubmittingVote: submitVote.isPending,
    
    deleteReport: deleteReport.mutate,
    isDeletingReport: deleteReport.isPending,
    
    // Utilities
    refetchReports: () => queryClient.invalidateQueries({ queryKey: ['citizenReports', stableUserId] }),
    refetchStats: () => queryClient.invalidateQueries({ queryKey: ['citizenStats', stableUserId] }),
  };
};
