
import React from 'react';
import { AlertCircle } from 'lucide-react';
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
    <TabsContent value="register" className="space-y-4 mt-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Create Your Account</p>
            <p>Choose your role carefully - it determines your access level.</p>
          </div>
        </div>
      </div>
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
