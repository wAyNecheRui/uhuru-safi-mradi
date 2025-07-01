
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<StepProps>;
  validation?: () => boolean;
}

export interface StepProps {
  data: any;
  onDataChange: (data: any) => void;
  errors?: Record<string, string>;
}

interface MultiStepFormProps {
  steps: FormStep[];
  onComplete: (data: any) => Promise<void> | void;
  onCancel?: () => void;
  className?: string;
}

export const MultiStepForm = ({ 
  steps, 
  onComplete, 
  onCancel, 
  className = '' 
}: MultiStepFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleDataChange = useCallback((stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    // Clear errors when data changes
    setErrors({});
  }, []);

  const handleNext = useCallback(async () => {
    const step = steps[currentStep];
    
    // Validate current step if validation function exists
    if (step.validation) {
      const isValid = step.validation();
      if (!isValid) {
        return;
      }
    }

    if (isLastStep) {
      setIsSubmitting(true);
      try {
        await onComplete(formData);
      } catch (error) {
        console.error('Form submission error:', error);
        setErrors({ submit: 'An error occurred while submitting the form' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps, isLastStep, onComplete, formData]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleStepClick = useCallback((stepIndex: number) => {
    // Only allow navigation to previous steps or the next immediate step
    if (stepIndex <= currentStep + 1 && stepIndex >= 0) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep]);

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            {currentStepData.description && (
              <p className="text-muted-foreground mt-2">{currentStepData.description}</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
        
        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                } ${index <= currentStep + 1 ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                disabled={index > currentStep + 1}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <StepComponent
          data={formData}
          onDataChange={handleDataChange}
          errors={errors}
        />

        {errors.submit && (
          <div className="text-destructive text-sm bg-destructive/10 p-3 rounded">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-between pt-6">
          <div>
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {onCancel && isFirstStep && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Submitting...'
            ) : isLastStep ? (
              'Complete'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
