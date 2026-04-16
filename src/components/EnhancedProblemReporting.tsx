
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, AlertCircle, AlertTriangle, FileText, Shield } from 'lucide-react';
import { useProblemReporting } from '@/hooks/useProblemReporting';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import BasicInfoSection from '@/components/reporting/BasicInfoSection';
import LocationSection from '@/components/reporting/LocationSection';
import PriorityImpactSection from '@/components/reporting/PriorityImpactSection';
import ImpactAssessmentSection from '@/components/reporting/ImpactAssessmentSection';
import PhotoUploadSection from '@/components/reporting/PhotoUploadSection';
import { ValidationTooltip } from '@/components/ui/validation-tooltip';
import DuplicateReportDetector from '@/components/reporting/DuplicateReportDetector';

const EnhancedProblemReporting = () => {
  const navigate = useNavigate();
  const {
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
  } = useProblemReporting();

  const validationErrors = getValidationErrors();
  const formValid = isFormValid();
  const { userProfile, loading: profileLoading } = useProfile();
  const { user } = useAuth();

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="animate-spin inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted-foreground font-display">Verifying authenticity...</p>
      </div>
    );
  }

  // Guard: Only citizens can report problems
  if (user && userProfile?.user_type !== 'citizen') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-t-4 border-t-destructive shadow-lg overflow-hidden">
          <CardHeader className="bg-destructive/5 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl font-display text-destructive">Standard Citizens Only</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            <div className="max-w-md mx-auto space-y-3">
              <p className="text-gray-700 font-medium">
                Infrastructure reporting is reserved for local citizens to ensure community-driven priorities.
              </p>
              <p className="text-sm text-muted-foreground">
                Your current account is registered as a <span className="font-bold underline">{userProfile?.user_type}</span>.
                Please use a standard citizen account to report new infrastructure problems.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="font-display"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                className="bg-gray-900 hover:bg-black font-display"
              >
                View My Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-card-hover border-t-4 border-t-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center text-xl sm:text-2xl font-display">
            <AlertTriangle className="h-6 w-6 mr-3 text-primary" />
            Problem Reporting System
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Report infrastructure problems in your community with detailed documentation and GPS tracking.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <BasicInfoSection
            reportData={reportData}
            onInputChange={handleInputChange}
          />
          {/* Duplicate report detector */}
          {reportData.title.length >= 10 && (
            <DuplicateReportDetector
              title={reportData.title}
              description={reportData.description}
              location={reportData.location}
              category={reportData.category}
              onLinkToExisting={(reportId) => {
                navigate(`/citizen/community-voting?highlight=${reportId}`);
              }}
            />
          )}
          {/* Inline validation for title */}
          {!reportData.title.trim() && reportData.description.trim() && (
            <p className="text-xs text-destructive flex items-center gap-1 -mt-4">
              <AlertCircle className="h-3 w-3" /> Problem title is required
            </p>
          )}

          <LocationSection
            reportData={reportData}
            onInputChange={handleInputChange}
            onDetectLocation={getCurrentLocation}
          />

          <PriorityImpactSection
            reportData={reportData}
            onInputChange={handleInputChange}
          />
          {/* Inline validation for priority */}
          {!reportData.priority && reportData.title.trim() && (
            <p className="text-xs text-destructive flex items-center gap-1 -mt-4">
              <AlertCircle className="h-3 w-3" /> Priority level is required
            </p>
          )}

          <div className="space-y-2">
            <PhotoUploadSection
              photoCount={reportData.photos.length}
              photos={reportData.photos}
              onPhotoUpload={handlePhotoUpload}
              onRemovePhoto={handleRemovePhoto}
              onCameraCapture={handleCameraCapture}
            />
            {/* Mandatory photo requirement */}
            {reportData.photos.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  At least one photo or video is required to submit a report
                </p>
              </div>
            )}
          </div>

          {/* Validation summary */}
          {validationErrors.length > 0 && (
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {validationErrors.length} requirement{validationErrors.length > 1 ? 's' : ''} remaining
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <ValidationTooltip disabled={!formValid} missingFields={validationErrors}>
              <Button
                onClick={submitReport}
                disabled={isSubmitting || !formValid}
                className="w-full sm:w-auto"
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
            </ValidationTooltip>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProblemReporting;
