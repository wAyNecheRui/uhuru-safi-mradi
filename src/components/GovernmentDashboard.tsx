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
  Shield, CheckCircle, Clock, AlertTriangle, Users, Wallet, FileText, 
  Gavel, Loader2, Eye, Briefcase, BarChart3, Award,
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
import BulkApprovalPanel from '@/components/government/BulkApprovalPanel';
import BulkBiddingPanel from '@/components/government/BulkBiddingPanel';

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
      setApprovedReports(prev => prev.filter(r => r.id !== reportId));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading approved reports...</p>
        </CardContent>
      </Card>
    );
  }

  if (approvedReports.length === 0) return null;

  return (
    <div className="space-y-3 mt-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <PlayCircle className="h-4 w-4 text-green-600" />
        Ready to Open Bidding ({approvedReports.length})
      </h3>
      <div className="grid gap-3">
        {approvedReports.map((report) => (
          <Card key={report.id} className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{report.title}</h4>
                  <p className="text-xs text-muted-foreground">{report.location}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="success" className="text-[10px]">Approved</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Budget: KES {report.budget_allocated?.toLocaleString() || report.estimated_cost?.toLocaleString() || 'TBD'}
                    </Badge>
                  </div>
                </div>
                <Button onClick={() => handleOpenBidding(report.id)} disabled={processingId === report.id} size="sm">
                  {processingId === report.id ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Opening...</> : <><PlayCircle className="h-3.5 w-3.5 mr-1.5" />Open Bidding</>}
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
  
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

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
      if (budgetAmount) {
        await supabase.from('problem_reports').update({ 
          estimated_cost: parseFloat(budgetAmount.replace(/,/g, '')),
          budget_allocated: parseFloat(budgetAmount.replace(/,/g, ''))
        }).eq('id', selectedReport.id);
      }
      await handleApproval(selectedReport.id, 'approve');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        LiveNotificationService.onReportApproved(selectedReport.id, user.id, selectedReport.title, selectedReport.reported_by);
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

  const quickActions = [
    { label: 'Project Portfolio', icon: FolderOpen, path: '/government/portfolio' },
    { label: 'Projects & Completion', icon: Award, path: '/government/projects' },
    { label: 'Report Approvals', icon: ClipboardCheck, path: '/government/approvals' },
    { label: 'Bid Approval', icon: Gavel, path: '/government/bid-approval' },
    { label: 'Contractor Mgmt', icon: Building2, path: '/government/contractors' },
    { label: 'Analytics', icon: BarChart3, path: '/government/analytics' },
    { label: 'Compliance', icon: Scale, path: '/government/compliance' },
    { label: 'Escrow Funding', icon: Wallet, path: '/government/escrow-funding' },
    { label: 'Release Payments', icon: Wallet, path: '/government/payment-release' },
    { label: 'Issue LPO', icon: FileText, path: '/government/lpo' },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Government Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Project approval, budget oversight, and transparency management.</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Management Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer hover:shadow-card-hover transition-all duration-200 group border-border/60"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="p-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5 group-hover:bg-primary/15 transition-colors">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium text-sm text-foreground">{action.label}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Budget Overview - FY 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Allocated', value: budgetOverview.totalAllocated, color: 'text-primary', bg: 'bg-primary/5' },
              { label: 'Total Spent', value: budgetOverview.totalSpent, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Committed', value: budgetOverview.totalCommitted, color: 'text-accent-foreground', bg: 'bg-accent/10' },
              { label: 'Available', value: budgetOverview.available, color: 'text-purple-700', bg: 'bg-purple-50' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center border border-transparent`}>
                <div className={`text-lg sm:text-xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground">Budget Utilization</span>
              <span className="text-xs font-semibold text-foreground">{budgetOverview.utilizationRate}%</span>
            </div>
            <Progress value={budgetOverview.utilizationRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="approvals" className="space-y-4 w-full max-w-full">
        <TabsList className="w-full bg-muted/50 flex-wrap h-auto p-1 rounded-xl">
          <TabsTrigger value="approvals" className="text-xs sm:text-sm rounded-lg">
            Approvals ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm rounded-lg">
            Active ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm rounded-lg">
            Security
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm rounded-lg">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-foreground">Community Validated Reports</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reports with {MIN_VOTES_THRESHOLD}+ community votes are ready for your review.
              </p>
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-sm mb-1">No Reports Pending Approval</h3>
                <p className="text-xs text-muted-foreground">Reports with {MIN_VOTES_THRESHOLD}+ votes will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingApprovals.map((project: any) => (
                <Card key={project.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{project.title}</h3>
                        <div className="flex gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">Under Review</Badge>
                          <Badge variant={project.priority === 'urgent' || project.priority === 'high' ? 'destructive' : 'outline'} className="text-[10px]">
                            {(project.priority || 'medium').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-muted-foreground">Location:</span><div className="font-medium text-foreground mt-0.5">{project.location || 'N/A'}</div></div>
                        <div><span className="text-muted-foreground">Estimated Cost:</span><div className="font-medium text-foreground mt-0.5">KES {project.estimated_cost?.toLocaleString() || 'TBD'}</div></div>
                        <div><span className="text-muted-foreground">Votes:</span><div className="font-medium text-foreground mt-0.5">{project.verified_votes || 0}</div></div>
                        <div><span className="text-muted-foreground">Category:</span><div className="font-medium text-foreground mt-0.5">{project.category || 'General'}</div></div>
                      </div>
                      {project.photo_urls?.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto py-1">
                          {project.photo_urls.slice(0, 3).map((url: string, i: number) => (
                            <img key={i} src={url} alt="" className="h-20 w-28 rounded-lg object-cover border border-border shrink-0" loading="lazy" />
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={() => handleApproveClick(project)}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectClick(project)}>
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <ApprovedReportsSection openBidding={openBidding} />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No active projects yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeProjects.map((project: any) => (
                <Card key={project.id}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{project.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{project.location || 'Location not specified'}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{project.status?.replace('_', ' ').toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{project.description?.substring(0, 120)}...</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate('/government/portfolio')}>Manage</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="security">
          <SecurityMonitor />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">View detailed analytics and reports</p>
              <Button size="sm" onClick={() => navigate('/government/analytics')}>Open Analytics Dashboard</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Report</DialogTitle>
            <DialogDescription>Set the budget allocation for: {selectedReport?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Budget Allocation (KES)</Label>
              <Input type="text" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="Enter budget amount" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmApproval} disabled={processing}>
              {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
            <DialogDescription>Provide a reason for rejecting: {selectedReport?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Rejection Reason</Label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this report is being rejected" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRejection} disabled={processing}>
              {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernmentDashboard;
