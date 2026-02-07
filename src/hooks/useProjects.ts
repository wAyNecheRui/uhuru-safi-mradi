import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateProjectProgress, getEffectiveProjectStatus } from '@/utils/progressCalculation';

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'Pending Review' | 'Active' | 'Bidding' | 'Completed' | 'Cancelled' | string;
  budget: string;
  contractor: string;
  progress: number;
  reportedBy: string;
  dateReported: string;
  votes: number;
  category?: string;
  estimatedCost?: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch real projects from database
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          *,
          problem_reports(
            title,
            description,
            location,
            priority,
            category,
            estimated_cost,
            reported_by,
            created_at
          ),
          project_milestones(status, payment_percentage)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      // Fetch contractor names separately
      const contractorIds = projectsData
        ?.map(p => p.contractor_id)
        .filter(Boolean) || [];
      
      const { data: contractorData } = contractorIds.length > 0
        ? await supabase
            .from('contractor_profiles')
            .select('user_id, company_name')
            .in('user_id', contractorIds)
        : { data: [] };

      // Create contractor lookup
      const contractorLookup: Record<string, string> = {};
      contractorData?.forEach(c => {
        contractorLookup[c.user_id] = c.company_name;
      });

      // Fetch community votes for each related report
      const reportIds = projectsData
        ?.map(p => p.report_id)
        .filter(Boolean) || [];
      
      const { data: votesData } = reportIds.length > 0 
        ? await supabase
            .from('community_votes')
            .select('report_id')
            .in('report_id', reportIds)
        : { data: [] };

      // Count votes per report
      const votesByReport: Record<string, number> = {};
      votesData?.forEach(v => {
        votesByReport[v.report_id] = (votesByReport[v.report_id] || 0) + 1;
      });

      // Transform database projects to UI format
      const transformedProjects: Project[] = (projectsData || []).map(project => {
        const report = project.problem_reports;
        const milestones = project.project_milestones || [];
        
        // Calculate progress using the unified utility
        const calculatedProgress = calculateProjectProgress(milestones);
        
        // Get effective status (handles case where all milestones are done but DB status lags)
        const effectiveStatus = getEffectiveProjectStatus(project.status, milestones);
        
        // Map database status to UI status
        let uiStatus: Project['status'] = 'Active';
        switch (effectiveStatus) {
          case 'planning': uiStatus = 'Pending Review'; break;
          case 'in_progress': uiStatus = 'Active'; break;
          case 'completed': uiStatus = 'Completed'; break;
          case 'cancelled': uiStatus = 'Cancelled'; break;
          default: uiStatus = effectiveStatus || 'Active';
        }

        return {
          id: project.id,
          title: project.title || report?.title || 'Untitled Project',
          description: project.description || report?.description || '',
          location: report?.location || 'Location not specified',
          priority: (report?.priority as Project['priority']) || 'medium',
          status: uiStatus,
          budget: project.budget 
            ? `KSh ${project.budget.toLocaleString()}` 
            : 'Budget TBD',
          contractor: contractorLookup[project.contractor_id] || 'Pending Assignment',
          progress: calculatedProgress,
          reportedBy: 'Citizen Reporter',
          dateReported: report?.created_at 
            ? new Date(report.created_at).toISOString().split('T')[0]
            : new Date(project.created_at).toISOString().split('T')[0],
          votes: votesByReport[project.report_id] || 0,
          category: report?.category || 'General',
          estimatedCost: report?.estimated_cost 
            ? `KSh ${report.estimated_cost.toLocaleString()}` 
            : undefined
        };
      });

      setProjects(transformedProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (projectData: Omit<Project, 'id' | 'progress' | 'votes' | 'status' | 'contractor'>) => {
    // This would typically create a problem report first
    // For now, just add to local state
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      status: 'Pending Review',
      contractor: 'Pending',
      progress: 0,
      votes: 1
    };
    
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates } : project
    ));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const getProjectsByStatus = (status: Project['status']) => {
    return projects.filter(project => project.status === status);
  };

  const getProjectsByPriority = (priority: Project['priority']) => {
    return projects.filter(project => project.priority === priority);
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    getProjectsByStatus,
    getProjectsByPriority,
    refetch: fetchProjects
  };
};
