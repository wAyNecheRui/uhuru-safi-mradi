import { useState, useEffect } from 'react';
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

export const useRecentIssues = (limit: number = 10) => {
  const [issues, setIssues] = useState<RecentIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentIssues = async () => {
      try {
        setLoading(true);
        
        const { data, error: issuesError } = await supabase
          .from('problem_reports')
          .select(`
            id,
            title,
            location,
            status,
            priority,
            priority_score,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (issuesError) throw issuesError;

        const formattedIssues = data?.map((issue, index) => ({
          id: index + 1,
          title: issue.title,
          location: issue.location,
          votes: issue.priority_score || 0,
          status: issue.status,
          urgency: issue.priority,
          reportedAt: formatTimeAgo(issue.created_at),
          priority_score: issue.priority_score
        })) || [];

        setIssues(formattedIssues);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recent issues');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentIssues();

    // Set up real-time subscription
    const channel = supabase
      .channel('problem_reports_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'problem_reports'
      }, () => {
        fetchRecentIssues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { issues, loading, error };
};

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