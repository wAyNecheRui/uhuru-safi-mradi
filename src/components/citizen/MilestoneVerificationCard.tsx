import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, Star, Camera,
  MapPin, Loader2, AlertTriangle, Eye,
  Users, Wallet, Clock, Shield
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
import { useProfile } from '@/hooks/useProfile';
import { MilestonePaymentService, REQUIRED_CITIZEN_VERIFICATIONS } from '@/services/MilestonePaymentService';
import { canVerifyMilestone, getCurrentPosition, haversineDistanceKm } from '@/utils/geoUtils';
import { WorkflowGuardService } from '@/services/WorkflowGuardService';

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
  const { userProfile } = useProfile();
  const { toast } = useToast();

  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'rejected' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<VerificationStatus | null>(null);
  const [hasUserVerified, setHasUserVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [proximityCheck, setProximityCheck] = useState<'idle' | 'checking' | 'passed' | 'failed' | 'gps_error'>('idle');
  const [proximityDistance, setProximityDistance] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Check verification status on mount and after verification
  useEffect(() => {
    checkVerificationStatus();
  }, [milestone.id, user?.id]);

  // Reset proximity state when dialog closes so a fresh check runs next time
  useEffect(() => {
    if (!showVerifyDialog) {
      setProximityCheck('idle');
      setLocation(null);
      setGpsAccuracy(null);
    }
  }, [showVerifyDialog]);

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

  const handleSimulateLocation = async () => {
    setGettingLocation(true);
    setProximityCheck('checking');

    // Artificial 1.5s delay to feel real
    await new Promise(r => setTimeout(r, 1500));

    // Use dummy coordinates that will pass server-side check (simulate on-site)
    // We'll set proximity check to 'passed' directly to bypass the RPC during simulation
    setLocation({ lat: -1.3965, lon: 36.7570 }); // Representative coordinates
    setGpsAccuracy(5.0);
    setProximityCheck('passed');

    toast({
      title: "Simulation Verified 🧪",
      description: "Simulation mode: Proximity check bypassed for testing.",
    });

    setGettingLocation(false);
  };

  const handleGetLocation = async () => {
    setGettingLocation(true);
    setProximityCheck('checking');
    try {
      const pos = await getCurrentPosition();
      setLocation({ lat: pos.lat, lon: pos.lon });
      setGpsAccuracy(pos.accuracy);

      // Server-side proximity check (10km radius)
      const allowed = await canVerifyMilestone(pos.lat, pos.lon, milestone.id);

      if (allowed) {
        setProximityCheck('passed');
        toast({
          title: "Location Verified ✅",
          description: pos.isFallback
            ? `Verified via WiFi/Network location. (Accuracy: ±${Math.round(pos.accuracy)}m)`
            : `Verified via precise GPS signal. (Accuracy: ±${Math.round(pos.accuracy)}m)`
        });
      } else {
        setProximityCheck('failed');
        toast({
          title: "Too Far From Project Site",
          description: "You must be within 10km of the project location to verify this milestone.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Geolocation error:', error);
      setProximityCheck('gps_error');

      let errorMsg = "GPS access is required to verify milestones.";
      if (error.code === 3) { // TIMEOUT
        errorMsg = "GPS request timed out. Please ensure you have a clear view of the sky and try again.";
      } else if (error.code === 1) { // PERMISSION_DENIED
        errorMsg = "Location access denied. Even if you clicked 'Allow', your OS or browser settings may be blocking the signal. Please check your system privacy settings.";
      }

      toast({
        title: "Location Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!user || !verificationStatus) return;

    // Enforce mandatory location verification
    if (!location || proximityCheck !== 'passed') {
      toast({
        title: "Location Required",
        description: "You must verify your location at the project site before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Prevent double submission
    if (hasUserVerified) {
      toast({
        title: "Already Verified",
        description: "You have already submitted a verification for this milestone.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await WorkflowGuardService.verifyMilestone(
        milestone.id,
        projectId,
        user.id,
        rating,
        notes,
        milestone.title,
        location || undefined
      );

      if (!result.success) {
        if (result.error === 'ALREADY_VERIFIED') {
          setHasUserVerified(true);
          toast({
            title: "Already Verified",
            description: "You have already submitted a verification for this milestone.",
            variant: "destructive"
          });
          setShowVerifyDialog(false);
          return;
        }
        throw new Error(result.error);
      }

      toast({
        title: "Verification Submitted",
        description: rating >= 3
          ? "Thank you for verifying this milestone!"
          : "Your feedback has been recorded."
      });

      setShowVerifyDialog(false);
      setHasUserVerified(true);

      // Re-fetch status to update UI
      const newStatus = await MilestonePaymentService.checkVerificationStatus(milestone.id);
      setCurrentVerificationStatus(newStatus);

      if (result.paymentTriggered) {
        toast({
          title: "💰 Payment Released!",
          description: "Verification threshold reached and funds have been released to the contractor.",
          variant: "default"
        });
      }

      onVerified();
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isCitizen = userProfile?.user_type === 'citizen';
  const canVerify = (milestone.status === 'submitted' || milestone.status === 'in_progress') && user && !hasUserVerified && isCitizen;
  const isPaid = milestone.status === 'paid' || milestone.status === 'payment_processing';
  const isVerified = milestone.status === 'verified';

  // Recovery: if milestone is 'verified' but not yet paid, attempt auto-payment
  useEffect(() => {
    if (isVerified && currentVerificationStatus?.canRelease && user && isCitizen) {
      console.log('[MilestoneVerification] Recovery: milestone verified but not paid, triggering auto-payment');
      MilestonePaymentService.triggerAutomatedPayment(milestone.id)
        .then(result => {
          if (result.success) {
            toast({
              title: "💰 Payment Released!",
              description: result.message
            });
            onVerified();
          }
        })
        .catch(err => console.error('[MilestoneVerification] Recovery payment failed:', err));
    }
  }, [isVerified, currentVerificationStatus?.canRelease, isCitizen]);
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
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="font-semibold shrink-0">
                  M{milestone.milestone_number}
                </Badge>
                <span className="font-medium text-sm sm:text-base break-words">{milestone.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">{milestone.description}</p>

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
                  {isPaid && <Wallet className="h-3 w-3 mr-1" />}
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

            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 sm:flex-col sm:shrink-0">
              {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEvidenceDialog(true)}
                  className="text-xs sm:text-sm"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Evidence ({milestone.evidence_urls.length})
                </Button>
              )}

              {canVerify && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                  onClick={() => {
                    // Open dialog AND trigger geolocation in the SAME synchronous user gesture.
                    // This preserves the user-activation context required by browsers in standalone tabs.
                    setShowVerifyDialog(true);
                    handleGetLocation();
                  }}
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Verify Work
                </Button>
              )}

              {user && !isCitizen && (milestone.status === 'submitted' || milestone.status === 'in_progress') && !hasUserVerified && (
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500 border-slate-200">
                  Standard Citizen only
                </Badge>
              )}

              {hasUserVerified && !isPaid && !isVerified && (
                <Badge variant="outline" className="text-blue-600 text-xs">
                  Awaiting verifications
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90dvh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Verify Milestone Completion</DialogTitle>
            <DialogDescription>
              {milestone.title} - Your verification helps release payment to the contractor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0 pr-2">
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
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Location Verification <span className="text-red-500 font-bold ml-1">*Required</span>
              </p>

              <div className="min-h-[60px] flex items-center">
                {gettingLocation ? (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl animate-pulse w-full shadow-sm">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <MapPin className="h-5 w-5 text-yellow-700" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-yellow-900 text-sm">Locating You...</h4>
                      <p className="text-[11px] text-yellow-700">Syncing with satellites & network signals</p>
                    </div>
                  </div>
                ) : proximityCheck === 'passed' && location ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl w-full shadow-sm">
                    <div className="p-2 bg-green-100 rounded-full text-green-700">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-green-900 text-sm">Location Verified</h4>
                      <p className="text-[11px] text-green-700">
                        Within range of project site ({location.lat.toFixed(3)}, {location.lon.toFixed(3)})
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className={`w-full h-auto py-4 flex flex-col items-center gap-1 rounded-xl transition-all hover:bg-slate-50 ${proximityCheck === 'failed' ? 'border-red-300 bg-red-50/30' :
                      proximityCheck === 'gps_error' ? 'border-amber-300 bg-amber-50/30' :
                        'border-dashed border-2 grow'
                      }`}
                  >
                    {proximityCheck === 'gps_error' ? (
                      <>
                        <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          GPS Lock Failed
                        </div>
                        <span className="text-[10px] text-amber-600">Tap to try again</span>
                      </>
                    ) : proximityCheck === 'failed' ? (
                      <>
                        <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                          <MapPin className="h-4 w-4" />
                          Too Far from Site
                        </div>
                        <span className="text-[10px] text-red-600">You must be within 10km. Tap to retry.</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                          <MapPin className="h-4 w-4" />
                          Location Detection Idle
                        </div>
                        <span className="text-[10px] text-slate-500">Enable GPS to automatically verify proximity</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {proximityCheck !== 'passed' && !gettingLocation && (
                <div className="mt-2 flex justify-center">
                  <button
                    onClick={handleGetLocation}
                    className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 py-1 font-medium"
                  >
                    <MapPin className="h-3 w-3" />
                    Retry location detection
                  </button>
                </div>
              )}

              {proximityCheck === 'failed' && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Distance check failed. Ensure you are actually at the physical project location.
                </p>
              )}
              {proximityCheck === 'gps_error' && (
                <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                  <p className="text-xs text-red-700 font-medium">
                    Technical Issue: The browser couldn't find your coordinates.
                  </p>
                  <ul className="text-[10px] text-red-600 list-disc pl-4 mt-1 space-y-0.5">
                    <li>Using a laptop? Move closer to a window for WiFi positioning.</li>
                    <li>Permission allowed but still failing? Check Windows/macOS Location Privacy settings.</li>
                    <li>Try using your mobile phone for verification if available.</li>
                  </ul>
                </div>
              )}
              {proximityCheck === 'passed' && gpsAccuracy && (
                <p className="text-xs text-green-600 mt-1">
                  Verified with accuracy: ±{Math.round(gpsAccuracy)}m
                </p>
              )}
              {proximityCheck === 'idle' && (
                <p className="text-xs text-muted-foreground mt-1">
                  GPS location is mandatory to prevent fraud. You must be near the project site.
                </p>
              )}
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
                      className={`h-10 w-10 ${(hoverRating || rating) >= star
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

          <DialogFooter className="flex-shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitVerification}
              disabled={submitting || !verificationStatus || rating === 0 || proximityCheck !== 'passed'}
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

      {/* Evidence Dialog - Responsive for all devices */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">📷 Milestone Evidence</DialogTitle>
            <DialogDescription className="text-sm">
              {milestone.title} - Review the contractor's work before verifying
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
            {milestone.evidence_urls?.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video rounded-lg overflow-hidden border-2 hover:shadow-lg hover:border-primary transition-all bg-muted"
              >
                <img
                  src={url}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
            {(!milestone.evidence_urls || milestone.evidence_urls.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No evidence photos submitted yet</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowEvidenceDialog(false)} className="w-full sm:w-auto">
              Close
            </Button>
            {canVerify && (
              <Button
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
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
