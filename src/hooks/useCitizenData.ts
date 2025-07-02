
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
}

export interface CitizenStats {
  totalReports: number;
  activeReports: number;
  completedReports: number;
  communityVotes: number;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

export const useCitizenData = () => {
  const { user, supabase } = useAuth();
  const queryClient = useQueryClient();

  // Fetch citizen's reports
  const {
    data: reports = [],
    isLoading: reportsLoading,
    error: reportsError
  } = useQuery({
    queryKey: ['citizenReports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('problem_reports')
        .select('*')
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching citizen reports:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch citizen statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['citizenStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return {
        totalReports: 0,
        activeReports: 0,
        completedReports: 0,
        communityVotes: 0,
        verificationStatus: 'unverified' as const
      };
      
      try {
        // Get report counts
        const { data: reports } = await supabase
          .from('problem_reports')
          .select('status')
          .eq('reported_by', user.id);
        
        // Get verification status from user_verifications table
        const { data: verifications } = await supabase
          .from('user_verifications')
          .select('status')
          .eq('user_id', user.id)
          .eq('verification_type', 'citizen_id');
        
        const totalReports = reports?.length || 0;
        const activeReports = reports?.filter(r => 
          ['pending', 'under_review', 'in_progress'].includes(r.status || '')
        ).length || 0;
        const completedReports = reports?.filter(r => r.status === 'completed').length || 0;
        
        // For now, set community votes to 0 since we don't have this table yet
        const communityVotes = 0;
        
        const verificationStatus = verifications?.some(v => v.status === 'verified') 
          ? 'verified' 
          : verifications?.some(v => v.status === 'pending')
          ? 'pending'
          : 'unverified';
        
        return {
          totalReports,
          activeReports,
          completedReports,
          communityVotes,
          verificationStatus
        };
      } catch (error) {
        console.error('Error fetching citizen stats:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Submit a vote on a report (placeholder functionality)
  const submitVote = useMutation({
    mutationFn: async ({ reportId, voteType }: { reportId: string; voteType: 'upvote' | 'downvote' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // For now, just simulate the vote since we don't have community_votes table
      console.log('Vote submitted:', { reportId, voteType, userId: user.id });
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Vote submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['citizenStats', user?.id] });
    },
    onError: (error: any) => {
      toast.error(`Failed to submit vote: ${error.message}`);
    }
  });

  // Delete a report (if allowed)
  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('problem_reports')
        .delete()
        .eq('id', reportId)
        .eq('reported_by', user.id); // Ensure user can only delete their own reports
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['citizenReports', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['citizenStats', user?.id] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete report: ${error.message}`);
    }
  });

  return {
    // Data
    reports,
    stats,
    
    // Loading states
    reportsLoading,
    statsLoading,
    isLoading: reportsLoading || statsLoading,
    
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
    refetchReports: () => queryClient.invalidateQueries({ queryKey: ['citizenReports', user?.id] }),
    refetchStats: () => queryClient.invalidateQueries({ queryKey: ['citizenStats', user?.id] }),
  };
};
