import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  HardHat, 
  Package, 
  Shield, 
  Wrench, 
  Clock,
  ThumbsUp,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LiveNotificationService } from '@/services/LiveNotificationService';
import { MilestonePaymentService } from '@/services/MilestonePaymentService';

interface QualityRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onRatingSubmitted?: () => void;
}

interface RatingCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  rating: number;
}

const QualityRatingModal: React.FC<QualityRatingModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onRatingSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [additionalComments, setAdditionalComments] = useState('');
  const [hasAlreadyRated, setHasAlreadyRated] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [activeMilestone, setActiveMilestone] = useState<{ id: string; title: string } | null>(null);

  // Check if user has already rated this project and get active milestone
  useEffect(() => {
    const checkStatusAndMilestone = async () => {
      if (!user || !isOpen) {
        setCheckingStatus(false);
        return;
      }
      
      setCheckingStatus(true);
      try {
        // Check existing quality rating
        const { data: existingRating } = await supabase
          .from('quality_checkpoints')
          .select('id')
          .eq('project_id', projectId)
          .eq('inspector_id', user.id)
          .eq('inspector_type', 'citizen')
          .eq('checkpoint_name', 'Citizen Quality Review')
          .maybeSingle();
        
        setHasAlreadyRated(!!existingRating);

        // Get the current active milestone (first in_progress or submitted milestone)
        const { data: milestones } = await supabase
          .from('project_milestones')
          .select('id, title, status, milestone_number')
          .eq('project_id', projectId)
          .in('status', ['in_progress', 'submitted', 'pending'])
          .order('milestone_number', { ascending: true })
          .limit(1);

        if (milestones && milestones.length > 0) {
          setActiveMilestone({ id: milestones[0].id, title: milestones[0].title });
        }
      } catch (error) {
        console.error('Error checking rating status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatusAndMilestone();
  }, [user, projectId, isOpen]);
  
  const [categories, setCategories] = useState<RatingCategory[]>([
    {
      id: 'workmanship',
      label: 'Workmanship Quality',
      icon: <Wrench className="h-5 w-5" />,
      description: 'Quality of construction work and attention to detail',
      rating: 0
    },
    {
      id: 'materials',
      label: 'Materials Used',
      icon: <Package className="h-5 w-5" />,
      description: 'Quality and durability of materials',
      rating: 0
    },
    {
      id: 'safety',
      label: 'Safety Standards',
      icon: <Shield className="h-5 w-5" />,
      description: 'Adherence to safety protocols and site management',
      rating: 0
    },
    {
      id: 'timeliness',
      label: 'Timeline Adherence',
      icon: <Clock className="h-5 w-5" />,
      description: 'Work completed within expected timeframes',
      rating: 0
    },
    {
      id: 'professionalism',
      label: 'Professionalism',
      icon: <HardHat className="h-5 w-5" />,
      description: 'Professional conduct and community interaction',
      rating: 0
    }
  ]);

  const [hoverRatings, setHoverRatings] = useState<{ [key: string]: number }>({});

  const handleRatingChange = (categoryId: string, rating: number) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, rating } : cat
      )
    );
  };

  const getOverallRating = () => {
    const ratings = categories.filter(c => c.rating > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, cat) => sum + cat.rating, 0) / ratings.length;
  };

  const getRatingLabel = (rating: number): { label: string; color: string } => {
    if (rating >= 4.5) return { label: 'Excellent', color: 'text-green-600' };
    if (rating >= 3.5) return { label: 'Good', color: 'text-blue-600' };
    if (rating >= 2.5) return { label: 'Average', color: 'text-yellow-600' };
    if (rating >= 1.5) return { label: 'Below Average', color: 'text-orange-600' };
    if (rating > 0) return { label: 'Poor', color: 'text-red-600' };
    return { label: 'Not Rated', color: 'text-gray-400' };
  };

  const completedCategories = categories.filter(c => c.rating > 0).length;
  const progress = (completedCategories / categories.length) * 100;
  const canSubmit = completedCategories >= 3; // At least 3 categories rated

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;

    // Prevent double submission
    if (hasAlreadyRated) {
      toast({
        title: 'Already Rated',
        description: 'You have already submitted a quality rating for this project.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const overallRating = getOverallRating();
      const ratingsData = categories.reduce((acc, cat) => ({
        ...acc,
        [cat.id]: cat.rating
      }), {});

      // Store quality rating in quality_checkpoints
      const { error } = await supabase.from('quality_checkpoints').insert({
        project_id: projectId,
        inspector_id: user.id,
        inspector_type: 'citizen',
        checkpoint_name: 'Citizen Quality Review',
        inspection_criteria: 'Workmanship, Materials, Safety, Timeliness, Professionalism',
        score: Math.round(overallRating * 20), // Convert to 0-100 scale
        passed: overallRating >= 3,
        findings: additionalComments || null,
        recommendations: JSON.stringify(ratingsData)
      });

      if (error) {
        // Handle unique constraint violation (citizen already rated)
        if (error.code === '23505') {
          setHasAlreadyRated(true);
          toast({
            title: 'Already Rated',
            description: 'You have already submitted a quality rating for this project.',
            variant: 'destructive'
          });
          onClose();
          return;
        }
        throw error;
      }

      // CRITICAL: Also create milestone_verification for auto-payment workflow
      if (activeMilestone) {
        const { error: mvError } = await supabase.from('milestone_verifications').insert({
          milestone_id: activeMilestone.id,
          verifier_id: user.id,
          verification_status: 'approved',
          verification_notes: `Citizen Quality Review - Rating: ${Math.round(overallRating)}/5. Categories: Workmanship ${categories.find(c => c.id === 'workmanship')?.rating || 0}/5, Materials ${categories.find(c => c.id === 'materials')?.rating || 0}/5, Safety ${categories.find(c => c.id === 'safety')?.rating || 0}/5, Timeliness ${categories.find(c => c.id === 'timeliness')?.rating || 0}/5, Professionalism ${categories.find(c => c.id === 'professionalism')?.rating || 0}/5. ${additionalComments || ''}`,
          verification_photos: []
        });

        if (mvError) {
          console.error('Error creating milestone verification:', mvError);
          // Continue anyway - quality checkpoint was saved
        } else {
          console.log('[QualityRating] Created milestone verification for auto-payment check');
          
          // Trigger auto-payment check
          const paymentResult = await MilestonePaymentService.triggerAutomatedPayment(activeMilestone.id);
          
          if (paymentResult.success && !paymentResult.alreadyPaid) {
            toast({
              title: '💰 Payment Auto-Released!',
              description: paymentResult.message,
              duration: 8000
            });
          } else if (!paymentResult.success) {
            console.log('[QualityRating] Auto-payment check result:', paymentResult.message);
          }
        }
      }

      // Send live notifications
      await LiveNotificationService.onQualityRated(
        projectId,
        user.id,
        overallRating,
        ratingsData
      );

      toast({
        title: '✅ Quality Rating Submitted',
        description: `Overall rating: ${overallRating.toFixed(1)}/5 stars. Thank you for your detailed feedback!`
      });

      setHasAlreadyRated(true);
      onRatingSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quality rating',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const overallRating = getOverallRating();
  const { label: ratingLabel, color: ratingColor } = getRatingLabel(overallRating);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <span className="truncate">Rate Project Quality</span>
          </DialogTitle>
          <DialogDescription className="pr-8">
            Evaluate the quality of work on "{projectTitle}". Your detailed feedback helps ensure accountability.
          </DialogDescription>
        </DialogHeader>

        {checkingStatus ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasAlreadyRated ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Already Rated</h3>
              <p className="text-muted-foreground mt-2">
                You have already submitted a quality rating for this project. Each citizen can only rate once to ensure fair and accurate feedback.
              </p>
            </div>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-6 py-4">
              {/* Progress Indicator */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Rating Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedCategories}/{categories.length} categories rated
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Rate at least 3 categories to submit
                </p>
              </div>

              {/* Overall Rating Display */}
              {overallRating > 0 && (
                <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {overallRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall</div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= Math.round(overallRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <Badge className={`${ratingColor} bg-transparent border`}>
                    {ratingLabel}
                  </Badge>
                </div>
              )}

              {/* Rating Categories */}
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      category.rating > 0
                        ? 'border-green-200 bg-green-50/50 dark:border-green-700 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          category.rating > 0 
                            ? 'bg-green-100 text-green-600 dark:bg-green-800' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                        }`}>
                          {category.icon}
                        </div>
                        <div>
                          <Label className="font-medium flex items-center gap-2">
                            {category.label}
                            {category.rating > 0 && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(category.id, star)}
                            onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [category.id]: star }))}
                            onMouseLeave={() => setHoverRatings(prev => ({ ...prev, [category.id]: 0 }))}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                (hoverRatings[category.id] || category.rating) >= star
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    {category.rating > 0 && (
                      <div className="mt-2 ml-12 text-sm">
                        <span className={getRatingLabel(category.rating).color}>
                          {getRatingLabel(category.rating).label}
                        </span>
                        <span className="text-muted-foreground"> ({category.rating}/5)</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Additional Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments" className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Additional Observations (Optional)
                </Label>
                <Textarea
                  id="comments"
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Share any specific observations about the work quality, materials used, worker professionalism, or areas needing improvement..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Your detailed feedback helps improve future projects
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit || submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Submit Rating ({overallRating.toFixed(1)}/5)
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QualityRatingModal;
