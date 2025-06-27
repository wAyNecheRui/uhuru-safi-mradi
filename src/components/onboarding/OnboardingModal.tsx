
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { UserOnboarding } from '@/types/onboarding';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onboarding: UserOnboarding;
  onCompleteStep: (stepId: string) => void;
}

const OnboardingModal = ({ isOpen, onClose, onboarding, onCompleteStep }: OnboardingModalProps) => {
  const progress = (onboarding.currentStep / onboarding.steps.length) * 100;
  const currentStep = onboarding.steps.find(step => !step.completed);

  const getRoleTitle = (userType: string) => {
    const titles = {
      citizen: 'Welcome, Citizen!',
      contractor: 'Welcome, Contractor!',
      government: 'Welcome, Government Official!'
    };
    return titles[userType as keyof typeof titles] || 'Welcome!';
  };

  const getRoleDescription = (userType: string) => {
    const descriptions = {
      citizen: 'Help improve your community by reporting issues and participating in decisions.',
      contractor: 'Bid on projects and contribute to infrastructure development.',
      government: 'Manage projects, allocate resources, and oversee community development.'
    };
    return descriptions[userType as keyof typeof descriptions] || 'Get started with the platform.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{getRoleTitle(onboarding.userType)}</DialogTitle>
          <p className="text-gray-600 mt-2">{getRoleDescription(onboarding.userType)}</p>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <Badge variant="outline">
                {onboarding.currentStep}/{onboarding.steps.length} Complete
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Getting Started Steps</h3>
            {onboarding.steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border ${
                  step.completed
                    ? 'bg-green-50 border-green-200'
                    : currentStep?.id === step.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="mt-1">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  {currentStep?.id === step.id && !step.completed && (
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => onCompleteStep(step.id)}
                    >
                      Mark as Complete
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {onboarding.isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Onboarding Complete!</h3>
              <p className="text-sm text-green-700 mt-1">
                You're all set up and ready to use the platform.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              {onboarding.isCompleted ? 'Close' : 'Skip for Now'}
            </Button>
            {!onboarding.isCompleted && currentStep && (
              <Button onClick={() => onCompleteStep(currentStep.id)}>
                Complete Current Step
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
