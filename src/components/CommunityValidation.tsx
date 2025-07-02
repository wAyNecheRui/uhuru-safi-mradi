
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
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProblemReport {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  location: string;
  photo_urls?: string[];
  created_at: string;
  reported_by: string;
  status: string;
  vote_count: number;
  user_vote?: 'upvote' | 'downvote' | null;
  reporter_name?: string;
}

const CommunityValidation = () => {
  const { user, supabase } = useAuth();
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingState, setVotingState] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('problem_reports')
        .select(`
          *,
          user_profiles!reported_by (
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each report, get vote counts and user's vote
      const reportsWithVotes = await Promise.all(
        (data || []).map(async (report) => {
          // Simulate vote counts since we don't have community_votes table yet
          const voteCount = Math.floor(Math.random() * 20) + 1;
          
          return {
            ...report,
            vote_count: voteCount,
            user_vote: null,
            reporter_name: report.user_profiles?.full_name || 'Anonymous'
          };
        })
      );

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
      // Simulate voting since we don't have community_votes table
      console.log(`Vote submitted: ${voteType} for report ${reportId}`);
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              user_vote: voteType,
              vote_count: report.vote_count + (voteType === 'upvote' ? 1 : -1)
            }
          : report
      ));

      toast.success(`Vote ${voteType === 'upvote' ? 'up' : 'down'} submitted successfully`);
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
                          <Badge variant="outline">{report.category}</Badge>
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
                      <div className="text-2xl font-bold text-gray-900">
                        {report.vote_count}
                      </div>
                      <div className="text-sm text-gray-600">Community Votes</div>
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
