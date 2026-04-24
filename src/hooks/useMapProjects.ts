import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KENYA_COUNTIES } from '@/constants/kenyaAdministrativeUnits';
import { getCountyCentroid, parseGpsPoint } from '@/constants/countyCentroids';

export interface MapProject {
  id: string;
  name: string;
  status: string;
  rawStatus: string;
  progress: number;
  budget: string;
  budgetRaw: number | null;
  contractor: string;
  location: string | null;
  category: string | null;
  county: string | null;
  lat: number;
  lng: number;
  isApproximate: boolean;
}

export const useMapProjects = (selectedCounty: string, viewAllCounties: boolean = false) => {
  const [projects, setProjects] = useState<MapProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        const { data, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id,
            title,
            status,
            budget,
            latitude,
            longitude,
            contractor_id,
            problem_reports!projects_report_id_fkey (
              location,
              coordinates,
              gps_coordinates,
              category,
              county
            )
          `);

        if (projectsError) throw projectsError;

        const contractorIds = data?.filter(p => p.contractor_id).map(p => p.contractor_id) || [];
        let contractorData: any[] = [];

        if (contractorIds.length > 0) {
          const { data: contractors } = await supabase
            .from('skills_profiles')
            .select('user_id, organization, full_name')
            .in('user_id', contractorIds);
          contractorData = contractors || [];
        }

        const isValidCounty = KENYA_COUNTIES.some(
          c => c.toLowerCase() === selectedCounty.toLowerCase()
        );

        const filteredData = data?.filter(project => {
          if (viewAllCounties) return true;
          const report = project.problem_reports as any;
          const county = report?.county || report?.location;
          if (!county) return true;
          if (!isValidCounty) return true;

          const countyLower = selectedCounty.toLowerCase();
          const countyPattern = new RegExp(`\\b${countyLower.replace(/[-]/g, '[-\\s]?')}\\b`, 'i');
          return countyPattern.test(String(county).toLowerCase());
        }) || [];

        const formattedProjects: MapProject[] = filteredData.map((project) => {
          const contractor = contractorData.find(c => c.user_id === project.contractor_id);
          const report = project.problem_reports as any;
          const reportCounty = report?.county || null;

          // Resolve coordinates: project lat/lng → report gps_coordinates → report coordinates → county centroid
          let lat: number | null = null;
          let lng: number | null = null;
          let isApproximate = false;

          if (typeof project.latitude === 'number' && typeof project.longitude === 'number'
              && !isNaN(project.latitude) && !isNaN(project.longitude)) {
            lat = project.latitude;
            lng = project.longitude;
          } else {
            const gps = parseGpsPoint(report?.gps_coordinates) || parseGpsPoint(report?.coordinates);
            if (gps) {
              [lat, lng] = gps;
            } else {
              const fallbackCounty = reportCounty || (isValidCounty ? selectedCounty : null);
              const centroid = getCountyCentroid(fallbackCounty);
              lat = centroid[0];
              lng = centroid[1];
              isApproximate = true;
            }
          }

          const budgetRaw = project.budget ? parseFloat(String(project.budget)) : null;

          return {
            id: project.id,
            name: project.title,
            status: formatStatus(project.status || 'planning'),
            rawStatus: (project.status || 'planning').toLowerCase().replace(/\s+/g, '_'),
            progress: getProgressFromStatus(project.status || 'planning'),
            budget: formatBudget(project.budget),
            budgetRaw,
            contractor: contractor?.organization ||
                       contractor?.full_name ||
                       (project.status === 'planning' ? 'Pending' : 'Unassigned'),
            location: report?.location || (reportCounty ? `${reportCounty} County` : null),
            category: report?.category || null,
            county: reportCounty,
            lat: lat!,
            lng: lng!,
            isApproximate,
          };
        });

        setProjects(formattedProjects);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

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
  }, [selectedCounty, viewAllCounties]);

  return { projects, loading, error };
};

const formatStatus = (status: string): string => {
  switch (status) {
    case 'planning': return 'Planning';
    case 'in_progress': return 'In Progress';
    case 'under_review': return 'Under Review';
    case 'completed': return 'Completed';
    default: return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
  if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
  return `KES ${amount.toLocaleString()}`;
};
