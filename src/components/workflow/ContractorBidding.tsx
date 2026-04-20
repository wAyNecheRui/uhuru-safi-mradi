import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText, Wallet, Clock, User, Award, AlertCircle,
  ShieldCheck, Hammer, ListChecks, HardHat, CheckCircle2,
  TrendingUp, Loader2, ChevronDown
} from 'lucide-react';
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
    technical_approach: '',
    materials_spec: '',
    timeline_breakdown: '',
    safety_plan: '',
    quality_assurance: ''
  });

  const bidValidationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!bidForm.bid_amount || parseFloat(bidForm.bid_amount) <= 0) errors.push('Valid bid amount is required');
    if (!bidForm.proposal.trim() || bidForm.proposal.trim().length < 50) errors.push('Proposal must be at least 50 characters');
    if (!bidForm.estimated_duration || parseInt(bidForm.estimated_duration) <= 0) errors.push('Estimated duration is required');

    // Advanced fields validation (optional but recommended)
    if (bidForm.materials_spec && bidForm.materials_spec.length < 20) errors.push('Materials spec should be detailed');

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
    if (isSubmitting) return;

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
        technical_approach: bidForm.technical_approach,
        materials_spec: bidForm.materials_spec,
        timeline_breakdown: bidForm.timeline_breakdown,
        safety_plan: bidForm.safety_plan,
        quality_assurance: bidForm.quality_assurance
      });

      toast.success('Bid submitted successfully');
      setShowBidForm(false);
      setBidForm({
        bid_amount: '',
        proposal: '',
        estimated_duration: '',
        technical_approach: '',
        materials_spec: '',
        timeline_breakdown: '',
        safety_plan: '',
        quality_assurance: ''
      });
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

  const userHasBid = bids.some(bid => bid.contractor_id === user?.id);
  const selectedBid = bids.find(bid => bid.status === 'selected');
  const isContractor = user?.user_type === 'contractor';

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
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileText className="h-5 w-5 text-blue-600" />
            Project Bidding
          </div>
          <div className="flex items-center gap-2">
            {projectBudget && projectBudget > 0 && (
              <Badge variant="outline" className="bg-slate-50 font-semibold border-slate-300">
                Budget: KSh {projectBudget.toLocaleString()}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
              {bids.length} Bid{bids.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {isContractor && !userHasBid && !selectedBid && (
          <Dialog open={showBidForm} onOpenChange={setShowBidForm}>
            <DialogTrigger asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]">
                <FileText className="h-5 w-5 mr-2" />
                Submit Your Official Bid
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-3xl max-h-[90dvh] flex flex-col p-0 overflow-hidden rounded-2xl">
              <DialogHeader className="p-6 pb-2 border-b bg-slate-50/50">
                <DialogTitle className="text-xl font-bold text-slate-900">Official Bidding Form</DialogTitle>
                <p className="text-sm text-slate-500">Provide a comprehensive proposal to increase your chances of selection.</p>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      Total Bid Amount (KSh) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={bidForm.bid_amount}
                      onChange={(e) => setBidForm({ ...bidForm, bid_amount: e.target.value })}
                      onBlur={() => markTouched('bid_amount')}
                      placeholder="e.g., 1,500,000"
                      className={`text-base h-11 ${touched.bid_amount && (!bidForm.bid_amount || parseFloat(bidForm.bid_amount) <= 0) ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    />
                    <InlineError
                      message="Enter a valid bid amount"
                      show={touched.bid_amount && (!bidForm.bid_amount || parseFloat(bidForm.bid_amount) <= 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Estimated Duration (Days) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={bidForm.estimated_duration}
                      onChange={(e) => setBidForm({ ...bidForm, estimated_duration: e.target.value })}
                      onBlur={() => markTouched('estimated_duration')}
                      placeholder="e.g., 45"
                      className={`text-base h-11 ${touched.estimated_duration && (!bidForm.estimated_duration || parseInt(bidForm.estimated_duration) <= 0) ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    />
                    <InlineError
                      message="Enter estimated duration"
                      show={touched.estimated_duration && (!bidForm.estimated_duration || parseInt(bidForm.estimated_duration) <= 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    Summary Proposal <span className="text-red-500">*</span>
                    <span className="text-slate-400 font-normal text-xs ml-auto">
                      {bidForm.proposal.trim().length}/50 min characters
                    </span>
                  </label>
                  <Textarea
                    value={bidForm.proposal}
                    onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                    onBlur={() => markTouched('proposal')}
                    placeholder="High-level summary of your project approach..."
                    className={`min-h-[100px] text-base resize-none ${touched.proposal && bidForm.proposal.trim().length < 50 ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                  />
                  <InlineError
                    message={`Proposal needs ${50 - bidForm.proposal.trim().length} more characters`}
                    show={touched.proposal && bidForm.proposal.trim().length < 50}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Hammer className="h-4 w-4 text-orange-600" />
                      Technical Methodology
                    </label>
                    <Textarea
                      value={bidForm.technical_approach}
                      onChange={(e) => setBidForm({ ...bidForm, technical_approach: e.target.value })}
                      placeholder="Explain how you will execute the work..."
                      className="min-h-[120px] text-sm border-slate-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-indigo-600" />
                      Materials Specification
                    </label>
                    <Textarea
                      value={bidForm.materials_spec}
                      onChange={(e) => setBidForm({ ...bidForm, materials_spec: e.target.value })}
                      placeholder="List key materials and standards..."
                      className="min-h-[120px] text-sm border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-yellow-600" />
                      Safety & Health Plan
                    </label>
                    <Textarea
                      value={bidForm.safety_plan}
                      onChange={(e) => setBidForm({ ...bidForm, safety_plan: e.target.value })}
                      placeholder="Risk mitigation and safety measures..."
                      className="min-h-[100px] text-sm border-slate-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      Quality Assurance
                    </label>
                    <Textarea
                      value={bidForm.quality_assurance}
                      onChange={(e) => setBidForm({ ...bidForm, quality_assurance: e.target.value })}
                      placeholder="Quality control and inspection process..."
                      className="min-h-[100px] text-sm border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Timeline Breakdown
                  </label>
                  <Textarea
                    value={bidForm.timeline_breakdown}
                    onChange={(e) => setBidForm({ ...bidForm, timeline_breakdown: e.target.value })}
                    placeholder="Phase-by-phase delivery schedule..."
                    className="min-h-[80px] text-sm border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-slate-50 flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-12 font-bold text-slate-600 border-slate-300 hover:bg-slate-100"
                  onClick={() => { setShowBidForm(false); setTouched({}); }}
                >
                  Cancel
                </Button>
                <ValidationTooltip disabled={!isBidValid} missingFields={bidValidationErrors}>
                  <Button
                    onClick={handleSubmitBid}
                    disabled={isSubmitting || !isBidValid}
                    className="flex-[2] h-12 font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting Proposal...
                      </span>
                    ) : 'Submit Final Bid'}
                  </Button>
                </ValidationTooltip>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {bids.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No bids submitted yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">Waiting for contractors to submit their specialized proposals.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <Card key={bid.id} className={`overflow-hidden transition-all border-l-4 ${bid.status === 'selected' ? 'border-l-green-500 ring-2 ring-green-100' : 'border-l-slate-300 hover:border-l-blue-400'}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-slate-900">Contractor #{bid.contractor_id.slice(-8).toUpperCase()}</span>
                            {bid.status === 'selected' && (
                              <Badge className="bg-green-100 text-green-700 border-green-200 uppercase text-[10px] font-black tracking-wider">
                                <Award className="h-3 w-3 mr-1" /> Selected
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded">
                              <Wallet className="h-3.5 w-3.5" /> KSh {bid.bid_amount.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded">
                              <Clock className="h-3.5 w-3.5" /> {bid.estimated_duration} Days
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                          Ref: {bid.id.slice(0, 8)}
                        </div>
                      </div>

                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Proposal Overview</h4>
                        <p className="text-slate-700 text-sm leading-relaxed">{bid.proposal}</p>

                        {(bid.technical_approach || bid.materials_spec || bid.timeline_breakdown) && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <details className="group">
                              <summary className="text-xs font-bold text-blue-600 cursor-pointer flex items-center justify-between group-hover:text-blue-700">
                                VIEW DETAILED METHODOLOGY
                                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                              </summary>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 animate-in fade-in slide-in-from-top-1">
                                {bid.technical_approach && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Methodology</span>
                                    <p className="text-xs text-slate-600 line-clamp-4">{bid.technical_approach}</p>
                                  </div>
                                )}
                                {bid.materials_spec && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Materials</span>
                                    <p className="text-xs text-slate-600 line-clamp-4">{bid.materials_spec}</p>
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
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-32 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Weight</div>
                        <div className="text-lg font-black text-slate-900 leading-none">N/A</div>
                      </div>

                      {canSelectBids && bid.status === 'submitted' && !selectedBid && (
                        <Button
                          size="sm"
                          onClick={() => handleSelectBid(bid.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-sm"
                        >
                          Select
                        </Button>
                      )}

                      <div className="text-[10px] font-medium text-slate-400 text-right mt-auto">
                        {new Date(bid.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedBid && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4">
            <div className="bg-white p-2 rounded-full shadow-sm text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-emerald-900 font-bold uppercase text-xs tracking-wider">Project Awarded</p>
              <p className="text-emerald-700 text-sm font-medium">Bidding phase complete. Project is now transitioning to execution.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractorBidding;