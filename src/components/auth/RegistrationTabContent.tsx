import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import RegistrationForm from './RegistrationForm';
import type { AuthFormData } from '@/hooks/useAuthForm';

interface RegistrationTabContentProps {
  formData: AuthFormData;
  isLoading: boolean;
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const RegistrationTabContent: React.FC<RegistrationTabContentProps> = ({
  formData,
  isLoading,
  onInputChange,
  onSubmit
}) => {
  return (
    <TabsContent value="register" className="mt-6">
      <RegistrationForm
        formData={formData}
        isLoading={isLoading}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </TabsContent>
  );
};

export default RegistrationTabContent;
