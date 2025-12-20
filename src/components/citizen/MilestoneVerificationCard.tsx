import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, XCircle, Star, Camera, 
  MapPin, Loader2, AlertTriangle, Eye
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
  completion_criteria: string | null;
}

interface MilestoneVerificationCardProps {
  milestone: Milestone;
  projectId: string;
  onVerified: () => void;
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
          verification_notes: notes || `Citizen verification - Rating: ${rating}/5`
        });

      if (error) throw error;

      // If approved with high rating, count towards verification
      if (verificationStatus === 'approved' && rating >= 3) {
        // Check if we have enough verifications to update milestone status
        const { data: verifications } = await supabase
          .from('milestone_verifications')
          .select('*')
          .eq('milestone_id', milestone.id)
          .eq('verification_status', 'approved');

        // If 3+ approvals, update milestone to verified
        if (verifications && verifications.length >= 2) {
          await supabase
            .from('project_milestones')
            .update({ status: 'verified', verified_at: new Date().toISOString() })
            .eq('id', milestone.id);
        }
      }

      toast({
        title: "Verification Submitted",
        description: verificationStatus === 'approved' 
          ? "Thank you for verifying this milestone!"
          : "Your feedback has been recorded."
      });

      setShowVerifyDialog(false);
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

  const canVerify = milestone.status === 'submitted' && user;

  return (
    <>
      <Card className={`${milestone.status === 'verified' ? 'border-green-300 bg-green-50' : ''}`}>
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
                <div className="text-sm bg-gray-50 p-2 rounded">
                  <strong>Criteria:</strong> {milestone.completion_criteria}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Badge className={
                  milestone.status === 'verified' ? 'bg-green-100 text-green-800' :
                  milestone.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {milestone.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {milestone.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {milestone.payment_percentage}% of budget
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEvidenceDialog(true)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Evidence
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Milestone Completion</DialogTitle>
            <DialogDescription>
              {milestone.title} - Please verify if the work meets the required standards
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Evidence Preview */}
            {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Submitted Evidence:</p>
                <div className="grid grid-cols-3 gap-2">
                  {milestone.evidence_urls.slice(0, 3).map((url, index) => (
                    <a 
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded overflow-hidden border"
                    >
                      <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Location Verification */}
            <div>
              <p className="text-sm font-medium mb-2">Verify Your Location</p>
              <Button
                variant="outline"
                onClick={handleGetLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : location ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Location Verified
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Verify I'm at Site
                  </>
                )}
              </Button>
            </div>

            {/* Rating */}
            <div>
              <p className="text-sm font-medium mb-2">Quality Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-colors"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        (hoverRating || rating) >= star 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Decision */}
            <div>
              <p className="text-sm font-medium mb-2">Your Verification</p>
              <div className="flex gap-2">
                <Button
                  variant={verificationStatus === 'approved' ? 'default' : 'outline'}
                  className={verificationStatus === 'approved' ? 'bg-green-600' : ''}
                  onClick={() => setVerificationStatus('approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve - Work Completed
                </Button>
                <Button
                  variant={verificationStatus === 'rejected' ? 'destructive' : 'outline'}
                  onClick={() => setVerificationStatus('rejected')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject - Issues Found
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-sm font-medium mb-2">Additional Notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what you observed..."
                rows={3}
              />
            </div>

            {verificationStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">
                    Please provide details about the issues you found in the notes above.
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
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Verification'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Milestone Evidence</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {milestone.evidence_urls?.map((url, index) => (
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
            <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MilestoneVerificationCard;
