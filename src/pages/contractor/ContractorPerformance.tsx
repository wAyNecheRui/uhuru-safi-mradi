import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, Award, BarChart3, Target, Clock, Star, 
  ThumbsUp, Wallet, Users, Loader2, PieChart, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isProjectEffectivelyCompleted } from '@/utils/progressCalculation';
import { fetchContractorRatingsFromVerifications } from '@/utils/contractorRatingCalculation';

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
}

interface BidAnalytics {
  totalBids: number;
  wonBids: number;
  lostBids: number;
  pendingBids: number;
  winRate: number;
  avgBidAmount: number;
}

const ContractorPerformance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [bidAnalytics, setBidAnalytics] = useState<BidAnalytics>({
    totalBids: 0, wonBids: 0, lostBids: 0, pendingBids: 0, winRate: 0, avgBidAmount: 0
  });
  const [ratings, setRatings] = useState<any[]>([]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Performance Analytics' }
  ];

  useEffect(() => {
    if (user) fetchPerformanceData();
  }, [user]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const { data: bids } = await supabase.from('contractor_bids').select('id, bid_amount, status').eq('contractor_id', user?.id);
      const realRatingsData = await fetchContractorRatingsFromVerifications([user?.id || '']);
      const myRealRatings = realRatingsData[user?.id || ''];
      const { data: projects } = await supabase.from('projects').select('id, status, budget, created_at, updated_at').eq('contractor_id', user?.id);
      const projectIds = projects?.map(p => p.id) || [];
      const { data: milestones } = projectIds.length > 0 ? await supabase.from('project_milestones').select('project_id, status').in('project_id', projectIds) : { data: [] };

      const milestonesByProject: Record<string, {status: string}[]> = {};
      (milestones || []).forEach(m => {
        if (!milestonesByProject[m.project_id]) milestonesByProject[m.project_id] = [];
        milestonesByProject[m.project_id].push({ status: m.status });
      });

      const totalBids = bids?.length || 0;
      const wonBids = bids?.filter(b => b.status === 'selected').length || 0;
      const lostBids = bids?.filter(b => b.status === 'rejected' || b.status === 'not_selected').length || 0;
      const pendingBids = bids?.filter(b => b.status === 'submitted' || b.status === 'under_review').length || 0;
      const avgBidAmount = bids?.reduce((sum, b) => sum + (b.bid_amount || 0), 0) / (totalBids || 1);

      setBidAnalytics({ totalBids, wonBids, lostBids, pendingBids, winRate: totalBids > 0 ? (wonBids / totalBids) * 100 : 0, avgBidAmount });

      const completedProjects = projects?.filter(p => isProjectEffectivelyCompleted(p.status, milestonesByProject[p.id] || [])) || [];
      const avgRating = myRealRatings?.averageRating || 0;
      const totalRatingCount = myRealRatings?.totalRatings || 0;
      const satisfactionScore = avgRating > 0 ? Math.round((avgRating / 5) * 100) : 0;
      const projectCompletionRate = projects?.length ? (completedProjects.length / projects.length) * 100 : 0;
      const timelinessScore = totalRatingCount > 0 ? Math.round((satisfactionScore * 0.7) + (projectCompletionRate * 0.3)) : 0;
      const qualityScore = satisfactionScore;
      const costScore = completedProjects.length > 0 ? Math.round(projectCompletionRate) : 0;

      const performanceMetrics: PerformanceMetric[] = [
        { name: 'Timeliness', value: timelinessScore, target: 90, trend: timelinessScore >= 70 ? 'up' : 'stable' },
        { name: 'Quality', value: qualityScore, target: 85, trend: qualityScore >= 70 ? 'up' : 'stable' },
        { name: 'Cost Control', value: costScore, target: 80, trend: costScore >= 70 ? 'up' : 'stable' },
        { name: 'Community Satisfaction', value: satisfactionScore, target: 80, trend: satisfactionScore >= 70 ? 'up' : 'stable' },
      ];

      setMetrics(performanceMetrics);
      const displayRatings = myRealRatings?.ratings?.map(r => ({
        rating: r.rating,
        source: r.source === 'milestone_verification' ? 'Milestone Verification' : 'Quality Review',
        date: r.date,
        projectId: r.projectId
      })) || [];
      setRatings(displayRatings);

      const metricsWithData = performanceMetrics.filter(m => m.value > 0);
      const overall = metricsWithData.length > 0 ? metricsWithData.reduce((sum, m) => sum + m.value, 0) / metricsWithData.length : 0;
      setOverallScore(Math.round(overall));
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-warning-foreground';
    return 'text-destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-destructive rotate-180" />;
      default: return <span className="h-4 w-4 text-muted-foreground">—</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading performance data...</span>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ResponsiveContainer className="py-5 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </div>
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-1">Performance Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your performance metrics, bid success rate, and contractor scorecard.</p>
          </div>

          {/* Overall Score */}
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="text-center md:text-left">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1">Overall Performance Score</h2>
                  <p className="text-xs text-muted-foreground">Based on timeliness, quality, cost control, and satisfaction</p>
                </div>
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-[6px] border-muted flex items-center justify-center">
                    <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
                  </div>
                  <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Award className="h-6 w-6 text-accent mx-auto mb-1" />
                    <p className="text-xl font-bold text-foreground">{bidAnalytics.wonBids}</p>
                    <p className="text-xs text-muted-foreground">Projects Won</p>
                  </div>
                  <div>
                    <Star className="h-6 w-6 text-accent mx-auto mb-1" />
                    <p className="text-xl font-bold text-foreground">{ratings.length > 0 ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1) : 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="scorecard" className="space-y-5">
            <TabsList className="w-full bg-muted/50 flex-wrap h-auto p-1 rounded-xl">
              <TabsTrigger value="scorecard" className="text-xs sm:text-sm rounded-lg">Scorecard</TabsTrigger>
              <TabsTrigger value="bids" className="text-xs sm:text-sm rounded-lg">Bid Analytics</TabsTrigger>
              <TabsTrigger value="benchmarks" className="text-xs sm:text-sm rounded-lg">Benchmarks</TabsTrigger>
              <TabsTrigger value="ratings" className="text-xs sm:text-sm rounded-lg">Ratings</TabsTrigger>
            </TabsList>

            <TabsContent value="scorecard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric) => (
                  <Card key={metric.name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm font-semibold">
                        <span>{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-3 mb-3">
                        <span className={`text-3xl font-bold ${getScoreColor(metric.value)}`}>{metric.value}%</span>
                        <span className="text-xs text-muted-foreground mb-1">Target: {metric.target}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                      <div className="mt-2 text-xs text-muted-foreground">
                        {metric.value >= metric.target
                          ? `✓ Exceeds target by ${metric.value - metric.target}%`
                          : `↑ ${metric.target - metric.value}% to reach target`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold">
                    <Target className="h-4 w-4 mr-2 text-primary" />Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.map((metric, index) => {
                      const weights = [40, 30, 20, 10];
                      const weight = weights[index] || 10;
                      const actualScore = Math.round((metric.value / 100) * weight);
                      const icons = [Clock, Star, Wallet, ThumbsUp];
                      const Icon = icons[index] || ThumbsUp;
                      return (
                        <div key={metric.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-foreground">{metric.name} ({weight}%)</p>
                              <p className="text-xs text-muted-foreground">
                                {index === 0 && 'On-time project completion rate'}
                                {index === 1 && 'Work quality and standards compliance'}
                                {index === 2 && 'Budget adherence and efficiency'}
                                {index === 3 && 'Citizen feedback and ratings'}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-primary">{actualScore}/{weight}</span>
                        </div>
                      );
                    })}
                    {metrics.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Complete projects to see your score breakdown</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bids" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Bids', value: bidAnalytics.totalBids, icon: BarChart3, color: 'text-primary' },
                  { label: 'Won', value: bidAnalytics.wonBids, icon: Award, color: 'text-success' },
                  { label: 'Pending', value: bidAnalytics.pendingBids, icon: Clock, color: 'text-warning-foreground' },
                  { label: 'Win Rate', value: `${bidAnalytics.winRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-accent-foreground' },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 text-center">
                      <s.icon className={`h-6 w-6 ${s.color} mx-auto mb-2`} />
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold">
                    <PieChart className="h-4 w-4 mr-2 text-primary" />Bid Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Won', value: bidAnalytics.wonBids, total: bidAnalytics.totalBids, color: 'bg-success' },
                      { label: 'Pending', value: bidAnalytics.pendingBids, total: bidAnalytics.totalBids, color: 'bg-warning' },
                      { label: 'Lost', value: bidAnalytics.lostBids, total: bidAnalytics.totalBids, color: 'bg-destructive' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-foreground">{item.value} / {item.total}</span>
                        </div>
                        <Progress value={item.total > 0 ? (item.value / item.total) * 100 : 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground">Average Bid Amount</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(bidAnalytics.avgBidAmount)}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="benchmarks" className="space-y-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-sm mb-1">Benchmarks Coming Soon</h3>
                  <p className="text-xs text-muted-foreground">Compare your performance with industry averages once more data is available.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ratings" className="space-y-4">
              {ratings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">No Ratings Yet</h3>
                    <p className="text-xs text-muted-foreground">Complete milestones to receive citizen verification ratings.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {ratings.map((rating, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                              <Star className="h-4 w-4 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-foreground">{rating.source}</p>
                              <p className="text-xs text-muted-foreground">{new Date(rating.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < Math.floor(rating.rating) ? 'text-accent' : 'text-muted-foreground/30'}`}>★</span>
                            ))}
                            <span className="ml-1 text-sm font-bold text-foreground">{rating.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorPerformance;
