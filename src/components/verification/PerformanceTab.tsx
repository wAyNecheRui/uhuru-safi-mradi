import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Award, DollarSign, Users, Star, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectWithRating {
  id: string;
  title: string;
  rating: number | null;
  review: string | null;
  votes: number;
}

interface PerformanceData {
  totalProjects: number;
  completedProjects: number;
  averageRating: number;
  totalBids: number;
  acceptedBids: number;
  projectsWithRatings: ProjectWithRating[];
}

const PerformanceTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    totalProjects: 0,
    completedProjects: 0,
    averageRating: 0,
    totalBids: 0,
    acceptedBids: 0,
    projectsWithRatings: []
  });

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user]);

  const fetchPerformanceData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch contractor ratings
      const { data: ratings } = await supabase
        .from('contractor_ratings')
        .select('rating, review, project_id')
        .eq('contractor_id', user.id);

      // Fetch projects where contractor is assigned
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, status')
        .eq('contractor_id', user.id);

      // Fetch bids
      const { data: bids } = await supabase
        .from('contractor_bids')
        .select('id, status')
        .eq('contractor_id', user.id);

      const totalProjects = projects?.length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
      
      const avgRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
        : 0;

      const totalBids = bids?.length || 0;
      const acceptedBids = bids?.filter(b => b.status === 'accepted' || b.status === 'selected').length || 0;

      // Map projects with their ratings
      const projectsWithRatings: ProjectWithRating[] = (projects || []).map(project => {
        const projectRating = ratings?.find(r => r.project_id === project.id);
        return {
          id: project.id,
          title: project.title,
          rating: projectRating?.rating || null,
          review: projectRating?.review || null,
          votes: projectRating ? 1 : 0
        };
      }).filter(p => p.rating !== null);

      setPerformanceData({
        totalProjects,
        completedProjects,
        averageRating: avgRating,
        totalBids,
        acceptedBids,
        projectsWithRatings
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = performanceData.totalProjects > 0 
    ? Math.round((performanceData.completedProjects / performanceData.totalProjects) * 100) 
    : 0;

  const bidSuccessRate = performanceData.totalBids > 0 
    ? Math.round((performanceData.acceptedBids / performanceData.totalBids) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasData = performanceData.totalProjects > 0 || performanceData.totalBids > 0;

  return (
    <div className="space-y-6">
      {!hasData ? (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Performance Data Yet</h3>
            <p className="text-muted-foreground">
              Your performance metrics will appear here once you start working on projects 
              and receive ratings from clients and community members.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Performance Metrics */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Project Completion Rate</span>
                    <span className="text-2xl font-bold text-primary">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {performanceData.completedProjects} of {performanceData.totalProjects} projects completed
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Bid Success Rate</span>
                    <span className="text-2xl font-bold text-green-600">{bidSuccessRate}%</span>
                  </div>
                  <Progress value={bidSuccessRate} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {performanceData.acceptedBids} of {performanceData.totalBids} bids accepted
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Average Rating</span>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                      <span className="text-2xl font-bold">{performanceData.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <Progress value={(performanceData.averageRating / 5) * 100} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Based on {performanceData.projectsWithRatings.length} ratings
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Total Projects</span>
                    <span className="text-2xl font-bold text-blue-600">{performanceData.totalProjects}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {performanceData.completedProjects} completed, {performanceData.totalProjects - performanceData.completedProjects} in progress
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Ratings */}
          {performanceData.projectsWithRatings.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Project Ratings & Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.projectsWithRatings.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold">{item.title}</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 font-semibold">{item.rating?.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      {item.review && (
                        <p className="text-sm text-muted-foreground">{item.review}</p>
                      )}
                      <div className="mt-2">
                        <Progress value={((item.rating || 0) / 5) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Bids Submitted</span>
                    <span className="font-semibold">{performanceData.totalBids}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bids Accepted</span>
                    <span className="font-semibold text-green-600">{performanceData.acceptedBids}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Projects</span>
                    <span className="font-semibold text-blue-600">
                      {performanceData.totalProjects - performanceData.completedProjects}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-600" />
                  Performance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Performance</span>
                    <Badge className={
                      performanceData.averageRating >= 4 ? 'bg-green-100 text-green-800' :
                      performanceData.averageRating >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {performanceData.averageRating >= 4 ? 'Excellent' :
                       performanceData.averageRating >= 3 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bid Success</span>
                    <Badge className={
                      bidSuccessRate >= 50 ? 'bg-green-100 text-green-800' :
                      bidSuccessRate >= 25 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {bidSuccessRate >= 50 ? 'High' :
                       bidSuccessRate >= 25 ? 'Moderate' : 'Building'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceTab;
