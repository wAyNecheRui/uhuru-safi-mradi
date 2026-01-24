import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isProjectEffectivelyCompleted } from '@/utils/progressCalculation';

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalFunds: string;
  citizenReports: number;
  verifiedContractors: number;
}

const fetchProjectStats = async (): Promise<ProjectStats> => {
  // Batch all queries in parallel for better performance
  const [projectsResult, milestonesResult, reportsResult, contractorsResult] = await Promise.all([
    supabase.from('projects').select('id, status, budget'),
    supabase.from('project_milestones').select('project_id, status'),
    supabase.from('problem_reports').select('*', { count: 'exact', head: true }),
    supabase.from('skills_profiles').select('*', { count: 'exact', head: true }).eq('available_for_work', true)
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (milestonesResult.error) throw milestonesResult.error;
  if (reportsResult.error) throw reportsResult.error;
  if (contractorsResult.error) throw contractorsResult.error;

  const projects = projectsResult.data || [];
  const milestones = milestonesResult.data || [];
  
  // Group milestones by project
  const milestonesByProject: Record<string, {status: string}[]> = {};
  milestones.forEach(m => {
    if (!milestonesByProject[m.project_id]) {
      milestonesByProject[m.project_id] = [];
    }
    milestonesByProject[m.project_id].push({ status: m.status });
  });

  const totalProjects = projects.length;
  
  // Count active and completed based on milestone-aware logic
  let activeProjects = 0;
  let completedProjects = 0;
  
  projects.forEach(project => {
    const projectMilestones = milestonesByProject[project.id] || [];
    if (isProjectEffectivelyCompleted(project.status, projectMilestones)) {
      completedProjects++;
    } else if (project.status === 'in_progress') {
      activeProjects++;
    }
  });
  
  const totalBudget = projects.reduce((sum, project) => {
    return sum + (parseFloat(project.budget?.toString() || '0') || 0);
  }, 0);
  
  const totalFunds = totalBudget > 1000000 
    ? `KES ${(totalBudget / 1000000).toFixed(1)}M`
    : `KES ${(totalBudget / 1000).toFixed(0)}K`;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalFunds,
    citizenReports: reportsResult.count || 0,
    verifiedContractors: contractorsResult.count || 0
  };
};

export const useProjectStats = () => {
  const { data: stats, isLoading: loading, error } = useQuery({
    queryKey: ['project-stats'],
    queryFn: fetchProjectStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return { 
    stats: stats || null, 
    loading, 
    error: error instanceof Error ? error.message : null 
  };
};
