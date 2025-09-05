-- Fix government user verification security issue (corrected approach)

-- Create a secure function to verify government users with proper verification status
CREATE OR REPLACE FUNCTION public.is_verified_government_user(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = user_uuid 
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = user_uuid
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  );
$$;

-- Drop the existing government policy and replace with stricter verification
DROP POLICY IF EXISTS "government_read_all_workers" ON public.citizen_workers;

-- Create new policy that requires proper government verification
CREATE POLICY "verified_government_read_workers" 
ON public.citizen_workers 
FOR SELECT
TO authenticated
USING (public.is_verified_government_user());

-- Create audit table for tracking government access to worker data
CREATE TABLE IF NOT EXISTS public.worker_data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  government_user_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  access_type text NOT NULL, -- 'view', 'contact_access', 'search', 'export'
  accessed_fields text[], -- track which fields were accessed
  access_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  session_id text,
  ip_address inet
);

-- Enable RLS on audit table
ALTER TABLE public.worker_data_access_logs ENABLE ROW LEVEL SECURITY;

-- Only verified government users can insert logs
CREATE POLICY "verified_government_can_log_access" 
ON public.worker_data_access_logs 
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_verified_government_user() 
  AND auth.uid() = government_user_id
);

-- Government users can view their own access logs
CREATE POLICY "government_can_view_own_logs" 
ON public.worker_data_access_logs 
FOR SELECT
TO authenticated
USING (
  public.is_verified_government_user() 
  AND auth.uid() = government_user_id
);

-- Create secure function for government users to access worker data with limited sensitive fields
CREATE OR REPLACE FUNCTION public.get_workers_for_government()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  experience_years integer,
  hourly_rate numeric,
  daily_rate numeric,
  willing_to_travel boolean,
  max_travel_distance integer,
  rating numeric,
  total_jobs_completed integer,
  skills text[],
  education_level text,
  certifications text[],
  languages text[],
  availability_status text,
  transport_means text[],
  verification_status text,
  background_check_status text,
  profile_photo_url text,
  county text,
  sub_county text,
  ward text,
  phone_number text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is verified government
  IF NOT public.is_verified_government_user() THEN
    RAISE EXCEPTION 'Access denied: Only verified government users can access worker information';
  END IF;
  
  -- Log the bulk access
  INSERT INTO worker_data_access_logs (
    government_user_id, 
    worker_id, 
    access_type, 
    accessed_fields
  ) 
  SELECT 
    auth.uid(), 
    cw.id, 
    'bulk_view',
    ARRAY['basic_profile', 'phone_number', 'location']
  FROM citizen_workers cw;
  
  -- Return worker information (excluding most sensitive data)
  RETURN QUERY
  SELECT 
    cw.id,
    cw.user_id,
    cw.experience_years,
    cw.hourly_rate,
    cw.daily_rate,
    cw.willing_to_travel,
    cw.max_travel_distance,
    cw.rating,
    cw.total_jobs_completed,
    cw.skills,
    cw.education_level,
    cw.certifications,
    cw.languages,
    cw.availability_status,
    cw.transport_means,
    cw.verification_status,
    cw.background_check_status,
    cw.profile_photo_url,
    cw.county,
    cw.sub_county,
    cw.ward,
    cw.phone_number, -- Include primary phone but not alternate
    cw.created_at,
    cw.updated_at
  FROM citizen_workers cw;
END;
$$;

-- Create function to get sensitive worker details (ID numbers, bank info, emergency contacts)
CREATE OR REPLACE FUNCTION public.get_worker_sensitive_info(worker_uuid uuid)
RETURNS TABLE(
  national_id text,
  kra_pin text,
  bank_name text,
  bank_account text,
  physical_address text,
  alternate_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  cv_document_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is verified government
  IF NOT public.is_verified_government_user() THEN
    RAISE EXCEPTION 'Access denied: Only verified government users can access sensitive worker information';
  END IF;
  
  -- Log the sensitive access
  INSERT INTO worker_data_access_logs (
    government_user_id, 
    worker_id, 
    access_type, 
    accessed_fields
  ) VALUES (
    auth.uid(), 
    worker_uuid, 
    'sensitive_info_access',
    ARRAY['national_id', 'kra_pin', 'bank_details', 'emergency_contacts', 'documents']
  );
  
  -- Return sensitive information
  RETURN QUERY
  SELECT 
    cw.national_id,
    cw.kra_pin,
    cw.bank_name,
    cw.bank_account,
    cw.physical_address,
    cw.alternate_phone,
    cw.emergency_contact_name,
    cw.emergency_contact_phone,
    cw.cv_document_url
  FROM citizen_workers cw
  WHERE cw.id = worker_uuid;
END;
$$;

-- Add updated trigger for the audit table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for worker_data_access_logs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_worker_data_access_logs_updated_at'
  ) THEN
    -- Add updated_at column to audit table if it doesn't exist
    ALTER TABLE public.worker_data_access_logs 
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
    
    -- Create trigger
    CREATE TRIGGER update_worker_data_access_logs_updated_at
      BEFORE UPDATE ON public.worker_data_access_logs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION public.is_verified_government_user() IS 
'Securely verifies if a user is a verified government official with valid, non-expired verification';

COMMENT ON FUNCTION public.get_workers_for_government() IS 
'Secure function for verified government users to access basic worker information with audit logging';

COMMENT ON FUNCTION public.get_worker_sensitive_info() IS 
'Secure function for verified government users to access sensitive worker details with strict audit logging';

COMMENT ON TABLE public.worker_data_access_logs IS 
'Audit log for tracking government user access to sensitive worker data';

COMMENT ON POLICY "verified_government_read_workers" ON public.citizen_workers IS 
'Only allows access to users with verified government status and valid verification records';