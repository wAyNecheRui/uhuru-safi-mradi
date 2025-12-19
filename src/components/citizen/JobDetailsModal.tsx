import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  Briefcase,
  CheckCircle
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  required_skills: string[];
  duration_days: number | null;
  wage_min: number | null;
  wage_max: number | null;
  positions_available: number | null;
  status: string | null;
  created_at: string | null;
}

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onApply: (jobId: string) => void;
  hasApplied: boolean;
  isApplying: boolean;
}

const JobDetailsModal = ({ 
  isOpen, 
  onClose, 
  job, 
  onApply, 
  hasApplied,
  isApplying 
}: JobDetailsModalProps) => {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {job.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {job.location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
            <p className="text-sm">{job.description}</p>
          </div>

          {/* Required Skills */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-primary border-primary/50">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="font-medium">{job.duration_days ? `${job.duration_days} days` : 'Flexible'}</p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Positions</span>
              </div>
              <p className="font-medium">{job.positions_available || 'Multiple'} available</p>
            </div>

            <div className="p-3 bg-muted rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Daily Wage</span>
              </div>
              <p className="font-medium text-green-600">
                {job.wage_min && job.wage_max 
                  ? `KES ${job.wage_min.toLocaleString()} - ${job.wage_max.toLocaleString()}`
                  : job.wage_min 
                    ? `From KES ${job.wage_min.toLocaleString()}`
                    : 'Negotiable'
                }
              </p>
            </div>
          </div>

          {/* Posted Date */}
          {job.created_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Posted on {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          )}

          {/* Apply Button */}
          <div className="pt-4 border-t">
            {hasApplied ? (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">You have already applied for this job</span>
              </div>
            ) : (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => onApply(job.id)}
                disabled={isApplying}
              >
                {isApplying ? 'Submitting Application...' : 'Apply for this Job'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;