
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface UserOnboarding {
  userId: string;
  userType: 'citizen' | 'contractor' | 'government';
  isCompleted: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  completedAt?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  push: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'project' | 'payment' | 'report' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}
