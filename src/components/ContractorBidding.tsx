import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Briefcase, Award, Clock, DollarSign, Users, Shield, FileText, CheckCircle, MapPin, Loader2, AlertCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  
  const [problems, setProblems] = useState<ProblemReport[]>([]);
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
      
      // Fetch approved problems that are open for bidding (with bidding window info)
      const { data: problemsData, error: problemsError } = await supabase
        .from('problem_reports')
        .select('*')
        .eq('status', 'approved')
        .order('priority_score', { ascending: false });

      if (problemsError) throw problemsError;
      setProblems(problemsData || []);

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
            Reported Problems - Available for Bidding
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            View community-reported problems and submit your bids to fix them.
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
            <TabsList className="grid w-full grid-cols-2 bg-background shadow-lg">
              <TabsTrigger 
                value="available" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Available Problems ({problems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="mybids" 
                className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                My Bids ({myBids.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-6">
              {problems.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Problems Available</h3>
                    <p className="text-muted-foreground">There are no approved problems available for bidding at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {problems.map((problem) => (
                    <Card key={problem.id} className="shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-xl font-semibold">{problem.title}</h3>
                            <div className="flex gap-2">
                              <Badge className={getPriorityColor(problem.priority)}>
                                {problem.priority || 'Medium'} Priority
                              </Badge>
                              {problem.category && (
                                <Badge variant="outline">{problem.category}</Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-muted-foreground line-clamp-2">{problem.description}</p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {problem.location || 'Location not specified'}
                            </div>
                            {problem.constituency && (
                              <span>{problem.constituency}</span>
                            )}
                            {problem.ward && (
                              <span>{problem.ward}</span>
                            )}
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
                              {problem.photo_urls.length > 3 && (
                                <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                                  +{problem.photo_urls.length - 3} more
                                </div>
                              )}
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
                              <div className="font-semibold text-primary">{problem.priority_score || 0}</div>
                              <div className="text-xs text-muted-foreground">Community Votes</div>
                            </div>
                            <div className="text-center">
                              <Clock className="h-5 w-5 mx-auto mb-1 text-secondary" />
                              <div className="font-semibold text-secondary">
                                {problem.created_at ? new Date(problem.created_at).toLocaleDateString() : 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">Reported</div>
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
                    <Card key={bid.id} className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-semibold">{bid.problem_reports?.title || 'Unknown Project'}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Bid: <span className="font-semibold text-green-600">{formatCurrency(bid.bid_amount)}</span></span>
                              <span>Duration: {bid.estimated_duration} days</span>
                              <span>Submitted: {new Date(bid.submitted_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge className={getStatusColor(bid.status)}>
                                {bid.status.replace('_', ' ').charAt(0).toUpperCase() + bid.status.slice(1)}
                              </Badge>
                              {bid.problem_reports?.location && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {bid.problem_reports.location}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{bid.proposal}</p>
                          </div>
                          
                          {bid.status === 'selected' && (
                            <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
                              View Contract
                            </Button>
                          )}
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

      {/* View Problem Details Modal */}
      <Dialog open={!!viewingProblem} onOpenChange={() => setViewingProblem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingProblem?.title}</DialogTitle>
            <DialogDescription>
              Reported on {viewingProblem?.created_at ? new Date(viewingProblem.created_at).toLocaleDateString() : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          {viewingProblem && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{viewingProblem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="mt-1">{viewingProblem.location || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="mt-1">{viewingProblem.category || 'General'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <Badge className={`mt-1 ${getPriorityColor(viewingProblem.priority)}`}>
                    {viewingProblem.priority || 'Medium'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estimated Cost</Label>
                  <p className="mt-1 font-semibold text-green-600">
                    {viewingProblem.estimated_cost ? formatCurrency(viewingProblem.estimated_cost) : 'To be determined'}
                  </p>
                </div>
              </div>

              {viewingProblem.photo_urls && viewingProblem.photo_urls.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Photos</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {viewingProblem.photo_urls.map((url, index) => (
                      <img 
                        key={index} 
                        src={url} 
                        alt={`Problem ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingProblem(null)}>
                  Close
                </Button>
                {!hasAlreadyBid(viewingProblem.id) && (
                  <Button onClick={() => {
                    setSelectedProblem(viewingProblem);
                    setViewingProblem(null);
                  }}>
                    Submit Bid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bid Submission Modal */}
      <Dialog open={!!selectedProblem} onOpenChange={() => setSelectedProblem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Submit Bid
            </DialogTitle>
            <DialogDescription>
              {selectedProblem?.title}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleBidSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Bid Amount (KES) *</Label>
                <Input
                  id="amount"
                  value={bidForm.amount}
                  onChange={(e) => setBidForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g., 2,400,000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Estimated Duration (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={bidForm.duration}
                  onChange={(e) => setBidForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 21"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="proposal">Proposal *</Label>
              <Textarea
                id="proposal"
                value={bidForm.proposal}
                onChange={(e) => setBidForm(prev => ({ ...prev, proposal: e.target.value }))}
                placeholder="Describe your approach to completing this project..."
                className="h-24"
                required
              />
            </div>

            <div>
              <Label htmlFor="technicalApproach">Technical Approach</Label>
              <Textarea
                id="technicalApproach"
                value={bidForm.technicalApproach}
                onChange={(e) => setBidForm(prev => ({ ...prev, technicalApproach: e.target.value }))}
                placeholder="Describe the technical methodology you'll use..."
                className="h-24"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setSelectedProblem(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Bid'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractorBidding;
