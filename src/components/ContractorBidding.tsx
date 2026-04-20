import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Briefcase, Award, Clock, Wallet, Users, Shield, FileText, CheckCircle, MapPin, Loader2, AlertCircle, Eye, Lock, Navigation, ChevronDown, Upload, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WorkflowGuardService, WORKFLOW_STATUS, MIN_VOTES_THRESHOLD } from '@/services/WorkflowGuardService';
import ProblemLocationModal from './contractor/ProblemLocationModal';

interface ProblemReport {
  id: string;
  title: string;
  description: string;
  location: string | null;
  coordinates: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  estimated_cost: number | null;
  priority_score: number | null;
  photo_urls: string[] | null;
  created_at: string | null;
  constituency: string | null;
  ward: string | null;
  bidding_status: string | null;
  bidding_start_date: string | null;
  bidding_end_date: string | null;
  bidding_extensions: number | null;
  min_bids_required: number | null;
  is_agpo_reserved: boolean | null;
  vote_count?: number;
}

interface ContractorBid {
  id: string;
  report_id: string;
  contractor_id: string;
  bid_amount: number;
  bid_bond_amount?: number;
  estimated_duration: number;
  proposal: string;
  technical_approach: string | null;
  materials_spec: string | null;
  safety_plan: string | null;
  quality_assurance: string | null;
  timeline_breakdown: string | null;
  status: string;
  submitted_at: string;
  problem_reports?: { title: string; location: string | null } | null;
}

