
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';

const ProblemReportingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addProject } = useProjects();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    location: '',
    estimatedCost: '',
    images: []
  });

  const categories = [
    'Roads & Transportation',
    'Water & Sanitation',
    'Healthcare Facilities',
    'Education Infrastructure',
    'Public Safety',
    'Energy & Utilities',
    'Environmental',
    'Other'
  ];

  const priorities = [
    { value: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a problem report.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newProject = addProject({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        priority: formData.priority as 'Low' | 'Medium' | 'High' | 'Critical',
        budget: formData.estimatedCost ? `KSh ${formData.estimatedCost}` : 'TBD',
        reportedBy: user.name,
        dateReported: new Date().toISOString().split('T')[0],
        category: formData.category,
        estimatedCost: formData.estimatedCost
      });

      toast({
        title: "Problem Report Submitted",
        description: "Your report has been submitted for community review.",
      });

      navigate('/citizen');
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          handleInputChange('location', `${formData.location} (GPS: ${coords})`);
          toast({
            title: "Location Added",
            description: "GPS coordinates have been added to your location.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your current location.",
            variant: "destructive"
          });
        }
      );
    }
  };

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
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level *</label>
                <div className="space-y-2">
                  {priorities.map(priority => (
                    <div
                      key={priority.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.priority === priority.value
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-green-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleInputChange('priority', priority.value)}
                    >
                      <Badge className={priority.color}>
                        {priority.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <div className="flex space-x-3">
                  <Input
                    required
                    className="flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detailed location description"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    GPS
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description *</label>
                <Textarea
                  required
                  rows={4}
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
                  <p className="text-sm text-gray-500">Max 5 files, 10MB each</p>
                  <input type="file" multiple accept="image/*,video/*" className="hidden" />
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
