import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useKenyaOpenData = () => {
  const [countyBenchmarks, setCountyBenchmarks] = useState([]);
  const [nationalTrends, setNationalTrends] = useState([]);
  const [sectorDistribution, setSectorDistribution] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOpenData();
  }, []);

  const fetchOpenData = async () => {
    try {
      setLoading(true);

      // Fetch county-level project data
      const { data: projectData } = await supabase
        .from('projects')
        .select(`
          *,
          problem_reports(location, category)
        `);

      // Fetch escrow data for budget utilization
      const { data: escrowData } = await supabase
        .from('escrow_accounts')
        .select('total_amount, held_amount, released_amount');

      // Fetch milestone verifications for satisfaction metrics
      const { data: verificationData } = await supabase
        .from('milestone_verifications')
        .select('verification_notes');

      // Calculate actual budget utilization from escrow data
      const totalEscrowFunded = escrowData?.reduce((sum, e) => sum + (e.held_amount || 0) + (e.released_amount || 0), 0) || 0;
      const totalEscrowRequired = escrowData?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0;
      const overallBudgetUtilization = totalEscrowRequired > 0 
        ? Math.round((totalEscrowFunded / totalEscrowRequired) * 100) 
        : 0;

      // Calculate satisfaction from verification ratings
      let totalRatings = 0;
      let ratingSum = 0;
      verificationData?.forEach(v => {
        const ratingMatch = v.verification_notes?.match(/Rating:\s*(\d+)/);
        if (ratingMatch) {
          ratingSum += parseInt(ratingMatch[1], 10);
          totalRatings++;
        }
      });
      const avgSatisfaction = totalRatings > 0 ? Math.round((ratingSum / totalRatings) * 20) : 0;

      // Transform project data by county
      const countyStats = {};
      projectData?.forEach(project => {
        const location = project.problem_reports?.location || 'Unknown';
        const county = location.split(',')[0]?.trim() || location.split(' ')[0] || 'Unknown';
        
        if (!countyStats[county]) {
          countyStats[county] = {
            county,
            projectsCompleted: 0,
            projectsTotal: 0,
            totalBudget: 0,
            budgetSpent: 0
          };
        }
        
        countyStats[county].projectsTotal++;
        if (project.status === 'completed') {
          countyStats[county].projectsCompleted++;
        }
        countyStats[county].totalBudget += project.budget || 0;
      });

      // Calculate actual metrics per county from real data
      Object.values(countyStats).forEach((county: any) => {
        county.budgetUtilization = county.projectsTotal > 0 
          ? Math.round((county.projectsCompleted / county.projectsTotal) * 100) 
          : 0;
        county.averageProjectCost = county.projectsTotal > 0 
          ? Math.round(county.totalBudget / county.projectsTotal) 
          : 0;
        // Use actual satisfaction from verifications
        county.citizenSatisfaction = avgSatisfaction;
        // Derive development index from completion rate
        county.developmentIndex = county.projectsTotal > 0 
          ? (county.projectsCompleted / county.projectsTotal) 
          : 0;
      });

      // Calculate actual national trends from database
      const currentYear = new Date().getFullYear();
      const projectsByYear = {};
      projectData?.forEach(project => {
        const year = new Date(project.created_at).getFullYear();
        if (!projectsByYear[year]) {
          projectsByYear[year] = { count: 0, budget: 0 };
        }
        projectsByYear[year].count++;
        projectsByYear[year].budget += project.budget || 0;
      });

      // Build trend data from actual project history
      const trendData = [];
      for (let year = currentYear - 4; year <= currentYear; year++) {
        const yearData = projectsByYear[year] || { count: 0, budget: 0 };
        trendData.push({
          year: String(year),
          projectsCompleted: yearData.count,
          budgetAllocated: yearData.budget / 1000000, // Convert to millions
          budgetUtilized: (yearData.budget * overallBudgetUtilization / 100) / 1000000
        });
      }

      // Calculate sector distribution from actual data
      const sectorCounts = {};
      projectData?.forEach(project => {
        const category = project.problem_reports?.category || 'Other';
        if (!sectorCounts[category]) {
          sectorCounts[category] = { count: 0, budget: 0 };
        }
        sectorCounts[category].count++;
        sectorCounts[category].budget += project.budget || 0;
      });

      const sectorData = Object.entries(sectorCounts).map(([name, data]: [string, any]) => ({
        name,
        value: data.count,
        amount: data.budget / 1000000 // Convert to millions
      }));

      // Calculate actual performance metrics from real data
      const totalProjects = projectData?.length || 0;
      const completedProjects = projectData?.filter(p => p.status === 'completed').length || 0;
      const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

      const metricsData = [
        {
          metric: 'National Average Completion Rate',
          value: `${completionRate}%`,
          benchmark: '85%',
          trend: completionRate >= 85 ? 'On Track' : completionRate >= 70 ? 'Improving' : 'Needs Attention',
          status: completionRate >= 85 ? 'excellent' : completionRate >= 70 ? 'improving' : 'concerning'
        },
        {
          metric: 'Budget Utilization Rate',
          value: `${overallBudgetUtilization}%`,
          benchmark: '90%',
          trend: overallBudgetUtilization >= 90 ? 'Excellent' : overallBudgetUtilization >= 75 ? 'Good' : 'Needs Attention',
          status: overallBudgetUtilization >= 90 ? 'excellent' : overallBudgetUtilization >= 75 ? 'improving' : 'concerning'
        },
        {
          metric: 'Citizen Satisfaction Index',
          value: avgSatisfaction.toString(),
          benchmark: '80',
          trend: avgSatisfaction >= 80 ? 'Excellent' : avgSatisfaction >= 60 ? 'Good' : 'Needs Improvement',
          status: avgSatisfaction >= 80 ? 'excellent' : avgSatisfaction >= 60 ? 'improving' : 'concerning'
        },
        {
          metric: 'Active Projects',
          value: String(totalProjects - completedProjects),
          benchmark: 'N/A',
          trend: 'Current',
          status: 'neutral'
        }
      ];

      setCountyBenchmarks(Object.values(countyStats));
      setNationalTrends(trendData);
      setSectorDistribution(sectorData);
      setPerformanceMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching Kenya Open Data:', error);
      toast({
        title: "Error",
        description: "Failed to load Kenya Open Data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    countyBenchmarks,
    nationalTrends,
    sectorDistribution,
    performanceMetrics,
    loading
  };
};
