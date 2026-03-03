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
  MapPin, Clock, DollarSign, Users, Calendar, Briefcase, CheckCircle, User, Phone
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

interface CitizenProfile {
  full_name?: string;
  phone_number?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  skills?: string[];
  experience_years?: number;
  daily_rate?: number;
  national_id?: string;
}

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onApply: (jobId: string) => void;
  hasApplied: boolean;
  isApplying: boolean;
  citizenProfile?: CitizenProfile | null;
}

const JobDetailsModal = ({ 
  isOpen, onClose, job, onApply, hasApplied, isApplying, citizenProfile
}: JobDetailsModalProps) => {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Briefcase className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="truncate">{job.title}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 pr-8">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
            <p className="text-sm">{job.description}</p>
          </div>

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
                  : job.wage_min ? `From KES ${job.wage_min.toLocaleString()}` : 'Negotiable'}
              </p>
            </div>
          </div>

          {job.created_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Posted on {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          )}

          {/* Your Profile - What the contractor will see */}
          {citizenProfile && !hasApplied && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-sm text-blue-800 flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                Your Application Profile
              </h4>
              <p className="text-xs text-blue-600 mb-2">This information will be sent to the contractor:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-blue-600">Name:</span> <span className="font-medium">{citizenProfile.full_name || 'Not set'}</span></div>
                <div><span className="text-blue-600">Phone:</span> <span className="font-medium">{citizenProfile.phone_number || 'Not set'}</span></div>
                <div><span className="text-blue-600">County:</span> <span className="font-medium">{citizenProfile.county || 'Not set'}</span></div>
                <div><span className="text-blue-600">Experience:</span> <span className="font-medium">{citizenProfile.experience_years ? `${citizenProfile.experience_years} yrs` : 'Not set'}</span></div>
                {citizenProfile.skills && citizenProfile.skills.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-blue-600">Skills:</span>{' '}
                    <span className="font-medium">{citizenProfile.skills.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            {hasApplied ? (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">You have already applied for this job</span>
              </div>
            ) : (
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onApply(job.id)} disabled={isApplying}>
                {isApplying ? 'Submitting Application...' : 'Apply with Your Profile'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;
