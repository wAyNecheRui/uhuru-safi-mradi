import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Shield,
  FolderOpen
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

// Mock data - replace with real Supabase queries
const mockActivityData = [
  { name: 'Jan', reports: 65, projects: 28 },
  { name: 'Feb', reports: 59, projects: 32 },
  { name: 'Mar', reports: 80, projects: 41 },
  { name: 'Apr', reports: 81, projects: 35 },
  { name: 'May', reports: 56, projects: 49 },
  { name: 'Jun', reports: 55, projects: 62 },
];

const mockStatusData = [
  { name: 'Pending', value: 35, color: '#f59e0b' },
  { name: 'In Progress', value: 45, color: '#3b82f6' },
  { name: 'Completed', value: 20, color: '#10b981' },
];

const COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend && (
            <span className={`inline-flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% from last month
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function ModernDashboard() {
  const { user } = useAuth();
  const [date, setDate] = React.useState<DateRange | undefined>();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-visuals-real', user?.user_type, date],
    queryFn: async () => {
      // Fetch projects
      const { data: projectsResult } = await supabase.from('projects').select('id, status, created_at, title');
      // Fetch reports
      const { data: reportsResult } = await supabase.from('problem_reports').select('id, status, created_at, title, category');
      // Fetch bids
      const { data: bidsResult } = await supabase.from('contractor_bids').select('id, status, created_at');
      // Fetch users
      // Use a valid table, or just static depending on what defines a "user_count" here.
      // E.g., const { count: usersCount } = await supabase.from('citizen_workers').select('*', { count: 'exact', head: true });
      const usersCount = 0;

      let safeProjects = projectsResult || [];
      let safeReports = reportsResult || [];
      let safeBids = bidsResult || [];

      // Apply Optional Date Range Filter
      if (date?.from || date?.to) {
        const fromTime = date.from ? new Date(date.from).getTime() : 0;
        // set 'to' time boundary at the end of the day if from/to are provided
        const toTime = date.to
          ? new Date(new Date(date.to).setHours(23, 59, 59, 999)).getTime()
          : Infinity;

        safeProjects = safeProjects.filter(p => {
          if (!p.created_at) return true;
          const time = new Date(p.created_at).getTime();
          return time >= fromTime && time <= toTime;
        });

        safeReports = safeReports.filter(r => {
          if (!r.created_at) return true;
          const time = new Date(r.created_at).getTime();
          return time >= fromTime && time <= toTime;
        });

        safeBids = safeBids.filter(b => {
          if (!b.created_at) return true;
          const time = new Date(b.created_at).getTime();
          return time >= fromTime && time <= toTime;
        });
      }

      // Calculate stats
      const totalReports = safeReports.length;
      const activeProjects = safeProjects.filter(p => ['in_progress', 'active'].includes(p.status || '')).length;
      const completedProjects = safeProjects.filter(p => ['completed', 'verified'].includes(p.status || '')).length;
      const pendingApprovals = safeBids.filter(b => ['pending', 'submitted'].includes(b.status || '')).length;
      const totalUsers = usersCount || 0;

      // Group projects by status for PieChart
      let statusPending = 0;
      let statusInProgress = 0;
      let statusCompleted = 0;

      safeProjects.forEach(p => {
        const s = p.status?.toLowerCase() || '';
        if (s.includes('complet') || s.includes('verif')) statusCompleted++;
        else if (s.includes('progress') || s.includes('activ')) statusInProgress++;
        else statusPending++; // planning, pending, etc.
      });

      const statusData = [
        { name: 'Pending/Planning', value: statusPending, color: '#f59e0b' },
        { name: 'In Progress', value: statusInProgress, color: '#3b82f6' },
        { name: 'Completed', value: statusCompleted, color: '#10b981' },
      ].filter(item => item.value > 0);

      // Group by month for ActivityData (last 6 months)
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          name: d.toLocaleString('default', { month: 'short' }),
          month: d.getMonth(),
          year: d.getFullYear(),
          reports: 0,
          projects: 0
        });
      }

      safeReports.forEach(r => {
        if (!r.created_at) return;
        const d = new Date(r.created_at);
        const match = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
        if (match) match.reports++;
      });

      safeProjects.forEach(p => {
        if (!p.created_at) return;
        const d = new Date(p.created_at);
        const match = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
        if (match) match.projects++;
      });

      const activityData = months.map(m => ({ name: m.name, reports: m.reports, projects: m.projects }));

      // Recent Activity Feed
      const recentFeed: any[] = [];
      safeProjects.slice(0, 20).forEach(p => {
        recentFeed.push({
          title: `Project: ${p.title || 'Unknown'} updated to ${p.status}`,
          time: p.created_at,
          type: p.status === 'completed' ? 'success' : 'info',
          source: 'project'
        });
      });
      safeReports.slice(0, 20).forEach(r => {
        recentFeed.push({
          title: `Report: ${r.title || r.category || 'Issue'} is ${r.status}`,
          time: r.created_at,
          type: r.status === 'resolved' ? 'success' : 'warning',
          source: 'report'
        });
      });

      // Sort descending
      recentFeed.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

      const formattedFeed = recentFeed.slice(0, 10).map(f => {
        const hours = Math.floor((Date.now() - new Date(f.time!).getTime()) / (1000 * 60 * 60));
        let timeStr = hours < 1 ? 'Just now' : hours < 24 ? `${hours} hours ago` : `${Math.floor(hours / 24)} days ago`;
        return { ...f, timeStr };
      });

      return {
        stats: { totalReports, activeProjects, pendingApprovals, completedProjects, totalUsers, monthlyGrowth: 0 },
        statusData: statusData.length > 0 ? statusData : mockStatusData,
        activityData: activityData,
        recentFeed: formattedFeed
      };
    }
  });

  const stats = dashboardData?.stats;
  const currentActivityData = dashboardData?.activityData || mockActivityData;
  const currentStatusData = dashboardData?.statusData || mockStatusData;
  const currentRecentFeed = dashboardData?.recentFeed || [];


  const getStatsForRole = () => {
    const baseStats = stats || {
      totalReports: 0,
      activeProjects: 0,
      pendingApprovals: 0,
      completedProjects: 0,
      totalUsers: 0,
      monthlyGrowth: 0
    };

    switch (user?.user_type) {
      case 'citizen':
        return [
          {
            title: 'My Reports',
            value: baseStats.totalReports,
            description: 'Issues reported this month',
            icon: FileText,
            trend: { value: 8.2, isPositive: true }
          },
          {
            title: 'Active Projects',
            value: baseStats.activeProjects,
            description: 'Projects in your area',
            icon: MapPin,
            trend: { value: 4.1, isPositive: true }
          },
          {
            title: 'Community Votes',
            value: 89,
            description: 'Your voting participation',
            icon: Users,
            trend: { value: 2.3, isPositive: true }
          },
          {
            title: 'Transparency Score',
            value: '94%',
            description: 'Project transparency rating',
            icon: Shield,
            trend: { value: 1.2, isPositive: true }
          }
        ];

      case 'contractor':
        return [
          {
            title: 'Active Bids',
            value: baseStats.pendingApprovals,
            description: 'Bids awaiting approval',
            icon: FileText,
            trend: { value: 15.3, isPositive: true }
          },
          {
            title: 'Won Projects',
            value: baseStats.completedProjects,
            description: 'Successfully completed',
            icon: CheckCircle,
            trend: { value: 7.8, isPositive: true }
          },
          {
            title: 'Current Projects',
            value: baseStats.activeProjects,
            description: 'Projects in progress',
            icon: Activity,
            trend: { value: 3.2, isPositive: false }
          },
          {
            title: 'Monthly Revenue',
            value: '$127,450',
            description: 'This month\'s earnings',
            icon: DollarSign,
            trend: { value: 12.5, isPositive: true }
          }
        ];

      case 'government':
        return [
          {
            title: 'Total Projects',
            value: baseStats.activeProjects + baseStats.completedProjects,
            description: 'Active and completed',
            icon: FolderOpen,
            trend: { value: 6.7, isPositive: true }
          },
          {
            title: 'Pending Approvals',
            value: baseStats.pendingApprovals,
            description: 'Awaiting review',
            icon: Clock,
            trend: { value: 2.1, isPositive: false }
          },
          {
            title: 'Citizen Reports',
            value: baseStats.totalReports,
            description: 'This month',
            icon: AlertTriangle,
            trend: { value: 9.4, isPositive: true }
          },
          {
            title: 'System Users',
            value: baseStats.totalUsers.toLocaleString(),
            description: 'Registered users',
            icon: Users,
            trend: { value: 4.2, isPositive: true }
          }
        ];

      default:
        return [];
    }
  };

  const statsCards = getStatsForRole();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || 'User'}
        </h2>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal" id="date-range-picker">
                <Calendar className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    `${formatDate(date.from)} - ${formatDate(date.to)}`
                  ) : (
                    formatDate(date.from)
                  )
                ) : (
                  <span>View Calendar</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarUI
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>
                  Monthly reports and projects activity
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={currentActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="reports"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Reports"
                    />
                    <Line
                      type="monotone"
                      dataKey="projects"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Projects"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>
                  Current project distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsPieChart>
                    <Pie
                      data={currentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {currentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentRecentFeed.length > 0 ? currentRecentFeed.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.timeStr}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No recent activity found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={currentActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reports" fill="#3b82f6" name="Reports" />
                  <Bar dataKey="projects" fill="#10b981" name="Projects" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Real-time updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentRecentFeed.length > 0 ? currentRecentFeed.map((activity, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'success' ? 'bg-green-100' :
                      activity.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                      <Activity className={`w-4 h-4 ${activity.type === 'success' ? 'text-green-600' :
                        activity.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.timeStr}
                      </p>
                    </div>
                    <Badge variant={activity.type === 'success' ? 'default' : 'secondary'} className={activity.type === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {activity.source === 'project' ? 'Project' : 'Report'}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground p-4">No system activity available to display.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}