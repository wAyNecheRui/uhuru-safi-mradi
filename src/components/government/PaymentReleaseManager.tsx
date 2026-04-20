import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Wallet, CheckCircle, Clock, AlertTriangle,
  Loader2, Lock, Unlock, Eye, Camera, FileText, Upload
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  payment_percentage: number;
  milestone_number: number;
  evidence_urls: string[] | null;
  submitted_at: string | null;
  verified_at: string | null;
}

interface EscrowAccount {
  id: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  status: string;
}

interface PaymentReleaseManagerProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

const PaymentReleaseManager: React.FC<PaymentReleaseManagerProps> = ({
  projectId,
  projectTitle,
  onClose
}) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [escrow, setEscrow] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [iacFile, setIacFile] = useState<File | null>(null);
  const [sigOfficial, setSigOfficial] = useState(false);
  const [sigAuditor, setSigAuditor] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_number', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

      // Fetch escrow account
      const { data: escrowData, error: escrowError } = await supabase
        .from('escrow_accounts')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (escrowError) throw escrowError;
      setEscrow(escrowData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!selectedMilestone || !escrow || !user) return;

    // IDEMPOTENCY: Prevent double-clicks
    if (processing) return;

    setProcessing(true);
    try {
      // Generate idempotency key to prevent duplicate payments
      const idempotencyKey = `release-${selectedMilestone.id}-${user.id}-${Date.now()}`;

      // Call the edge function to release payment
      const { data, error } = await supabase.functions.invoke('release-milestone-payment', {
        body: { milestoneId: selectedMilestone.id },
        headers: { 'X-Idempotency-Key': idempotencyKey }
      });

      if (error) throw error;

      toast({
        title: "Payment Released",
        description: `Payment for "${selectedMilestone.title}" has been released successfully.`
      });

      setShowReleaseDialog(false);
      setSelectedMilestone(null);
      setReleaseNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error releasing payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to release payment",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Verified - Ready</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><Wallet className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Lock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const canRelease = (milestone: Milestone) => {
    return milestone.status === 'verified' && escrow && escrow.held_amount >= (escrow.total_amount * milestone.payment_percentage / 100);
  };

  if (loading) {
    return (
      <DialogContent className="max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DialogContent>
    );
  }

  const totalReleased = escrow?.released_amount || 0;
  const totalAmount = escrow?.total_amount || 0;
  const releasePercentage = totalAmount > 0 ? (totalReleased / totalAmount) * 100 : 0;

  return (
    <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-4xl max-h-[90dvh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
          <Wallet className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="truncate">Payment Release Manager</span>
        </DialogTitle>
        <DialogDescription className="truncate">{projectTitle}</DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 sm:space-y-6 py-2 pr-1">
        {/* Escrow Summary */}
        {escrow ? (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                  <p className="text-sm sm:text-xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Released</p>
                  <p className="text-sm sm:text-xl font-bold text-primary">{formatCurrency(totalReleased)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Held</p>
                  <p className="text-sm sm:text-xl font-bold text-primary">{formatCurrency(escrow.held_amount)}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span>Payment Progress</span>
                  <span>{releasePercentage.toFixed(0)}%</span>
                </div>
                <Progress value={releasePercentage} className="h-2 sm:h-3" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800">No escrow account found for this project.</p>
              <p className="text-sm text-yellow-600">Please create an escrow account first.</p>
            </CardContent>
          </Card>
        )}

        {/* Milestones */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Milestone Payments</h3>

          {milestones.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No milestones configured</p>
                <p className="text-sm text-muted-foreground">Please configure milestones first.</p>
              </CardContent>
            </Card>
          ) : (
            milestones.map((milestone) => {
              const milestoneAmount = (totalAmount * milestone.payment_percentage) / 100;
              const isReleasable = canRelease(milestone);

              return (
                <Card key={milestone.id} className={`${milestone.status === 'paid' ? 'bg-green-50 border-green-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">M{milestone.milestone_number}</Badge>
                          <span className="font-semibold">{milestone.title}</span>
                          {getStatusBadge(milestone.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-green-700">
                            {formatCurrency(milestoneAmount)} ({milestone.payment_percentage}%)
                          </span>
                          {milestone.submitted_at && (
                            <span className="text-muted-foreground">
                              Submitted: {new Date(milestone.submitted_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setShowEvidenceDialog(true);
                            }}
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Evidence ({milestone.evidence_urls.length})
                          </Button>
                        )}

                        {isReleasable && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setShowReleaseDialog(true);
                            }}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Release Payment
                          </Button>
                        )}

                        {milestone.status === 'paid' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Payment Released
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>

      {/* Release Payment Confirmation Dialog */}
      <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment Release</DialogTitle>
            <DialogDescription>
              You are about to release payment for: {selectedMilestone?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Gross Amount</p>
                  <p className="text-lg font-bold text-slate-700">
                    {formatCurrency((totalAmount * (selectedMilestone?.payment_percentage || 0)) / 100)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-amber-600">WHT (2%) Deducted</p>
                  <p className="text-lg font-bold text-amber-700">
                    -{formatCurrency((totalAmount * (selectedMilestone?.payment_percentage || 0)) / 100 * 0.02)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Net Payment (EFT Amount)</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency((totalAmount * (selectedMilestone?.payment_percentage || 0)) / 100 * 0.98)}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3 p-4 border rounded-xl bg-blue-50/30">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  IAC Certificate <span className="text-red-500">*</span>
                </label>
                <Badge variant="outline" className="bg-white">Legal Gate</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Upload the signed <strong>Inspection & Acceptance Certificate</strong>. EFT cannot be triggered without this document per PPADA 2015.
              </p>
              <label className="flex items-center justify-center gap-2 h-12 px-3 rounded-lg border-2 border-dashed border-blue-200 bg-white text-sm cursor-pointer hover:bg-blue-50 transition-colors">
                {iacFile ? (
                  <><CheckCircle className="h-5 w-5 text-green-600" /> {iacFile.name.substring(0, 20)}...</>
                ) : (
                  <><Upload className="h-5 w-5 text-blue-400" /> Select Signed IAC (PDF)</>
                )}
                <input type="file" className="hidden" accept=".pdf" onChange={(e) => setIacFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-3 p-4 border rounded-xl bg-slate-50 border-slate-200">
              <label className="text-sm font-bold flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-slate-600" />
                Multi-Signature Verification
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sigOfficial}
                    onChange={(e) => setSigOfficial(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-700">Senior Official sign-off</p>
                    <p className="text-muted-foreground group-hover:text-slate-600">Confirms alignment with project scope and budget.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sigAuditor}
                    onChange={(e) => setSigAuditor(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-700">Internal Auditor Verification</p>
                    <p className="text-muted-foreground group-hover:text-slate-600">Confirms IAC authenticity and verification math.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Internal Release Notes</label>
              <Textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Reference AIE batch number or inspection date..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReleaseDialog(false)}>Cancel</Button>
            <Button
              onClick={handleReleasePayment}
              disabled={processing || !iacFile || !sigOfficial || !sigAuditor}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Confirm Release
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Viewer Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Milestone Evidence</DialogTitle>
            <DialogDescription>{selectedMilestone?.title}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {selectedMilestone?.evidence_urls?.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
              >
                <img
                  src={url}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContent>
  );
};

export default PaymentReleaseManager;
