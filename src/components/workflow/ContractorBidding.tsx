import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Wallet, Clock, User, Award, AlertCircle } from 'lucide-react';
import { WorkflowService } from '@/services/WorkflowService';
import { ContractorBid } from '@/types/workflow';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ValidationTooltip, InlineError } from '@/components/ui/validation-tooltip';

interface ContractorBiddingProps {
  reportId: string;
  projectBudget?: number;
  onBidSelected?: (bid: ContractorBid) => void;
  canSelectBids?: boolean;
}

const ContractorBidding: React.FC<ContractorBiddingProps> = ({
  reportId,
  projectBudget,
  onBidSelected,
  canSelectBids = false
}) => {
  const { user } = useAuth();
  const [bids, setBids] = useState<ContractorBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [bidForm, setBidForm] = useState({
    bid_amount: '',
    proposal: '',
    estimated_duration: '',
    technical_approach: ''
  });

  const bidValidationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!bidForm.bid_amount || parseFloat(bidForm.bid_amount) <= 0) errors.push('Valid bid amount is required');
    if (!bidForm.proposal.trim() || bidForm.proposal.trim().length < 50) errors.push('Proposal must be at least 50 characters');
    if (!bidForm.estimated_duration || parseInt(bidForm.estimated_duration) <= 0) errors.push('Estimated duration is required');
    return errors;
  }, [bidForm]);

  const isBidValid = bidValidationErrors.length === 0;

  useEffect(() => {
    loadBids();
  }, [reportId]);

  const loadBids = async () => {
    try {
      const bidsData = await WorkflowService.getBidsForReport(reportId);
      setBids(bidsData);
    } catch (error) {
      console.error('Error loading bids:', error);
      toast.error('Failed to load contractor bids');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async () => {
    if (!user) {
      toast.error('Please log in to submit a bid');
      return;
    }

    if (!isBidValid) {
      toast.error(bidValidationErrors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      await WorkflowService.submitBid({
        report_id: reportId,
        bid_amount: parseFloat(bidForm.bid_amount),
        proposal: bidForm.proposal,
        estimated_duration: parseInt(bidForm.estimated_duration),
        technical_approach: bidForm.technical_approach
      });

      toast.success('Bid submitted successfully');
      setShowBidForm(false);
      setBidForm({ bid_amount: '', proposal: '', estimated_duration: '', technical_approach: '' });
      setTouched({});
      await loadBids();
    } catch (error) {
      console.error('Error submitting bid:', error);
      toast.error('Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectBid = async (bidId: string) => {
    if (!canSelectBids) return;
    try {
      const selectedBid = await WorkflowService.selectBid(bidId);
      toast.success('Contractor selected successfully');
      onBidSelected?.(selectedBid as ContractorBid);
      await loadBids();
    } catch (error) {
      console.error('Error selecting bid:', error);
      toast.error('Failed to select contractor');
    }
  };

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const isContractor = true;
  const userHasBid = bids.some(bid => bid.contractor_id === user?.id);
  const selectedBid = bids.find(bid => bid.status === 'selected');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contractor Bidding
          </div>
          <div className="flex items-center gap-2">
            {projectBudget && (
              <Badge variant="outline">
                Budget: KSh {projectBudget.toLocaleString()}
              </Badge>
            )}
            <Badge variant="secondary">
              {bids.length} Bid{bids.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isContractor && !userHasBid && !selectedBid && (
          <Dialog open={showBidForm} onOpenChange={setShowBidForm}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Submit Your Bid
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-2xl max-h-[90dvh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-base sm:text-lg pr-8">Submit Contractor Bid</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-2 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">
                      Bid Amount (KSh) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      value={bidForm.bid_amount}
                      onChange={(e) => setBidForm({ ...bidForm, bid_amount: e.target.value })}
                      onBlur={() => markTouched('bid_amount')}
                      placeholder="e.g., 500000"
                      className={`text-sm ${touched.bid_amount && (!bidForm.bid_amount || parseFloat(bidForm.bid_amount) <= 0) ? 'border-destructive' : ''}`}
                    />
                    <InlineError
                      message="Enter a valid bid amount"
                      show={touched.bid_amount && (!bidForm.bid_amount || parseFloat(bidForm.bid_amount) <= 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">
                      Duration (days) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      value={bidForm.estimated_duration}
                      onChange={(e) => setBidForm({ ...bidForm, estimated_duration: e.target.value })}
                      onBlur={() => markTouched('estimated_duration')}
                      placeholder="e.g., 30"
                      className={`text-sm ${touched.estimated_duration && (!bidForm.estimated_duration || parseInt(bidForm.estimated_duration) <= 0) ? 'border-destructive' : ''}`}
                    />
                    <InlineError
                      message="Enter estimated duration in days"
                      show={touched.estimated_duration && (!bidForm.estimated_duration || parseInt(bidForm.estimated_duration) <= 0)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">
                    Project Proposal <span className="text-destructive">*</span>
                    <span className="text-muted-foreground text-xs ml-1">
                      ({bidForm.proposal.trim().length}/50 min characters)
                    </span>
                  </label>
                  <Textarea
                    value={bidForm.proposal}
                    onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                    onBlur={() => markTouched('proposal')}
                    placeholder="Describe your approach in detail (minimum 50 characters)..."
                    minRows={3}
                    className={`text-sm resize-none ${touched.proposal && bidForm.proposal.trim().length < 50 ? 'border-destructive' : ''}`}
                  />
                  <InlineError
                    message={`Proposal needs ${50 - bidForm.proposal.trim().length} more characters`}
                    show={touched.proposal && bidForm.proposal.trim().length < 50}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">
                    Technical Approach (optional)
                  </label>
                  <Textarea
                    value={bidForm.technical_approach}
                    onChange={(e) => setBidForm({ ...bidForm, technical_approach: e.target.value })}
                    placeholder="Technical methodology..."
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Validation summary */}
                {bidValidationErrors.length > 0 && Object.keys(touched).length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {bidValidationErrors.length} field{bidValidationErrors.length > 1 ? 's' : ''} need attention
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => { setShowBidForm(false); setTouched({}); }}
                  >
                    Cancel
                  </Button>
                  <ValidationTooltip disabled={!isBidValid} missingFields={bidValidationErrors}>
                    <Button
                      onClick={handleSubmitBid}
                      disabled={isSubmitting || !isBidValid}
                      className="flex-1"
                      size="sm"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Bid'}
                    </Button>
                  </ValidationTooltip>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {bids.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p>No bids submitted yet</p>
            <p className="text-sm">Waiting for contractors to submit their proposals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <Card key={bid.id} className={`${bid.status === 'selected' ? 'ring-2 ring-green-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Contractor #{bid.contractor_id.slice(-8)}</span>
                        </div>
                        {bid.status === 'selected' && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span>KSh {bid.bid_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{bid.estimated_duration} days</span>
                        </div>
                      </div>

                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm">{bid.proposal}</p>
                        {bid.technical_approach && (
                          <details className="mt-2">
                            <summary className="text-sm font-medium cursor-pointer text-primary">
                              Technical Approach
                            </summary>
                            <p className="text-sm mt-1 text-muted-foreground">{bid.technical_approach}</p>
                          </details>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Submitted: {new Date(bid.submitted_at).toLocaleString()}
                      </div>
                    </div>

                    {canSelectBids && bid.status === 'submitted' && !selectedBid && (
                      <Button
                        size="sm"
                        onClick={() => handleSelectBid(bid.id)}
                        className="ml-4"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedBid && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-300 font-medium">
              ✅ Contractor selected! Project can now proceed to execution phase.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractorBidding;