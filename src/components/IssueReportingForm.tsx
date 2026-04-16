
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Upload, Send, Check, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { CATEGORIES, PRIORITIES } from '@/constants/problemReporting';

const IssueReportingForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    urgency: '',
    location: '',
    county: '',
    ward: '',
    gpsCoordinates: null as { lat: number, lng: number } | null,
    photos: [] as File[],
    reporterName: '',
    reporterPhone: '',
    reporterNationalId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const { toast } = useToast();

  const categories = CATEGORIES;

  const urgencyLevels = PRIORITIES;

  const kenyanCounties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Meru', 'Nyeri', 'Machakos',
    'Kakamega', 'Kericho', 'Kitale', 'Garissa', 'Thika', 'Kilifi', 'Malindi'
  ];

  const getCurrentLocation = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setFormData(prev => ({ ...prev, gpsCoordinates: coords }));
          toast({
            title: "Location captured",
            description: `GPS coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
          });
          setGpsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location error",
            description: "Unable to get your current location. Please enter manually.",
            variant: "destructive"
          });
          setGpsLoading(false);
        }
      );
    } else {
      toast({
        title: "GPS not supported",
        description: "Your device doesn't support GPS location.",
        variant: "destructive"
      });
      setGpsLoading(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + formData.photos.length > 5) {
      toast({
        title: "Too many files",
        description: "You can upload maximum 5 photos/videos.",
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
    toast({
      title: "Files uploaded",
      description: `${files.length} file(s) added successfully.`,
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!formData.title || !formData.description || !formData.category || !formData.urgency) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Issue reported successfully!",
      description: "Your report has been submitted and will be reviewed by the community. Reference ID: UWZ-2024-001234",
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      category: '',
      urgency: '',
      location: '',
      county: '',
      ward: '',
      gpsCoordinates: null,
      photos: [],
      reporterName: '',
      reporterPhone: '',
      reporterNationalId: ''
    });

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Camera className="h-6 w-6 mr-3 text-green-600" />
            Report Infrastructure Issue
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Help improve Kenya's infrastructure by reporting issues in your community.
            Your report will be verified and prioritized by citizen voting.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Issue Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Large pothole on Mombasa Road"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select issue category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="urgency" className="text-sm font-medium text-gray-700">
                    Urgency Level *
                  </Label>
                  <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center">
                            <Badge className={level.color}>{level.label}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Detailed Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the issue in detail, including when you first noticed it and how it affects the community..."
                    minRows={4}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="county" className="text-sm font-medium text-gray-700">
                  County *
                </Label>
                <Select value={formData.county} onValueChange={(value) => setFormData(prev => ({ ...prev, county: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {kenyanCounties.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ward" className="text-sm font-medium text-gray-700">
                  Ward/Constituency
                </Label>
                <Input
                  id="ward"
                  value={formData.ward}
                  onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
                  placeholder="e.g., Kasarani Ward"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Specific Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Near Kenyatta University"
                  className="mt-1"
                />
              </div>
            </div>

            {/* GPS Location */}
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">GPS Location</h4>
                <p className="text-sm text-blue-700">
                  {formData.gpsCoordinates
                    ? `Lat: ${formData.gpsCoordinates.lat.toFixed(6)}, Lng: ${formData.gpsCoordinates.lng.toFixed(6)}`
                    : 'No GPS coordinates captured yet'
                  }
                </p>
              </div>
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={gpsLoading}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {gpsLoading ? (
                  'Getting Location...'
                ) : formData.gpsCoordinates ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Location
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Get My Location
                  </>
                )}
              </Button>
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Photos/Videos (Max 5 files)
              </Label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> photos or videos
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, MP4 up to 10MB each</p>
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {formData.photos.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Camera className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reporter Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reporter Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="reporterName" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="reporterName"
                    value={formData.reporterName}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
                    placeholder="Your full name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reporterPhone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="reporterPhone"
                    value={formData.reporterPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporterPhone: e.target.value }))}
                    placeholder="0700 000 000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reporterNationalId" className="text-sm font-medium text-gray-700">
                    National ID (for verification)
                  </Label>
                  <Input
                    id="reporterNationalId"
                    value={formData.reporterNationalId}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporterNationalId: e.target.value }))}
                    placeholder="ID Number"
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Providing your details helps with verification and follow-up. Your information will be kept confidential.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
              >
                {isSubmitting ? (
                  'Submitting Report...'
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Submit Issue Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-green-800 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Your report will be reviewed for authenticity
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Community members will vote on priority
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Verified contractors will bid on the project
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Government approves and releases funds
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-800 mb-3">Transparency Features</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                All funds are tracked on blockchain
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Real-time project progress updates
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Community verification at each milestone
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                SMS updates via USSD for rural areas
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IssueReportingForm;