const ContractorBidding = () => {
  const { user } = useAuth();
  const { contractorProfile, userProfile } = useProfile();
  const { toast } = useToast();

  const [allProblems, setAllProblems] = useState<ProblemReport[]>([]);
  const [myBids, setMyBids] = useState<ContractorBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<ProblemReport | null>(null);
  const [viewingProblem, setViewingProblem] = useState<ProblemReport | null>(null);
  const [locationProblem, setLocationProblem] = useState<ProblemReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [bidForm, setBidForm] = useState({
    amount: '',
    bidBondAmount: '',
    duration: '',
    proposal: '',
    technicalApproach: '',
    materialsSpec: '',
    timelineBreakdown: '',
    safetyPlan: '',
    qualityAssurance: ''
  });

  const [activeEnvelopeTab, setActiveEnvelopeTab] = useState('technical');
  const [bidBondFile, setBidBondFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: problemsData, error: problemsError } = await supabase
        .from('problem_reports')
        .select(`
          *,
          community_votes(vote_type)
        `)
        .in('status', [
          WORKFLOW_STATUS.PENDING,
          WORKFLOW_STATUS.UNDER_REVIEW,
          WORKFLOW_STATUS.APPROVED,
          WORKFLOW_STATUS.BIDDING_OPEN,
          WORKFLOW_STATUS.CONTRACTOR_SELECTED,
          WORKFLOW_STATUS.IN_PROGRESS
        ])
        .order('priority_score', { ascending: false });

      if (problemsError) throw problemsError;

      const problemsWithVotes = (problemsData || []).map(p => ({
        ...p,
        vote_count: p.community_votes?.length || 0
      }));

      setAllProblems(problemsWithVotes);

      if (user?.id) {
        const { data: bidsData, error: bidsError } = await supabase
          .from('contractor_bids')
          .select(`
            *,
            problem_reports(title, location)
          `)
          .eq('contractor_id', user.id)
          .order('submitted_at', { ascending: false });

        if (bidsError) throw bidsError;
        setMyBids(bidsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProblem || !user) return;

    if (selectedProblem.status !== WORKFLOW_STATUS.BIDDING_OPEN) {
      toast({
        title: "Cannot Submit Bid",
        description: "Bidding is not open for this project yet",
        variant: "destructive"
      });
      return;
    }

    if (!contractorProfile?.verified) {
      toast({
        title: "Verification Required",
        description: "Your contractor profile must be verified before you can submit bids. Please ensure your KRA PIN and business documents are updated.",
        variant: "destructive"
      });
      return;
    }

    // AGPO Enforcement
    if (selectedProblem.is_agpo_reserved && !contractorProfile?.agpo_category) {
      toast({
        title: "AGPO Reserved Project",
        description: "This project is reserved for Women, Youth, or PWD-owned enterprises. You must have a valid AGPO certificate to bid.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const bidAmount = parseFloat(bidForm.amount.replace(/,/g, ''));
      const bidBondAmount = parseFloat(bidForm.bidBondAmount.replace(/,/g, ''));

      // PPRA requirement: Bid Bond must be at least 0.5% of bid amount for large projects
      if (bidAmount > 5000000 && (!bidBondAmount || bidBondAmount < bidAmount * 0.005)) {
        toast({
          title: "Insufficient Bid Bond",
          description: "For projects over 5M KES, a bid bond of at least 0.5% is mandatory per PPRA guidelines.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('contractor_bids')
        .insert({
          report_id: selectedProblem.id,
          contractor_id: user.id,
          bid_amount: bidAmount,
          bid_bond_amount: bidBondAmount || null,
          estimated_duration: parseInt(bidForm.duration),
          proposal: bidForm.proposal,
          technical_approach: bidForm.technicalApproach || null,
          materials_spec: bidForm.materialsSpec || null,
          timeline_breakdown: bidForm.timelineBreakdown || null,
          safety_plan: bidForm.safetyPlan || null,
          quality_assurance: bidForm.qualityAssurance || null
        });

      if (error) throw error;

      try {
        await supabase.from('verification_audit_log' as any).insert({
          action_type: 'bid_submit',
          user_id: user.id,
          report_id: selectedProblem.id,
          result: 'allowed',
          metadata: { bid_amount: bidAmount, estimated_duration: parseInt(bidForm.duration) }
        });
      } catch { /* non-blocking */ }

      try {
        const companyName = contractorProfile?.company_name || userProfile?.full_name || 'A contractor';
        const { LiveNotificationService } = await import('@/services/LiveNotificationService');
        await LiveNotificationService.onBidSubmitted(
          selectedProblem.id,
          user.id,
          companyName,
          bidAmount
        );
      } catch (notifError) {
        console.warn('Bid notification failed (non-blocking):', notifError);
      }

      toast({
        title: "Bid submitted successfully!",
        description: "Your bid has been submitted and will be reviewed.",
      });

      setBidForm({
        amount: '',
        duration: '',
        proposal: '',
        technicalApproach: '',
        materialsSpec: '',
        timelineBreakdown: '',
        safetyPlan: '',
        qualityAssurance: ''
      });
      setSelectedProblem(null);
      fetchData();
    } catch (error: any) {
      console.error('Error submitting bid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit bid",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected': return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted':
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkflowStatusColor = (status: string | null) => {
    switch (status) {
      case WORKFLOW_STATUS.PENDING: return 'bg-gray-100 text-gray-800';
      case WORKFLOW_STATUS.UNDER_REVIEW: return 'bg-blue-100 text-blue-800';
      case WORKFLOW_STATUS.APPROVED: return 'bg-green-100 text-green-800';
      case WORKFLOW_STATUS.BIDDING_OPEN: return 'bg-purple-100 text-purple-800';
      case WORKFLOW_STATUS.CONTRACTOR_SELECTED: return 'bg-indigo-100 text-indigo-800';
      case WORKFLOW_STATUS.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkflowStatusLabel = (status: string | null) => {
    return WorkflowGuardService.getStatusLabel(status || WORKFLOW_STATUS.PENDING);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const hasAlreadyBid = (problemId: string) => {
    return myBids.some(bid => bid.report_id === problemId);
  };

  const canBid = (problem: ProblemReport) => {
    return problem.status === WORKFLOW_STATUS.BIDDING_OPEN && !hasAlreadyBid(problem.id);
  };

  const getWorkflowProgress = (status: string | null) => {
    const steps = [
      WORKFLOW_STATUS.PENDING,
      WORKFLOW_STATUS.UNDER_REVIEW,
      WORKFLOW_STATUS.APPROVED,
      WORKFLOW_STATUS.BIDDING_OPEN,
      WORKFLOW_STATUS.CONTRACTOR_SELECTED,
      WORKFLOW_STATUS.IN_PROGRESS
    ];
    const index = steps.indexOf(status as typeof steps[number]);
    return index >= 0 ? index : 0;
  };

  const biddingOpenProblems = allProblems.filter(p => p.status === WORKFLOW_STATUS.BIDDING_OPEN);
  const pipelineProblems = allProblems.filter(p => p.status !== WORKFLOW_STATUS.BIDDING_OPEN);

  const activeReports = activeTab === 'available' ? biddingOpenProblems : activeTab === 'pipeline' ? pipelineProblems : [];
  const categories = ['All', ...Array.from(new Set(activeReports.map(p => p.category || 'Other'))).sort()];
  const filteredReports = selectedCategory === 'All'
    ? activeReports
    : activeReports.filter(p => (p.category || 'Other') === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-primary">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center text-2xl">
            <Briefcase className="h-6 w-6 mr-3 text-primary" />
            Reported Problems & Bidding Opportunities
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            View community-reported problems. You can only submit bids on projects where bidding is open.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Contractor Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-3">
                  {contractorProfile?.company_name?.substring(0, 2).toUpperCase() || userProfile?.full_name?.substring(0, 2).toUpperCase() || 'CO'}
                </div>
                <h3 className="font-semibold">{contractorProfile?.company_name || 'Not Set'}</h3>
                <div className="flex items-center justify-center mt-2">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-lg font-semibold">{contractorProfile?.average_rating || 0}</span>
                  <span className="text-sm text-muted-foreground ml-1">({contractorProfile?.previous_projects_count || 0} projects)</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {contractorProfile?.kra_pin && (
                  <div>
                    <span className="font-medium text-foreground">KRA PIN:</span>
                    <div className="text-muted-foreground">{contractorProfile.kra_pin}</div>
                  </div>
                )}
                {contractorProfile?.years_in_business && (
                  <div>
                    <span className="font-medium text-foreground">Experience:</span>
                    <div className="text-muted-foreground">{contractorProfile.years_in_business} years</div>
                  </div>
                )}
              </div>

              <Badge className={contractorProfile?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {contractorProfile?.verified ? 'Verified Contractor' : 'Pending Verification'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedCategory('All'); }} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-background shadow-lg">
              <TabsTrigger value="available" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Open Bidding ({biddingOpenProblems.length})
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Pipeline ({pipelineProblems.length})
              </TabsTrigger>
              <TabsTrigger value="mybids" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                My Bids ({myBids.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-6">
              {/* Category Chips */}
              {biddingOpenProblems.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {filteredReports.length === 0 ? (
                <Card className="shadow-lg border-2 border-dashed">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects found in this category</h3>
                    <p className="text-muted-foreground">Try selecting another category or check the Pipeline tab.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {filteredReports.map((problem) => (
                    <Card key={problem.id} className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary overflow-hidden">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-xl font-semibold">{problem.title}</h3>
                            <div className="flex gap-2">
                              {problem.is_agpo_reserved && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex gap-1 items-center">
                                  <Award className="h-3 w-3" /> AGPO Reserved
                                </Badge>
                              )}
                              <Badge className="bg-purple-100 text-purple-800">Open Bidding</Badge>
                              <Badge className={getPriorityColor(problem.priority)}>{problem.priority || 'Medium'}</Badge>
                            </div>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">{problem.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <button className="flex items-center hover:text-primary transition-colors" onClick={() => setLocationProblem(problem)}>
                              <MapPin className="h-4 w-4 mr-1" />
                              {problem.location || 'N/A'}
                              <Navigation className="h-3 w-3 ml-1 text-blue-500" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
                            <div className="text-center">
                              <Wallet className="h-4 w-4 mx-auto mb-1 text-green-600" />
                              <div className="font-bold text-green-600 text-sm">{problem.estimated_cost ? formatCurrency(problem.estimated_cost) : 'TBD'}</div>
                              <div className="text-[10px] uppercase text-muted-foreground">Est. Cost</div>
                            </div>
                            <div className="text-center border-x">
                              <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                              <div className="font-bold text-primary text-sm">{problem.vote_count || 0}</div>
                              <div className="text-[10px] uppercase text-muted-foreground">Votes</div>
                            </div>
                            <div className="text-center">
                              <Clock className="h-4 w-4 mx-auto mb-1 text-secondary" />
                              <div className="font-bold text-secondary text-sm">{problem.bidding_end_date ? new Date(problem.bidding_end_date).toLocaleDateString() : 'N/A'}</div>
                              <div className="text-[10px] uppercase text-muted-foreground">Deadline</div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t">
                            <Button variant="outline" size="sm" onClick={() => setViewingProblem(problem)}>
                              <Eye className="h-4 w-4 mr-2" /> Details
                            </Button>
                            {hasAlreadyBid(problem.id) ? (
                              <Badge className="bg-blue-100 text-blue-800 px-4 py-2">Bid Submitted</Badge>
                            ) : (
                              <Button onClick={() => setSelectedProblem(problem)}>Submit Bid</Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-6">
              {/* Category Chips */}
              {pipelineProblems.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {filteredReports.length === 0 ? (
                <Card className="shadow-lg border-2 border-dashed">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items in this category</h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredReports.map((problem) => (
                    <Card key={problem.id} className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-400">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{problem.title}</h3>
                              <Badge className={getWorkflowStatusColor(problem.status)}>{getWorkflowStatusLabel(problem.status)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{problem.description}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setViewingProblem(problem)}>
                            <Eye className="h-4 w-4 mr-1" /> Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mybids" className="space-y-6">
              {myBids.length === 0 ? (
                <Card className="shadow-lg h-40 flex items-center justify-center">
                  <p className="text-muted-foreground">You haven't submitted any bids yet.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {myBids.map((bid) => (
                    <Card key={bid.id} className={`shadow-md border-l-4 ${bid.status === 'selected' ? 'border-l-green-500 ring-1 ring-green-100' : 'border-l-blue-400'}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900">{bid.problem_reports?.title}</h4>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground font-medium">
                                <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-green-600" /> {formatCurrency(bid.bid_amount)}</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-600" /> {bid.estimated_duration} days</span>
                              </div>
                            </div>
                            <Badge className={getStatusColor(bid.status)}>{bid.status.toUpperCase()}</Badge>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proposal Overview</h5>
                            <p className="text-sm text-slate-700 leading-relaxed">{bid.proposal}</p>

                            {(bid.technical_approach || bid.materials_spec || bid.timeline_breakdown) && (
                              <details className="mt-3 pt-3 border-t border-slate-200 group">
                                <summary className="text-[10px] font-black text-blue-600 cursor-pointer flex items-center justify-between hover:text-blue-700 uppercase tracking-widest">
                                  Show Full Proposal Details
                                  <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 animate-in fade-in slide-in-from-top-1">
                                  {bid.technical_approach && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Methodology</span>
                                      <p className="text-xs text-slate-600">{bid.technical_approach}</p>
                                    </div>
                                  )}
                                  {bid.materials_spec && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Materials</span>
                                      <p className="text-xs text-slate-600">{bid.materials_spec}</p>
                                    </div>
                                  )}
                                  {bid.safety_plan && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Safety Plan</span>
                                      <p className="text-xs text-slate-600">{bid.safety_plan}</p>
                                    </div>
                                  )}
                                  {bid.quality_assurance && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Quality Plan</span>
                                      <p className="text-xs text-slate-600">{bid.quality_assurance}</p>
                                    </div>
                                  )}
                                  {bid.timeline_breakdown && (
                                    <div className="space-y-1 col-span-full">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Timeline Breakdown</span>
                                      <p className="text-xs text-slate-600">{bid.timeline_breakdown}</p>
                                    </div>
                                  )}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bid Submission Dialog */}
      <Dialog open={!!selectedProblem} onOpenChange={() => setSelectedProblem(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-2xl max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Two-Envelope Bid Submission
            </DialogTitle>
            <DialogDescription>
              Submit your Technical and Financial proposals for: {selectedProblem?.title}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeEnvelopeTab} onValueChange={setActiveEnvelopeTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="technical">1. Technical Proposal</TabsTrigger>
              <TabsTrigger value="financial">2. Financial Bid</TabsTrigger>
            </TabsList>

            <form onSubmit={handleBidSubmit} className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              <TabsContent value="technical" className="space-y-4 mt-0">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-2 items-start mb-4">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    <strong>Technical Evaluation:</strong> Your technical score must exceed 70% for your financial bid to be opened by the procurement committee.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Project Proposal <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={bidForm.proposal}
                    onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                    placeholder="High-level summary of your approach..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Technical Methodology</Label>
                    <Textarea
                      value={bidForm.technicalApproach}
                      onChange={(e) => setBidForm({ ...bidForm, technicalApproach: e.target.value })}
                      placeholder="Explain how you will execute the work..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Materials Specification</Label>
                    <Textarea
                      value={bidForm.materialsSpec}
                      onChange={(e) => setBidForm({ ...bidForm, materialsSpec: e.target.value })}
                      placeholder="List key materials and standards..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Safety & Health Plan</Label>
                    <Textarea
                      value={bidForm.safetyPlan}
                      onChange={(e) => setBidForm({ ...bidForm, safetyPlan: e.target.value })}
                      placeholder="Risk mitigation and safety measures..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quality Assurance</Label>
                    <Textarea
                      value={bidForm.qualityAssurance}
                      onChange={(e) => setBidForm({ ...bidForm, qualityAssurance: e.target.value })}
                      placeholder="Quality control and inspection process..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timeline Breakdown</Label>
                  <Textarea
                    value={bidForm.timelineBreakdown}
                    onChange={(e) => setBidForm({ ...bidForm, timelineBreakdown: e.target.value })}
                    placeholder="Phase-by-phase delivery schedule..."
                    rows={2}
                  />
                </div>

                <Button type="button" className="w-full" onClick={() => setActiveEnvelopeTab('financial')}>
                  Continue to Financial Bid <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </TabsContent>

              <TabsContent value="financial" className="space-y-6 mt-0 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bid Amount (KES) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        value={bidForm.amount}
                        onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                        placeholder="500,000"
                        required
                        className="pl-9"
                      />
                      <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Execution Duration (Days) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={bidForm.duration}
                        onChange={(e) => setBidForm({ ...bidForm, duration: e.target.value })}
                        placeholder="30"
                        required
                        className="pl-9"
                      />
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Bid Security (Bid Bond)</Label>
                    <Badge variant="outline" className="bg-white">Legal Requirement</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Guarantee Amount (KES)</Label>
                      <Input
                        value={bidForm.bidBondAmount}
                        onChange={(e) => setBidForm({ ...bidForm, bidBondAmount: e.target.value })}
                        placeholder="e.g. 50,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Upload Guarantee Bond (PDF)</Label>
                      <label className="flex items-center justify-center gap-2 h-10 px-3 rounded-md border border-input bg-white text-sm cursor-pointer hover:bg-slate-50 transition-colors">
                        {bidBondFile ? (
                          <><CheckCircle className="h-4 w-4 text-green-600" /> {bidBondFile.name.substring(0, 15)}...</>
                        ) : (
                          <><Upload className="h-4 w-4 text-muted-foreground" /> Select File</>
                        )}
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => setBidBondFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    * Per PPADA 2015, bid security from authorized banks or insurance companies is required for projects valued over a certain threshold.
                  </p>
                </div>

                <div className="flex gap-3 border-t pt-4 sticky bottom-0 bg-background pb-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectedProblem(null)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} className="flex-1 bg-primary text-primary-foreground">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Final Bid Package"}
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingProblem} onOpenChange={() => setViewingProblem(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-2xl max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingProblem?.title}</DialogTitle>
          </DialogHeader>
          {viewingProblem && (
            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              <div className="flex gap-2">
                <Badge className={getWorkflowStatusColor(viewingProblem.status)}>{getWorkflowStatusLabel(viewingProblem.status)}</Badge>
                <Badge className={getPriorityColor(viewingProblem.priority)}>{viewingProblem.priority}</Badge>
              </div>
              <div>
                <Label className="text-xs uppercase font-bold text-muted-foreground">Description</Label>
                <p className="text-gray-700 mt-1 bg-slate-50 p-4 rounded-lg">{viewingProblem.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-xs font-bold block mb-1">Location</Label>
                  <p className="text-sm font-medium">{viewingProblem.location || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-xs font-bold block mb-1">Estimated Cost</Label>
                  <p className="text-sm font-bold text-green-700">{viewingProblem.estimated_cost ? formatCurrency(viewingProblem.estimated_cost) : 'TBD'}</p>
                </div>
              </div>
              {viewingProblem.photo_urls && viewingProblem.photo_urls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Evidence Photos</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {viewingProblem.photo_urls.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener" className="aspect-video rounded-xl overflow-hidden border">
                        <img src={url} className="w-full h-full object-cover" alt="Evidence" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-4">
                {canBid(viewingProblem) ? (
                  <Button className="w-full h-12 text-lg font-bold" onClick={() => { setViewingProblem(null); setSelectedProblem(viewingProblem); }}>
                    Submit Bid Now
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">Bidding is closed for this status: {getWorkflowStatusLabel(viewingProblem.status)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProblemLocationModal isOpen={!!locationProblem} onClose={() => setLocationProblem(null)} problem={locationProblem} />
    </div>
  );
};

export default ContractorBidding;