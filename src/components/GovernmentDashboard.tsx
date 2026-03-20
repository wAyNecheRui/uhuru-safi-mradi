import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, CheckCircle, Clock, AlertTriangle, Users, DollarSign, FileText, 
  Gavel, Loader2, Eye, Wallet, Briefcase, BarChart3, 
  ClipboardCheck, UserCog, Building2, Scale, Globe, Lock, FolderOpen, Image,
  PlayCircle, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useGovernmentDashboard } from '@/hooks/useGovernmentDashboard';
import { SecurityMonitor } from '@/components/security/SecurityMonitor';
import GovernmentJurisdictionSettings from '@/components/government/GovernmentJurisdictionSettings';
import { WorkflowGuardService, WORKFLOW_STATUS, MIN_VOTES_THRESHOLD } from '@/services/WorkflowGuardService';
import { LiveNotificationService } from '@/services/LiveNotificationService';
import { supabase } from '@/integrations/supabase/client';

// Component for Approved Reports that are ready to open for bidding
const ApprovedReportsSection = ({ openBidding }: { openBidding: (reportId: string) => Promise<boolean> }) => {
  const [approvedReports, setApprovedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovedReports();
  }, []);

  const fetchApprovedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('problem_reports')
        .select('*')
        .eq('status', 'approved')
        .eq('bidding_status', 'not_open')
        .order('approved_at', { ascending: false });

      if (error) throw error;
      setApprovedReports(data || []);
    } catch (error) {
      console.error('Error fetching approved reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBidding = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      await openBidding(reportId);
      // Remove from local list after success
      setApprovedReports(prev => prev.filter(r => r.id !== reportId));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading approved reports...</p>
        </CardContent>
      </Card>
    );
  }

  if (approvedReports.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <PlayCircle className="h-5 w-5 text-green-600" />
        Ready to Open Bidding ({approvedReports.length})
      </h3>
      <div className="grid gap-4">
        {approvedReports.map((report) => (
          <Card key={report.id} className="shadow-md border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold">{report.title}</h4>
                  <p className="text-sm text-muted-foreground">{report.location}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    <Badge variant="outline">
                      Budget: KES {report.budget_allocated?.toLocaleString() || report.estimated_cost?.toLocaleString() || 'TBD'}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => handleOpenBidding(report.id)}
                  disabled={processingId === report.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingId === report.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Open Bidding
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const GovernmentDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { pendingApprovals, activeProjects, budgetOverview, loading, handleApproval, openBidding } = useGovernmentDashboard();
  
  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading dashboard data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApproveClick = (project: any) => {
    setSelectedReport(project);
    setBudgetAmount(project.estimated_cost?.toString() || '');
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (project: any) => {
    setSelectedReport(project);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const confirmApproval = async () => {
    if (!selectedReport) return;
    
    setProcessing(true);
    try {
      // First update budget if provided
      if (budgetAmount) {
        await supabase
          .from('problem_reports')
          .update({ 
            estimated_cost: parseFloat(budgetAmount.replace(/,/g, '')),
            budget_allocated: parseFloat(budgetAmount.replace(/,/g, ''))
          })
          .eq('id', selectedReport.id);
      }
      
      await handleApproval(selectedReport.id, 'approve');

      // Fire notifications to citizens and contractors
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        LiveNotificationService.onReportApproved(
          selectedReport.id,
          user.id,
          selectedReport.title,
          selectedReport.reported_by
        );
      }

      setApproveDialogOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const confirmRejection = async () => {
    if (!selectedReport) return;
    
    setProcessing(true);
    try {
      await handleApproval(selectedReport.id, 'reject');
      setRejectDialogOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Rejection error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenBidding = async (reportId: string) => {
    await openBidding(reportId);
  };

  const quickActions = [
    { label: 'Project Portfolio', icon: FolderOpen, path: '/government/portfolio', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Projects & Completion', icon: Award, path: '/government/projects', color: 'bg-green-700 hover:bg-green-800' },
    { label: 'Report Approvals', icon: ClipboardCheck, path: '/government/approvals', color: 'bg-orange-600 hover:bg-orange-700' },
    { label: 'Bid Approval', icon: Gavel, path: '/government/bid-approval', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Contractor Management', icon: Building2, path: '/government/contractors', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Analytics & Reports', icon: BarChart3, path: '/government/analytics', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Compliance', icon: Scale, path: '/government/compliance', color: 'bg-teal-600 hover:bg-teal-700' },
    { label: 'Escrow Funding', icon: Wallet, path: '/government/escrow-funding', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Release Payments', icon: DollarSign, path: '/government/payment-release', color: 'bg-teal-600 hover:bg-teal-700' },
    { label: 'Issue LPO', icon: FileText, path: '/government/lpo', color: 'bg-cyan-600 hover:bg-cyan-700' },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      <Card className="shadow-xl border-t-4 border-t-primary">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-primary flex-shrink-0" />
                <span className="break-words">Government Dashboard</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Project approval, budget oversight, and transparency management.
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 flex-shrink-0">
              Live Dashboard
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Navigation Grid */}
      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary flex-shrink-0" />
            Management Modules
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 text-xs`}
              >
                <action.icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="text-center leading-tight break-words">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Budget Overview - FY 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{budgetOverview.totalAllocated}</div>
              <div className="text-sm text-blue-700">Total Allocated</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{budgetOverview.totalSpent}</div>
              <div className="text-sm text-green-700">Total Spent</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{budgetOverview.totalCommitted}</div>
              <div className="text-sm text-yellow-700">Committed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{budgetOverview.available}</div>
              <div className="text-sm text-purple-700">Available</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
              <span className="text-sm text-gray-600">{budgetOverview.utilizationRate}%</span>
            </div>
            <Progress value={budgetOverview.utilizationRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Jurisdiction settings moved to registration - not displayed here */}

      <Tabs defaultValue="approvals" className="space-y-4 sm:space-y-6 w-full max-w-full">
        <TabsList className="w-full bg-card shadow-lg flex-wrap h-auto p-1">
          <TabsTrigger 
            value="approvals" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Ready for Approval</span>
            <span className="sm:hidden">Approvals</span>
            <span className="ml-1">({pendingApprovals.length})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Active Projects</span>
            <span className="sm:hidden">Active</span>
            <span className="ml-1">({activeProjects.length})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 hidden sm:inline" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-6">
          {/* Info Banner */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Community Validated Reports</h4>
                  <p className="text-sm text-blue-700">
                    These reports have received at least {MIN_VOTES_THRESHOLD} community votes and are ready for your review and approval.
                    Only reports in "Under Review" status appear here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {pendingApprovals.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Pending Approval</h3>
                <p className="text-muted-foreground">
                  Reports that receive {MIN_VOTES_THRESHOLD}+ community votes will appear here for your review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingApprovals.map((project: any) => (
                <Card key={project.id} className="shadow-lg border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            Under Review
                          </Badge>
                          <Badge className={getUrgencyColor(project.priority || 'medium')}>
                            {(project.priority || 'medium').toUpperCase()} Priority
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-600">{project.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Location:</span>
                          <div className="text-gray-900">{project.location || 'Not specified'}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Estimated Cost:</span>
                          <div className="text-green-600 font-semibold">
                            {project.estimated_cost ? 
                              new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(project.estimated_cost) : 
                              'Not estimated'
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Community Votes:</span>
                          <div className="text-blue-600 font-semibold flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {project.vote_count || 0} votes
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Reported:</span>
                          <div className="text-gray-900">
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Verification Checklist */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-3">Approval Checklist</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="flex items-center gap-2">
                            {(project.vote_count || 0) >= MIN_VOTES_THRESHOLD ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{MIN_VOTES_THRESHOLD}+ Votes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {project.coordinates || project.gps_coordinates ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">GPS Location</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {(project.photo_urls?.length > 0 || project.video_urls?.length > 0) ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">Media Evidence</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {project.estimated_cost ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">Cost Estimate</span>
                          </div>
                        </div>
                      </div>

                      {/* Show photos if available */}
                      {project.photo_urls && project.photo_urls.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-700">Evidence Photos:</span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {project.photo_urls.slice(0, 4).map((url: string, index: number) => (
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
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 pt-4 border-t">
                        <Button
                          onClick={() => handleApproveClick(project)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Report
                        </Button>
                        <Button
                          onClick={() => handleApproval(project.id, 'request_more_info')}
                          variant="outline"
                          className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Request Info
                        </Button>
                        <Button
                          onClick={() => handleRejectClick(project)}
                          variant="outline"
                          className="border-red-500 text-red-700 hover:bg-red-50"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Approved Reports - Ready to Open Bidding */}
          <ApprovedReportsSection openBidding={openBidding} />
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {activeProjects.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
                <p className="text-muted-foreground">
                  Projects will appear here once contractors are selected and work begins.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {activeProjects.map((project: any) => (
                <Card key={project.id} className="shadow-lg border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {project.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Budget:</span>
                          <div className="text-green-600 font-semibold">
                            {project.budget ? 
                              new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(project.budget) : 
                              'TBD'
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Location:</span>
                          <div className="text-gray-900">
                            {project.problem_reports?.location || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Started:</span>
                          <div className="text-gray-900">
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/government/portfolio`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600 mb-4">
                View detailed analytics and reports for all projects.
              </p>
              <Button onClick={() => navigate('/government/analytics')}>
                Open Analytics Dashboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Report</DialogTitle>
            <DialogDescription>
              Confirm approval for: {selectedReport?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="budget">Allocated Budget (KES)</Label>
              <Input
                id="budget"
                type="text"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="e.g., 500,000"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This budget will be used for contractor bidding
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmApproval} 
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject: {selectedReport?.title}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRejection} 
              disabled={processing}
              variant="destructive"
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernmentDashboard;