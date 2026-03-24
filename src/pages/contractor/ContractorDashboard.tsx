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
import { useRealtimeSubscription, REALTIME_PRESETS } from '@/hooks/useRealtimeSubscription';
import { calculateProjectProgress } from '@/utils/progressCalculation';
import RealtimeStatusIndicator from '@/components/realtime/RealtimeStatusIndicator';
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
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    successRate: 0
  });
  const [activeProjects, setActiveProjects] = useState<ProjectWithProgress[]>([]);

  // SECURITY: Only use stable user ID after auth is complete
  const stableUserId = !authLoading && user?.id ? user.id : null;

  // Memoize fetch function for real-time subscription
  const fetchDashboardData = useCallback(async () => {
    // SECURITY: Don't fetch if user not stable
    if (!stableUserId) return;
    
    try {
      setLoading(true);

      // Fetch projects with milestones to calculate accurate stats
      // SECURITY: Always filter by the authenticated user's ID
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('contractor_id', stableUserId);

      // Fetch all milestones for this contractor's projects
      const projectIds = projects?.map(p => p.id) || [];
      const { data: allMilestones } = projectIds.length > 0 ? await supabase
        .from('project_milestones')
        .select('project_id, status, payment_percentage')
        .in('project_id', projectIds) : { data: [] };

      // Group milestones by project and calculate completion
      const milestonesByProject = (allMilestones || []).reduce((acc, m) => {
        if (!acc[m.project_id]) acc[m.project_id] = [];
        acc[m.project_id].push(m);
        return acc;
      }, {} as Record<string, typeof allMilestones>);

      // A project is "completed" if:
      // 1. status is 'completed' OR
      // 2. All milestones are in paid/verified/completed status
      const completedProjects: typeof projects = [];
      const activeProjectsRaw: typeof projects = [];

      (projects || []).forEach(project => {
        const milestones = milestonesByProject[project.id] || [];
        const totalMilestones = milestones.length;
        const completedMilestones = milestones.filter(m => 
          ['paid', 'verified', 'completed'].includes(m.status || '')
        ).length;

        // Check if fully completed (all milestones done or status is completed)
        const isFullyCompleted = project.status === 'completed' || 
          (totalMilestones > 0 && completedMilestones === totalMilestones);

        if (isFullyCompleted) {
          completedProjects.push(project);
        } else if (['in_progress', 'planning', 'active'].includes(project.status || '')) {
          activeProjectsRaw.push(project);
        }
      });

      // Calculate progress for active projects using unified utility
      const activeWithProgress: ProjectWithProgress[] = activeProjectsRaw.map(project => {
        const milestones = milestonesByProject[project.id] || [];
        const calculatedProgress = calculateProjectProgress(milestones);
        return {
          ...project,
          progress: calculatedProgress
        } as ProjectWithProgress;
      });

      // Calculate total earnings from completed projects
      const totalEarnings = completedProjects.reduce((acc, p) => acc + (p?.budget || 0), 0);

      // Calculate success rate (accepted bids / total bids)
      // SECURITY: Always filter by authenticated user's ID
      const { data: bidsData } = await supabase
        .from('contractor_bids')
        .select('status')
        .eq('contractor_id', stableUserId);

      const totalBids = bidsData?.length || 0;
      const acceptedBids = bidsData?.filter(b => b.status === 'accepted' || b.status === 'selected').length || 0;

      const successRate = totalBids > 0 
        ? Math.round((acceptedBids / totalBids) * 100) 
        : 0;

      setStats({
        activeProjects: activeWithProgress.length,
        completedProjects: completedProjects.length,
        totalEarnings: totalEarnings,
        successRate: successRate
      });

      setActiveProjects(activeWithProgress.slice(0, 3)); // Show only top 3
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [stableUserId]); // SECURITY: Depend on stableUserId

  // Set up real-time subscriptions for contractor data
  useRealtimeSubscription({
    subscriptions: REALTIME_PRESETS.contractorDashboard,
    onDataChange: fetchDashboardData,
    channelPrefix: 'contractor-dashboard',
    enabled: !!stableUserId // SECURITY: Only enable when user is stable
  });

  useEffect(() => {
    if (stableUserId) {
      fetchDashboardData();
    }
  }, [stableUserId, fetchDashboardData]);


  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `KES ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `KES ${(amount / 1000).toFixed(0)}K`;
    }
    return `KES ${amount}`;
  };

  const quickActions = [
    {
      title: 'Browse Projects',
      description: 'Find and bid on available government projects',
      icon: Briefcase,
      href: '/contractor/bidding',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-600'
    },
    {
      title: 'My Bids',
      description: 'Track your submitted bids and their status',
      icon: Eye,
      href: '/contractor/tracking',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'My Projects',
      description: 'Manage your active and completed projects',
      icon: FileText,
      href: '/contractor/projects',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-600'
    },
    {
      title: 'Verification System',
      description: 'Manage credentials and verification status',
      icon: Award,
      href: '/contractor/verification',
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Bid Templates',
      description: 'Access standardized bid templates',
      icon: FileText,
      href: '/contractor/templates',
      color: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Financials',
      description: 'Escrow, payments, and financial analytics',
      icon: Wallet,
      href: '/contractor/financials',
      color: 'bg-teal-500 hover:bg-teal-600',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Quality Assurance',
      description: 'Quality checklists and compliance monitoring',
      icon: CheckCircle,
      href: '/contractor/quality',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Performance',
      description: 'Scorecard, ratings, and bid analytics',
      icon: BarChart3,
      href: '/contractor/performance',
      color: 'bg-rose-500 hover:bg-rose-600',
      iconColor: 'text-rose-600'
    },
    {
      title: 'Communications',
      description: 'Messages, notifications, and disputes',
      icon: MessageSquare,
      href: '/contractor/communications',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      iconColor: 'text-cyan-600'
    },
    {
      title: 'Job Postings',
      description: 'Manage jobs and review citizen applicants',
      icon: Briefcase,
      href: '/contractor/jobs',
      color: 'bg-amber-500 hover:bg-amber-600',
      iconColor: 'text-amber-600'
    }
  ];

  const displayStats = [
    { label: 'Active Projects', value: stats.activeProjects.toString(), icon: Briefcase, color: 'text-blue-600' },
    { label: 'Completed Projects', value: stats.completedProjects.toString(), icon: Award, color: 'text-green-600' },
    { label: 'Total Earnings', value: formatCurrency(stats.totalEarnings), icon: Wallet, color: 'text-purple-600' },
    { label: 'Success Rate', value: `${stats.successRate}%`, icon: TrendingUp, color: 'text-orange-600' }
  ];

  // SECURITY: Show loading if auth is still resolving or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading dashboard...</span>
          </div>
        </main>
      </div>
    );
  }

  // SECURITY: Don't render if user is not authenticated
  if (!stableUserId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">

      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav />
          
          {/* Welcome Header Card - Government Style */}
          <Card className="shadow-xl border-t-4 border-t-blue-600 mb-4 sm:mb-6">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                    <span className="break-words">Contractor Dashboard</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Manage your projects, bids, and track your performance.
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 flex-shrink-0">
                  Live Dashboard
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Cards - Government Style */}
          <Card className="shadow-lg mb-4 sm:mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                {displayStats.map((stat) => {
                  const bgColors: Record<string, string> = {
                    'text-blue-600': 'bg-blue-50',
                    'text-green-600': 'bg-green-50',
                    'text-purple-600': 'bg-purple-50',
                    'text-orange-600': 'bg-orange-50'
                  };
                  const textColors: Record<string, string> = {
                    'text-blue-600': 'text-blue-700',
                    'text-green-600': 'text-green-700',
                    'text-purple-600': 'text-purple-700',
                    'text-orange-600': 'text-orange-700'
                  };
                  return (
                    <div key={stat.label} className={`text-center p-4 ${bgColors[stat.color] || 'bg-gray-50'} rounded-lg`}>
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className={`text-sm ${textColors[stat.color] || 'text-gray-700'}`}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Government Button Grid Style */}
          <Card className="shadow-lg mb-6 sm:mb-8">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Management Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {quickActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={action.title}
                      onClick={() => navigate(action.href)}
                      className={`${action.color} text-white h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 text-xs`}
                    >
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                      <span className="text-center leading-tight break-words">{action.title}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <ContractorLocationSettings />

          {/* Active Projects */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No active projects yet.</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Browse available projects and submit bids to get started.</p>
                  <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700" size={isMobile ? "sm" : "default"}>
                    <Link to="/contractor/bidding">Browse Available Projects</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{project.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">{project.description?.slice(0, 50)}...</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-green-600 text-sm sm:text-base">
                            {formatCurrency(project.budget || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span>Progress</span>
                          <span>{project.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm gap-2">
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Updated: {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 self-start sm:self-center">
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Button variant="outline" asChild size={isMobile ? "sm" : "default"}>
                      <Link to="/contractor/projects">View All Projects</Link>
                    </Button>
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