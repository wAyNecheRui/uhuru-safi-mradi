
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
      <DialogContent className="max-w-2xl max-h-[90dvh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl pr-8">{getRoleTitle(onboarding.userType)}</DialogTitle>
          <p className="text-muted-foreground mt-2 pr-8">{getRoleDescription(onboarding.userType)}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-6 py-2">
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
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                    : currentStep?.id === step.id
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className="mt-1">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
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
            <div className="bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 dark:text-green-400">Onboarding Complete!</h3>
              <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                You're all set up and ready to use the platform.
              </p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {onboarding.isCompleted ? 'Close' : 'Skip for Now'}
          </Button>
          {!onboarding.isCompleted && currentStep && (
            <Button onClick={() => onCompleteStep(currentStep.id)}>
              Complete Current Step
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
