import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, MessageSquare, Users, Wifi } from 'lucide-react';
import { WorkflowService } from '@/services/WorkflowService';
import { CommunityVote } from '@/types/workflow';
import { toast } from 'sonner';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface CommunityVotingProps {
  reportId: string;
  currentUserId?: string;
}

const CommunityVoting: React.FC<CommunityVotingProps> = ({ reportId, currentUserId }) => {
  const [votes, setVotes] = useState<CommunityVote[]>([]);
  const [userVote, setUserVote] = useState<CommunityVote | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVotes = useCallback(async () => {
    try {
      const votesData = await WorkflowService.getVotesForReport(reportId);
      setVotes(votesData);
      
      // Find current user's vote
      if (currentUserId) {
        const existingVote = votesData.find(vote => vote.user_id === currentUserId);
        setUserVote(existingVote || null);
        setComment(existingVote?.comment || '');
      }
    } catch (error) {
      console.error('Error loading votes:', error);
      toast.error('Failed to load community votes');
    } finally {
      setLoading(false);
    }
  }, [reportId, currentUserId]);

  // Set up real-time subscription for live vote updates
  const { isSubscribed } = useRealtimeSubscription({
    subscriptions: [
      { 
        table: 'community_votes', 
        event: '*',
        filter: `report_id=eq.${reportId}`
      }
    ],
    onDataChange: loadVotes,
    channelPrefix: `votes-${reportId}`
  });

  useEffect(() => {
    loadVotes();
  }, [loadVotes]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!currentUserId) {
      toast.error('Please log in to vote');
      return;
    }

    setIsSubmitting(true);
    try {
      await WorkflowService.submitVote(reportId, voteType, comment.trim() || undefined);
      toast.success('Vote submitted successfully');
      await loadVotes();
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upvotes = votes.filter(vote => vote.vote_type === 'upvote').length;
  const downvotes = votes.filter(vote => vote.vote_type === 'downvote').length;
  const totalVotes = votes.length;
  const priorityScore = upvotes - downvotes;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Validation
            {isSubscribed && (
              <Badge variant="outline" className="text-xs ml-2">
                <Wifi className="h-3 w-3 mr-1 text-green-500" />
                Live
              </Badge>
            )}
          </div>
          <Badge variant={priorityScore >= 5 ? "default" : "secondary"}>
            Priority Score: {priorityScore >= 0 ? '+' : ''}{priorityScore}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vote Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-bold text-lg">{upvotes}</span>
            </div>
            <p className="text-sm text-muted-foreground">Upvotes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-600">
              <ThumbsDown className="h-4 w-4" />
              <span className="font-bold text-lg">{downvotes}</span>
            </div>
            <p className="text-sm text-muted-foreground">Downvotes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <MessageSquare className="h-4 w-4" />
              <span className="font-bold text-lg">{totalVotes}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Votes</p>
          </div>
        </div>

        {/* Voting Interface */}
        {currentUserId && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Add your comment (optional):
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this problem..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleVote('upvote')}
                disabled={isSubmitting}
                variant={userVote?.vote_type === 'upvote' ? 'default' : 'outline'}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                {userVote?.vote_type === 'upvote' ? 'Upvoted' : 'Upvote'}
              </Button>
              
              <Button
                onClick={() => handleVote('downvote')}
                disabled={isSubmitting}
                variant={userVote?.vote_type === 'downvote' ? 'destructive' : 'outline'}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                {userVote?.vote_type === 'downvote' ? 'Downvoted' : 'Downvote'}
              </Button>
            </div>
          </div>
        )}

        {/* Recent Comments */}
        {votes.filter(vote => vote.comment).length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Community Comments:</h4>
            <div className="space-y-3">
              {votes
                .filter(vote => vote.comment)
                .slice(0, 3)
                .map((vote) => (
                  <div key={vote.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {vote.vote_type === 'upvote' ? (
                        <ThumbsUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <ThumbsDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(vote.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{vote.comment}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {priorityScore >= 5 && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✅ Community validation threshold reached — this report has progressed in the workflow.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityVoting;
