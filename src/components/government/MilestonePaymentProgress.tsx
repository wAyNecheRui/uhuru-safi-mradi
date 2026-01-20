import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, CheckCircle, Clock, AlertTriangle, 
  Loader2, Lock, Eye, Camera, Users, Zap, RefreshCw
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

interface MilestoneVerification {
  id: string;
  milestone_id: string;
  verifier_id: string;
  verification_status: string;
  verified_at: string;
  verification_notes: string | null;
}

interface EscrowAccount {
  id: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  status: string;
}

interface MilestonePaymentProgressProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

const MilestonePaymentProgress: React.FC<MilestonePaymentProgressProps> = ({ 
  projectId, 
  projectTitle, 
  onClose 
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [verifications, setVerifications] = useState<Record<string, MilestoneVerification[]>>({});
  const [escrow, setEscrow] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for milestone updates
    const channel = supabase
      .channel('milestone_payment_progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_milestones',
          filter: `project_id=eq.${projectId}`
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestone_verifications'
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escrow_accounts',
          filter: `project_id=eq.${projectId}`
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      // Fetch verifications for each milestone
      if (milestonesData && milestonesData.length > 0) {
        const milestoneIds = milestonesData.map(m => m.id);
        const { data: verificationsData } = await supabase
          .from('milestone_verifications')
          .select('*')
          .in('milestone_id', milestoneIds)
          .order('verified_at', { ascending: false });

        // Group verifications by milestone_id
        const groupedVerifications: Record<string, MilestoneVerification[]> = {};
        verificationsData?.forEach(v => {
          if (!groupedVerifications[v.milestone_id]) {
            groupedVerifications[v.milestone_id] = [];
          }
          groupedVerifications[v.milestone_id].push(v);
        });
        setVerifications(groupedVerifications);
      }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payment Released
          </Badge>
        );
      case 'verified':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Zap className="h-3 w-3 mr-1" />
            Auto-Payment Processing
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Awaiting Citizen Verification
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Work In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Lock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getVerificationProgress = (milestoneId: string) => {
    const milestoneVerifications = verifications[milestoneId] || [];
    const approvedCount = milestoneVerifications.filter(v => v.verification_status === 'approved').length;
    const requiredVerifications = 2; // As per the system requirement
    return { approved: approvedCount, required: requiredVerifications };
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
  const paidMilestones = milestones.filter(m => m.status === 'paid').length;
  const totalMilestones = milestones.length;

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          Milestone Payment Progress
        </DialogTitle>
        <DialogDescription>{projectTitle}</DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Automated Payment Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Automated Payment System</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Payments are automatically released when milestones receive <strong>2+ citizen verifications</strong> with 
                  a minimum average rating of <strong>3/5 stars</strong>. No manual intervention required.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escrow Summary */}
        {escrow ? (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Escrow Account Status</h4>
                <Button variant="ghost" size="sm" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Released to Contractor</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(totalReleased)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Held in Escrow</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(escrow.held_amount)}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Payment Progress ({paidMilestones}/{totalMilestones} milestones)</span>
                  <span>{releasePercentage.toFixed(0)}%</span>
                </div>
                <Progress value={releasePercentage} className="h-3" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800">No escrow account found for this project.</p>
              <p className="text-sm text-yellow-600">Please fund the escrow first via the Escrow Funding page.</p>
            </CardContent>
          </Card>
        )}

        {/* Milestones Progress */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Milestone Payment Timeline</h3>
          
          {milestones.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No milestones configured</p>
              </CardContent>
            </Card>
          ) : (
            milestones.map((milestone) => {
              const milestoneAmount = (totalAmount * milestone.payment_percentage) / 100;
              const verificationProgress = getVerificationProgress(milestone.id);
              const isPaid = milestone.status === 'paid';
              const isVerified = milestone.status === 'verified';
              const isSubmitted = milestone.status === 'submitted';

              return (
                <Card 
                  key={milestone.id} 
                  className={`
                    ${isPaid ? 'bg-green-50 border-green-200' : ''}
                    ${isVerified ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">M{milestone.milestone_number}</Badge>
                          <span className="font-semibold">{milestone.title}</span>
                          {getStatusBadge(milestone.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                        
                        {/* Payment Amount */}
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <span className="font-medium text-green-700">
                            <DollarSign className="h-4 w-4 inline" />
                            {formatCurrency(milestoneAmount)} ({milestone.payment_percentage}%)
                          </span>
                          {milestone.submitted_at && (
                            <span className="text-muted-foreground">
                              Submitted: {new Date(milestone.submitted_at).toLocaleDateString()}
                            </span>
                          )}
                          {isPaid && milestone.verified_at && (
                            <span className="text-green-600">
                              Paid: {new Date(milestone.verified_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Citizen Verification Progress */}
                        {(isSubmitted || isVerified) && !isPaid && (
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Citizen Verification Progress</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress 
                                value={(verificationProgress.approved / verificationProgress.required) * 100} 
                                className="flex-1 h-2"
                              />
                              <span className="text-sm font-medium">
                                {verificationProgress.approved}/{verificationProgress.required} verified
                              </span>
                            </div>
                            {verificationProgress.approved >= verificationProgress.required ? (
                              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Verification threshold met - auto-payment processing
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">
                                {verificationProgress.required - verificationProgress.approved} more citizen verification(s) needed
                              </p>
                            )}
                          </div>
                        )}

                        {/* Payment Released */}
                        {isPaid && (
                          <div className="bg-green-100 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Payment of {formatCurrency(milestoneAmount)} released to contractor
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Evidence Button */}
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

export default MilestonePaymentProgress;
