
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import type { AuthFormData } from '@/hooks/useAuthForm';

interface LoginTabContentProps {
  formData: AuthFormData;
  isLoading: boolean;
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LoginTabContent: React.FC<LoginTabContentProps> = ({
  formData,
  isLoading,
  onInputChange,
  onSubmit
}) => {
  return (
    <TabsContent value="login" className="space-y-4 mt-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Welcome back!</p>
            <p>Sign in with your registered email and password.</p>
          </div>
        </div>
      </div>
      <LoginForm
        formData={formData}
        isLoading={isLoading}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </TabsContent>
  );
};

export default LoginTabContent;
