import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KENYA_COUNTIES } from '@/constants/kenyaAdministrativeUnits';

interface MapProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: string;
  contractor: string;
  location: string | null;
}

export const useMapProjects = (selectedCounty: string) => {
  const [projects, setProjects] = useState<MapProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Get projects with their related problem reports
        const { data, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id,
            title,
            status,
            budget,
            contractor_id,
            problem_reports!projects_report_id_fkey (
              location,
              coordinates
            )
          `);
          
        if (projectsError) throw projectsError;

        // Get contractor names separately if contractor_id exists
        const contractorIds = data?.filter(p => p.contractor_id).map(p => p.contractor_id) || [];
        let contractorData: any[] = [];
        
        if (contractorIds.length > 0) {
          const { data: contractors } = await supabase
            .from('skills_profiles')
            .select('user_id, organization, full_name')
            .in('user_id', contractorIds);
          contractorData = contractors || [];
        }

        // Filter projects by county if location contains county name
        const filteredData = data?.filter(project => {
          const location = project.problem_reports?.location;
          return !location || location.toLowerCase().includes(selectedCounty.toLowerCase());
        }) || [];

        const formattedProjects: MapProject[] = filteredData.map((project, index) => {
          const contractor = contractorData.find(c => c.user_id === project.contractor_id);
          
          return {
            id: project.id,
            name: project.title,
            status: formatStatus(project.status || 'planning'),
            progress: getProgressFromStatus(project.status || 'planning'),
            budget: formatBudget(project.budget),
            contractor: contractor?.organization || 
                       contractor?.full_name || 
                       (project.status === 'planning' ? 'Pending' : 'Unassigned'),
            location: project.problem_reports?.location || `${selectedCounty} Area`
          };
        });

        setProjects(formattedProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Set up real-time subscription
    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects'
      }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCounty]);

  return { projects, loading, error };
};

const formatStatus = (status: string): string => {
  switch (status) {
    case 'planning': return 'Planning';
    case 'in_progress': return 'In Progress';
    case 'under_review': return 'Under Review';
    case 'completed': return 'Completed';
    default: return 'Planning';
  }
};

const getProgressFromStatus = (status: string): number => {
  switch (status) {
    case 'planning': return 15;
    case 'in_progress': return 65;
    case 'under_review': return 90;
    case 'completed': return 100;
    default: return 0;
  }
};

const formatBudget = (budget: any): string => {
  if (!budget) return 'Budget TBD';
  
  const amount = parseFloat(budget.toString());
  if (amount >= 1000000) {
    return `KES ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `KES ${(amount / 1000).toFixed(0)}K`;
  }
  return `KES ${amount.toLocaleString()}`;
};