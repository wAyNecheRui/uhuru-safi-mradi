import React, { useState, useEffect } from 'react';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { cn } from '@/lib/utils';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useAuth } from '@/contexts/AuthContext';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { ConsentBanner } from '@/components/privacy/ConsentBanner';
import CountyAssignmentGate from '@/components/auth/CountyAssignmentGate';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  userType?: 'citizen' | 'contractor' | 'government';
  userName?: string;
}

export function AppLayout({ children, className, userType: propUserType, userName: propUserName }: AppLayoutProps) {
  useIdleTimeout();
  const { user } = useAuth();

  const userType = propUserType || user?.user_type;
  const userName = propUserName || user?.name;

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!userType) return;
    const key = `onboarding_wizard_${userType}_completed`;
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true);
    }
  }, [userType]);

  const handleOnboardingComplete = () => {
    if (userType) {
      localStorage.setItem(`onboarding_wizard_${userType}_completed`, 'true');
    }
    setShowOnboarding(false);
  };

  return (
    <>
      <OfflineBanner />
      <div className={cn('min-h-screen w-full overflow-x-hidden', className)}>
        {children}
      </div>
      <div id="live-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />
      <FeedbackButton />
      <ConsentBanner />
      <CountyAssignmentGate />
      {showOnboarding && userType && (
        <OnboardingWizard
          userType={userType}
          userName={userName || ''}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}
    </>
  );
}