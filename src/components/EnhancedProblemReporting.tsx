
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText } from 'lucide-react';
import { useProblemReporting } from '@/hooks/useProblemReporting';
import BasicInfoSection from '@/components/reporting/BasicInfoSection';
import LocationSection from '@/components/reporting/LocationSection';
import PriorityImpactSection from '@/components/reporting/PriorityImpactSection';
import ImpactAssessmentSection from '@/components/reporting/ImpactAssessmentSection';
import PhotoUploadSection from '@/components/reporting/PhotoUploadSection';

const EnhancedProblemReporting = () => {
  const {
    reportData,
    handleInputChange,
    handlePhotoUpload,
    handleRemovePhoto,
    getCurrentLocation,
    submitReport,
    isSubmitting
  } = useProblemReporting();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-slate-600">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <AlertTriangle className="h-6 w-6 mr-3 text-slate-600" />
            Enhanced Problem Reporting System
          </CardTitle>
          <p className="text-slate-600 mt-2">
            Report infrastructure problems in your community with detailed documentation and GPS tracking.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <BasicInfoSection
            reportData={reportData}
            onInputChange={handleInputChange}
          />

          <LocationSection
            reportData={reportData}
            onInputChange={handleInputChange}
            onGetCurrentLocation={getCurrentLocation}
          />

          <PriorityImpactSection
            reportData={reportData}
            onInputChange={handleInputChange}
          />

          <PhotoUploadSection
            photoCount={reportData.photos.length}
            photos={reportData.photos}
            onPhotoUpload={handlePhotoUpload}
            onRemovePhoto={handleRemovePhoto}
          />

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button 
              onClick={submitReport} 
              className="bg-slate-600 hover:bg-slate-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProblemReporting;
