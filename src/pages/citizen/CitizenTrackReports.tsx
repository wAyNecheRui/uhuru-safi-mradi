import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Clock, FileText, Eye, Trash2, ImageOff, ThumbsUp, ThumbsDown, Globe, MapPinned } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ContractorBanner from '@/components/contractor/ContractorBanner';
import ReportDetailsModal from '@/components/ReportDetailsModal';
import { useCitizenData } from '@/hooks/useCitizenData';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CitizenTrackReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { reports: myReports, isLoading: myLoading, deleteReport, isDeletingReport } = useCitizenData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userCounty = user?.profile?.county;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Track Reports' }
  ];

  // Fetch ALL reports in the system
  const { data: allReports = [], isLoading: allLoading } = useQuery({
    queryKey: ['allSystemReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('problem_reports')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch user's existing votes
  const { data: userVotes = [] } = useQuery({
    queryKey: ['userVotes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('community_votes')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch vote counts per report
  const { data: voteCounts = {} } = useQuery({
    queryKey: ['voteCounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_votes')
        .select('report_id, vote_type');
      if (error) throw error;
      const counts: Record<string, { upvotes: number; downvotes: number }> = {};
      (data || []).forEach(v => {
        if (!counts[v.report_id]) counts[v.report_id] = { upvotes: 0, downvotes: 0 };
        if (v.vote_type === 'upvote') counts[v.report_id].upvotes++;
        else counts[v.report_id].downvotes++;
      });
      return counts;
    },
    staleTime: 30 * 1000,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ reportId, voteType }: { reportId: string; voteType: 'upvote' | 'downvote' }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('community_votes')
        .upsert({
          report_id: reportId,
          user_id: user.id,
          vote_type: voteType,
        }, { onConflict: 'user_id,report_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vote submitted');
      queryClient.invalidateQueries({ queryKey: ['userVotes'] });
      queryClient.invalidateQueries({ queryKey: ['voteCounts'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to vote');
    }
  });

  // Determine which reports to show based on tab
  const getDisplayReports = () => {
    let source = activeTab === 'all' ? allReports : allReports.filter(r => {
      if (!userCounty) return false;
      // Match county from the location field
      const loc = (r.location || '').toLowerCase();
      const county = userCounty.toLowerCase();
      return loc.includes(county);
    });

    if (searchTerm) {
      source = source.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return source;
  };

  const displayReports = getDisplayReports();
  const isLoading = activeTab === 'all' ? allLoading : allLoading;

  // Check if user can vote on a report
  const canVote = (report: any) => {
    if (!user?.id) return false;
    // Can't vote on own reports
    if (report.reported_by === user.id) return false;
    // Must be citizen
    if (user.user_type !== 'citizen') return false;
    return true;
  };

  const getUserVote = (reportId: string) => {
    return userVotes.find(v => v.report_id === reportId);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase().replace(/_/g, ' ') || '';
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contractor selected': case 'contractor_selected': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bidding open': case 'bidding_open': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'under review': case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const renderReportCard = (report: any, showVoting: boolean) => {
    const votes = voteCounts[report.id] || { upvotes: 0, downvotes: 0 };
    const existingVote = getUserVote(report.id);
    const isOwnReport = report.reported_by === user?.id;
    const votable = canVote(report);

    return (
      <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
        {/* Hero Photo */}
        {report.photo_urls && report.photo_urls.length > 0 ? (
          <div className="w-full h-[180px] sm:h-[220px] overflow-hidden bg-muted">
            <img
              src={report.photo_urls[0]}
              alt={report.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-[100px] bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-display mb-1">{report.title}</CardTitle>
              <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-3">
                {report.location && (
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {report.location}
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            {isOwnReport && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary ml-2 shrink-0">
                My Report
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge className={getStatusColor(report.status)}>{formatStatus(report.status)}</Badge>
            {report.priority && (
              <Badge className={getPriorityColor(report.priority)}>{report.priority?.toUpperCase()}</Badge>
            )}
            {report.category && (
              <Badge variant="outline" className="text-xs">{report.category}</Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{report.description}</p>

          {/* Voting Section */}
          {showVoting && (
            <div className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg mb-3">
              <Button
                variant={existingVote?.vote_type === 'upvote' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1"
                disabled={!votable || voteMutation.isPending}
                onClick={() => voteMutation.mutate({ reportId: report.id, voteType: 'upvote' })}
                title={!votable ? (isOwnReport ? "Can't vote on your own report" : 'Sign in as citizen to vote') : 'Upvote'}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{votes.upvotes}</span>
              </Button>
              <Button
                variant={existingVote?.vote_type === 'downvote' ? 'destructive' : 'ghost'}
                size="sm"
                className="h-8 gap-1"
                disabled={!votable || voteMutation.isPending}
                onClick={() => voteMutation.mutate({ reportId: report.id, voteType: 'downvote' })}
                title={!votable ? (isOwnReport ? "Can't vote on your own report" : 'Sign in as citizen to vote') : 'Downvote'}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{votes.downvotes}</span>
              </Button>
              {isOwnReport && (
                <span className="text-xs text-muted-foreground ml-auto">You can't vote on your own report</span>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t">
            <div className="flex gap-2">
              {isOwnReport && report.status === 'pending' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeletingReport}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your report "{report.title}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteReport(report.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmpty = (tab: string) => (
    <Card>
      <CardContent className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-display font-semibold text-foreground mb-2">No Reports Found</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm
            ? 'No reports match your search criteria.'
            : tab === 'county'
              ? `No reports found in ${userCounty || 'your county'}.`
              : 'No reports have been submitted yet.'}
        </p>
        <Button asChild>
          <a href="/citizen/report">Submit a Report</a>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <BreadcrumbNav items={breadcrumbItems} />

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">Community Reports</h1>
          <p className="text-muted-foreground text-sm">Browse all infrastructure reports and vote on issues in your community.</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search reports by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-11 bg-muted p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Globe className="h-4 w-4" />
              All Reports
            </TabsTrigger>
            <TabsTrigger value="county" className="rounded-lg gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MapPinned className="h-4 w-4" />
              My County {userCounty && <span className="text-xs opacity-70">({userCounty})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="animate-pulse">Loading reports...</div>
                </CardContent>
              </Card>
            ) : displayReports.length === 0 ? (
              renderEmpty('all')
            ) : (
              displayReports.map(report => renderReportCard(report, true))
            )}
          </TabsContent>

          <TabsContent value="county" className="space-y-4">
            {!userCounty ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPinned className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-display font-semibold mb-2">County Not Set</h3>
                  <p className="text-muted-foreground mb-4">
                    Please update your profile with your county to see local reports.
                  </p>
                  <Button asChild variant="outline">
                    <a href="/settings">Update Profile</a>
                  </Button>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="animate-pulse">Loading county reports...</div>
                </CardContent>
              </Card>
            ) : displayReports.length === 0 ? (
              renderEmpty('county')
            ) : (
              displayReports.map(report => renderReportCard(report, true))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};

export default CitizenTrackReports;
