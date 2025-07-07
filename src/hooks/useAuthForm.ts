
import { useState, useCallback } from 'react';

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  location: string;
  type: 'citizen' | 'contractor' | 'government';
  organization: string;
  skills: string;
}

export const useAuthForm = () => {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    location: '',
    type: 'citizen',
    organization: '',
    skills: ''
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(prev => ({ 
      ...prev, 
      password: '', 
      confirmPassword: '',
    }));
  }, []);

  return {
    formData,
    handleInputChange,
    resetForm
  };
};
