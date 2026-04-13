import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Upload, X, Loader2, MapPin, 
  CheckCircle, AlertCircle, Clock, Info
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import GrokCameraModal from '@/components/camera/GrokCameraModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import LiveNotificationService from '@/services/LiveNotificationService';
import { calculateProjectProgress } from '@/utils/progressCalculation';

interface Milestone {
  id: string;
  title: string;
  milestone_number: number;
  status: string;
}

interface ProgressUpdateFormProps {
  projectId: string;
  projectTitle: string;
  milestones: Milestone[];
  onClose: () => void;
  onSubmitted: () => void;
}

const ProgressUpdateForm: React.FC<ProgressUpdateFormProps> = ({
  projectId,
  projectTitle,
  milestones,
  onClose,
  onSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [description, setDescription] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [challenges, setChallenges] = useState('');
  const [workersPresent, setWorkersPresent] = useState<number | ''>('');
  const [weatherConditions, setWeatherConditions] = useState('');
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Deduplicate milestones by ID to prevent showing same milestone twice
  const uniqueMilestones = milestones.reduce((acc, milestone) => {
    if (!acc.find(m => m.id === milestone.id)) {
      acc.push(milestone);
    }
    return acc;
  }, [] as Milestone[]);

  // Sort milestones by number for sequential processing
  const sortedMilestones = [...uniqueMilestones].sort((a, b) => a.milestone_number - b.milestone_number);

  // Enforce sequential milestone progression - only allow updating the NEXT available milestone
  const getNextAvailableMilestone = (): Milestone | null => {
    // Check if any milestone is currently submitted (awaiting verification) or verified (awaiting payment)
    const blockedMilestone = sortedMilestones.find(m => 
      m.status === 'submitted' || m.status === 'verified'
    );
    
    if (blockedMilestone) {
      // A milestone is in the verification/payment cycle - block all updates
      return null;
    }

    // Find a milestone that's in_progress (continue working on it)
    const inProgressMilestone = sortedMilestones.find(m => m.status === 'in_progress');
    if (inProgressMilestone) {
      return inProgressMilestone;
    }

    // Find the first pending milestone (start new work)
    const nextPendingMilestone = sortedMilestones.find(m => m.status === 'pending');
    return nextPendingMilestone || null;
  };

  // Get the blocking milestone for display purposes
  const getBlockingMilestone = (): Milestone | null => {
    return sortedMilestones.find(m => 
      m.status === 'submitted' || m.status === 'verified'
    ) || null;
  };

  const nextAvailableMilestone = getNextAvailableMilestone();
  const blockingMilestone = getBlockingMilestone();
  
  // Only show the single next available milestone (enforces sequential workflow)
  const activeMilestones = nextAvailableMilestone ? [nextAvailableMilestone] : [];

  // Calculate progress automatically based on milestone statuses using unified utility
  // When submitting, simulate the milestone becoming "submitted" for preview
  const calculateProgress = (): number => {
    if (uniqueMilestones.length === 0) return 0;
    
    // Create a modified milestone list to simulate current submission
    const selectedMilestone = uniqueMilestones.find(m => m.id === selectedMilestoneId);
    const isNewSubmission = selectedMilestone && 
      (selectedMilestone.status === 'pending' || selectedMilestone.status === 'in_progress');
    
    const simulatedMilestones = uniqueMilestones.map(m => {
      if (isNewSubmission && m.id === selectedMilestoneId) {
        // Simulate this milestone becoming 'submitted'
        return { ...m, status: 'submitted' };
      }
      return m;
    });
    
    return calculateProjectProgress(simulatedMilestones);
  };

  const progress = calculateProgress();

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
          title: "Location Captured",
          description: "Your current location has been recorded."
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
        toast({
          title: "Location Error",
          description: "Could not get your location. Please try again.",
          variant: "destructive"
        });
      }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - photos.length);
    setPhotos(prev => [...prev, ...newFiles]);

    // Create preview URLs
    newFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPhotoUrls(prev => [...prev, url]);
    });

    // Reset input so user can select the same file again
    e.target.value = '';
  };

  const handleCameraCapture = (file: File) => {
    if (photos.length >= 5) return;
    setPhotos(prev => [...prev, file]);
    const url = URL.createObjectURL(file);
    setPhotoUrls(prev => [...prev, url]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoUrls[index]);
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0 || !user) return [];

    // Upload all photos in parallel for faster performance
    const uploadPromises = photos.map(async (photo, index) => {
      // Path must start with user.id to satisfy RLS policy
      // Use index to ensure unique filenames even if uploaded at same millisecond
      const fileName = `${user.id}/progress/${projectId}/${Date.now()}_${index}_${photo.name}`;
      
      const { data, error } = await supabase.storage
        .from('report-files')
        .upload(fileName, photo);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('report-files')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  };

  const handleSubmit = async () => {
    if (!user || !description.trim()) {
      toast({
        title: "Required Fields",
        description: "Please provide a progress description",
        variant: "destructive"
      });
      return;
    }

    // Check if project is completed before allowing submission
    const { data: projectCheck } = await supabase
      .from('projects')
      .select('status')
      .eq('id', projectId)
      .single();
    
    if (projectCheck?.status === 'completed' || projectCheck?.status === 'cancelled') {
      toast({
        title: "Project Completed",
        description: "No progress updates can be submitted for a completed project.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Upload photos first
      setUploading(true);
      const uploadedPhotoUrls = await uploadPhotos();
      setUploading(false);

      // Create progress update
      const { error } = await supabase
        .from('project_progress')
        .insert({
          project_id: projectId,
          milestone_id: selectedMilestoneId || null,
          updated_by: user.id,
          progress_percentage: progress,
          update_description: description,
          photo_urls: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : null,
          challenges_faced: challenges || null,
          workers_present: workersPresent || null,
          weather_conditions: weatherConditions || null,
          gps_coordinates: location ? `(${location.lat},${location.lon})` : null,
        });

      if (error) throw error;

      // If milestone selected, update milestone status and evidence
      if (selectedMilestoneId) {
        const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);
        if (selectedMilestone) {
          // Determine the new status based on current status and whether evidence is provided
          let newStatus = selectedMilestone.status;
          
          if (selectedMilestone.status === 'pending') {
            // Start working on this milestone
            newStatus = uploadedPhotoUrls.length > 0 ? 'submitted' : 'in_progress';
          } else if (selectedMilestone.status === 'in_progress' && uploadedPhotoUrls.length > 0) {
            // Submit evidence for verification
            newStatus = 'submitted';
          }

          // Only update if status changes or we have new evidence
          if (newStatus !== selectedMilestone.status || uploadedPhotoUrls.length > 0) {
            const updateData: any = {
              status: newStatus
            };

            // Add evidence URLs if provided
            if (uploadedPhotoUrls.length > 0) {
              updateData.evidence_urls = uploadedPhotoUrls;
              updateData.submitted_at = new Date().toISOString();
            }

            await supabase
              .from('project_milestones')
              .update(updateData)
              .eq('id', selectedMilestoneId);

            // Send live notification for milestone progress
            if (newStatus === 'submitted') {
              await LiveNotificationService.onMilestoneProgressSubmitted(
                projectId,
                selectedMilestoneId,
                selectedMilestone.title,
                user.id,
                description
              );
            }
          }
        }
      }

      toast({
        title: "Progress Updated",
        description: "Your project progress has been submitted successfully."
      });

      onSubmitted();
    } catch (error) {
      console.error('Error submitting progress:', error);
      toast({
        title: "Error",
        description: "Failed to submit progress update",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-2xl max-h-[85dvh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle className="text-base sm:text-lg pr-8">Submit Progress Update</DialogTitle>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{projectTitle}</p>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-2 pr-1">
        {/* Auto-calculated Progress Display */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-sm font-medium">Overall Progress</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-calculated based on {uniqueMilestones.length} milestone{uniqueMilestones.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Badge className="text-lg px-3 py-1 bg-primary text-primary-foreground">
                {progress}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{uniqueMilestones.filter(m => m.status === 'verified' || m.status === 'completed').length} completed</span>
              <span>{uniqueMilestones.filter(m => m.status === 'submitted').length} awaiting verification</span>
              <span>{activeMilestones.length} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Milestone Blocked Alert */}
        {blockingMilestone && (
          <Alert className="border-amber-300 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Progress Update Blocked</AlertTitle>
            <AlertDescription className="text-amber-700">
              {blockingMilestone.status === 'submitted' 
                ? `Milestone "${blockingMilestone.title}" is awaiting citizen verification.`
                : `Milestone "${blockingMilestone.title}" is verified but awaiting payment release.`
              }
              <br />
              <span className="text-sm mt-1 block">Complete the current milestone cycle before updating progress on the next one.</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Milestone Selection - Only show if not blocked */}
        {activeMilestones.length > 0 && !blockingMilestone && (
          <div className="space-y-2">
            <Label>Related Milestone</Label>
            <Select 
              value={selectedMilestoneId || "none"} 
              onValueChange={(value) => setSelectedMilestoneId(value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a milestone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific milestone</SelectItem>
                {activeMilestones.map(milestone => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    M{milestone.milestone_number}: {milestone.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Sequential workflow: You can only update the next milestone in order.
            </p>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label>Progress Description *</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the work completed, activities performed..."
            rows={4}
          />
        </div>

        {/* Photo Upload for Milestone Verification */}
        <div className="space-y-2">
          <Label className="flex items-center">
            <Camera className="h-4 w-4 mr-2 text-blue-600" />
            Photo Evidence for Citizen Verification
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Upload photos of completed work. Citizens will use these to verify milestone completion.
          </p>
          <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/50">
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-200">
                    <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 5 && (
              <div className="text-center space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photos
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setCameraOpen(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {photos.length}/5 photos • JPG, PNG supported
                </p>
              </div>
            )}
          </div>
          {selectedMilestoneId && (
            <p className="text-xs text-amber-600 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              Photos will be attached to the selected milestone for citizen verification
            </p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>GPS Location</Label>
          <div className="flex items-center gap-2">
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
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Capture Location
                </>
              )}
            </Button>
            {location && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Location Captured
              </Badge>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Workers Present</Label>
            <Input
              type="number"
              min="0"
              value={workersPresent}
              onChange={(e) => setWorkersPresent(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Number of workers"
            />
          </div>
          <div className="space-y-2">
            <Label>Weather Conditions</Label>
            <Select value={weatherConditions} onValueChange={setWeatherConditions}>
              <SelectTrigger>
                <SelectValue placeholder="Select weather" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunny">Sunny</SelectItem>
                <SelectItem value="cloudy">Cloudy</SelectItem>
                <SelectItem value="rainy">Rainy</SelectItem>
                <SelectItem value="stormy">Stormy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Challenges */}
        <div className="space-y-2">
          <Label>Challenges Faced (Optional)</Label>
          <Textarea
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            placeholder="Any challenges, delays, or issues encountered..."
            rows={2}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !description.trim() || !!blockingMilestone}
          className="bg-primary"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {uploading ? 'Uploading Photos...' : 'Submitting...'}
            </>
          ) : blockingMilestone ? (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Update Blocked
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Update
            </>
          )}
        </Button>
      </DialogFooter>

      {/* Grok Camera Modal */}
      <GrokCameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
        maxFiles={5}
        capturedCount={photos.length}
      />
    </DialogContent>
  );
};

export default ProgressUpdateForm;
