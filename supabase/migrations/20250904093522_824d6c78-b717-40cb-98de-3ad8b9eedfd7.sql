-- Drop all existing conflicting policies on citizen_workers
DROP POLICY IF EXISTS "Government can view all worker profiles" ON public.citizen_workers;
DROP POLICY IF EXISTS "Government can view worker profiles" ON public.citizen_workers;
DROP POLICY IF EXISTS "Restrict contractor direct access" ON public.citizen_workers;
DROP POLICY IF EXISTS "Workers can manage their own profiles" ON public.citizen_workers;
DROP POLICY IF EXISTS "Workers can manage their profiles" ON public.citizen_workers;
DROP POLICY IF EXISTS "Contractors cannot directly access citizen_workers" ON public.citizen_workers;

-- Create clean, consolidated RLS policies with proper security
-- Policy 1: Workers can manage their own profiles
CREATE POLICY "workers_own_profile_access" 
ON public.citizen_workers 
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Government users can view all worker profiles (read-only for sensitive data)
CREATE POLICY "government_read_all_workers" 
ON public.citizen_workers 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.user_type = 'government'
  )
);

-- Policy 3: Block all other access (contractors must use secure function)
-- This is the default behavior when no policies match, but let's be explicit
CREATE POLICY "block_unauthorized_access" 
ON public.citizen_workers 
FOR ALL
TO authenticated
USING (false)  -- Explicitly deny all other access
WITH CHECK (false);

-- Ensure the secure function for contractors is properly set up
CREATE OR REPLACE FUNCTION public.get_available_workers()
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
    cw.county, -- Only general location
    cw.created_at,
    cw.updated_at
  FROM citizen_workers cw
  WHERE cw.availability_status = 'available' 
    AND cw.verification_status = 'verified'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.user_type = 'contractor'
    );
$$;

-- Add comment for security documentation
COMMENT ON FUNCTION public.get_available_workers() IS 
'Secure function for contractors to view only non-sensitive worker data. Excludes phone numbers, national IDs, KRA PINs, bank details, and physical addresses.';

COMMENT ON POLICY "workers_own_profile_access" ON public.citizen_workers IS 
'Workers can only access and modify their own profile data';

COMMENT ON POLICY "government_read_all_workers" ON public.citizen_workers IS 
'Government users have read-only access to all worker profiles for administrative purposes';

COMMENT ON POLICY "block_unauthorized_access" ON public.citizen_workers IS 
'Explicitly blocks all unauthorized access. Contractors must use get_available_workers() function.';