import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ReportData } from '@/types/problemReporting';
import { WorkflowService } from '@/services/WorkflowService';

const emptyReportData: ReportData = {
  title: '',
  category: 'roads',
  description: '',
  location: '',
  coordinates: '',
  gpsVerified: false,
  priority: '',
  photos: [],
  estimatedCost: '',
  affectedPopulation: ''
};

export const useProblemReporting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reportData, setReportData] = useState<ReportData>({ ...emptyReportData });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: keyof ReportData, value: string) => {
    setReportData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLocationDataChange = useCallback((data: { gpsVerified: boolean; coordinates?: string; location?: string }) => {
    setReportData(prev => ({
      ...prev,
      gpsVerified: data.gpsVerified,
      ...(data.coordinates ? { coordinates: data.coordinates } : {}),
      ...(data.location ? { location: data.location } : {}),
    }));
  }, []);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + reportData.photos.length > 10) {
      toast.error('Maximum 10 photos/videos allowed');
      return;
    }

    setReportData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
    toast.success(`${files.length} file(s) added successfully`);
  }, [reportData.photos.length]);

  const handleRemovePhoto = useCallback((index: number) => {
    setReportData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    toast.success('File removed');
  }, []);

  const handleCameraCapture = useCallback((file: File) => {
    if (reportData.photos.length >= 10) {
      toast.error('Maximum 10 photos/videos allowed');
      return;
    }
    setReportData(prev => ({ ...prev, photos: [...prev.photos, file] }));
  }, [reportData.photos.length]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }

    toast.info('Detecting location...', { duration: 2000 });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = `${latitude}, ${longitude}`;

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'en-US,en;q=0.9' }
          });

          if (!response.ok) throw new Error('Network response was not ok');

          const data = await response.json();
          const detectedLocation = data.display_name;

          setReportData(prev => ({
            ...prev,
            coordinates,
            location: detectedLocation || coordinates
          }));
          toast.success('Location automatically detected!');
        } catch (error) {
          console.error("OSM Geocoding error:", error);
          setReportData(prev => ({ ...prev, coordinates, location: `Location at ${coordinates}` }));
          toast.success('GPS coordinates captured, but could not fetch address name.');
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        toast.error('Unable to get GPS location. Please check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const getValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];
    if (!reportData.title.trim()) errors.push('Problem title is required');
    if (!reportData.category) errors.push('Category is required');
    if (!reportData.description.trim()) errors.push('Description is required');
    if (!reportData.coordinates) errors.push('GPS location is required — please allow location access');
    if (reportData.photos.length === 0) errors.push('At least one photo or video is required');
    if (!reportData.priority) errors.push('Priority level is required');
    return errors;
  }, [reportData]);

  const isFormValid = useCallback(() => {
    return getValidationErrors().length === 0;
  }, [getValidationErrors]);

  const submitReport = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to submit a report');
      navigate('/auth');
      return;
    }

    const errors = getValidationErrors();
    if (errors.length > 0) {
      toast.error(`Please fix: ${errors[0]}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Parallelize photo uploads for significantly better performance
      const uploadPromises = reportData.photos.map(async (photo) => {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/problem-reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('report-files')
          .upload(filePath, photo);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          throw new Error(`Failed to upload ${photo.name}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('report-files')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const photoUrls = await Promise.all(uploadPromises);

      // Submit the report via WorkflowService - only sending fields existing in the schema
      await WorkflowService.submitProblemReport({
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        location: reportData.location,
        coordinates: reportData.coordinates || undefined,
        estimated_cost: reportData.estimatedCost ? parseFloat(reportData.estimatedCost) : undefined,
        affected_population: reportData.affectedPopulation ? parseInt(reportData.affectedPopulation) : undefined,
        photo_urls: photoUrls
      });

      toast.success('Problem report submitted successfully!');
      setReportData({ ...emptyReportData });
      navigate('/citizen/track');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`Failed to submit report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [reportData, user, navigate, getValidationErrors]);

  // Auto-detect location on mount

  // Auto-detect location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    reportData,
    handleInputChange,
    handleLocationDataChange,
    handlePhotoUpload,
    handleRemovePhoto,
    handleCameraCapture,
    getCurrentLocation,
    submitReport,
    isSubmitting,
    getValidationErrors,
    isFormValid
  };
};
