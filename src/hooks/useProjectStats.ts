import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalFunds: string;
  citizenReports: number;
  verifiedContractors: number;
}

export const useProjectStats = () => {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get projects stats
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('status, budget');
        
        if (projectsError) throw projectsError;

        // Get reports count
        const { count: reportsCount, error: reportsError } = await supabase
          .from('problem_reports')
          .select('*', { count: 'exact', head: true });
        
        if (reportsError) throw reportsError;

        // Get verified contractors count
        const { count: contractorsCount, error: contractorsError } = await supabase
          .from('skills_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('available_for_work', true);
        
        if (contractorsError) throw contractorsError;

        // Calculate stats
        const totalProjects = projects?.length || 0;
        const activeProjects = projects?.filter(p => p.status === 'in_progress').length || 0;
        const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
        
        // Calculate total funds
        const totalBudget = projects?.reduce((sum, project) => {
          return sum + (parseFloat(project.budget?.toString() || '0') || 0);
        }, 0) || 0;
        
        const totalFunds = totalBudget > 1000000 
          ? `KES ${(totalBudget / 1000000).toFixed(1)}M`
          : `KES ${(totalBudget / 1000).toFixed(0)}K`;

        setStats({
          totalProjects,
          activeProjects,
          completedProjects,
          totalFunds,
          citizenReports: reportsCount || 0,
          verifiedContractors: contractorsCount || 0
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};