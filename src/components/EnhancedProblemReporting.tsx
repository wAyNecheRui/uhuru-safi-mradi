
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Camera, MapPin, Clock, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EnhancedProblemReporting = () => {
  const [reportData, setReportData] = useState({
    title: '',
    category: 'roads',
    description: '',
    location: '',
    coordinates: '',
    priority: 'medium',
    photos: [] as File[],
    estimatedCost: '',
    affectedPopulation: ''
  });
  const { toast } = useToast();

  const categories = [
    { value: 'roads', label: 'Roads & Transportation', icon: '🛣️' },
    { value: 'water', label: 'Water & Sanitation', icon: '💧' },
    { value: 'healthcare', label: 'Healthcare Facilities', icon: '🏥' },
    { value: 'education', label: 'Education Infrastructure', icon: '🏫' },
    { value: 'electricity', label: 'Electricity & Lighting', icon: '⚡' },
    { value: 'waste', label: 'Waste Management', icon: '🗑️' },
    { value: 'security', label: 'Security Infrastructure', icon: '🛡️' },
    { value: 'other', label: 'Other Infrastructure', icon: '🏗️' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const handleInputChange = (field: string, value: string) => {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <AlertTriangle className="h-6 w-6 mr-3 text-green-600" />
            Enhanced Problem Reporting System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Report infrastructure problems in your community with detailed documentation and GPS tracking.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Problem Title *</label>
              <Input
                placeholder="Brief description of the problem"
                value={reportData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={reportData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Problem Description *</label>
            <Textarea
              placeholder="Provide detailed description of the problem, its impact, and any relevant background information..."
              rows={4}
              value={reportData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <Input
                placeholder="e.g., Mombasa Road, Industrial Area, Nairobi"
                value={reportData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GPS Coordinates</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Will be auto-filled"
                  value={reportData.coordinates}
                  onChange={(e) => handleInputChange('coordinates', e.target.value)}
                />
                <Button onClick={getCurrentLocation} variant="outline">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Priority and Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
              <div className="space-y-2">
                {priorities.map(priority => (
                  <div
                    key={priority.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      reportData.priority === priority.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('priority', priority.value)}
                  >
                    <Badge className={priority.color}>
                      {priority.label}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost (KES)</label>
                <Input
                  placeholder="e.g., 500000"
                  type="number"
                  value={reportData.estimatedCost}
                  onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affected Population</label>
                <Input
                  placeholder="e.g., 1000 residents"
                  value={reportData.affectedPopulation}
                  onChange={(e) => handleInputChange('affectedPopulation', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Photo Documentation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo Documentation</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Upload photos to document the problem</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Button variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose Photos
              </Button>
              {reportData.photos.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-green-600">{reportData.photos.length} photo(s) selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button onClick={submitReport} className="bg-green-600 hover:bg-green-700">
              <FileText className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProblemReporting;
