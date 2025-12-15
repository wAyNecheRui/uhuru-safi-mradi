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
  kra_pin: string;
  specialization: string;
  years_in_business: string;
  department: string;
  position: string;
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
    skills: '',
    kra_pin: '',
    specialization: '',
    years_in_business: '',
    department: '',
    position: ''
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
