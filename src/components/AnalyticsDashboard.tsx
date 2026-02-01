import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSystemAnalytics } from '@/hooks/useSystemAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Users, FileText, CheckCircle, Clock, AlertTriangle, Eye, Target, Zap, RefreshCw, Star } from 'lucide-react';
import { isProjectEffectivelyCompleted } from '@/utils/progressCalculation';
import { formatDateTime, getCurrentDateTime } from '@/lib/dateUtils';
import { getContractorSatisfactionMetrics } from '@/utils/contractorRatingCalculation';

interface RealTimeKPIs {
  transparencyIndex: number;
  avgPaymentTime: string;
  projectSuccessRate: number;
  citizenEngagement: string;
  totalReports: number;
  approvedProjects: number;
  activeContractors: number;
  pendingPayments: number;
  contractorSatisfaction: number;
  avgRating: number;
  totalRatings: number;
}

const AnalyticsDashboard = () => {
  const { analytics, loading: analyticsLoading, getLatestMetric, calculateTrend } = useSystemAnalytics();
  const [realTimeKPIs, setRealTimeKPIs] = useState<RealTimeKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchRealTimeKPIs();
  }, []);

  const fetchRealTimeKPIs = async () => {
    try {
      // Fetch all data in parallel for accurate real-time KPIs
      const [projectsRes, reportsRes, milestonesRes, escrowsRes, paymentsRes, contractorsRes, satisfactionMetrics] = await Promise.all([
        supabase.from('projects').select('id, status, contractor_id'),
        supabase.from('problem_reports').select('id, status'),
        supabase.from('project_milestones').select('id, status, project_id'),
        supabase.from('escrow_accounts').select('id, project_id'),
        supabase.from('payment_transactions').select('id, status, created_at'),
        supabase.from('skills_profiles').select('id, available_for_work'),
        getContractorSatisfactionMetrics() // Get REAL ratings from verifications, not empty table
      ]);

      const projects = projectsRes.data || [];
      const reports = reportsRes.data || [];
      const milestones = milestonesRes.data || [];
      const escrows = escrowsRes.data || [];
      const payments = paymentsRes.data || [];
      const contractors = contractorsRes.data || [];

      // Calculate Transparency Index (projects with escrow + verified milestones)
      const projectsWithEscrow = new Set(escrows.map(e => e.project_id)).size;
      const verifiedMilestones = milestones.filter(m => 
        m.status === 'verified' || m.status === 'paid' || m.status === 'completed'
      ).length;
      const totalMilestones = milestones.length || 1;
      const totalProjects = projects.length || 1;
      const transparencyIndex = Math.round(
        ((projectsWithEscrow / totalProjects) * 50) + ((verifiedMilestones / totalMilestones) * 50)
      );

      // Calculate Average Payment Time (simplified - based on completed payments ratio)
      const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'success').length;
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const avgPaymentTime = pendingPayments === 0 && completedPayments > 0 
        ? 'Immediate' 
        : pendingPayments > 0 
          ? `${pendingPayments} pending`
          : 'No data';

      // Calculate Project Success Rate - using milestone-based completion
      const milestonesByProject: Record<string, {status: string}[]> = {};
      milestones.forEach(m => {
        if (!milestonesByProject[m.project_id]) {
          milestonesByProject[m.project_id] = [];
        }
        milestonesByProject[m.project_id].push({ status: m.status });
      });
      
      const completedProjects = projects.filter(p => 
        isProjectEffectivelyCompleted(p.status, milestonesByProject[p.id] || [])
      ).length;
      const projectsWithContractors = projects.filter(p => p.contractor_id).length;
      const projectSuccessRate = projectsWithContractors > 0 
        ? Math.round((completedProjects / projectsWithContractors) * 100) 
        : 0;

      // Citizen Engagement Level
      const activeReports = reports.filter(r => 
        r.status !== 'completed' && r.status !== 'rejected'
      ).length;
      const citizenEngagement = reports.length > 10 
        ? 'High' 
        : reports.length > 5 
          ? 'Medium' 
          : reports.length > 0 
            ? 'Growing'
            : 'Low';

      // Count active contractors
      const activeContractors = contractors.filter(c => c.available_for_work).length;

      // Approved projects (with approved status or beyond)
      const approvedProjects = reports.filter(r => 
        r.status === 'approved' || r.status === 'bidding_open' || 
        r.status === 'contractor_selected' || r.status === 'completed'
      ).length;

      // Calculate contractor satisfaction from REAL verification ratings
      const contractorSatisfaction = satisfactionMetrics.totalRatings > 0
        ? Math.round((satisfactionMetrics.averageRating / 5) * 100)
        : 0;

      setRealTimeKPIs({
        transparencyIndex: Math.min(transparencyIndex, 100),
        avgPaymentTime,
        projectSuccessRate: Math.min(projectSuccessRate, 100),
        citizenEngagement,
        totalReports: reports.length,
        approvedProjects,
        activeContractors,
        pendingPayments,
        contractorSatisfaction,
        avgRating: Math.round(satisfactionMetrics.averageRating * 10) / 10,
        totalRatings: satisfactionMetrics.totalRatings
      });
      setLastUpdated(getCurrentDateTime());
    } catch (error) {
      console.error('Error fetching real-time KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Reports',
      value: realTimeKPIs?.totalReports || getLatestMetric('total_reports')?.metric_value || 0,
      trend: calculateTrend('total_reports'),
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Approved Projects',
      value: realTimeKPIs?.approvedProjects || getLatestMetric('approved_projects')?.metric_value || 0,
      trend: calculateTrend('approved_projects'),
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Active Contractors',
      value: realTimeKPIs?.activeContractors || getLatestMetric('active_contractors')?.metric_value || 0,
      trend: calculateTrend('active_contractors'),
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Pending Payments',
      value: realTimeKPIs?.pendingPayments || getLatestMetric('pending_payments')?.metric_value || 0,
      trend: calculateTrend('pending_payments'),
      icon: Clock,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Government Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time performance indicators calculated from actual system data
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">Last updated: {lastUpdated}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => { setLoading(true); fetchRealTimeKPIs(); }} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend > 0;
          const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${getColorClasses(kpi.color)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {kpi.trend !== 0 && (
                    <div className="flex items-center text-sm">
                      <TrendIcon 
                        className={`h-4 w-4 mr-1 ${
                          isPositiveTrend ? 'text-green-600' : 'text-red-600'
                        }`} 
                      />
                      <span className={isPositiveTrend ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(kpi.trend).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold">{kpi.value.toLocaleString()}</h3>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Transparency Index</span>
                <Badge variant="outline">{realTimeKPIs?.transparencyIndex || 0}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Payment Status</span>
                <Badge variant="outline">{realTimeKPIs?.avgPaymentTime || 'No data'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Project Success Rate</span>
                <Badge variant="outline">{realTimeKPIs?.projectSuccessRate || 0}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Citizen Engagement</span>
                <Badge variant="outline">{realTimeKPIs?.citizenEngagement || 'Low'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Contractor Satisfaction
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {realTimeKPIs?.contractorSatisfaction || 0}%
                  </Badge>
                  {(realTimeKPIs?.totalRatings || 0) > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({realTimeKPIs?.avgRating}/5 from {realTimeKPIs?.totalRatings} ratings)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recent Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.length > 0 ? (
                analytics.slice(0, 5).map((metric, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{metric.metric_name.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(metric.metric_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{metric.metric_value}</p>
                      <Badge variant="outline" className="text-xs">
                        {metric.category}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Historical metrics will appear as data accumulates
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {analytics.length === 0 && !realTimeKPIs && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No analytics data available</h3>
          <p className="text-muted-foreground">
            Analytics will be populated as the system is used
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;