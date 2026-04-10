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
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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

  // Mock queries - replace with real Supabase data
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.user_type],
    queryFn: async () => {
      // Replace with actual Supabase queries
      return {
        totalReports: 1247,
        activeProjects: 89,
        pendingApprovals: 23,
        completedProjects: 156,
        totalUsers: 5432,
        monthlyGrowth: 12.5
      };
    }
  });

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
      case 'admin':
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
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
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
                  <LineChart data={mockActivityData}>
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
                  <PieChart>
                    <Pie
                      data={mockStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
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
                {[
                  { title: 'New project approved', time: '2 hours ago', type: 'success' },
                  { title: 'Contractor bid submitted', time: '4 hours ago', type: 'info' },
                  { title: 'Citizen report resolved', time: '1 day ago', type: 'success' },
                  { title: 'Payment milestone reached', time: '2 days ago', type: 'warning' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
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
                <BarChart data={mockActivityData}>
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
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        System activity #{i + 1}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Description of the activity that occurred in the system.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.floor(Math.random() * 24)} hours ago
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {['Info', 'Success', 'Warning'][Math.floor(Math.random() * 3)]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}