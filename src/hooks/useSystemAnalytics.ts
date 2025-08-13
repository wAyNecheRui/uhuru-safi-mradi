import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SystemAnalytics } from '@/types/workforce';

export const useSystemAnalytics = () => {
  const [analytics, setAnalytics] = useState<SystemAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async (category?: string, days: number = 30) => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('system_analytics')
        .select('*')
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAnalytics(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAnalytics = async () => {
    try {
      const { error } = await supabase.rpc('update_system_analytics');
      if (error) throw error;
      
      toast({
        title: "Analytics updated",
        description: "System analytics have been refreshed."
      });
      
      fetchAnalytics();
    } catch (error: any) {
      toast({
        title: "Error updating analytics",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getMetricsByCategory = (category: string) => {
    return analytics.filter(metric => metric.category === category);
  };

  const getLatestMetric = (metricName: string) => {
    return analytics
      .filter(metric => metric.metric_name === metricName)
      .sort((a, b) => new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime())[0];
  };

  const calculateTrend = (metricName: string, days: number = 7) => {
    const metrics = analytics
      .filter(metric => metric.metric_name === metricName)
      .sort((a, b) => new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime())
      .slice(-days);

    if (metrics.length < 2) return 0;

    const first = metrics[0].metric_value;
    const last = metrics[metrics.length - 1].metric_value;
    
    return first === 0 ? 0 : ((last - first) / first) * 100;
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    fetchAnalytics,
    updateAnalytics,
    getMetricsByCategory,
    getLatestMetric,
    calculateTrend
  };
};