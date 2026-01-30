import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Clock, 
  CheckCircle, MapPin, Calendar, Download, Loader2,
  Eye, Star, Zap, Target, RefreshCw
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isProjectEffectivelyCompleted } from '@/utils/progressCalculation';
import { formatDateTime, getCurrentDateTime } from '@/lib/dateUtils';

const GovernmentAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [kpis, setKpis] = useState({
    transparencyIndex: 0,
    paymentTimeliness: 0,
    projectSuccessRate: 0,
    citizenEngagement: 0,
    citizenEngagementTrend: 0,
    contractorSatisfaction: 0,
    governmentEfficiency: 0,
    // Raw counts for transparency
    totalProjects: 0,
    projectsWithEscrow: 0,
    totalMilestones: 0,
    verifiedMilestones: 0,
    paidMilestones: 0,
    totalReports: 0,
    totalVotes: 0,
    totalRatings: 0,
    avgRating: 0
  });
  const [regionalData, setRegionalData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch all necessary data in parallel for accurate KPIs
      const [projectsRes, reportsRes, milestonesRes, ratingsRes, votesRes, escrowRes, paymentsRes] = await Promise.all([
        supabase.from('projects').select('id, status, budget, contractor_id, report_id'),
        supabase.from('problem_reports').select('id, location, status, priority, created_at'),
        supabase.from('project_milestones').select('id, status, project_id, payment_percentage'),
        supabase.from('contractor_ratings').select('rating, project_id'),
        supabase.from('community_votes').select('id, report_id, vote_type'),
        supabase.from('escrow_accounts').select('id, project_id, total_amount, released_amount, held_amount'),
        supabase.from('payment_transactions').select('id, status, amount, created_at')
      ]);

      const projects = projectsRes.data || [];
      const reports = reportsRes.data || [];
      const milestones = milestonesRes.data || [];
      const ratings = ratingsRes.data || [];
      const votes = votesRes.data || [];
      const escrows = escrowRes.data || [];
      const payments = paymentsRes.data || [];

      // === TRANSPARENCY INDEX ===
      // Measures: projects with escrow accounts + verified milestones + blockchain records
      const projectsWithEscrow = new Set(escrows.map(e => e.project_id)).size;
      const verifiedMilestones = milestones.filter(m => 
        m.status === 'verified' || m.status === 'paid' || m.status === 'completed'
      ).length;
      const totalMilestones = milestones.length || 1;
      const totalProjects = projects.length || 1;
      const transparencyIndex = totalProjects > 0 
        ? Math.round(((projectsWithEscrow / totalProjects) * 50) + ((verifiedMilestones / totalMilestones) * 50))
        : 0;

      // === PAYMENT TIMELINESS ===
      // Measures: paid milestones vs total milestones that should be paid
      const paidMilestones = milestones.filter(m => m.status === 'paid').length;
      const submittedOrPaidMilestones = milestones.filter(m => 
        m.status === 'submitted' || m.status === 'verified' || m.status === 'paid' || m.status === 'completed'
      ).length;
      const paymentTimeliness = submittedOrPaidMilestones > 0 
        ? Math.round((paidMilestones / submittedOrPaidMilestones) * 100) 
        : 0;

      // === PROJECT SUCCESS RATE ===
      // Measures: effectively completed projects vs total projects with contractors assigned
      // Group milestones by project for completion detection
      const milestonesByProject: Record<string, {status: string}[]> = {};
      milestones.forEach(m => {
        if (!milestonesByProject[m.project_id]) {
          milestonesByProject[m.project_id] = [];
        }
        milestonesByProject[m.project_id].push({ status: m.status });
      });
      
      // Count projects that are effectively completed (all milestones done OR status = completed)
      const completedProjects = projects.filter(p => 
        isProjectEffectivelyCompleted(p.status, milestonesByProject[p.id] || [])
      ).length;
      const projectsWithContractors = projects.filter(p => p.contractor_id).length;
      const projectSuccessRate = projectsWithContractors > 0 
        ? Math.round((completedProjects / projectsWithContractors) * 100) 
        : (completedProjects > 0 ? 100 : 0);

      // === CITIZEN ENGAGEMENT ===
      // Measures: total reports + total votes (actual participation)
      const currentCitizenEngagement = reports.length + votes.length;
      
      // Calculate trend by comparing to reports from last 30 days vs previous 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const recentReports = reports.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length;
      const previousReports = reports.filter(r => {
        const date = new Date(r.created_at);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      }).length;
      
      const citizenEngagementTrend = previousReports > 0 
        ? Math.round(((recentReports - previousReports) / previousReports) * 100)
        : (recentReports > 0 ? 100 : 0);

      // === CONTRACTOR SATISFACTION ===
      // Measures: average rating from contractor_ratings table (scale 1-5 -> percentage)
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length 
        : 0;
      const contractorSatisfaction = Math.round((avgRating / 5) * 100);

      // === GOVERNMENT EFFICIENCY ===
      // Measures: (approved reports + completed projects + processed payments) / total actions possible
      const approvedReports = reports.filter(r => 
        r.status === 'approved' || r.status === 'bidding_open' || r.status === 'contractor_selected' || r.status === 'completed' || r.status === 'in_progress'
      ).length;
      const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'success').length;
      const totalReportsCount = reports.length || 1;
      const totalPaymentsCount = payments.length || 1;
      
      const approvalRate = approvedReports / totalReportsCount;
      const paymentCompletionRate = completedPayments / totalPaymentsCount;
      const projectCompletionRate = completedProjects / totalProjects;
      
      const governmentEfficiency = Math.round(
        ((approvalRate * 40) + (paymentCompletionRate * 30) + (projectCompletionRate * 30))
      );

      setKpis({
        transparencyIndex: Math.min(transparencyIndex, 100),
        paymentTimeliness: Math.min(paymentTimeliness, 100),
        projectSuccessRate: Math.min(projectSuccessRate, 100),
        citizenEngagement: currentCitizenEngagement,
        citizenEngagementTrend,
        contractorSatisfaction: Math.min(contractorSatisfaction, 100),
        governmentEfficiency: Math.min(governmentEfficiency, 100),
        // Raw counts for transparency
        totalProjects,
        projectsWithEscrow,
        totalMilestones,
        verifiedMilestones,
        paidMilestones,
        totalReports: reports.length,
        totalVotes: votes.length,
        totalRatings: ratings.length,
        avgRating: Math.round(avgRating * 10) / 10
      });
      
      setLastUpdated(getCurrentDateTime());

      // === REGIONAL DATA ===
      // Calculate per-county statistics from reports and projects
      const countyStats: Record<string, { total: number; completed: number; inProgress: number; budget: number }> = {};
      
      // Process reports by county
      reports.forEach(report => {
        // Parse county from location string (format: "County, Sub-location")
        const county = report.location?.split(',')[0]?.trim() || 'Unknown';
        if (!countyStats[county]) {
          countyStats[county] = { total: 0, completed: 0, inProgress: 0, budget: 0 };
        }
        countyStats[county].total++;
        if (report.status === 'completed' || report.status === 'resolved') {
          countyStats[county].completed++;
        }
        if (report.status === 'in_progress' || report.status === 'contractor_selected') {
          countyStats[county].inProgress++;
        }
      });

      // Add project budget data per county (via report_id linkage)
      projects.forEach(project => {
        const linkedReport = reports.find(r => r.id === project.report_id);
        if (linkedReport) {
          const county = linkedReport.location?.split(',')[0]?.trim() || 'Unknown';
          if (countyStats[county]) {
            countyStats[county].budget += Number(project.budget) || 0;
          }
        }
      });

      setRegionalData(Object.entries(countyStats)
        .filter(([county]) => county !== 'Unknown' && county.length > 2)
        .map(([county, stats]) => ({
          county,
          ...stats,
          completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total));

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Analytics & Reporting' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics & Reporting</h1>
              <p className="text-muted-foreground">Performance metrics and regional development insights</p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchAnalyticsData()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Generating Report",
                  description: "Your analytics report is being generated. Download will start shortly."
                });
                // Generate comprehensive CSV data
                const csvContent = `Analytics Report - ${getCurrentDateTime()}\n\nKPI,Value,Details\nTransparency Index,${kpis.transparencyIndex}%,"${kpis.projectsWithEscrow}/${kpis.totalProjects} projects with escrow, ${kpis.verifiedMilestones}/${kpis.totalMilestones} milestones verified"\nPayment Timeliness,${kpis.paymentTimeliness}%,"${kpis.paidMilestones}/${kpis.totalMilestones} milestones paid"\nProject Success Rate,${kpis.projectSuccessRate}%,"Projects completed on time/budget"\nCitizen Engagement,${kpis.citizenEngagement},"${kpis.totalReports} reports + ${kpis.totalVotes} votes"\nContractor Satisfaction,${kpis.contractorSatisfaction}%,"${kpis.totalRatings} ratings, avg ${kpis.avgRating}/5"\nGovernment Efficiency,${kpis.governmentEfficiency}%,"Composite: approvals, payments, completions"`;
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          <Tabs defaultValue="kpis" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="kpis">Performance KPIs</TabsTrigger>
              <TabsTrigger value="regional">Regional Insights</TabsTrigger>
            </TabsList>

            {/* KPIs Tab */}
            <TabsContent value="kpis" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Transparency Index */}
                <Card className="border-t-4 border-t-blue-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      Transparency Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{kpis.transparencyIndex}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.projectsWithEscrow}/{kpis.totalProjects} with escrow, {kpis.verifiedMilestones}/{kpis.totalMilestones} verified
                    </p>
                    <Progress value={kpis.transparencyIndex} className="mt-3 h-2" />
                  </CardContent>
                </Card>

                {/* Payment Timeliness */}
                <Card className="border-t-4 border-t-green-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      Payment Timeliness
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{kpis.paymentTimeliness}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.paidMilestones}/{kpis.totalMilestones} milestones paid
                    </p>
                    <Progress value={kpis.paymentTimeliness} className="mt-3 h-2" />
                  </CardContent>
                </Card>

                {/* Project Success Rate */}
                <Card className="border-t-4 border-t-purple-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      Project Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{kpis.projectSuccessRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Completed on time/budget</p>
                    <Progress value={kpis.projectSuccessRate} className="mt-3 h-2" />
                  </CardContent>
                </Card>

                {/* Citizen Engagement */}
                <Card className="border-t-4 border-t-orange-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      Citizen Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{kpis.citizenEngagement}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.totalReports} reports + {kpis.totalVotes} votes
                    </p>
                    {kpis.citizenEngagementTrend !== 0 && (
                      <div className={`flex items-center gap-1 mt-2 text-xs ${kpis.citizenEngagementTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {kpis.citizenEngagementTrend > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {kpis.citizenEngagementTrend > 0 ? '+' : ''}{kpis.citizenEngagementTrend}% from last 30 days
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contractor Satisfaction */}
                <Card className="border-t-4 border-t-yellow-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      Contractor Satisfaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">{kpis.contractorSatisfaction}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.totalRatings > 0 
                        ? `${kpis.totalRatings} ratings (avg ${kpis.avgRating}/5)` 
                        : 'No ratings submitted yet'}
                    </p>
                    <Progress value={kpis.contractorSatisfaction} className="mt-3 h-2" />
                  </CardContent>
                </Card>

                {/* Government Efficiency */}
                <Card className="border-t-4 border-t-teal-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-teal-600" />
                      Government Efficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-teal-600">{kpis.governmentEfficiency}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Approvals, payments & completions
                    </p>
                    <Progress value={kpis.governmentEfficiency} className="mt-3 h-2" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Regional Insights Tab */}
            <TabsContent value="regional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    County Performance Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {regionalData.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No regional data available</p>
                  ) : (
                    <div className="space-y-4">
                      {regionalData.map((region, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">{region.county}</span>
                            <Badge variant="outline">{region.total} projects</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Completion Rate</span>
                              <span>{region.completionRate}%</span>
                            </div>
                            <Progress value={region.completionRate} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center py-4">
                    Regional analytics are calculated from actual project and report data in the system.
                    As more data is collected, detailed category breakdowns will appear here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentAnalytics;
