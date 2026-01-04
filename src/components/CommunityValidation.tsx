import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Navigation,
  Loader2,
  Filter,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocationFiltering, ProblemWithDistance } from '@/hooks/useLocationFiltering';
import { WorkflowGuardService, MIN_VOTES_THRESHOLD, WORKFLOW_STATUS } from '@/services/WorkflowGuardService';

interface ProblemReport {
  id: string;
  title: string;
  description: string;
  priority: string;
  location: string;
  photo_urls?: string[];
  created_at: string;
  reported_by: string;
  status: string;
  priority_score: number;
  user_vote?: 'upvote' | 'downvote' | null;
  reporter_name?: string;
  upvotes: number;
  downvotes: number;
  distance_km?: number | null;
  distance_category?: 'urgent' | 'nearby' | 'county' | 'unknown';
  can_vote?: boolean;
  can_verify?: boolean;
}

const CommunityValidation = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingState, setVotingState] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState('all');
  
  const {
    userLocation,
    isLocating,
    locationError,
    getCurrentLocation,
    fetchProblemsWithDistance,
    canVote,
    canVerify,
    getDistanceCategory,
    formatDistance,
  } = useLocationFiltering();

  // Fetch reports with distance using location
  const fetchReportsWithDistance = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const problemsWithDistance = await fetchProblemsWithDistance(
        userLocation.latitude,
        userLocation.longitude,
        20 // 20km radius
      );

      // Enrich with votes and eligibility
      const enrichedReports = await Promise.all((problemsWithDistance || []).map(async (problem) => {
        const { data: voteCounts } = await supabase
          .from('community_votes')
          .select('vote_type')
          .eq('report_id', problem.id);

        const upvotes = voteCounts?.filter(v => v.vote_type === 'upvote').length || 0;
        const downvotes = voteCounts?.filter(v => v.vote_type === 'downvote').length || 0;

        let userVote = null;
        if (user) {
          const { data: userVoteData } = await supabase
            .from('community_votes')
            .select('vote_type')
            .eq('report_id', problem.id)
            .eq('user_id', user.id)
            .maybeSingle();
          userVote = userVoteData?.vote_type || null;
        }

        const { data: reporterData } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', problem.id)
          .maybeSingle();

        // Check eligibility
        const canVoteResult = await canVote(problem.id);
        const canVerifyResult = await canVerify(problem.id);

        return {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          priority: problem.priority || 'medium',
          location: problem.location || 'Location not specified',
          photo_urls: problem.photo_urls,
          created_at: problem.created_at,
          reported_by: '',
          status: problem.status || 'pending',
          priority_score: problem.priority_score || 0,
          user_vote: userVote as 'upvote' | 'downvote' | null,
          reporter_name: reporterData?.full_name || 'Community Member',
          upvotes,
          downvotes,
          distance_km: problem.distance_km,
          distance_category: problem.distance_category,
          can_vote: canVoteResult,
          can_verify: canVerifyResult,
        };
      }));

      setReports(enrichedReports);
    } catch (error) {
      console.error('Error fetching reports with distance:', error);
      toast.error('Failed to load community reports');
    } finally {
      setLoading(false);
    }
  }, [userLocation, user, fetchProblemsWithDistance, canVote, canVerify]);

  // Effect to fetch reports with distance when location is available
  useEffect(() => {
    if (userLocation) {
      fetchReportsWithDistance();
    }
  }, [userLocation, fetchReportsWithDistance]);

  // Fallback fetch without distance - only fetch pending reports for voting
  const fetchReportsWithoutDistance = useCallback(async () => {
    setLoading(true);
    try {
      // Only fetch reports that are pending (awaiting community votes)
      const { data, error } = await supabase
        .from('problem_reports')
        .select('*')
        .eq('status', WORKFLOW_STATUS.PENDING)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reportsWithVotes = await Promise.all((data || []).map(async (report) => {
        const { data: voteCounts } = await supabase
          .from('community_votes')
          .select('vote_type')
          .eq('report_id', report.id);

        const upvotes = voteCounts?.filter(v => v.vote_type === 'upvote').length || 0;
        const downvotes = voteCounts?.filter(v => v.vote_type === 'downvote').length || 0;

        let userVote = null;
        if (user) {
          const { data: userVoteData } = await supabase
            .from('community_votes')
            .select('vote_type')
            .eq('report_id', report.id)
            .eq('user_id', user.id)
            .maybeSingle();
          userVote = userVoteData?.vote_type || null;
        }

        const { data: reporterData } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', report.reported_by)
          .maybeSingle();

        return {
          ...report,
          priority_score: report.priority_score || 0,
          user_vote: userVote as 'upvote' | 'downvote' | null,
          reporter_name: reporterData?.full_name || 'Anonymous User',
          priority: report.priority || 'medium',
          location: report.location || 'Location not specified',
          upvotes,
          downvotes,
          can_vote: true,
          can_verify: true,
        };
      }));

      setReports(reportsWithVotes);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load community reports');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleVote = async (reportId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    setVotingState(prev => ({ ...prev, [reportId]: true }));

    try {
      // Insert or update vote in community_votes table
      const { error } = await supabase
        .from('community_votes')
        .upsert({
          report_id: reportId,
          user_id: user.id,
          vote_type: voteType
        }, {
          onConflict: 'report_id,user_id'
        });

      if (error) throw error;

      // Update local state immediately for better UX
      let newTotalVotes = 0;
      setReports(prev => prev.map(report => {
        if (report.id === reportId) {
          const wasUpvote = report.user_vote === 'upvote';
          const wasDownvote = report.user_vote === 'downvote';
          
          let newUpvotes = report.upvotes;
          let newDownvotes = report.downvotes;
          
          // Remove previous vote
          if (wasUpvote) newUpvotes--;
          if (wasDownvote) newDownvotes--;
          
          // Add new vote
          if (voteType === 'upvote') newUpvotes++;
          if (voteType === 'downvote') newDownvotes++;
          
          newTotalVotes = newUpvotes + newDownvotes;
          
          return { 
            ...report, 
            user_vote: voteType,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            priority_score: newUpvotes - newDownvotes
          };
        }
        return report;
      }));

      // Check if this vote triggers a status change (reaches 50 votes threshold)
      const statusResult = await WorkflowGuardService.checkAndUpdateStatusAfterVote(reportId);
      
      if (statusResult.statusChanged) {
        toast.success('Vote submitted! This report has reached the review threshold and will now be reviewed by government officials.', {
          duration: 5000
        });
        // Remove this report from the list as it's now under_review
        setReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        toast.success(`Vote submitted successfully`);
      }
    } catch (error: any) {
      console.error('Voting error:', error);
      toast.error('Failed to submit vote');
    } finally {
      setVotingState(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const handleVerify = async (reportId: string, action: 'verify' | 'flag') => {
    if (!user) {
      toast.error('Please log in to verify reports');
      return;
    }

    try {
      const { error } = await supabase
        .from('problem_reports')
        .update({ 
          status: action === 'verify' ? 'verified' : 'flagged',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Report ${action === 'verify' ? 'verified' : 'flagged'} successfully`);
      // Refresh the list
      if (userLocation) {
        fetchReportsWithDistance();
      } else {
        fetchReportsWithoutDistance();
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(`Failed to ${action} report`);
    }
  };

  // Effect for fallback fetch when no location
  useEffect(() => {
    if (!userLocation && !isLocating) {
      fetchReportsWithoutDistance();
    }
  }, [userLocation, isLocating, fetchReportsWithoutDistance]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">Loading community reports...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter reports by distance category
  const filteredReports = activeTab === 'all' 
    ? reports 
    : reports.filter(r => r.distance_category === activeTab);

  // Group reports by distance category for counts
  const urgentCount = reports.filter(r => r.distance_category === 'urgent').length;
  const nearbyCount = reports.filter(r => r.distance_category === 'nearby').length;
  const countyCount = reports.filter(r => r.distance_category === 'county').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-t-4 border-t-green-600">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Users className="h-6 w-6 mr-3 text-green-600" />
            Community Validation & Voting
          </CardTitle>
          <p className="text-gray-600">
            Help validate and prioritize community-reported problems in your area. Your votes help determine which issues get addressed first.
          </p>
          
          {/* Location Status */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {isLocating ? (
              <Badge variant="outline" className="text-blue-600">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Detecting location...
              </Badge>
            ) : userLocation ? (
              <Badge className="bg-green-100 text-green-800">
                <Navigation className="h-3 w-3 mr-1" />
                Location: {userLocation.county || `${userLocation.latitude.toFixed(2)}°, ${userLocation.longitude.toFixed(2)}°`}
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => getCurrentLocation()}
                className="text-blue-600"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Enable Location
              </Button>
            )}
            {locationError && (
              <span className="text-sm text-amber-600">{locationError}</span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Distance-based Tabs */}
      {userLocation && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              All ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="urgent" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              🔴 Urgent ({urgentCount})
            </TabsTrigger>
            <TabsTrigger value="nearby" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
              🟡 Nearby ({nearbyCount})
            </TabsTrigger>
            <TabsTrigger value="county" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              🔵 County ({countyCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports in This Category</h3>
            <p className="text-gray-600">
              {activeTab === 'all' 
                ? 'All community reports have been reviewed and validated.'
                : `No reports in the ${activeTab} category within your area.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Report Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {report.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {/* Distance Badge */}
                          {report.distance_km !== undefined && report.distance_km !== null && (
                            <Badge className={
                              report.distance_category === 'urgent' ? 'bg-red-100 text-red-800' :
                              report.distance_category === 'nearby' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              <Navigation className="h-3 w-3 mr-1" />
                              {formatDistance(report.distance_km)}
                            </Badge>
                          )}
                          <Badge className={getPriorityColor(report.priority)}>
                            {report.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ID: {report.id.substring(0, 8)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {report.description}
                    </p>

                    <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4 mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {report.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(report.created_at)}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Reported by {report.reporter_name}
                      </div>
                    </div>

                    {/* Photo Gallery */}
                    {report.photo_urls && report.photo_urls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {report.photo_urls.slice(0, 4).map((url, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={url}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            {index === 3 && report.photo_urls!.length > 4 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                <span className="text-white font-semibold">
                                  +{report.photo_urls!.length - 4} more
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Voting Section */}
          <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div className="text-lg font-bold text-gray-900">
                  {report.priority_score}
                </div>
              </div>
              <div className="text-xs text-gray-600">Priority Score</div>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <div className="text-green-600 flex items-center">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {report.upvotes}
                </div>
                <div className="text-red-600 flex items-center">
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  {report.downvotes}
                </div>
              </div>
              
              {/* Vote Progress to Government Review */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progress to Review</span>
                  <span>{Math.min(report.upvotes + report.downvotes, MIN_VOTES_THRESHOLD)}/{MIN_VOTES_THRESHOLD}</span>
                </div>
                <Progress 
                  value={Math.min(((report.upvotes + report.downvotes) / MIN_VOTES_THRESHOLD) * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {report.upvotes + report.downvotes >= MIN_VOTES_THRESHOLD 
                    ? '✓ Ready for government review' 
                    : `${MIN_VOTES_THRESHOLD - (report.upvotes + report.downvotes)} more votes needed`}
                </p>
              </div>
            </div>

                    <div className="space-y-3">
                      {/* Already voted notice */}
                      {report.user_vote && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded text-center">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          You've already {report.user_vote === 'upvote' ? 'supported' : 'disputed'} this issue
                        </div>
                      )}
                      {/* Vote eligibility notice */}
                      {!report.user_vote && report.can_vote === false && (
                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          You must be within 50km to vote on this issue
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant={report.user_vote === 'upvote' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVote(report.id, 'upvote')}
                          disabled={votingState[report.id] || report.can_vote === false || !!report.user_vote}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {report.user_vote === 'upvote' ? 'Supported' : 'Support'}
                        </Button>
                        <Button
                          variant={report.user_vote === 'downvote' ? 'destructive' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVote(report.id, 'downvote')}
                          disabled={votingState[report.id] || report.can_vote === false || !!report.user_vote}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {report.user_vote === 'downvote' ? 'Disputed' : 'Dispute'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityValidation;
