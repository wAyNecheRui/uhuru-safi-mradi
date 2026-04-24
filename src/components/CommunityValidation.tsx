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
  Info,
  Search,
  ChevronDown,
  Globe2,
  Scale,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocationFiltering, ProblemWithDistance } from '@/hooks/useLocationFiltering';
import { WorkflowGuardService, MIN_VOTES_THRESHOLD, WORKFLOW_STATUS } from '@/services/WorkflowGuardService';
import { getWorkflowStageDisplay } from '@/utils/workflowStatusDisplay';

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
  category?: string;
  problem_type?: string;
  user_vote?: 'upvote' | 'downvote' | null;
  reporter_name?: string;
  upvotes: number;
  downvotes: number;
  distance_km?: number | null;
  distance_category?: 'urgent' | 'nearby' | 'county' | 'unknown';
  can_vote?: boolean;
  can_verify?: boolean;
}

const getRootCounty = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\bcounty\b/g, '')
    .replace(/\bcity\b/g, '')
    .replace(/\b(north|south|east|west|central)\b/g, '')
    .trim();
};

const CommunityValidation = () => {
  const { user } = useAuth();
  const { userProfile } = useProfile();
  const [allValidatedReports, setAllValidatedReports] = useState<ProblemReport[]>([]);
  const [profileCountyReports, setProfileCountyReports] = useState<ProblemReport[]>([]);
  const [detectedCountyReports, setDetectedCountyReports] = useState<ProblemReport[]>([]);

  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingDetected, setLoadingDetected] = useState(false);

  const [votingState, setVotingState] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNationwide, setShowNationwide] = useState(false);

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

  const userCounty = userProfile?.county || userLocation?.county || null;

  useEffect(() => {
    void (async () => {
      await getCurrentLocation();
    })();
  }, [getCurrentLocation]);

  const fetchCountyReports = useCallback(async (countyName: string, type: 'profile' | 'detected') => {
    if (!countyName) return;
    const setLoading = type === 'profile' ? setLoadingProfile : setLoadingDetected;
    const setReports = type === 'profile' ? setProfileCountyReports : setDetectedCountyReports;

    try {
      setLoading(true);
      const rootCounty = getRootCounty(countyName);

      const { data, error } = await supabase
        .from('problem_reports')
        .select(`
          *,
          community_votes(user_id, vote_type),
          profiles:reported_by(full_name)
        `)
        .eq('status', WORKFLOW_STATUS.PENDING)
        .ilike('location', `%${rootCounty}%`)
        .order('priority_score', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(report => {
        const userVote = report.community_votes?.find((v: any) => v.user_id === user?.id);
        const upvotes = report.community_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0;
        const downvotes = report.community_votes?.filter((v: any) => v.vote_type === 'downvote').length || 0;

        return {
          ...report,
          user_vote: (userVote?.vote_type as 'upvote' | 'downvote') || null,
          reporter_name: (report as any).profiles?.full_name || 'Anonymous',
          upvotes,
          downvotes,
          can_vote: true,
          can_verify: true,
          is_in_county: true,
        };
      });

      setReports(formatted);
    } catch (error) {
      console.error(`Error fetching ${type} reports:`, error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (userProfile?.county) fetchCountyReports(userProfile.county, 'profile');
  }, [userProfile?.county, fetchCountyReports]);

  useEffect(() => {
    if (userLocation?.county) fetchCountyReports(userLocation.county, 'detected');
  }, [userLocation?.county, fetchCountyReports]);

  const fetchAllValidatedReports = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingAll(true);
      const { data: myVotes, error: votesError } = await supabase
        .from('community_votes')
        .select('report_id, created_at')
        .eq('user_id', user.id);

      if (votesError) throw votesError;
      if (!myVotes || myVotes.length === 0) {
        setAllValidatedReports([]);
        return;
      }

      const reportIds = myVotes.map(v => v.report_id);
      const voteOrderMap = new Map(myVotes.map(v => [v.report_id, new Date(v.created_at).getTime()]));

      const { data: reports, error: reportsError } = await supabase
        .from('problem_reports')
        .select(`
          *,
          community_votes(user_id, vote_type),
          profiles:reported_by(full_name)
        `)
        .in('id', reportIds);

      if (reportsError) throw reportsError;

      const profileRoot = userProfile?.county ? getRootCounty(userProfile.county) : null;
      const reportsWithVotes = (reports || []).map(report => {
        const reportCountyRoot = (report as any).county ? getRootCounty((report as any).county) : null;
        const isInCounty = profileRoot && reportCountyRoot ? profileRoot === reportCountyRoot : false;
        return {
          ...report,
          user_vote: (report.community_votes?.find((v: any) => v.user_id === user.id)?.vote_type as 'upvote' | 'downvote') || null,
          reporter_name: (report as any).profiles?.full_name || 'Anonymous',
          upvotes: report.community_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0,
          downvotes: report.community_votes?.filter((v: any) => v.vote_type === 'downvote').length || 0,
          can_vote: true,
          can_verify: true,
          is_in_county: isInCounty,
        };
      });

      reportsWithVotes.sort((a, b) => (voteOrderMap.get(b.id) ?? 0) - (voteOrderMap.get(a.id) ?? 0));
      setAllValidatedReports(reportsWithVotes);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingAll(false);
    }
  }, [user, userProfile?.county]);

  const handleVote = async (reportId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }
    setVotingState(prev => ({ ...prev, [reportId]: true }));
    try {
      const { error } = await supabase
        .from('community_votes')
        .upsert({ report_id: reportId, user_id: user.id, vote_type: voteType }, { onConflict: 'report_id,user_id' });

      if (error) throw error;

      const applyVoteUpdate = (r: ProblemReport): ProblemReport => {
        if (r.id !== reportId) return r;
        const wasUp = r.user_vote === 'upvote';
        const wasDown = r.user_vote === 'downvote';
        let newUp = r.upvotes + (voteType === 'upvote' ? 1 : 0) - (wasUp ? 1 : 0);
        let newDown = r.downvotes + (voteType === 'downvote' ? 1 : 0) - (wasDown ? 1 : 0);
        return { ...r, user_vote: voteType, upvotes: newUp, downvotes: newDown, priority_score: newUp - newDown };
      };

      setProfileCountyReports(prev => prev.map(applyVoteUpdate));
      setDetectedCountyReports(prev => prev.map(applyVoteUpdate));
      setAllValidatedReports(prev => prev.map(applyVoteUpdate));

      const statusResult = await WorkflowGuardService.checkAndUpdateStatusAfterVote(reportId);
      if (statusResult.statusChanged) {
        toast.success('Vote submitted! Threshold reached - moving to review.');
        setProfileCountyReports(prev => prev.filter(r => r.id !== reportId));
        setDetectedCountyReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        toast.success(`Vote submitted successfully`);
      }
      fetchAllValidatedReports();
    } catch (error) {
      console.error('Voting error:', error);
    } finally {
      setVotingState(prev => ({ ...prev, [reportId]: false }));
    }
  };

  useEffect(() => { fetchAllValidatedReports(); }, [fetchAllValidatedReports]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  const rawActiveReports = activeTab === 'votes' ? allValidatedReports : activeTab === 'profile' ? profileCountyReports : detectedCountyReports;
  const activeLoading = activeTab === 'votes' ? loadingAll : activeTab === 'profile' ? loadingProfile : loadingDetected;

  const filteredReports = React.useMemo(() => {
    return rawActiveReports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) || report.description.toLowerCase().includes(searchQuery.toLowerCase()) || report.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory || report.problem_type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [rawActiveReports, searchQuery, selectedCategory]);

  const availableCategories = React.useMemo(() => {
    const cats = new Set<string>();
    rawActiveReports.forEach(r => { if (r.category) cats.add(r.category); else if (r.problem_type) cats.add(r.problem_type); });
    return Array.from(cats).sort();
  }, [rawActiveReports]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-t-4 border-t-green-600">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Users className="h-6 w-6 mr-3 text-green-600" />
            Community Validation & Voting
          </CardTitle>
          <p className="text-gray-600">Help validate and prioritize community-reported problems in your area.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {isLocating ? <Badge variant="outline" className="text-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Detecting location...</Badge> :
              userCounty ? <Badge className="bg-green-100 text-green-800"><Navigation className="h-3 w-3 mr-1" /> County: {userCounty}</Badge> :
                <Badge variant="outline"><Info className="h-3 w-3 mr-1" /> County not set</Badge>}
          </div>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedCategory('all'); }} className="flex-1 min-w-[260px]">
          <TabsList className={`grid w-full bg-white shadow rounded-lg overflow-hidden ${showNationwide ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white" disabled={!userProfile?.county}>
              <MapPin className="h-4 w-4 mr-2" /> {userProfile?.county || 'My County'} ({profileCountyReports.length})
            </TabsTrigger>
            {showNationwide && (
              <>
                <TabsTrigger value="detected" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white" disabled={!userLocation?.county}>
                  <Navigation className="h-4 w-4 mr-2" /> {userLocation?.county || 'Detected'} ({detectedCountyReports.length})
                </TabsTrigger>
                <TabsTrigger value="votes" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <ThumbsUp className="h-4 w-4 mr-2" /> My Votes ({allValidatedReports.length})
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
        <Button
          variant={showNationwide ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const next = !showNationwide;
            setShowNationwide(next);
            if (!next) setActiveTab('profile');
          }}
          className="whitespace-nowrap"
        >
          <Globe2 className="h-4 w-4 mr-2" />
          {showNationwide ? 'Hide nationwide' : 'Show nationwide'}
        </Button>
      </div>
      {showNationwide && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Out-of-county votes are weighted at <strong>0.3x</strong> to keep local voices decisive on local issues.</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search problems..." className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 shadow-sm outline-none transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setSelectedCategory('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>All Categories</button>
          {availableCategories.map((cat) => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>{cat}</button>))}
        </div>
      </div>

      {activeLoading && filteredReports.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" /><div className="text-gray-500">Loading reports...</div></CardContent></Card>
      ) : filteredReports.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3><p className="text-gray-600">Try adjusting your filters.</p></CardContent></Card>
      ) : (
        <div className="grid gap-6">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} user={user} votingState={votingState} handleVote={handleVote} userLocation={userLocation} formatDate={formatDate} formatDistance={formatDistance} getPriorityColor={getPriorityColor} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReportCard = ({ report, user, votingState, handleVote, userLocation, formatDate, formatDistance, getPriorityColor }: any) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-slate-200 hover:border-l-green-500 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{report.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {report.distance_km != null && <Badge className="bg-blue-100 text-blue-800"><Navigation className="h-3 w-3 mr-1" /> {formatDistance(report.distance_km)} away</Badge>}
                  <Badge className={getPriorityColor(report.priority)}>{report.priority.toUpperCase()}</Badge>
                  <Badge variant="outline" className="bg-slate-50">{report.category || 'Other'}</Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={
                            report.is_in_county
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-help'
                              : 'bg-amber-50 text-amber-800 border-amber-200 cursor-help'
                          }
                        >
                          <Scale className="h-3 w-3 mr-1" />
                          {report.is_in_county ? '1.0× vote weight' : '0.3× vote weight'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs">
                        {report.is_in_county
                          ? 'This report is in your registered county — your vote counts at full weight.'
                          : 'This report is outside your registered county — your vote counts at 30% to keep local voices decisive on local issues.'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-gray-400">#{report.id.substring(0, 8)}</Badge>
            </div>
            <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">{report.description}</p>
            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-6 gap-y-2">
              <div className="flex items-center"><MapPin className="h-4 w-4 mr-1.5 text-red-400" /> {report.location}</div>
              <div className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-blue-400" /> {formatDate(report.created_at)}</div>
            </div>
            {report.photo_urls && report.photo_urls.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {report.photo_urls.slice(0, 4).map((url: string, index: number) => (
                  <img key={index} src={url} className="aspect-video object-cover rounded-md border" alt="Evidence" />
                ))}
              </div>
            )}
          </div>
          <div className="lg:w-64 bg-slate-50/50 p-6 flex flex-col justify-between">
            <div className="text-center space-y-4">
              <div className="inline-flex flex-col items-center">
                <div className="flex items-center gap-2 font-black text-2xl text-gray-900"><TrendingUp className="h-4 w-4 text-blue-600" /> {report.priority_score}</div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Priority Weight</span>
              </div>
              <div className="flex justify-between font-bold">
                <div className="text-green-600 flex items-center"><ThumbsUp className="h-4 w-4 mr-1" /> {report.upvotes}</div>
                <div className="text-red-500 flex items-center"><ThumbsDown className="h-4 w-4 mr-1" /> {report.downvotes}</div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase"><span>Threshold</span><span>{Math.min(report.upvotes + report.downvotes, MIN_VOTES_THRESHOLD)}/{MIN_VOTES_THRESHOLD}</span></div>
                <Progress value={Math.min(((report.upvotes + report.downvotes) / MIN_VOTES_THRESHOLD) * 100, 100)} className="h-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-6">
              <Button variant={report.user_vote === 'upvote' ? 'default' : 'outline'} size="sm" className={report.user_vote === 'upvote' ? 'bg-green-600' : ''} onClick={() => handleVote(report.id, 'upvote')} disabled={votingState[report.id] || !!report.user_vote}><ThumbsUp className="h-4 w-4 mr-1" /> Support</Button>
              <Button variant={report.user_vote === 'downvote' ? 'destructive' : 'outline'} size="sm" onClick={() => handleVote(report.id, 'downvote')} disabled={votingState[report.id] || !!report.user_vote}><ThumbsDown className="h-4 w-4 mr-1" /> Dispute</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityValidation;
