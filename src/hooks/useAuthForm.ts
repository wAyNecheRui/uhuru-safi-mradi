import { useState, useCallback } from 'react';

export interface AuthFormData {
  // Common fields
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  type: 'citizen' | 'contractor' | 'government';
  country: string;
  
  // Kenya-specific identification
  national_id: string;
  id_type: 'national_id' | 'passport' | 'alien_id' | 'military_id';
  gender: string;
  date_of_birth: string;
  
  // Location (Kenya administrative units)
  county: string;
  sub_county: string;
  ward: string;
  
  // Citizen-specific
  skills: string;
  
  // Contractor-specific (AGPO & NCA aligned)
  organization: string;
  kra_pin: string;
  company_registration_number: string;
  specialization: string;
  years_in_business: string;
  nca_category: string;
  is_agpo: boolean;
  agpo_category: string;
  
  // Government-specific (GHRIS aligned)
  department: string;
  position: string;
  employee_number: string;
  office_phone: string;
  supervisor_name: string;
  clearance_level: string;
}

export const useAuthForm = () => {
  const [formData, setFormData] = useState<AuthFormData>({
    // Common
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    type: 'citizen',
    country: 'KE',
    
    // Kenya ID
    national_id: '',
    id_type: 'national_id',
    gender: '',
    date_of_birth: '',
    
    // Location
    county: '',
    sub_county: '',
    ward: '',
    
    // Citizen
    skills: '',
    
    // Contractor
    organization: '',
    kra_pin: '',
    company_registration_number: '',
    specialization: '',
    years_in_business: '',
    nca_category: '',
    is_agpo: false,
    agpo_category: '',
    
    // Government
    department: '',
    position: '',
    employee_number: '',
    office_phone: '',
    supervisor_name: '',
    clearance_level: 'standard'
  });

  const handleInputChange = useCallback((field: string, value: string | boolean) => {
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
