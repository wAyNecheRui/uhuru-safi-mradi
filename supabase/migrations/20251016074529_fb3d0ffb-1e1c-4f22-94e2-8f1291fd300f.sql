-- Phase 1: Core Authentication & Role-Based Access Control System

-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('citizen', 'contractor', 'government', 'admin');

-- 2. Create user_roles table (roles MUST be in separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- 5. RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Enhanced user_profiles table with required fields
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS national_id TEXT,
ADD COLUMN IF NOT EXISTS id_type TEXT DEFAULT 'national_id',
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS sub_county TEXT,
ADD COLUMN IF NOT EXISTS ward TEXT,
ADD COLUMN IF NOT EXISTS postal_address TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 7. Government official verification enhancements
ALTER TABLE public.user_verifications
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS document_urls TEXT[];

-- 8. Create contractor_profiles table for contractor-specific data
CREATE TABLE IF NOT EXISTS public.contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  company_registration_number TEXT,
  kra_pin TEXT,
  tax_compliance_certificate_url TEXT,
  business_permit_url TEXT,
  years_in_business INTEGER,
  number_of_employees INTEGER,
  specialization TEXT[],
  previous_projects_count INTEGER DEFAULT 0,
  total_contract_value NUMERIC DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own profile"
ON public.contractor_profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Government can view all contractor profiles"
ON public.contractor_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'government') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view verified contractors"
ON public.contractor_profiles
FOR SELECT
USING (verified = true);

-- 9. Create government_profiles table for government officials
CREATE TABLE IF NOT EXISTS public.government_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  employee_number TEXT,
  office_location TEXT,
  office_phone TEXT,
  supervisor_name TEXT,
  supervisor_contact TEXT,
  clearance_level TEXT DEFAULT 'standard',
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.government_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Government users can manage own profile"
ON public.government_profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all government profiles"
ON public.government_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Update trigger to assign default role when user signs up
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign default citizen role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, COALESCE((NEW.raw_user_meta_data->>'user_type')::app_role, 'citizen'))
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to user_profiles
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- 11. Create verification request tracking table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role app_role NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  supporting_documents TEXT[],
  justification TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification requests"
ON public.verification_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests"
ON public.verification_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage verification requests"
ON public.verification_requests
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 12. Add updated_at trigger for new tables
CREATE TRIGGER update_contractor_profiles_updated_at
  BEFORE UPDATE ON public.contractor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_government_profiles_updated_at
  BEFORE UPDATE ON public.government_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_verified ON public.contractor_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_government_profiles_verified ON public.government_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_county ON public.user_profiles(county);

-- 14. Add comments for documentation
COMMENT ON TABLE public.user_roles IS 'Stores user roles separately for security - prevents privilege escalation attacks';
COMMENT ON FUNCTION public.has_role IS 'Security definer function to check user roles without RLS recursion';
COMMENT ON TABLE public.contractor_profiles IS 'Contractor-specific profile information and verification status';
COMMENT ON TABLE public.government_profiles IS 'Government official profile information and clearance levels';
COMMENT ON TABLE public.verification_requests IS 'Tracks role upgrade requests and verification workflow';