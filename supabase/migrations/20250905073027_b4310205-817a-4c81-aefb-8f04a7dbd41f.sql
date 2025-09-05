-- Fix government user verification security issue

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

-- Create a secure view for government users that excludes most sensitive personal data
CREATE OR REPLACE VIEW public.government_worker_view AS
SELECT 
  id,
  user_id,
  experience_years,
  hourly_rate,
  daily_rate,
  willing_to_travel,
  max_travel_distance,
  rating,
  total_jobs_completed,
  skills,
  education_level,
  certifications,
  languages,
  availability_status,
  transport_means,
  verification_status,
  background_check_status,
  profile_photo_url,
  county,
  sub_county,
  ward,
  created_at,
  updated_at,
  -- Include phone for contact purposes but exclude sensitive financial/ID data
  phone_number,
  -- Exclude: national_id, kra_pin, bank_name, bank_account, physical_address, 
  -- alternate_phone, emergency_contact_name, emergency_contact_phone, cv_document_url
  null::text as national_id, -- Explicitly null these for clarity
  null::text as kra_pin,
  null::text as bank_name,
  null::text as bank_account,
  null::text as physical_address
FROM citizen_workers
WHERE public.is_verified_government_user();

-- Enable RLS on the view
ALTER VIEW public.government_worker_view SET (security_barrier = true);

-- Drop the existing government policy and replace with stricter verification
DROP POLICY IF EXISTS "government_read_all_workers" ON public.citizen_workers;

-- Create new policy that requires proper government verification
CREATE POLICY "verified_government_read_workers" 
ON public.citizen_workers 
FOR SELECT
TO authenticated
USING (public.is_verified_government_user());

-- Create policy for the government view (additional layer of security)
CREATE POLICY "government_can_use_secure_view" 
ON public.government_worker_view
FOR SELECT
TO authenticated
USING (public.is_verified_government_user());

-- Create audit table for tracking government access to worker data
CREATE TABLE IF NOT EXISTS public.worker_data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  government_user_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  access_type text NOT NULL, -- 'view', 'search', 'export'
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

-- Create function to get worker contact info with audit logging
CREATE OR REPLACE FUNCTION public.get_worker_contact_info_secure(worker_uuid uuid)
RETURNS TABLE(
  phone_number text,
  alternate_phone text,
  emergency_contact_name text,
  emergency_contact_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gov_verified boolean;
BEGIN
  -- Check if user is verified government
  SELECT public.is_verified_government_user() INTO gov_verified;
  
  IF NOT gov_verified THEN
    RAISE EXCEPTION 'Access denied: Only verified government users can access worker contact information';
  END IF;
  
  -- Log the access
  INSERT INTO worker_data_access_logs (
    government_user_id, 
    worker_id, 
    access_type, 
    accessed_fields
  ) VALUES (
    auth.uid(), 
    worker_uuid, 
    'contact_info_access',
    ARRAY['phone_number', 'alternate_phone', 'emergency_contact_name', 'emergency_contact_phone']
  );
  
  -- Return contact information
  RETURN QUERY
  SELECT 
    cw.phone_number,
    cw.alternate_phone,
    cw.emergency_contact_name,
    cw.emergency_contact_phone
  FROM citizen_workers cw
  WHERE cw.id = worker_uuid;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.is_verified_government_user() IS 
'Securely verifies if a user is a verified government official with valid, non-expired verification';

COMMENT ON VIEW public.government_worker_view IS 
'Secure view for verified government users that excludes sensitive financial and ID information';

COMMENT ON FUNCTION public.get_worker_contact_info_secure() IS 
'Secure function for verified government users to access worker contact information with audit logging';

COMMENT ON TABLE public.worker_data_access_logs IS 
'Audit log for tracking government user access to sensitive worker data';

COMMENT ON POLICY "verified_government_read_workers" ON public.citizen_workers IS 
'Only allows access to users with verified government status and valid verification records';