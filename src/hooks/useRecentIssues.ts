import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecentIssue {
  id: number;
  title: string;
  location: string | null;
  votes: number;
  status: string | null;
  urgency: string | null;
  reportedAt: string;
  priority_score: number | null;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

const fetchRecentIssues = async (limit: number): Promise<RecentIssue[]> => {
  const { data, error } = await supabase
    .from('problem_reports')
    .select('id, title, location, status, priority, priority_score, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;

  return data?.map((issue, index) => ({
    id: index + 1,
    title: issue.title,
    location: issue.location,
    votes: issue.priority_score || 0,
    status: issue.status,
    urgency: issue.priority,
    reportedAt: formatTimeAgo(issue.created_at || ''),
    priority_score: issue.priority_score
  })) || [];
};

export const useRecentIssues = (limit: number = 10) => {
  const queryClient = useQueryClient();

  const { data: issues, isLoading: loading, error } = useQuery({
    queryKey: ['recent-issues', limit],
    queryFn: () => fetchRecentIssues(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('problem_reports_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'problem_reports'
      }, () => {
        // Invalidate cache to refetch
        queryClient.invalidateQueries({ queryKey: ['recent-issues'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { 
    issues: issues || [], 
    loading, 
    error: error instanceof Error ? error.message : null 
  };
};
