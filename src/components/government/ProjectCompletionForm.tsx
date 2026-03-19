import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Award, Star, CheckCircle, AlertCircle, Loader2,
  MessageSquare, Clock, Wrench, Users
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProjectLifecycleService } from '@/services/ProjectLifecycleService';
import { useToast } from '@/hooks/use-toast';

interface ProjectCompletionFormProps {
  projectId: string;
  projectTitle: string;
  contractorName?: string;
  budget?: number;
  onCompleted: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectCompletionForm: React.FC<ProjectCompletionFormProps> = ({
  projectId,
  projectTitle,
  contractorName,
  budget,
  onCompleted,
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  
  // Rating states
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [workQuality, setWorkQuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [review, setReview] = useState('');

  const ratingCategories = [
    { 
      label: 'Work Quality', 
      value: workQuality, 
      setter: setWorkQuality,
      icon: Wrench,
      description: 'Quality of construction and materials'
    },
    { 
      label: 'Communication', 
      value: communication, 
      setter: setCommunication,
      icon: MessageSquare,
      description: 'Responsiveness and clarity'
    },
    { 
      label: 'Timeliness', 
      value: timeliness, 
      setter: setTimeliness,
      icon: Clock,
      description: 'Meeting deadlines and schedules'
    },
  ];

  const handleComplete = async () => {
    if (overallRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating for the contractor",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const success = await ProjectLifecycleService.completeProject(projectId, {
        rating: overallRating,
        work_quality: workQuality || overallRating,
        communication: communication || overallRating,
        completion_timeliness: timeliness || overallRating,
        review: review || undefined
      });

      if (success) {
        toast({
          title: "Project Completed!",
          description: "The project has been marked as complete and published to the transparency portal."
        });
        onCompleted();
        onOpenChange(false);
      } else {
        throw new Error('Failed to complete project');
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast({
        title: "Error",
        description: "Failed to complete the project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderStarRating = (
    value: number, 
    setValue: (v: number) => void, 
    hover?: number,
    setHover?: (v: number) => void,
    size: 'sm' | 'lg' = 'sm'
  ) => {
    const iconSize = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(star)}
            onMouseEnter={() => setHover?.(star)}
            onMouseLeave={() => setHover?.(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star 
              className={`${iconSize} ${
                ((hover || value) >= star) 
                  ? 'fill-amber-400 text-amber-400' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Complete Project & Rate Contractor
          </DialogTitle>
          <DialogDescription>
            Finalize the project and provide a performance rating for the contractor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Project Summary */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">{projectTitle}</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              {contractorName && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{contractorName}</span>
                </div>
              )}
              {budget && (
                <div>
                  <span className="text-muted-foreground">Budget:</span>{' '}
                  <span className="font-medium">KES {budget.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Overall Rating */}
          <div className="space-y-2">
            <label className="font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Overall Performance Rating *
            </label>
            <div className="flex items-center gap-4">
              {renderStarRating(overallRating, setOverallRating, hoverRating, setHoverRating, 'lg')}
              {overallRating > 0 && (
                <Badge className="bg-amber-100 text-amber-800">
                  {overallRating}/5 Stars
                </Badge>
              )}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Rate specific aspects (optional):</p>
            {ratingCategories.map((category) => (
              <div key={category.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <category.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">{category.label}</span>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                {renderStarRating(category.value, category.setter)}
              </div>
            ))}
          </div>

          {/* Review */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Written Review (optional)</label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Describe the contractor's performance, quality of work, and any notable aspects..."
              rows={3}
            />
          </div>

          {/* Completion Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">This action will:</p>
                <ul className="text-blue-700 mt-1 space-y-1">
                  <li>• Mark the project as completed</li>
                  <li>• Publish final details to the transparency portal</li>
                  <li>• Update contractor's public rating</li>
                  <li>• Generate completion records</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleComplete} 
            disabled={processing || overallRating === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCompletionForm;
