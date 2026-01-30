import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, XCircle, AlertCircle, Users, MapPin, 
  Camera, DollarSign, Clock, FileText, Shield,
  ThumbsUp, ThumbsDown, Loader2, MessageSquare, Gavel, Play
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkflowGuardService, MIN_VOTES_THRESHOLD, WORKFLOW_STATUS } from '@/services/WorkflowGuardService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

const GovernmentApprovalDashboard = () => {
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [assignedCounties, setAssignedCounties] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    try {
      // Get current user's assigned counties
      const { data: { user } } = await supabase.auth.getUser();
      
      let counties: string[] = [];
      if (user) {
        const { data: govProfile } = await supabase
          .from('government_profiles')
          .select('assigned_counties')
          .eq('user_id', user.id)
          .single();
        
        counties = govProfile?.assigned_counties || [];
        setAssignedCounties(counties);
      }

      // Build query - filter by assigned counties if set
      let query = supabase
        .from('problem_reports')
        .select(`
          *,
          community_votes(vote_type)
        `)
        .eq('status', WORKFLOW_STATUS.UNDER_REVIEW)
        .order('priority_score', { ascending: false });

      // If government official has assigned counties, filter by those
      if (counties.length > 0) {
        query = query.or(
          counties.map(county => `location.ilike.%${county}%`).join(',')
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      const reportsWithVotes = data?.map(report => ({
        ...report,
        upvotes: report.community_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0,
        downvotes: report.community_votes?.filter((v: any) => v.vote_type === 'downvote').length || 0,
        totalVotes: report.community_votes?.length || 0
      })) || [];

      setPendingReports(reportsWithVotes);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatus = (report: any) => {
    const checks = {
      communityVotes: report.totalVotes >= MIN_VOTES_THRESHOLD,
      gpsValidation: !!report.gps_coordinates || !!report.coordinates,
      mediaEvidence: (report.photo_urls?.length > 0) || (report.video_urls?.length > 0),
      budgetFeasibility: !!report.estimated_cost && report.estimated_cost > 0
    };

    return checks;
  };

  const handleApproval = async (reportId: string) => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast({
        title: "Budget Required",
        description: "Please enter a valid budget amount",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const result = await WorkflowGuardService.approveReport(reportId, parseFloat(budgetAmount));

      if (!result.success) {
        toast({
          title: "Cannot Approve",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Report Approved",
        description: "The report has been approved. You can now open it for bidding.",
      });

      setShowApproveDialog(false);
      setBudgetAmount('');
      setSelectedReport(null);
      fetchPendingReports();
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process the approval",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejection = async (reportId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('problem_reports')
        .update({
          status: WORKFLOW_STATUS.REJECTED,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report Rejected",
        description: "The report has been rejected."
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedReport(null);
      fetchPendingReports();
    } catch (error) {
      console.error('Error processing rejection:', error);
      toast({
        title: "Error",
        description: "Failed to reject the report",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Project Approvals' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Approval Dashboard</h1>
            <p className="text-gray-600">
              Review and approve citizen-reported problems that have received {MIN_VOTES_THRESHOLD}+ community votes
            </p>
          </div>

          {/* Workflow Status Explanation */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Workflow Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-800">1. Pending</Badge>
                  <span className="text-gray-600">Citizen report</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">2. Under Review</Badge>
                  <span className="text-gray-600">{MIN_VOTES_THRESHOLD}+ votes reached</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">3. Approved</Badge>
                  <span className="text-gray-600">Government approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800">4. Bidding</Badge>
                  <span className="text-gray-600">Contractors bid</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <p className="text-blue-800">
                  <strong>{pendingReports.length}</strong> reports with {MIN_VOTES_THRESHOLD}+ votes awaiting your review. 
                  Verify all checklist items before approval.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {pendingReports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Ready for Approval</h3>
                  <p className="text-gray-600">
                    Reports need at least {MIN_VOTES_THRESHOLD} community votes before they appear here for government review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingReports.map((report) => {
                const verification = getVerificationStatus(report);
                const allChecked = Object.values(verification).every(v => v);
                
                return (
                  <Card key={report.id} className="shadow-lg border-l-4 border-l-blue-500">
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={WorkflowGuardService.getStatusColor(report.status)}>
                              {WorkflowGuardService.getStatusLabel(report.status)}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{report.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            {report.location || 'Location not specified'}
                          </div>
                        </div>
                        <Badge className={`${report.priority === 'urgent' ? 'bg-red-100 text-red-800' : 
                          report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                          {report.priority?.toUpperCase() || 'MEDIUM'} Priority
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <p className="text-gray-700">{report.description}</p>
                      
                      {/* Verification Checklist */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                          Verification Checklist (All Must Pass)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`flex items-center gap-3 p-3 rounded-lg ${
                            verification.communityVotes ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            {verification.communityVotes ? 
                              <CheckCircle className="h-5 w-5 text-green-600" /> : 
                              <XCircle className="h-5 w-5 text-red-600" />
                            }
                            <div>
                              <p className="font-medium">Community Votes (min {MIN_VOTES_THRESHOLD})</p>
                              <p className="text-sm text-gray-600">
                                {report.totalVotes} votes ({report.upvotes} up, {report.downvotes} down)
                              </p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center gap-3 p-3 rounded-lg ${
                            verification.gpsValidation ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            {verification.gpsValidation ? 
                              <CheckCircle className="h-5 w-5 text-green-600" /> : 
                              <XCircle className="h-5 w-5 text-red-600" />
                            }
                            <div>
                              <p className="font-medium">GPS Validation</p>
                              <p className="text-sm text-gray-600">
                                {verification.gpsValidation ? 'Coordinates verified' : 'No GPS data'}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center gap-3 p-3 rounded-lg ${
                            verification.mediaEvidence ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            {verification.mediaEvidence ? 
                              <CheckCircle className="h-5 w-5 text-green-600" /> : 
                              <XCircle className="h-5 w-5 text-red-600" />
                            }
                            <div>
                              <p className="font-medium">Media Evidence</p>
                              <p className="text-sm text-gray-600">
                                {report.photo_urls?.length || 0} photos, {report.video_urls?.length || 0} videos
                              </p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center gap-3 p-3 rounded-lg ${
                            verification.budgetFeasibility ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            {verification.budgetFeasibility ? 
                              <CheckCircle className="h-5 w-5 text-green-600" /> : 
                              <XCircle className="h-5 w-5 text-red-600" />
                            }
                            <div>
                              <p className="font-medium">Budget Feasibility</p>
                              <p className="text-sm text-gray-600">
                                {report.estimated_cost 
                                  ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(report.estimated_cost)
                                  : 'Not estimated'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Show photos if available */}
                      {report.photo_urls && report.photo_urls.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Evidence Photos ({report.photo_urls.length}):
                          </span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {report.photo_urls.slice(0, 4).map((url: string, index: number) => (
                              <a 
                                key={index} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
                              >
                                <img 
                                  src={url} 
                                  alt={`Evidence ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                          {report.photo_urls.length > 4 && (
                            <p className="text-sm text-gray-500">+ {report.photo_urls.length - 4} more photos</p>
                          )}
                        </div>
                      )}
                      
                      {/* Community Support */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-5 w-5 text-green-600" />
                          <span className="font-medium">{report.upvotes} Upvotes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="h-5 w-5 text-red-600" />
                          <span className="font-medium">{report.downvotes} Downvotes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">{report.affected_population || 0} Affected</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t">
                        <Button
                          onClick={() => {
                            setSelectedReport(report);
                            setBudgetAmount(report.estimated_cost?.toString() || '');
                            setShowApproveDialog(true);
                          }}
                          disabled={processing || !allChecked}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Set Budget
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowRejectDialog(true);
                          }}
                          disabled={processing}
                          variant="outline"
                          className="border-red-500 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button variant="outline" disabled={processing}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request More Info
                        </Button>
                      </div>
                      
                      {!allChecked && (
                        <p className="text-sm text-orange-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Complete all verification checks before approval. Missing items are highlighted in red.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ResponsiveContainer>
      </main>

      {/* Approval Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Report
            </DialogTitle>
            <DialogDescription>
              Approving this report will move it to the next workflow stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Report: <strong>{selectedReport?.title}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="budget">Allocated Budget (KES)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Enter budget amount..."
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
              {selectedReport?.estimated_cost && (
                <p className="text-xs text-gray-500">
                  Citizen estimated: {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(selectedReport.estimated_cost)}
                </p>
              )}
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <strong>Next Steps:</strong>
              <ol className="list-decimal ml-4 mt-1">
                <li>Report status will change to "Approved"</li>
                <li>You can then open it for contractor bidding</li>
                <li>Contractors will submit bids</li>
                <li>You will select the winning contractor</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedReport && handleApproval(selectedReport.id)}
              disabled={processing || !budgetAmount}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Please provide a reason for rejecting: <strong>{selectedReport?.title}</strong>
            </p>
            <Textarea
              placeholder="Enter rejection reason (required)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedReport && handleRejection(selectedReport.id)}
              disabled={processing || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernmentApprovalDashboard;
