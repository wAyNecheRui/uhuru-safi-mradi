import React from 'react';
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
    <TabsContent value="login" className="mt-6">
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
