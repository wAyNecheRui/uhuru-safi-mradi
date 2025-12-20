import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, CheckCircle, Award } from 'lucide-react';
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

interface ContractorRatingFormProps {
  projectId: string;
  contractorId: string;
  projectTitle: string;
  contractorName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const ContractorRatingForm: React.FC<ContractorRatingFormProps> = ({
  projectId,
  contractorId,
  projectTitle,
  contractorName,
  onClose,
  onSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [overallRating, setOverallRating] = useState(0);
  const [workQuality, setWorkQuality] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRatings, setHoverRatings] = useState({
    overall: 0,
    quality: 0,
    timeliness: 0,
    communication: 0
  });

  const RatingStars = ({ 
    value, 
    onChange, 
    hoverValue, 
    onHover 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    hoverValue: number;
    onHover: (v: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star 
            className={`h-7 w-7 ${
              (hoverValue || value) >= star 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (!user || overallRating === 0) {
      toast({
        title: "Required Fields",
        description: "Please provide at least an overall rating",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Insert rating
      const { error } = await supabase
        .from('contractor_ratings')
        .insert({
          contractor_id: contractorId,
          project_id: projectId,
          rated_by: user.id,
          rating: overallRating,
          work_quality: workQuality || null,
          completion_timeliness: timeliness || null,
          communication: communication || null,
          review: review || null
        });

      if (error) throw error;

      // Update contractor's average rating
      const { data: allRatings } = await supabase
        .from('contractor_ratings')
        .select('rating')
        .eq('contractor_id', contractorId);

      if (allRatings && allRatings.length > 0) {
        const avgRating = allRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / allRatings.length;
        
        await supabase
          .from('contractor_profiles')
          .update({ average_rating: avgRating })
          .eq('user_id', contractorId);
      }

      toast({
        title: "Rating Submitted",
        description: "Thank you for rating this contractor!"
      });

      onSubmitted();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Rate Contractor
        </DialogTitle>
        <DialogDescription>
          {contractorName} - {projectTitle}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Overall Rating */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Overall Rating *</Label>
          <RatingStars
            value={overallRating}
            onChange={setOverallRating}
            hoverValue={hoverRatings.overall}
            onHover={(v) => setHoverRatings(prev => ({ ...prev, overall: v }))}
          />
        </div>

        {/* Category Ratings */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">Detailed Ratings (Optional)</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Work Quality</Label>
              <RatingStars
                value={workQuality}
                onChange={setWorkQuality}
                hoverValue={hoverRatings.quality}
                onHover={(v) => setHoverRatings(prev => ({ ...prev, quality: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Timeliness</Label>
              <RatingStars
                value={timeliness}
                onChange={setTimeliness}
                hoverValue={hoverRatings.timeliness}
                onHover={(v) => setHoverRatings(prev => ({ ...prev, timeliness: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Communication</Label>
              <RatingStars
                value={communication}
                onChange={setCommunication}
                hoverValue={hoverRatings.communication}
                onHover={(v) => setHoverRatings(prev => ({ ...prev, communication: v }))}
              />
            </div>
          </div>
        </div>

        {/* Written Review */}
        <div className="space-y-2">
          <Label>Written Review (Optional)</Label>
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience working with this contractor..."
            rows={4}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || overallRating === 0}
          className="bg-primary"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Rating
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ContractorRatingForm;
