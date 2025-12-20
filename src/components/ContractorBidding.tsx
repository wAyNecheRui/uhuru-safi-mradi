import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Briefcase, Award, Clock, DollarSign, Users, Shield, FileText, CheckCircle, MapPin, Loader2, AlertCircle, Eye, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WorkflowGuardService, WORKFLOW_STATUS, MIN_VOTES_THRESHOLD } from '@/services/WorkflowGuardService';

interface ProblemReport {
  id: string;
  title: string;
  description: string;
  location: string | null;
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
  bid_amount: number;
  estimated_duration: number;
  proposal: string;
  technical_approach: string | null;
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
  const [submitting, setSubmitting] = useState(false);
  
  const [bidForm, setBidForm] = useState({
    amount: '',
    duration: '',
    proposal: '',
    technicalApproach: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL reported problems (not just bidding_open) so contractors can see the pipeline
      // Include vote counts
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
      
      // Calculate vote counts
      const problemsWithVotes = (problemsData || []).map(p => ({
        ...p,
        vote_count: p.community_votes?.length || 0
      }));
      
      setAllProblems(problemsWithVotes);

      // Fetch contractor's bids
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

    // Validate that bidding is open
    if (selectedProblem.status !== WORKFLOW_STATUS.BIDDING_OPEN) {
      toast({
        title: "Cannot Submit Bid",
        description: "Bidding is not open for this project yet",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('contractor_bids')
        .insert({
          report_id: selectedProblem.id,
          contractor_id: user.id,
          bid_amount: parseFloat(bidForm.amount.replace(/,/g, '')),
          estimated_duration: parseInt(bidForm.duration),
          proposal: bidForm.proposal,
          technical_approach: bidForm.technicalApproach || null
        });

      if (error) throw error;

      toast({
        title: "Bid submitted successfully!",
        description: "Your bid has been submitted and will be reviewed.",
      });

      setBidForm({
        amount: '',
        duration: '',
        proposal: '',
        technicalApproach: ''
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

  // Filter problems for available (bidding_open) and pipeline (all others)
  const biddingOpenProblems = allProblems.filter(p => p.status === WORKFLOW_STATUS.BIDDING_OPEN);
  const pipelineProblems = allProblems.filter(p => p.status !== WORKFLOW_STATUS.BIDDING_OPEN);

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
                {userProfile?.location && (
                  <div>
                    <span className="font-medium text-foreground">Location:</span>
                    <div className="text-muted-foreground">{userProfile.location}</div>
                  </div>
                )}
              </div>

              {contractorProfile?.specialization && contractorProfile.specialization.length > 0 && (
                <div>
                  <span className="font-medium text-foreground text-sm">Specialties:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contractorProfile.specialization.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Badge className={contractorProfile?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {contractorProfile?.verified ? 'Verified Contractor' : 'Pending Verification'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="available" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-background shadow-lg">
              <TabsTrigger 
                value="available" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Open for Bidding ({biddingOpenProblems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="pipeline" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Project Pipeline ({pipelineProblems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="mybids" 
                className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                My Bids ({myBids.length})
              </TabsTrigger>
            </TabsList>

            {/* Available for Bidding Tab */}
            <TabsContent value="available" className="space-y-6">
              {biddingOpenProblems.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Projects Open for Bidding</h3>
                    <p className="text-muted-foreground">Check the Pipeline tab to see upcoming projects that may open for bidding soon.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {biddingOpenProblems.map((problem) => (
                    <Card key={problem.id} className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-purple-500">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-xl font-semibold">{problem.title}</h3>
                            <div className="flex gap-2">
                              <Badge className="bg-purple-100 text-purple-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Open for Bidding
                              </Badge>
                              <Badge className={getPriorityColor(problem.priority)}>
                                {problem.priority || 'Medium'} Priority
                              </Badge>
                            </div>
                          </div>

                          <p className="text-muted-foreground line-clamp-2">{problem.description}</p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {problem.location || 'Location not specified'}
                            </div>
                          </div>

                          {problem.photo_urls && problem.photo_urls.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto">
                              {problem.photo_urls.slice(0, 3).map((url, index) => (
                                <img 
                                  key={index} 
                                  src={url} 
                                  alt={`Problem ${index + 1}`}
                                  className="h-20 w-20 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                              <div className="font-semibold text-green-600">
                                {problem.estimated_cost ? formatCurrency(problem.estimated_cost) : 'TBD'}
                              </div>
                              <div className="text-xs text-muted-foreground">Estimated Cost</div>
                            </div>
                            <div className="text-center">
                              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                              <div className="font-semibold text-primary">{problem.vote_count || 0}</div>
                              <div className="text-xs text-muted-foreground">Community Votes</div>
                            </div>
                            <div className="text-center">
                              <Clock className="h-5 w-5 mx-auto mb-1 text-secondary" />
                              <div className="font-semibold text-secondary">
                                {problem.bidding_end_date ? new Date(problem.bidding_end_date).toLocaleDateString() : 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">Bidding Deadline</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingProblem(problem)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <div className="flex gap-2">
                              {hasAlreadyBid(problem.id) ? (
                                <Badge className="bg-blue-100 text-blue-800">Bid Submitted</Badge>
                              ) : (
                                <Button
                                  onClick={() => setSelectedProblem(problem)}
                                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                                >
                                  Submit Bid
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pipeline Tab - Shows all stages */}
            <TabsContent value="pipeline" className="space-y-6">
              <Card className="shadow-lg mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Projects below are in various stages of the approval process. You can only bid once a project status changes to "Open for Bidding".</span>
                  </div>
                </CardContent>
              </Card>
              
              {pipelineProblems.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Projects in Pipeline</h3>
                    <p className="text-muted-foreground">New community-reported problems will appear here as they progress through the approval workflow.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pipelineProblems.map((problem) => (
                    <Card key={problem.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{problem.title}</h3>
                              <Badge className={getWorkflowStatusColor(problem.status)}>
                                {getWorkflowStatusLabel(problem.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{problem.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {problem.location || 'N/A'}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {problem.vote_count || 0} votes
                              </span>
                              {problem.estimated_cost && (
                                <span className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(problem.estimated_cost)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {/* Workflow Progress */}
                            <div className="flex items-center gap-1">
                              {[0, 1, 2, 3].map((step) => (
                                <div
                                  key={step}
                                  className={`w-2 h-2 rounded-full ${
                                    step <= getWorkflowProgress(problem.status) 
                                      ? 'bg-primary' 
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            
                            {problem.status === WORKFLOW_STATUS.PENDING && (
                              <span className="text-xs text-muted-foreground">
                                Needs {MIN_VOTES_THRESHOLD - (problem.vote_count || 0)} more votes
                              </span>
                            )}
                            {problem.status === WORKFLOW_STATUS.UNDER_REVIEW && (
                              <span className="text-xs text-muted-foreground">
                                Awaiting government approval
                              </span>
                            )}
                            {problem.status === WORKFLOW_STATUS.APPROVED && (
                              <span className="text-xs text-muted-foreground">
                                Bidding opening soon
                              </span>
                            )}
                            {problem.status === WORKFLOW_STATUS.CONTRACTOR_SELECTED && (
                              <span className="text-xs text-green-600">
                                Contractor assigned
                              </span>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingProblem(problem)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Bids Tab */}
            <TabsContent value="mybids" className="space-y-6">
              {myBids.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Bids Yet</h3>
                    <p className="text-muted-foreground">You haven't submitted any bids. Browse available problems and submit your first bid!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {myBids.map((bid) => (
                    <Card key={bid.id} className="shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {bid.problem_reports?.title || 'Project'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {bid.problem_reports?.location || 'Location not specified'}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm">
                                <DollarSign className="h-4 w-4 inline mr-1 text-green-600" />
                                {formatCurrency(bid.bid_amount)}
                              </span>
                              <span className="text-sm">
                                <Clock className="h-4 w-4 inline mr-1 text-blue-600" />
                                {bid.estimated_duration} days
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(bid.status)}>
                              {bid.status === 'selected' && <Award className="h-3 w-3 mr-1" />}
                              {bid.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(bid.submitted_at).toLocaleDateString()}
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
        </div>
      </div>

      {/* Bid Submission Dialog */}
      <Dialog open={!!selectedProblem} onOpenChange={() => setSelectedProblem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Bid for: {selectedProblem?.title}</DialogTitle>
            <DialogDescription>
              Provide your proposal details for this project.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleBidSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Bid Amount (KES) *</Label>
                <Input
                  id="amount"
                  type="text"
                  value={bidForm.amount}
                  onChange={(e) => setBidForm({...bidForm, amount: e.target.value})}
                  placeholder="e.g., 500,000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Estimated Duration (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={bidForm.duration}
                  onChange={(e) => setBidForm({...bidForm, duration: e.target.value})}
                  placeholder="e.g., 30"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="proposal">Project Proposal *</Label>
              <Textarea
                id="proposal"
                value={bidForm.proposal}
                onChange={(e) => setBidForm({...bidForm, proposal: e.target.value})}
                placeholder="Describe your approach to solving this problem..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="technicalApproach">Technical Approach (optional)</Label>
              <Textarea
                id="technicalApproach"
                value={bidForm.technicalApproach}
                onChange={(e) => setBidForm({...bidForm, technicalApproach: e.target.value})}
                placeholder="Detail your technical methodology and implementation plan..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline" 
                className="flex-1"
                onClick={() => setSelectedProblem(null)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Submitting...' : 'Submit Bid'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingProblem} onOpenChange={() => setViewingProblem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingProblem?.title}</DialogTitle>
          </DialogHeader>
          
          {viewingProblem && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getWorkflowStatusColor(viewingProblem.status)}>
                  {getWorkflowStatusLabel(viewingProblem.status)}
                </Badge>
                <Badge className={getPriorityColor(viewingProblem.priority)}>
                  {viewingProblem.priority || 'Medium'} Priority
                </Badge>
                {viewingProblem.category && (
                  <Badge variant="outline">{viewingProblem.category}</Badge>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{viewingProblem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Location</h4>
                  <p className="text-muted-foreground">{viewingProblem.location || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Estimated Cost</h4>
                  <p className="text-muted-foreground">
                    {viewingProblem.estimated_cost ? formatCurrency(viewingProblem.estimated_cost) : 'TBD'}
                  </p>
                </div>
              </div>

              {viewingProblem.photo_urls && viewingProblem.photo_urls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Evidence Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingProblem.photo_urls.map((url, index) => (
                      <img 
                        key={index} 
                        src={url} 
                        alt={`Problem ${index + 1}`}
                        className="aspect-square object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                {canBid(viewingProblem) ? (
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setViewingProblem(null);
                      setSelectedProblem(viewingProblem);
                    }}
                  >
                    Submit Bid for This Project
                  </Button>
                ) : hasAlreadyBid(viewingProblem.id) ? (
                  <Badge className="bg-blue-100 text-blue-800 w-full justify-center py-2">
                    You have already submitted a bid for this project
                  </Badge>
                ) : (
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <Lock className="h-5 w-5 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      Bidding is not open yet. Current status: {getWorkflowStatusLabel(viewingProblem.status)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractorBidding;