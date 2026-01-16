import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, XCircle, Star, Camera, 
  MapPin, Loader2, AlertTriangle, Eye,
  Users, DollarSign, Clock, Shield
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
import { MilestonePaymentService, REQUIRED_CITIZEN_VERIFICATIONS } from '@/services/MilestonePaymentService';

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  payment_percentage: number;
  milestone_number: number;
  evidence_urls: string[] | null;
  completion_criteria: string | null;
}

interface MilestoneVerificationCardProps {
  milestone: Milestone;
  projectId: string;
  onVerified: () => void;
}

interface VerificationStatus {
  canRelease: boolean;
  approvedCount: number;
  requiredCount: number;
  averageRating: number;
  message: string;
}

const MilestoneVerificationCard: React.FC<MilestoneVerificationCardProps> = ({
  milestone,
  projectId,
  onVerified
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'rejected' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<VerificationStatus | null>(null);
  const [hasUserVerified, setHasUserVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check verification status on mount and after verification
  useEffect(() => {
    checkVerificationStatus();
  }, [milestone.id, user?.id]);

  const checkVerificationStatus = async () => {
    setCheckingStatus(true);
    try {
      // Get current verification status
      const status = await MilestonePaymentService.checkVerificationStatus(milestone.id);
      setCurrentVerificationStatus(status);

      // Check if current user has already verified
      if (user) {
        const { data } = await supabase
          .from('milestone_verifications')
          .select('id')
          .eq('milestone_id', milestone.id)
          .eq('verifier_id', user.id)
          .single();
        
        setHasUserVerified(!!data);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setGettingLocation(false);
        toast({
          title: "Location Verified",
          description: "Your location has been captured for verification."
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
        toast({
          title: "Location Error",
          description: "Could not get your location.",
          variant: "destructive"
        });
      }
    );
  };

  const handleSubmitVerification = async () => {
    if (!user || !verificationStatus) return;

    setSubmitting(true);
    try {
      // Insert verification record
      const { error } = await supabase
        .from('milestone_verifications')
        .insert({
          milestone_id: milestone.id,
          verifier_id: user.id,
          verification_status: verificationStatus,
          verification_notes: notes || `Citizen verification - Rating: ${rating}/5`,
          verification_photos: location ? [`GPS: ${location.lat}, ${location.lon}`] : null
        });

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description: verificationStatus === 'approved' 
          ? "Thank you for verifying this milestone!"
          : "Your feedback has been recorded."
      });

      setShowVerifyDialog(false);
      setHasUserVerified(true);

      // Re-check verification status
      const newStatus = await MilestonePaymentService.checkVerificationStatus(milestone.id);
      setCurrentVerificationStatus(newStatus);

      // If approved and we have enough verifications, trigger automated payment
      if (verificationStatus === 'approved' && rating >= 3 && newStatus.canRelease) {
        toast({
          title: "🎉 Verification Threshold Reached!",
          description: "Triggering automated payment release..."
        });

        // Trigger automated payment
        const paymentResult = await MilestonePaymentService.triggerAutomatedPayment(milestone.id);
        
        if (paymentResult.success) {
          toast({
            title: "💰 Payment Released!",
            description: paymentResult.message
          });
        } else {
          toast({
            title: "Payment Pending",
            description: paymentResult.message,
            variant: paymentResult.error ? "destructive" : "default"
          });
        }
      }

      onVerified();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canVerify = milestone.status === 'submitted' && user && !hasUserVerified;
  const isPaid = milestone.status === 'paid';
  const isVerified = milestone.status === 'verified';
  const verificationProgress = currentVerificationStatus 
    ? (currentVerificationStatus.approvedCount / currentVerificationStatus.requiredCount) * 100 
    : 0;

  return (
    <>
      <Card className={`
        ${isPaid ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : ''}
        ${isVerified ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}
        ${milestone.status === 'submitted' ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
      `}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-semibold">
                  M{milestone.milestone_number}
                </Badge>
                <span className="font-medium">{milestone.title}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
              
              {milestone.completion_criteria && (
                <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded mb-2">
                  <strong>Criteria:</strong> {milestone.completion_criteria}
                </div>
              )}

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={
                  isPaid ? 'bg-green-600 text-white' :
                  isVerified ? 'bg-blue-600 text-white' :
                  milestone.status === 'submitted' ? 'bg-yellow-500 text-white' :
                  'bg-gray-100 text-gray-800'
                }>
                  {isPaid && <DollarSign className="h-3 w-3 mr-1" />}
                  {isVerified && <CheckCircle className="h-3 w-3 mr-1" />}
                  {milestone.status === 'submitted' && <Clock className="h-3 w-3 mr-1" />}
                  {isPaid ? 'PAID' : milestone.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {milestone.payment_percentage}% of budget
                </span>
              </div>

              {/* Citizen Verification Progress */}
              {!checkingStatus && currentVerificationStatus && milestone.status !== 'pending' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Citizen Verifications</span>
                    </div>
                    <span className="text-sm font-bold">
                      {currentVerificationStatus.approvedCount}/{currentVerificationStatus.requiredCount}
                    </span>
                  </div>
                  <Progress value={Math.min(verificationProgress, 100)} className="h-2 mb-2" />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {currentVerificationStatus.averageRating > 0 
                        ? `Avg Rating: ${currentVerificationStatus.averageRating.toFixed(1)}/5 ⭐`
                        : 'No ratings yet'}
                    </span>
                    {currentVerificationStatus.canRelease && !isPaid && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Ready for Payment
                      </Badge>
                    )}
                  </div>

                  {isPaid && (
                    <div className="mt-2 text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Payment automatically released after citizen verification
                    </div>
                  )}
                </div>
              )}

              {/* User verification status */}
              {hasUserVerified && (
                <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  You have verified this milestone
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEvidenceDialog(true)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Evidence ({milestone.evidence_urls.length})
                </Button>
              )}

              {canVerify && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowVerifyDialog(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verify Work
                </Button>
              )}

              {hasUserVerified && !isPaid && !isVerified && (
                <Badge variant="outline" className="text-blue-600">
                  Awaiting more verifications
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify Milestone Completion</DialogTitle>
            <DialogDescription>
              {milestone.title} - Your verification helps release payment to the contractor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Important Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Your verification matters!</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Once {REQUIRED_CITIZEN_VERIFICATIONS} citizens approve this milestone with a rating of 3+, 
                    payment will be <strong>automatically released</strong> to the contractor.
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Preview */}
            {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">📷 Submitted Evidence:</p>
                <div className="grid grid-cols-3 gap-2">
                  {milestone.evidence_urls.slice(0, 3).map((url, index) => (
                    <a 
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded overflow-hidden border hover:border-primary transition-colors"
                    >
                      <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                  {milestone.evidence_urls.length > 3 && (
                    <div className="aspect-square rounded border flex items-center justify-center bg-muted">
                      <span className="text-sm text-muted-foreground">
                        +{milestone.evidence_urls.length - 3} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Verification */}
            <div>
              <p className="text-sm font-medium mb-2">📍 Verify Your Location (Optional)</p>
              <Button
                variant="outline"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="w-full"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : location ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Location Verified ({location.lat.toFixed(4)}, {location.lon.toFixed(4)})
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Confirm I'm at the Project Site
                  </>
                )}
              </Button>
            </div>

            {/* Rating */}
            <div>
              <p className="text-sm font-medium mb-2">⭐ Quality Rating (Required)</p>
              <div className="flex gap-1 justify-center bg-muted/50 rounded-lg py-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`h-10 w-10 ${
                        (hoverRating || rating) >= star 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm mt-2 text-muted-foreground">
                  {rating === 1 && "Poor quality - needs significant improvement"}
                  {rating === 2 && "Below average - some issues noted"}
                  {rating === 3 && "Acceptable - meets basic requirements"}
                  {rating === 4 && "Good quality - well executed"}
                  {rating === 5 && "Excellent - exceeds expectations"}
                </p>
              )}
            </div>

            {/* Verification Decision */}
            <div>
              <p className="text-sm font-medium mb-2">✅ Your Decision</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={verificationStatus === 'approved' ? 'default' : 'outline'}
                  className={verificationStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setVerificationStatus('approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant={verificationStatus === 'rejected' ? 'destructive' : 'outline'}
                  onClick={() => setVerificationStatus('rejected')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-sm font-medium mb-2">📝 Additional Notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what you observed at the site..."
                rows={3}
              />
            </div>

            {verificationStatus === 'rejected' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Please provide specific details about the issues you found. This helps contractors improve and prevents fraudulent payments.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitVerification}
              disabled={submitting || !verificationStatus || rating === 0}
              className={verificationStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Submit Verification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>📷 Milestone Evidence - {milestone.title}</DialogTitle>
            <DialogDescription>
              Review the contractor's submitted evidence before verifying
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {milestone.evidence_urls?.map((url, index) => (
              <a 
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video rounded-lg overflow-hidden border hover:shadow-lg hover:border-primary transition-all"
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
            <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>
              Close
            </Button>
            {canVerify && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setShowEvidenceDialog(false);
                  setShowVerifyDialog(true);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Proceed to Verify
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MilestoneVerificationCard;
