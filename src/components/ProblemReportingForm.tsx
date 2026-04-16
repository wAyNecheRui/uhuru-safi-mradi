
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DuplicateReportDetector from '@/components/reporting/DuplicateReportDetector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, AlertCircle, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useSecurityEnhanced } from '@/hooks/useSecurityEnhanced';
import { supabase } from '@/integrations/supabase/client';
import { enhancedReportValidationSchema } from '@/utils/securityEnhanced';

import { CATEGORIES, PRIORITIES } from '@/constants/problemReporting';

const ProblemReportingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addProject } = useProjects();
  const {
    csrfToken,
    isRateLimited,
    checkRateLimit,
    validateFile,
    sanitizeAndValidateInput,
    secureSubmit
  } = useSecurityEnhanced();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    location: '',
    estimatedCost: '',
    images: []
  });

  // Using canonical categories from constants
  const categories = CATEGORIES;
  const priorities = PRIORITIES;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a problem report.",
        variant: "destructive"
      });
      return;
    }

    // Authenticity check: Ensure user is a standard citizen
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.user_type !== 'citizen') {
      toast({
        title: "Standard Citizens Only",
        description: "Only standard citizen accounts can report new infrastructure problems.",
        variant: "destructive"
      });
      return;
    }

    // Check rate limiting
    if (isRateLimited) {
      toast({
        title: "Too Many Requests",
        description: "Please wait before submitting another report.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Sanitize and validate inputs
      const titleValidation = sanitizeAndValidateInput(formData.title, 200);
      const descValidation = sanitizeAndValidateInput(formData.description, 2000);
      const locationValidation = sanitizeAndValidateInput(formData.location, 200);
      const categoryValidation = sanitizeAndValidateInput(formData.category, 50);

      if (!titleValidation.valid || !descValidation.valid || !locationValidation.valid || !categoryValidation.valid) {
        toast({
          title: "Invalid Input",
          description: "Please check your input for invalid characters or length.",
          variant: "destructive"
        });
        return;
      }

      // Enhanced validation using Zod
      const reportData = {
        title: titleValidation.sanitized,
        description: descValidation.sanitized,
        location: locationValidation.sanitized,
        priority: formData.priority.toLowerCase(),
        category: categoryValidation.sanitized,
        coordinates: formData.location.includes('GPS:') ? formData.location.split('GPS:')[1]?.trim() : undefined
      };

      const validationResult = enhancedReportValidationSchema.safeParse(reportData);
      if (!validationResult.success) {
        toast({
          title: "Validation Failed",
          description: validationResult.error.errors[0]?.message || "Please check your input.",
          variant: "destructive"
        });
        return;
      }

      // Secure submission with rate limiting
      const result = await secureSubmit(
        reportData,
        async (data, csrf) => {
          return addProject({
            title: data.title,
            description: data.description,
            location: data.location,
            priority: data.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
            budget: formData.estimatedCost ? `KSh ${formData.estimatedCost}` : 'TBD',
            reportedBy: user.name || user.email,
            dateReported: new Date().toISOString().split('T')[0],
            category: data.category,
            estimatedCost: formData.estimatedCost
          });
        },
        `report_submit_${user.id}`
      );

      if (result.success) {
        toast({
          title: "Problem Report Submitted",
          description: "Your report has been submitted for community review.",
        });
        navigate('/citizen');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast({ title: "Detecting location...", description: "Please wait while we acquire your GPS coordinates." });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = `${lat}, ${lng}`;

          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              headers: { 'Accept-Language': 'en-US,en;q=0.9' }
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const detectedLocation = data.display_name;

            handleInputChange('location', detectedLocation || coords);
            toast({
              title: "Location Detected",
              description: `Mapped to: ${detectedLocation}`,
            });
          } catch (error) {
            console.error("OSM Geocoding error:", error);
            handleInputChange('location', coords);
            toast({
              title: "Location Captured",
              description: "Coordinates acquired, but unable to resolve street address.",
            });
          }
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your current location. Please check browser permissions.",
            variant: "destructive"
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast({
        title: "GPS not supported",
        description: "Your device doesn't support GPS location.",
        variant: "destructive"
      });
    }
  };

  // Auto-detect location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center text-2xl">
            <AlertCircle className="h-6 w-6 mr-3 text-blue-600" />
            Report Infrastructure Problem
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Help improve your community by reporting infrastructure issues that need attention.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Problem Title *</label>
                <Input
                  required
                  placeholder="Brief description of the problem"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Duplicate report detector */}
              {formData.title.length >= 10 && (
                <div className="md:col-span-2">
                  <DuplicateReportDetector
                    title={formData.title}
                    location={formData.location}
                    category={formData.category}
                    onLinkToExisting={(reportId) => {
                      navigate(`/citizen/community-voting?highlight=${reportId}`);
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level *</label>
                <div className="space-y-2">
                  {priorities.map(priority => (
                    <div
                      key={priority.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${formData.priority === priority.value
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-green-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <div className="flex flex-col space-y-3">
                  {formData.location ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <MapPin className="h-5 w-5 shrink-0" />
                        <span className="font-semibold shrink-0">Detected Location:</span>
                        <span className="break-words">{formData.location}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-500 bg-gray-50 italic flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        Initializing automatic location detection...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description *</label>
                <Textarea
                  required
                  minRows={4}
                  placeholder="Provide detailed information about the problem, its impact on the community, and any safety concerns"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost (KSh)</label>
                <Input
                  type="number"
                  placeholder="Optional rough estimate"
                  value={formData.estimatedCost}
                  onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo/Video Evidence</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload images or videos</p>
                  <p className="text-sm text-gray-500">Max 5 files, 10MB each (JPEG, PNG, WebP, PDF only)</p>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      for (const file of files) {
                        const validation = await validateFile(file);
                        if (!validation.valid) {
                          toast({
                            title: "Invalid File",
                            description: validation.error,
                            variant: "destructive"
                          });
                          return;
                        }
                      }
                      // Handle validated files here
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Community Review Process</h4>
                  <p className="text-sm text-blue-700">
                    Your report will be reviewed by community members and local officials.
                    Projects with higher community support and clear documentation are prioritized for funding.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Secure Submission</h4>
                  <p className="text-sm text-green-700">
                    Your data is protected with encryption and security validation.
                    All inputs are sanitized and validated before submission.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
              >
                <FileText className="w-4 w-4 mr-2" />
                Submit Problem Report
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProblemReportingForm;
