
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ReportData } from '@/types/problemReporting';

export const useProblemReporting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [reportData, setReportData] = useState<ReportData>({
    title: '',
    category: '',
    description: '',
    location: '',
    coordinates: '',
    priority: '',
    photos: [],
    estimatedCost: '',
    affectedPopulation: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: keyof ReportData, value: string) => {
    setReportData(prev => ({ ...prev, [field]: value }));
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

  const submitReport = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to submit a report');
      navigate('/auth');
      return;
    }

    // Validation
    const requiredFields = ['title', 'category', 'description', 'location'];
    const missingFields = requiredFields.filter(field => !reportData[field as keyof ReportData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
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
          const filePath = `problem-reports/${fileName}`;

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

      // Submit the report
      const { data, error } = await supabase
        .from('problem_reports')
        .insert({
          title: reportData.title,
          description: reportData.description,
          category: reportData.category,
          priority: reportData.priority || 'medium',
          location: reportData.location,
          coordinates: reportData.coordinates,
          estimated_cost: reportData.estimatedCost ? parseFloat(reportData.estimatedCost) : null,
          affected_population: reportData.affectedPopulation ? parseInt(reportData.affectedPopulation) : null,
          photo_urls: photoUrls,
          reported_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Problem report submitted successfully!');
      
      // Reset form
      setReportData({
        title: '',
        category: '',
        description: '',
        location: '',
        coordinates: '',
        priority: '',
        photos: [],
        estimatedCost: '',
        affectedPopulation: ''
      });

      navigate('/citizen/track');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`Failed to submit report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [reportData, user, supabase, navigate]);

  return {
    reportData,
    handleInputChange,
    handlePhotoUpload,
    getCurrentLocation,
    submitReport,
    isSubmitting
  };
};
