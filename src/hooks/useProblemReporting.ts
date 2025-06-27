
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ReportData } from '@/types/problemReporting';

export const useProblemReporting = () => {
  const [reportData, setReportData] = useState<ReportData>({
    title: '',
    category: 'roads',
    description: '',
    location: '',
    coordinates: '',
    priority: 'medium',
    photos: [],
    estimatedCost: '',
    affectedPopulation: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof ReportData, value: string | File[]) => {
    setReportData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setReportData(prev => ({ ...prev, photos: [...prev.photos, ...newFiles] }));
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setReportData(prev => ({ ...prev, coordinates: coords }));
          toast({
            title: "Location captured",
            description: "GPS coordinates have been recorded.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enter manually.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const submitReport = () => {
    if (!reportData.title || !reportData.description || !reportData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Generate report ID
    const reportId = `RPT-${Date.now().toString().slice(-6)}`;
    
    // Create report object
    const report = {
      ...reportData,
      id: reportId,
      submissionDate: new Date().toISOString(),
      status: 'pending',
      reporterInfo: JSON.parse(localStorage.getItem('userAuth') || '{}')
    };

    // Save to localStorage (in real app, this would go to database)
    const existingReports = JSON.parse(localStorage.getItem('userReports') || '[]');
    existingReports.push(report);
    localStorage.setItem('userReports', JSON.stringify(existingReports));

    toast({
      title: "Report Submitted",
      description: `Your report ${reportId} has been submitted successfully. You can track its progress in your dashboard.`,
    });

    // Reset form
    setReportData({
      title: '',
      category: 'roads',
      description: '',
      location: '',
      coordinates: '',
      priority: 'medium',
      photos: [],
      estimatedCost: '',
      affectedPopulation: ''
    });
  };

  return {
    reportData,
    handleInputChange,
    handlePhotoUpload,
    getCurrentLocation,
    submitReport
  };
};
