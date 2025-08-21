
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Eye,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface VoteCount {
  upvotes: number;
  downvotes: number;
}

const CommunityValidation = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingState, setVotingState] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchReports();

    // Set up real-time subscription for community votes
    const channel = supabase
      .channel('community-votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_votes'
        },
        (payload) => {
          console.log('Vote change detected:', payload);
          // Refresh reports when votes change
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('problem_reports')
        .select('*')
        .eq('status', 'pending')
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each report, get vote counts and user's current vote
      const reportsWithVotes = await Promise.all((data || []).map(async (report) => {
        // Get vote counts
        const { data: voteCounts, error: voteError } = await supabase
          .from('community_votes')
          .select('vote_type')
          .eq('report_id', report.id);

        if (voteError) {
          console.error('Error fetching vote counts:', voteError);
        }

        const upvotes = voteCounts?.filter(v => v.vote_type === 'upvote').length || 0;
        const downvotes = voteCounts?.filter(v => v.vote_type === 'downvote').length || 0;

        // Get user's current vote if logged in
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
        
        return {
          ...report,
          priority_score: report.priority_score || 0,
          user_vote: userVote,
          reporter_name: 'Anonymous', // Could join with profiles table later
          priority: report.priority || 'medium',
          location: report.location || 'Location not specified',
          upvotes,
          downvotes
        };
      }));

      setReports(reportsWithVotes);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load community reports');
    } finally {
      setLoading(false);
    }
  };

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

      toast.success(`Vote submitted successfully`);
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
      fetchReports(); // Refresh the list
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(`Failed to ${action} report`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-t-4 border-t-green-600">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Users className="h-6 w-6 mr-3 text-green-600" />
            Community Validation & Voting
          </CardTitle>
          <p className="text-gray-600">
            Help validate and prioritize community-reported problems. Your votes help determine which issues get addressed first.
          </p>
        </CardHeader>
      </Card>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Pending Validation</h3>
            <p className="text-gray-600">All community reports have been reviewed and validated.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reports.map((report) => (
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
            </div>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant={report.user_vote === 'upvote' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVote(report.id, 'upvote')}
                          disabled={votingState[report.id]}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Support
                        </Button>
                        <Button
                          variant={report.user_vote === 'downvote' ? 'destructive' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVote(report.id, 'downvote')}
                          disabled={votingState[report.id]}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Dispute
                        </Button>
                      </div>

                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Verification Actions
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => handleVerify(report.id, 'verify')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify as Valid
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => handleVerify(report.id, 'flag')}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Flag as Invalid
                          </Button>
                        </div>
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
