
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, Eye, Mouse, Clock, AlertTriangle } from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
  showInProduction?: boolean;
}

export const AnalyticsDashboard = ({ 
  className, 
  showInProduction = false 
}: AnalyticsDashboardProps) => {
  const { getAnalyticsSummary } = useAnalytics();
  const [summary, setSummary] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development' || showInProduction);
  }, [showInProduction]);

  useEffect(() => {
    if (isVisible) {
      const updateSummary = () => {
        setSummary(getAnalyticsSummary());
      };

      updateSummary();
      const interval = setInterval(updateSummary, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isVisible, getAnalyticsSummary]);

  if (!isVisible || !summary) return null;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className={`fixed bottom-4 left-4 w-96 z-50 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Activity className="h-4 w-4" />
            <span>Analytics Dashboard</span>
            <Badge variant="outline">{summary.sessionId.split('_')[1]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Session</p>
                    <p className="text-sm font-mono">{formatDuration(summary.sessionDuration)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Eye className="h-3 w-3 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Page Views</p>
                    <p className="text-sm font-mono">{summary.pageViewCount}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mouse className="h-3 w-3 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Events</p>
                    <p className="text-sm font-mono">{summary.eventCount}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Page Time</p>
                    <p className="text-sm font-mono">
                      {isNaN(summary.averagePageTime) ? '0s' : formatDuration(summary.averagePageTime)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="pages" className="mt-3">
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Most Visited Pages</h4>
                {summary.mostVisitedPages.map((page: any, index: number) => (
                  <div key={page.page} className="flex justify-between items-center text-xs">
                    <span className="truncate flex-1">{page.page}</span>
                    <Badge variant="secondary" className="ml-2">{page.count}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="events" className="mt-3">
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Top Events</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.topEvents}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
