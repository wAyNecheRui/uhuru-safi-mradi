import React from 'react';
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
    <div className="mt-2">
      <LoginForm
        formData={formData}
        isLoading={isLoading}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default LoginTabContent;
