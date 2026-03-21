import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Database, TrendingUp, MapPin, Wallet, Users, Calendar, BarChart3, PieChart as PieChartIcon, Shield, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getContractorSatisfactionMetrics } from '@/utils/contractorRatingCalculation';

interface CountyData {
  county: string;
  projectCount: number;
  completedCount: number;
  totalBudget: number;
  releasedAmount: number;
  completionRate: number;
}

interface CategoryData {
  name: string;
  count: number;
  budget: number;
}

const KenyaOpenDataIntegration = () => {
  const [loading, setLoading] = useState(true);
  const [countyData, setCountyData] = useState<CountyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [platformStats, setPlatformStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    releasedAmount: 0,
    totalContractors: 0,
    verifiedContractors: 0,
    citizenSatisfaction: 0,
    averageCompletionRate: 0
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);

      // Fetch all projects with their reports and escrow data
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id, status, budget,
          report_id
        `);

      // Fetch report details for location data
      const { data: reports } = await supabase
        .from('problem_reports')
        .select('id, location, category');

      // Fetch escrow data
      const { data: escrows } = await supabase
        .from('escrow_accounts')
        .select('project_id, total_amount, released_amount');

      // Fetch milestone data for completion calculation
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('project_id, status');

      // Fetch contractor data
      const { data: contractors } = await supabase
        .from('contractor_profiles')
        .select('id, verified');

      // Get real satisfaction metrics
      const satisfactionMetrics = await getContractorSatisfactionMetrics();

      // Build report location map
      const reportMap = new Map((reports || []).map(r => [r.id, r]));
      
      // Build escrow map
      const escrowMap = new Map((escrows || []).map(e => [e.project_id, e]));
      
      // Build milestone map for completion calculation
      const milestonesByProject = new Map<string, { total: number; completed: number }>();
      (milestones || []).forEach(m => {
        const current = milestonesByProject.get(m.project_id) || { total: 0, completed: 0 };
        current.total++;
        if (['verified', 'completed', 'paid'].includes(m.status)) {
          current.completed++;
        }
        milestonesByProject.set(m.project_id, current);
      });

      // Calculate county-level statistics from REAL data
      const countyStats = new Map<string, CountyData>();
      const categoryStats = new Map<string, CategoryData>();

      (projects || []).forEach(project => {
        const report = reportMap.get(project.report_id);
        const escrow = escrowMap.get(project.id);
        const milestonesInfo = milestonesByProject.get(project.id);
        
        // Extract county from location (format: "Ward, Constituency, County")
        const location = report?.location || 'Unknown';
        const parts = location.split(',').map((p: string) => p.trim());
        const county = parts[parts.length - 1] || 'Unknown';
        
        // Calculate if project is completed
        const isCompleted = project.status === 'completed' || 
          (milestonesInfo && milestonesInfo.total > 0 && milestonesInfo.completed === milestonesInfo.total);

        // Aggregate county data
        const existing = countyStats.get(county) || {
          county,
          projectCount: 0,
          completedCount: 0,
          totalBudget: 0,
          releasedAmount: 0,
          completionRate: 0
        };
        
        existing.projectCount++;
        if (isCompleted) existing.completedCount++;
        existing.totalBudget += project.budget || 0;
        existing.releasedAmount += escrow?.released_amount || 0;
        
        countyStats.set(county, existing);

        // Aggregate category data
        const category = report?.category || 'Other';
        const categoryExisting = categoryStats.get(category) || {
          name: category,
          count: 0,
          budget: 0
        };
        categoryExisting.count++;
        categoryExisting.budget += project.budget || 0;
        categoryStats.set(category, categoryExisting);
      });

      // Calculate completion rates
      countyStats.forEach((data, county) => {
        data.completionRate = data.projectCount > 0 
          ? Math.round((data.completedCount / data.projectCount) * 100)
          : 0;
        countyStats.set(county, data);
      });

      // Sort county data by project count
      const sortedCountyData = Array.from(countyStats.values())
        .filter(c => c.county !== 'Unknown')
        .sort((a, b) => b.projectCount - a.projectCount)
        .slice(0, 10);

      // Sort category data
      const sortedCategoryData = Array.from(categoryStats.values())
        .sort((a, b) => b.count - a.count);

      // Calculate platform-wide stats
      const totalProjects = (projects || []).length;
      const completedProjects = (projects || []).filter(p => {
        const milestonesInfo = milestonesByProject.get(p.id);
        return p.status === 'completed' || 
          (milestonesInfo && milestonesInfo.total > 0 && milestonesInfo.completed === milestonesInfo.total);
      }).length;
      const totalBudget = (projects || []).reduce((sum, p) => sum + (p.budget || 0), 0);
      const releasedAmount = (escrows || []).reduce((sum, e) => sum + (e.released_amount || 0), 0);
      const totalContractors = (contractors || []).length;
      const verifiedContractors = (contractors || []).filter(c => c.verified).length;

      setPlatformStats({
        totalProjects,
        completedProjects,
        totalBudget,
        releasedAmount,
        totalContractors,
        verifiedContractors,
        citizenSatisfaction: satisfactionMetrics.totalRatings > 0 
          ? Math.round((satisfactionMetrics.averageRating / 5) * 100) 
          : 0,
        averageCompletionRate: totalProjects > 0 
          ? Math.round((completedProjects / totalProjects) * 100)
          : 0
      });

      setCountyData(sortedCountyData);
      setCategoryData(sortedCategoryData);
    } catch (error) {
      console.error('Error fetching platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading platform benchmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-primary">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center text-2xl">
            <Database className="h-6 w-6 mr-3 text-primary" />
            Platform Performance Benchmarks
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Real-time performance metrics from the Infrastructure Transparency Platform
          </p>
        </CardHeader>
      </Card>

      {/* Platform Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-lg">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{platformStats.totalProjects}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{platformStats.averageCompletionRate}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{formatAmount(platformStats.totalBudget)}</div>
            <div className="text-sm text-muted-foreground">Total Budget</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">
              {platformStats.citizenSatisfaction > 0 
                ? `${platformStats.citizenSatisfaction}%` 
                : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Citizen Satisfaction</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="counties" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card shadow-lg">
          <TabsTrigger value="counties">County Performance</TabsTrigger>
          <TabsTrigger value="categories">Sector Analysis</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="counties" className="space-y-6">
          {countyData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No county data available yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  County benchmarks will appear as projects are created with location data
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Projects by County</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={countyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="county" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'totalBudget' ? formatAmount(Number(value)) : value,
                          name === 'projectCount' ? 'Projects' :
                          name === 'completedCount' ? 'Completed' :
                          name === 'completionRate' ? 'Completion Rate %' :
                          name
                        ]}
                      />
                      <Bar dataKey="projectCount" fill="hsl(var(--primary))" name="projectCount" />
                      <Bar dataKey="completedCount" fill="hsl(var(--chart-2))" name="completedCount" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>County Completion Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {countyData.map((county) => (
                      <div key={county.county} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{county.county}</span>
                          <span>
                            {county.completedCount}/{county.projectCount} projects ({county.completionRate}%)
                          </span>
                        </div>
                        <Progress value={county.completionRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {categoryData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No category data available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Project Distribution by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Budget by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.map((category, index) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span>{category.name}</span>
                          </div>
                          <span className="font-medium">{formatAmount(category.budget)}</span>
                        </div>
                        <Progress 
                          value={(category.budget / Math.max(...categoryData.map(c => c.budget))) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">Project Completion Rate</h3>
                    <Badge variant={platformStats.averageCompletionRate >= 70 ? 'default' : 'secondary'}>
                      {platformStats.averageCompletionRate >= 70 ? 'On Track' : 'Needs Attention'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{platformStats.averageCompletionRate}%</div>
                      <div className="text-xs text-muted-foreground">Current</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">70%</div>
                      <div className="text-xs text-muted-foreground">Target</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">Budget Utilization</h3>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{formatAmount(platformStats.releasedAmount)}</div>
                      <div className="text-xs text-muted-foreground">Released</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatAmount(platformStats.totalBudget)}</div>
                      <div className="text-xs text-muted-foreground">Total Budget</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">Contractor Verification</h3>
                    <Badge variant={platformStats.verifiedContractors > 0 ? 'default' : 'secondary'}>
                      {platformStats.totalContractors > 0 
                        ? `${Math.round((platformStats.verifiedContractors / platformStats.totalContractors) * 100)}%`
                        : 'N/A'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{platformStats.verifiedContractors}</div>
                      <div className="text-xs text-muted-foreground">Verified</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{platformStats.totalContractors}</div>
                      <div className="text-xs text-muted-foreground">Total Registered</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">Citizen Satisfaction</h3>
                    <Badge variant={platformStats.citizenSatisfaction >= 70 ? 'default' : 'secondary'}>
                      {platformStats.citizenSatisfaction > 0 
                        ? (platformStats.citizenSatisfaction >= 70 ? 'Good' : 'Needs Improvement')
                        : 'No Data'}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {platformStats.citizenSatisfaction > 0 
                        ? `${platformStats.citizenSatisfaction}%` 
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Based on citizen milestone verifications
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-semibold">Platform Database</div>
                  <div className="text-sm text-muted-foreground">Real-time project and transaction data</div>
                </div>
                <div className="text-center p-4 bg-green-500/5 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-semibold">Milestone Verifications</div>
                  <div className="text-sm text-muted-foreground">Citizen-verified progress data</div>
                </div>
                <div className="text-center p-4 bg-purple-500/5 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-semibold">Live Metrics</div>
                  <div className="text-sm text-muted-foreground">Updated on each page load</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KenyaOpenDataIntegration;
