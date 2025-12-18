import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, XCircle, AlertCircle, Users, MapPin, 
  Camera, DollarSign, Clock, FileText, Shield,
  ThumbsUp, ThumbsDown, Loader2, MessageSquare
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const GovernmentApprovalDashboard = () => {
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    try {
      const { data, error } = await supabase
        .from('problem_reports')
        .select(`
          *,
          community_votes(vote_type)
        `)
        .eq('status', 'pending')
        .order('priority_score', { ascending: false });

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
      communityVotes: report.totalVotes >= 50,
      gpsValidation: !!report.gps_coordinates || !!report.coordinates,
      mediaEvidence: (report.photo_urls?.length > 0) || (report.video_urls?.length > 0),
      budgetFeasibility: !!report.estimated_cost && report.estimated_cost > 0
    };

    return checks;
  };

  const handleApproval = async (reportId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        approved_by: action === 'approve' ? userData.user?.id : null
      };

      const { error } = await supabase
        .from('problem_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Report Approved" : "Report Rejected",
        description: action === 'approve' 
          ? "The report has been approved and a project will be created."
          : "The report has been rejected."
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedReport(null);
      fetchPendingReports();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: "Failed to process the approval",
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Header selectedCounty="Nairobi" onCountyChange={() => {}} />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header selectedCounty="Nairobi" onCountyChange={() => {}} />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Approval Dashboard</h1>
            <p className="text-gray-600">Review and approve citizen-reported problems</p>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <p className="text-blue-800">
                  <strong>{pendingReports.length}</strong> reports awaiting review. 
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
                  <p className="text-gray-600">No pending reports to review</p>
                </CardContent>
              </Card>
            ) : (
              pendingReports.map((report) => {
                const verification = getVerificationStatus(report);
                const allChecked = Object.values(verification).every(v => v);
                
                return (
                  <Card key={report.id} className="shadow-lg border-l-4 border-l-orange-500">
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
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
                          Verification Checklist
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
                              <p className="font-medium">Community Votes (min 50)</p>
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
                          onClick={() => handleApproval(report.id, 'approve')}
                          disabled={processing || !allChecked}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Project
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
                          Complete all verification checks before approval
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

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
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
              onClick={() => selectedReport && handleApproval(selectedReport.id, 'reject')}
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
