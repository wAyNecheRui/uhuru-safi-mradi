import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Upload, X, Loader2, MapPin, Cloud, 
  CheckCircle, AlertCircle, Image as ImageIcon, Send
} from 'lucide-react';
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

interface Milestone {
  id: string;
  title: string;
  milestone_number: number;
  status: string;
}

interface ProgressUpdateFormProps {
  projectId: string;
  projectTitle: string;
  currentProgress: number;
  milestones: Milestone[];
  onClose: () => void;
  onSubmitted: () => void;
}

const ProgressUpdateForm: React.FC<ProgressUpdateFormProps> = ({
  projectId,
  projectTitle,
  currentProgress,
  milestones,
  onClose,
  onSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [progress, setProgress] = useState(currentProgress);
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
    setPhotos([...photos, ...newFiles]);

    // Create preview URLs
    newFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPhotoUrls(prev => [...prev, url]);
    });
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

      // If milestone selected, update milestone evidence
      if (selectedMilestoneId && uploadedPhotoUrls.length > 0) {
        const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);
        if (selectedMilestone && selectedMilestone.status === 'in_progress') {
          await supabase
            .from('project_milestones')
            .update({
              evidence_urls: uploadedPhotoUrls,
              submitted_at: new Date().toISOString(),
              status: 'submitted'
            })
            .eq('id', selectedMilestoneId);

          // Send live notification for milestone progress
          await LiveNotificationService.onMilestoneProgressSubmitted(
            projectId,
            selectedMilestoneId,
            selectedMilestone.title,
            user.id,
            description
          );
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

  // Deduplicate milestones by ID to prevent showing same milestone twice
  const uniqueMilestones = milestones.reduce((acc, milestone) => {
    if (!acc.find(m => m.id === milestone.id)) {
      acc.push(milestone);
    }
    return acc;
  }, [] as Milestone[]);

  const activeMilestones = uniqueMilestones.filter(m => 
    m.status === 'pending' || m.status === 'in_progress'
  );

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Submit Progress Update</DialogTitle>
        <p className="text-sm text-muted-foreground">{projectTitle}</p>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Progress Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Overall Progress</Label>
            <Badge variant="outline" className="text-lg">
              {progress}%
            </Badge>
          </div>
          <Slider
            value={[progress]}
            onValueChange={(value) => setProgress(value[0])}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Milestone Selection */}
        {activeMilestones.length > 0 && (
          <div className="space-y-2">
            <Label>Related Milestone (Optional)</Label>
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
                  capture="environment"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute('capture');
                        fileInputRef.current.click();
                      }
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photos
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute('capture', 'environment');
                        fileInputRef.current.click();
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
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
          disabled={submitting || !description.trim()}
          className="bg-primary"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {uploading ? 'Uploading Photos...' : 'Submitting...'}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Update
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ProgressUpdateForm;
