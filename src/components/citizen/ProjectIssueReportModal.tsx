import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle,
  Camera,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Upload,
  FileImage
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LiveNotificationService } from '@/services/LiveNotificationService';

interface ProjectIssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onIssueSubmitted?: () => void;
}

const ISSUE_TYPES = [
  { value: 'quality_concern', label: 'Quality Concern', icon: '⚠️' },
  { value: 'safety_hazard', label: 'Safety Hazard', icon: '🚨' },
  { value: 'delayed_work', label: 'Work Delays', icon: '⏰' },
  { value: 'material_issue', label: 'Material Issues', icon: '📦' },
  { value: 'environmental', label: 'Environmental Impact', icon: '🌍' },
  { value: 'community_disruption', label: 'Community Disruption', icon: '🏘️' },
  { value: 'corruption_suspicion', label: 'Suspected Irregularity', icon: '🔍' },
  { value: 'other', label: 'Other Issue', icon: '📋' }
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800', description: 'Minor issue, no immediate action needed' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', description: 'Should be addressed soon' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', description: 'Urgent attention required' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800', description: 'Immediate action needed' }
];

const ProjectIssueReportModal: React.FC<ProjectIssueReportModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onIssueSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [issueType, setIssueType] = useState('');
  const [severity, setSeverity] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive'
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingLocation(false);
        toast({
          title: 'Location Captured',
          description: 'Your current location has been recorded'
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
        toast({
          title: 'Location Error',
          description: 'Could not get your location',
          variant: 'destructive'
        });
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).slice(0, 5 - photos.length);
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const canSubmit = issueType && severity && title.length >= 10 && description.length >= 20;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;

    setSubmitting(true);
    try {
      // Upload photos first
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileName = `${user.id}/issues/${projectId}/${Date.now()}_${photo.name}`;
        const { data, error } = await supabase.storage
          .from('report-files')
          .upload(fileName, photo);

        if (data && !error) {
          const { data: urlData } = supabase.storage
            .from('report-files')
            .getPublicUrl(fileName);
          photoUrls.push(urlData.publicUrl);
        }
      }

      // Create dispute record for issue tracking
      const { error } = await supabase.from('disputes').insert({
        project_id: projectId,
        raised_by: user.id,
        dispute_type: issueType,
        title: title,
        description: description,
        priority: severity,
        evidence_urls: photoUrls.length > 0 ? photoUrls : null,
        status: 'open'
      });

      if (error) throw error;

      // Send live notifications to contractor and government
      await LiveNotificationService.onProjectIssueReported(
        projectId,
        user.id,
        ISSUE_TYPES.find(t => t.value === issueType)?.label || issueType,
        description,
        severity
      );

      toast({
        title: '🚨 Issue Reported Successfully',
        description: 'Your report has been submitted. Both the contractor and government officials have been notified.'
      });

      onIssueSubmitted?.();
      onClose();
      
      // Reset form
      setIssueType('');
      setSeverity('');
      setTitle('');
      setDescription('');
      setLocation(null);
      setPhotos([]);
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit issue report',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'high': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default: return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive pr-8">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Report Project Issue</span>
          </DialogTitle>
          <DialogDescription className="pr-8">
            Report concerns about "{projectTitle}". Both the contractor and government officials will be immediately notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Issue Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="issueType">Type of Issue *</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity Selection */}
          <div className="space-y-2">
            <Label>Severity Level *</Label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_LEVELS.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setSeverity(level.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    severity === level.value
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getSeverityIcon(level.value)}
                    <Badge className={level.color}>{level.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Issue Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title * (min 10 characters)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue..."
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100 characters
            </p>
          </div>

          {/* Detailed Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description * (min 20 characters)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. Include what you observed, when it happened, and any potential impacts..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length} characters
            </p>
          </div>

          {/* Location Capture */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Your Location (Optional)
            </Label>
            <Button
              type="button"
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
                  Location Captured ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Capture Current Location
                </>
              )}
            </Button>
          </div>

          {/* Photo Evidence */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Evidence (Optional, max 5)
            </Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Photos help document the issue and speed up resolution
            </p>
          </div>

          {/* Notification Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">Who will be notified?</p>
                <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                  <li>• <strong>Contractor</strong> - Will see the issue and can respond</li>
                  <li>• <strong>Government Officials</strong> - Will review and may intervene</li>
                  <li>• <strong>You</strong> - Will receive updates on resolution</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Submit Issue Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectIssueReportModal;
