
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  user_type: 'citizen' | 'contractor' | 'government';
  profile?: {
    full_name?: string;
    phone_number?: string;
    location?: string;
    county?: string;
    sub_county?: string;
    ward?: string;
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export interface SignUpData {
  // Common fields
  name: string;
  phone?: string;
  location?: string;
  type: 'citizen' | 'contractor' | 'government';
  
  // Kenya-specific identification
  national_id?: string;
  id_type?: 'national_id' | 'passport' | 'alien_id' | 'military_id';
  gender?: string;
  date_of_birth?: string;
  
  // Location (Kenya administrative units)
  county?: string;
  sub_county?: string;
  ward?: string;
  
  // Citizen-specific
  skills?: string;
  
  // Contractor-specific (AGPO & NCA aligned)
  organization?: string;
  kra_pin?: string;
  company_registration_number?: string;
  specialization?: string;
  years_in_business?: string;
  nca_category?: string;
  is_agpo?: boolean;
  agpo_category?: string;
  
  // Government-specific (GHRIS aligned)
  department?: string;
  position?: string;
  employee_number?: string;
  office_phone?: string;
  supervisor_name?: string;
  clearance_level?: string;
}
