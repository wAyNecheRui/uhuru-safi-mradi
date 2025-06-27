
import { useState, useEffect } from 'react';
import { UserOnboarding, OnboardingStep } from '@/types/onboarding';

export const useOnboarding = (userType: 'citizen' | 'contractor' | 'government') => {
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getOnboardingSteps = (type: string): OnboardingStep[] => {
    const commonSteps = [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your contact information and preferences',
        completed: false,
        order: 1
      }
    ];

    const typeSpecificSteps = {
      citizen: [
        {
          id: 'report-issue',
          title: 'Learn to Report Issues',
          description: 'Understand how to report infrastructure problems',
          completed: false,
          order: 2
        },
        {
          id: 'track-reports',
          title: 'Track Your Reports',
          description: 'See how to monitor progress on your submissions',
          completed: false,
          order: 3
        },
        {
          id: 'community-voting',
          title: 'Participate in Voting',
          description: 'Learn about community decision-making process',
          completed: false,
          order: 4
        }
      ],
      contractor: [
        {
          id: 'verification',
          title: 'Complete Verification',
          description: 'Submit required documents and certifications',
          completed: false,
          order: 2
        },
        {
          id: 'bidding',
          title: 'Understanding Bidding',
          description: 'Learn how to bid on available projects',
          completed: false,
          order: 3
        },
        {
          id: 'project-management',
          title: 'Project Management',
          description: 'Understand project tracking and milestone reporting',
          completed: false,
          order: 4
        }
      ],
      government: [
        {
          id: 'project-approval',
          title: 'Project Approval Process',
          description: 'Learn how to review and approve projects',
          completed: false,
          order: 2
        },
        {
          id: 'fund-management',
          title: 'Fund Management',
          description: 'Understand budget allocation and escrow management',
          completed: false,
          order: 3
        },
        {
          id: 'reporting',
          title: 'Reports and Analytics',
          description: 'Access performance metrics and community feedback',
          completed: false,
          order: 4
        }
      ]
    };

    return [...commonSteps, ...typeSpecificSteps[type]];
  };

  useEffect(() => {
    // Check if user has completed onboarding
    const existingOnboarding = localStorage.getItem(`onboarding_${userType}`);
    
    if (existingOnboarding) {
      setOnboarding(JSON.parse(existingOnboarding));
    } else {
      // Create new onboarding
      const newOnboarding: UserOnboarding = {
        userId: Date.now().toString(),
        userType,
        isCompleted: false,
        currentStep: 0,
        steps: getOnboardingSteps(userType)
      };
      setOnboarding(newOnboarding);
      localStorage.setItem(`onboarding_${userType}`, JSON.stringify(newOnboarding));
    }
    
    setIsLoading(false);
  }, [userType]);

  const completeStep = (stepId: string) => {
    if (!onboarding) return;

    const updatedSteps = onboarding.steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );

    const completedSteps = updatedSteps.filter(step => step.completed).length;
    const isCompleted = completedSteps === updatedSteps.length;

    const updatedOnboarding = {
      ...onboarding,
      steps: updatedSteps,
      currentStep: completedSteps,
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined
    };

    setOnboarding(updatedOnboarding);
    localStorage.setItem(`onboarding_${userType}`, JSON.stringify(updatedOnboarding));
  };

  const resetOnboarding = () => {
    localStorage.removeItem(`onboarding_${userType}`);
    setOnboarding(null);
  };

  return {
    onboarding,
    isLoading,
    completeStep,
    resetOnboarding
  };
};
