import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemAnalytics } from '@/hooks/useSystemAnalytics';
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const AnalyticsDashboard = () => {
  const { analytics, loading, getLatestMetric, calculateTrend } = useSystemAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Reports',
      value: getLatestMetric('total_reports')?.metric_value || 0,
      trend: calculateTrend('total_reports'),
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Approved Projects',
      value: getLatestMetric('approved_projects')?.metric_value || 0,
      trend: calculateTrend('approved_projects'),
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Active Contractors',
      value: getLatestMetric('active_contractors')?.metric_value || 0,
      trend: calculateTrend('active_contractors'),
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Pending Payments',
      value: getLatestMetric('pending_payments')?.metric_value || 0,
      trend: calculateTrend('pending_payments'),
      icon: Clock,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Government Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor key performance indicators and system metrics
        </p>
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
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Transparency Index</span>
                <Badge variant="outline">95%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Payment Time</span>
                <Badge variant="outline">3.2 days</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Project Success Rate</span>
                <Badge variant="outline">87%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Citizen Engagement</span>
                <Badge variant="outline">High</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.slice(0, 5).map((metric, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{metric.metric_name.replace('_', ' ')}</p>
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {analytics.length === 0 && (
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