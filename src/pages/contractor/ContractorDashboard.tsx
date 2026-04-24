import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FileText, Wallet, Clock, TrendingUp, Award, Loader2, Eye, CheckCircle, MessageSquare, BarChart3 } from 'lucide-react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ContractorLocationSettings from '@/components/contractor/ContractorLocationSettings';
import ContractorMapView from '@/components/contractor/ContractorMapView';
import { useRealtimeSubscription, REALTIME_PRESETS } from '@/hooks/useRealtimeSubscription';
import { calculateProjectProgress } from '@/utils/progressCalculation';

interface ProjectWithProgress {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  status: string | null;
  updated_at: string | null;
  progress?: number;
}

const ContractorDashboard = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeProjects: 0, completedProjects: 0, totalEarnings: 0, successRate: 0 });
  const [activeProjects, setActiveProjects] = useState<ProjectWithProgress[]>([]);

  const stableUserId = !authLoading && user?.id ? user.id : null;

  const fetchDashboardData = useCallback(async () => {
    if (!stableUserId) return;
    try {
      setLoading(true);
      const { data: projects } = await supabase.from('projects').select('*').eq('contractor_id', stableUserId);
      const projectIds = projects?.map(p => p.id) || [];
      const { data: allMilestones } = projectIds.length > 0
        ? await supabase.from('project_milestones').select('project_id, status, payment_percentage').in('project_id', projectIds)
        : { data: [] };

      const milestonesByProject = (allMilestones || []).reduce((acc, m) => {
        if (!acc[m.project_id]) acc[m.project_id] = [];
        acc[m.project_id].push(m);
        return acc;
      }, {} as Record<string, typeof allMilestones>);

      const completedProjects: typeof projects = [];
      const activeProjectsRaw: typeof projects = [];

      (projects || []).forEach(project => {
        const milestones = milestonesByProject[project.id] || [];
        const completedMilestones = milestones.filter(m => ['paid', 'verified', 'completed'].includes(m.status || '')).length;
        const isFullyCompleted = project.status === 'completed' || (milestones.length > 0 && completedMilestones === milestones.length);
        if (isFullyCompleted) completedProjects.push(project);
        else if (['in_progress', 'planning', 'active'].includes(project.status || '')) activeProjectsRaw.push(project);
      });

      const activeWithProgress: ProjectWithProgress[] = activeProjectsRaw.map(project => ({
        ...project,
        progress: calculateProjectProgress(milestonesByProject[project.id] || [])
      } as ProjectWithProgress));

      const totalEarnings = completedProjects.reduce((acc, p) => acc + (p?.budget || 0), 0);
      const { data: bidsData } = await supabase.from('contractor_bids').select('status').eq('contractor_id', stableUserId);
      const totalBids = bidsData?.length || 0;
      const acceptedBids = bidsData?.filter(b => b.status === 'accepted' || b.status === 'selected').length || 0;

      setStats({
        activeProjects: activeWithProgress.length,
        completedProjects: completedProjects.length,
        totalEarnings,
        successRate: totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0
      });
      setActiveProjects(activeWithProgress.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [stableUserId]);

  useRealtimeSubscription({
    subscriptions: REALTIME_PRESETS.contractorDashboard,
    onDataChange: fetchDashboardData,
    channelPrefix: 'contractor-dashboard',
    enabled: !!stableUserId
  });

  useEffect(() => {
    if (stableUserId) fetchDashboardData();
  }, [stableUserId, fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
    return `KES ${amount}`;
  };

  const quickActions = [
    { title: 'Browse Projects', icon: Briefcase, href: '/contractor/bidding' },
    { title: 'My Bids', icon: Eye, href: '/contractor/tracking' },
    { title: 'My Projects', icon: FileText, href: '/contractor/projects' },
    { title: 'Verification', icon: Award, href: '/contractor/verification' },
    { title: 'Bid Templates', icon: FileText, href: '/contractor/templates' },
    { title: 'Financials', icon: Wallet, href: '/contractor/financials' },
    { title: 'Quality', icon: CheckCircle, href: '/contractor/quality' },
    { title: 'Performance', icon: BarChart3, href: '/contractor/performance' },
    { title: 'System Visuals', icon: TrendingUp, href: '/visuals' },
    { title: 'Communications', icon: MessageSquare, href: '/contractor/communications' },
    { title: 'Job Postings', icon: Briefcase, href: '/contractor/jobs' },
  ];

  const displayStats = [
    { label: 'Active Projects', value: stats.activeProjects.toString(), color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Completed', value: stats.completedProjects.toString(), color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Earnings', value: formatCurrency(stats.totalEarnings), color: 'text-purple-700', bg: 'bg-purple-50' },
    { label: 'Success Rate', value: `${stats.successRate}%`, color: 'text-accent-foreground', bg: 'bg-accent/10' },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground text-sm">Loading dashboard...</span>
      </div>
    );
  }

  if (!stableUserId) return null;

  return (
    <div className="min-h-screen bg-background">
      <main>
        <ResponsiveContainer className="py-5 sm:py-8">
          <BreadcrumbNav />

          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Contractor Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your projects, bids, and track your performance.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {displayStats.map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-transparent`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Management Modules</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className="cursor-pointer hover:shadow-card-hover transition-all duration-200 group border-border/60"
                    onClick={() => navigate(action.href)}
                  >
                    <CardContent className="p-4">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5 group-hover:bg-primary/15 transition-colors">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm text-foreground">{action.title}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Location Settings */}
          <ContractorLocationSettings />

          {/* Active Projects */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">No active projects yet.</p>
                  <Button asChild size="sm"><Link to="/contractor/bidding">Browse Available Projects</Link></Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="border border-border rounded-xl p-4 hover:shadow-card-hover transition-all duration-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-foreground">{project.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{project.description?.slice(0, 60)}...</p>
                        </div>
                        <span className="font-semibold text-sm text-green-700">{formatCurrency(project.budget || 0)}</span>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{project.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated: {new Date(project.updated_at!).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">{project.status}</Badge>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" asChild><Link to="/contractor/projects">View All Projects</Link></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorDashboard;
