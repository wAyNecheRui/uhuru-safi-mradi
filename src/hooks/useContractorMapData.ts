import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCountyCentroid, parseGpsPoint } from '@/constants/countyCentroids';

export interface ContractorMapItem {
  id: string;
  kind: 'bid_opportunity' | 'my_project';
  name: string;
  status: string;
  rawStatus: string;
  category: string | null;
  county: string | null;
  location: string | null;
  budget: string;
  budgetRaw: number | null;
  lat: number;
  lng: number;
  isApproximate: boolean;
  // Bid-opportunity specifics
  biddingDeadline?: string | null;
  daysLeft?: number | null;
  urgency?: 'low' | 'medium' | 'high' | 'expired';
  bidCount?: number;
  // My-project specifics
  progress?: number;
  reportId?: string;
}

const formatBudget = (budget: any): string => {
  if (!budget) return 'Budget TBD';
  const amount = parseFloat(budget.toString());
  if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
  return `KES ${amount.toLocaleString()}`;
};

const computeUrgency = (deadline: string | null): { daysLeft: number | null; urgency: ContractorMapItem['urgency'] } => {
  if (!deadline) return { daysLeft: null, urgency: 'low' };
  const ms = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return { daysLeft: days, urgency: 'expired' };
  if (days <= 3) return { daysLeft: days, urgency: 'high' };
  if (days <= 7) return { daysLeft: days, urgency: 'medium' };
  return { daysLeft: days, urgency: 'low' };
};

const resolveCoords = (
  raw: { latitude?: number | null; longitude?: number | null; gps?: any; coordinates?: any; county?: string | null }
): { lat: number; lng: number; isApproximate: boolean } => {
  if (typeof raw.latitude === 'number' && typeof raw.longitude === 'number'
      && !isNaN(raw.latitude) && !isNaN(raw.longitude)) {
    return { lat: raw.latitude, lng: raw.longitude, isApproximate: false };
  }
  const gps = parseGpsPoint(raw.gps) || parseGpsPoint(raw.coordinates);
  if (gps) return { lat: gps[0], lng: gps[1], isApproximate: false };
  const centroid = getCountyCentroid(raw.county);
  return { lat: centroid[0], lng: centroid[1], isApproximate: true };
};

export const useContractorMapData = (contractorId: string | null) => {
  const [biddingOpportunities, setBiddingOpportunities] = useState<ContractorMapItem[]>([]);
  const [myProjects, setMyProjects] = useState<ContractorMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractorId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Open bidding opportunities (any contractor can bid nationwide)
        const { data: openReports, error: reportsErr } = await supabase
          .from('problem_reports')
          .select('id, title, category, county, location, coordinates, gps_coordinates, status, bidding_status, bidding_end_date, estimated_cost, budget_allocated')
          .eq('bidding_status', 'open')
          .is('deleted_at', null);

        if (reportsErr) throw reportsErr;

        // Count bids per report for context
        const reportIds = (openReports || []).map(r => r.id);
        let bidCountByReport: Record<string, number> = {};
        if (reportIds.length > 0) {
          const { data: bids } = await supabase
            .from('contractor_bids')
            .select('report_id')
            .in('report_id', reportIds)
            .is('deleted_at', null);
          bidCountByReport = (bids || []).reduce((acc, b) => {
            acc[b.report_id] = (acc[b.report_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }

        const opportunities: ContractorMapItem[] = (openReports || []).map(r => {
          const { lat, lng, isApproximate } = resolveCoords({
            gps: r.gps_coordinates,
            coordinates: r.coordinates,
            county: r.county || r.location,
          });
          const { daysLeft, urgency } = computeUrgency(r.bidding_end_date);
          const budgetVal = r.budget_allocated || r.estimated_cost;
          return {
            id: `report-${r.id}`,
            reportId: r.id,
            kind: 'bid_opportunity',
            name: r.title,
            status: 'Bidding Open',
            rawStatus: 'bidding_open',
            category: r.category,
            county: r.county,
            location: r.location,
            budget: formatBudget(budgetVal),
            budgetRaw: budgetVal ? parseFloat(String(budgetVal)) : null,
            lat,
            lng,
            isApproximate,
            biddingDeadline: r.bidding_end_date,
            daysLeft,
            urgency,
            bidCount: bidCountByReport[r.id] || 0,
          };
        });

        // 2. Contractor's own projects
        const { data: projects, error: projectsErr } = await supabase
          .from('projects')
          .select(`
            id, title, status, budget, latitude, longitude, contractor_id,
            problem_reports!projects_report_id_fkey (
              location, coordinates, gps_coordinates, category, county
            )
          `)
          .eq('contractor_id', contractorId)
          .is('deleted_at', null);

        if (projectsErr) throw projectsErr;

        // Get milestone progress
        const projectIds = (projects || []).map(p => p.id);
        let progressByProject: Record<string, number> = {};
        if (projectIds.length > 0) {
          const { data: milestones } = await supabase
            .from('project_milestones')
            .select('project_id, status, payment_percentage')
            .in('project_id', projectIds);

          const grouped = (milestones || []).reduce((acc, m) => {
            (acc[m.project_id] ||= []).push(m);
            return acc;
          }, {} as Record<string, any[]>);

          Object.entries(grouped).forEach(([pid, ms]) => {
            const total = ms.reduce((sum, m) => sum + (m.payment_percentage || 0), 0);
            const completed = ms
              .filter(m => ['paid', 'verified', 'completed'].includes(m.status))
              .reduce((sum, m) => sum + (m.payment_percentage || 0), 0);
            progressByProject[pid] = total > 0 ? Math.round((completed / total) * 100) : 0;
          });
        }

        const mine: ContractorMapItem[] = (projects || []).map(p => {
          const report = p.problem_reports as any;
          const { lat, lng, isApproximate } = resolveCoords({
            latitude: p.latitude,
            longitude: p.longitude,
            gps: report?.gps_coordinates,
            coordinates: report?.coordinates,
            county: report?.county || report?.location,
          });
          return {
            id: `project-${p.id}`,
            kind: 'my_project',
            name: p.title,
            status: (p.status || 'planning').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            rawStatus: p.status || 'planning',
            category: report?.category || null,
            county: report?.county || null,
            location: report?.location || null,
            budget: formatBudget(p.budget),
            budgetRaw: p.budget ? parseFloat(String(p.budget)) : null,
            lat,
            lng,
            isApproximate,
            progress: progressByProject[p.id] || 0,
          };
        });

        setBiddingOpportunities(opportunities);
        setMyProjects(mine);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`contractor-map-${contractorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_reports' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contractor_bids' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractorId]);

  return { biddingOpportunities, myProjects, loading, error };
};
