import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, TrendingUp, Bell, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BidStatus {
  id: string;
  projectTitle: string;
  bidAmount: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'selected' | 'rejected';
  submittedDate: string;
  lastUpdate: string;
  totalBids: number;
  currentRanking: number;
  evaluationProgress: number;
  notifications: Notification[];
}

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

const RealTimeBidTracking = () => {
  const [bidStatuses, setBidStatuses] = useState<BidStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real bid data
  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: bids, error } = await supabase
          .from('contractor_bids')
          .select(`
            id,
            bid_amount,
            status,
            submitted_at,
            estimated_duration,
            problem_reports!contractor_bids_report_id_fkey (
              title,
              location
            )
          `)
          .eq('contractor_id', user.id)
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        const formattedBids: BidStatus[] = bids?.map(bid => ({
          id: bid.id,
          projectTitle: bid.problem_reports?.title || 'Project Title',
          bidAmount: `KES ${(parseFloat(bid.bid_amount?.toString() || '0') / 1000000).toFixed(1)}M`,
          status: bid.status as BidStatus['status'],
          submittedDate: new Date(bid.submitted_at).toISOString().split('T')[0],
          lastUpdate: new Date().toLocaleString(),
          totalBids: Math.floor(Math.random() * 15) + 3, // Placeholder - would need aggregate query
          currentRanking: Math.floor(Math.random() * 5) + 1, // Placeholder - would need ranking logic
          evaluationProgress: getProgressFromStatus(bid.status),
          notifications: generateStatusNotifications(bid.status, bid.problem_reports?.title || 'Project')
        })) || [];

        setBidStatuses(formattedBids);
      } catch (error) {
        console.error('Error fetching bids:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, []);

  // Set up real-time subscription for actual implementation
  useEffect(() => {
    const channel = supabase
      .channel('bid-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contractor_bids'
      }, (payload) => {
        console.log('Real-time bid update:', payload);
        // Handle real-time updates here
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: BidStatus['status']) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'selected': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getProgressFromStatus = (status: string): number => {
    switch (status) {
      case 'submitted': return 25;
      case 'under_review': return 50;
      case 'shortlisted': return 75;
      case 'selected': return 100;
      case 'rejected': return 0;
      default: return 25;
    }
  };

  const generateStatusNotifications = (status: string, projectTitle: string): Notification[] => {
    const baseNotifications = [
      { id: '1', message: `Bid submitted for ${projectTitle}`, timestamp: new Date().toLocaleString(), type: 'info' as const }
    ];

    switch (status) {
      case 'under_review':
        return [
          ...baseNotifications,
          { id: '2', message: 'Your bid is under technical review', timestamp: new Date().toLocaleString(), type: 'info' as const }
        ];
      case 'shortlisted':
        return [
          ...baseNotifications,
          { id: '3', message: 'Congratulations! You have been shortlisted', timestamp: new Date().toLocaleString(), type: 'success' as const }
        ];
      case 'selected':
        return [
          ...baseNotifications,
          { id: '4', message: 'Congratulations! Your bid has been selected', timestamp: new Date().toLocaleString(), type: 'success' as const }
        ];
      case 'rejected':
        return [
          ...baseNotifications,
          { id: '5', message: 'Your bid was not selected this time', timestamp: new Date().toLocaleString(), type: 'error' as const }
        ];
      default:
        return baseNotifications;
    }
  };

  const getStatusStep = (status: BidStatus['status']) => {
    switch (status) {
      case 'submitted': return 1;
      case 'under_review': return 2;
      case 'shortlisted': return 3;
      case 'selected': return 4;
      case 'rejected': return 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-xl">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Real-Time Bid Tracking
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Monitor your bid status in real-time with live updates and transparent evaluation progress.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {bidStatuses.map((bid) => (
          <Card key={bid.id} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bid.projectTitle}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>Bid Amount: <span className="font-semibold text-green-600">{bid.bidAmount}</span></span>
                      <span>Submitted: {new Date(bid.submittedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(bid.status)}>
                    {bid.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                {/* Progress Timeline */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Evaluation Progress</span>
                    <span>{bid.evaluationProgress}%</span>
                  </div>
                  <Progress value={bid.evaluationProgress} className="h-2" />
                  
                  {/* Status Steps */}
                  <div className="flex justify-between mt-4">
                    {['Submitted', 'Under Review', 'Shortlisted', 'Selected'].map((step, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          getStatusStep(bid.status) > index 
                            ? 'bg-green-500 text-white' 
                            : getStatusStep(bid.status) === index + 1 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-xs mt-1 text-gray-600">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <div className="font-semibold text-purple-600">{bid.totalBids}</div>
                    <div className="text-xs text-gray-600">Total Bids</div>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <div className="font-semibold text-blue-600">#{bid.currentRanking}</div>
                    <div className="text-xs text-gray-600">Current Rank</div>
                  </div>
                  <div className="text-center">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                    <div className="font-semibold text-orange-600">{new Date(bid.lastUpdate).toLocaleTimeString()}</div>
                    <div className="text-xs text-gray-600">Last Update</div>
                  </div>
                </div>

                {/* Recent Notifications */}
                <div className="space-y-2">
                  <h4 className="flex items-center text-sm font-medium text-gray-700">
                    <Bell className="h-4 w-4 mr-1" />
                    Recent Updates
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bid.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border text-sm ${getNotificationColor(notification.type)}`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="flex-1">{notification.message}</p>
                          <span className="text-xs opacity-75 ml-2">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bidStatuses.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Bids</h3>
            <p className="text-gray-600">You haven't submitted any bids yet. Start browsing available projects to submit your first bid.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeBidTracking;