import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, ThumbsDown, Users, MapPin, Clock, AlertTriangle, Camera, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MIN_VOTES_THRESHOLD } from '@/services/WorkflowGuardService';

interface PendingReport {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  priority: string;
  created_at: string;
  photo_urls: string[] | null;
  estimated_cost: number | null;
  affected_population: number | null;
  upvotes: number;
  downvotes: number;
  totalVotes: number;
}

interface ApprovedProject {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  status: string;
  created_at: string;
  problem_reports?: {
    location: string;
    priority_score: number;
  };
}

const CommunityVoting = () => {
  const [votes, setVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [approvedProjects, setApprovedProjects] = useState<ApprovedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pending problem reports with votes
      const { data: reportsData, error: reportsError } = await supabase
        .from('problem_reports')
        .select(`
          id, title, description, location, category, priority, 
          created_at, photo_urls, estimated_cost, affected_population,
          community_votes(vote_type)
        `)
        .eq('status', 'pending')
        .order('priority_score', { ascending: false });

      if (reportsError) throw reportsError;

      const pendingWithVotes = (reportsData || []).map(report => ({
        ...report,
        upvotes: report.community_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0,
        downvotes: report.community_votes?.filter((v: any) => v.vote_type === 'downvote').length || 0,
        totalVotes: report.community_votes?.length || 0
      }));

      setPendingReports(pendingWithVotes);

      // Fetch approved projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, title, description, budget, status, created_at,
          problem_reports(location, priority_score)
        `)
        .in('status', ['planning', 'bidding', 'in_progress'])
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setApprovedProjects(projectsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load community voting data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reportId: string, voteType: 'up' | 'down') => {
    const currentVote = votes[reportId];
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Login Required",
          description: "Please log in to vote on issues.",
          variant: "destructive"
        });
        return;
      }

      const dbVoteType = voteType === 'up' ? 'upvote' : 'downvote';

      if (currentVote === voteType) {
        // Remove vote
        await supabase
          .from('community_votes')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', userData.user.id);

        setVotes(prev => ({ ...prev, [reportId]: null }));
        toast({
          title: "Vote removed",
          description: "Your vote has been removed.",
        });
      } else {
        // Upsert vote
        await supabase
          .from('community_votes')
          .upsert({
            report_id: reportId,
            user_id: userData.user.id,
            vote_type: dbVoteType
          }, { onConflict: 'report_id,user_id' });

        setVotes(prev => ({ ...prev, [reportId]: voteType }));
        toast({
          title: "Vote recorded",
          description: `You voted ${voteType === 'up' ? 'to prioritize' : 'against'} this issue.`,
        });
      }

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive"
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent': 
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'water': 'bg-blue-100 text-blue-800',
      'roads': 'bg-indigo-100 text-indigo-800',
      'electricity': 'bg-yellow-100 text-yellow-800',
      'sewage': 'bg-green-100 text-green-800',
      'healthcare': 'bg-pink-100 text-pink-800',
      'education': 'bg-cyan-100 text-cyan-800'
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const calculateVotePercentage = (upVotes: number, downVotes: number) => {
    const total = upVotes + downVotes;
    return total > 0 ? Math.round((upVotes / total) * 100) : 0;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading community issues...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center text-2xl">
            <Users className="h-6 w-6 mr-3 text-blue-600" />
            Community Voting Dashboard
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Help prioritize infrastructure issues in your community. Vote on reported problems to influence government resource allocation.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Pending Issues ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger 
            value="approved" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Approved Projects ({approvedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {pendingReports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No pending issues to vote on at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingReports.map((issue) => {
                const userVote = votes[issue.id];
                const votePercentage = calculateVotePercentage(issue.upvotes, issue.downvotes);
                
                return (
                  <Card key={issue.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-xl font-semibold text-gray-900">{issue.title}</h3>
                            <div className="flex gap-2">
                              <Badge className={getUrgencyColor(issue.priority || 'medium')}>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {(issue.priority || 'Medium').toUpperCase()}
                              </Badge>
                              {issue.category && (
                                <Badge className={getCategoryColor(issue.category)}>
                                  {issue.category}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-700 leading-relaxed">{issue.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              {issue.location || 'Location not specified'}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              Reported {formatTimeAgo(issue.created_at)}
                            </div>
                            {issue.photo_urls && issue.photo_urls.length > 0 && (
                              <div className="flex items-center text-gray-600">
                                <Camera className="h-4 w-4 mr-2" />
                                {issue.photo_urls.length} photos attached
                              </div>
                            )}
                            {issue.affected_population && (
                              <div className="flex items-center text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                {issue.affected_population.toLocaleString()} affected
                              </div>
                            )}
                          </div>

                          {issue.estimated_cost && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Estimated Cost: </span>
                              <span className="text-lg font-semibold text-green-600">
                                {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(issue.estimated_cost)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="lg:w-80 space-y-4">
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-3">Community Priority</h4>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span>Support: {issue.upvotes}</span>
                                <span>Against: {issue.downvotes}</span>
                              </div>
                              
                              <Progress value={votePercentage} className="h-2" />
                              
                              <div className="text-center text-sm text-gray-600">
                                {votePercentage}% community support ({issue.totalVotes} votes)
                              </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                              <Button
                                onClick={() => handleVote(issue.id, 'up')}
                                variant={userVote === 'up' ? 'default' : 'outline'}
                                className={`flex-1 ${
                                  userVote === 'up' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'border-green-300 text-green-700 hover:bg-green-50'
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Prioritize
                              </Button>
                              
                              <Button
                                onClick={() => handleVote(issue.id, 'down')}
                                variant={userVote === 'down' ? 'default' : 'outline'}
                                className={`flex-1 ${
                                  userVote === 'down' 
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'border-red-300 text-red-700 hover:bg-red-50'
                                }`}
                              >
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                Not Priority
                              </Button>
                            </div>

                            {issue.totalVotes >= MIN_VOTES_THRESHOLD ? (
                              <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800 text-center">
                                ✅ {MIN_VOTES_THRESHOLD}+ votes reached! Moved to government review.
                              </div>
                            ) : (
                              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 text-center">
                                {MIN_VOTES_THRESHOLD - issue.totalVotes} more votes needed for government review
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          {approvedProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No approved projects yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {approvedProjects.map((project) => (
                <Card key={project.id} className="shadow-lg border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {project.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-gray-700">{project.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <div>{project.problem_reports?.location || 'Not specified'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Budget:</span>
                          <div className="text-green-600 font-semibold">
                            {project.budget 
                              ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(project.budget)
                              : 'TBD'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Created:</span>
                          <div>{new Date(project.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-4">How Community Voting Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-800">Voting Process:</h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Issues with {MIN_VOTES_THRESHOLD}+ votes automatically move to government review phase
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Your vote helps prioritize community needs
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Verified citizens can participate in voting
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-blue-800">Transparency Features:</h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  All voting data is publicly visible
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Track projects from report to completion
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Real-time updates on project progress
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityVoting;
