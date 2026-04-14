
import { useState, useCallback } from 'react';
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
  county: '',
  constituency: '',
  ward: '',
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

  const handleLocationDataChange = useCallback((data: { county: string; constituency: string; ward: string; gpsVerified: boolean; coordinates?: string }) => {
    setReportData(prev => ({
      ...prev,
      county: data.county,
      constituency: data.constituency,
      ward: data.ward,
      gpsVerified: data.gpsVerified,
      ...(data.coordinates ? { coordinates: data.coordinates } : {}),
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = `${latitude}, ${longitude}`;
        setReportData(prev => ({ ...prev, coordinates }));
        toast.success('GPS location captured successfully');
      },
      (error) => {
        console.error('GPS Error:', error);
        toast.error('Unable to get GPS location. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const getValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];
    if (!reportData.title.trim()) errors.push('Problem title is required');
    if (!reportData.category) errors.push('Category is required');
    if (!reportData.description.trim()) errors.push('Description is required');
    if (!reportData.county) errors.push('County is required');
    if (!reportData.constituency) errors.push('Constituency is required');
    if (!reportData.ward) errors.push('Ward is required');
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
      // Upload photos first if any
      const photoUrls: string[] = [];

      if (reportData.photos.length > 0) {
        for (const photo of reportData.photos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/problem-reports/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('report-files')
            .upload(filePath, photo);

          if (uploadError) {
            console.error('Photo upload error:', uploadError);
            toast.error(`Failed to upload ${photo.name}`);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('report-files')
              .getPublicUrl(filePath);
            photoUrls.push(publicUrl);
          }
        }
      }

      // Derive display location from structured fields
      const displayLocation = [reportData.ward, reportData.constituency, `${reportData.county} County`].filter(Boolean).join(', ');

      // Submit the report via WorkflowService with structured location
      const report = await WorkflowService.submitProblemReport({
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        location: displayLocation,
        coordinates: reportData.coordinates || undefined,
        county: reportData.county,
        constituency: reportData.constituency,
        ward: reportData.ward,
        estimated_cost: reportData.estimatedCost ? parseFloat(reportData.estimatedCost) : undefined,
        affected_population: reportData.affectedPopulation ? parseInt(reportData.affectedPopulation) : undefined,
        photo_urls: photoUrls
      });

      toast.success('Problem report submitted successfully!');

      // Reset form
      setReportData({ ...emptyReportData });

      navigate('/citizen/track');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`Failed to submit report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [reportData, user, navigate, getValidationErrors]);

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
