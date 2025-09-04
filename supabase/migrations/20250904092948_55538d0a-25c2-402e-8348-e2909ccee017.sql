-- Drop the view since it can't have RLS
DROP VIEW IF EXISTS public.contractor_worker_view;

-- Create a secure function for contractors to view worker information
CREATE OR REPLACE FUNCTION public.get_available_workers_for_contractors()
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
    cw.county,
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

-- Update the main table RLS policies to be more restrictive
DROP POLICY IF EXISTS "Contractors can view available workers" ON public.citizen_workers;

-- Create policy that blocks contractors from direct access to the main table
CREATE POLICY "Restrict contractor direct access" 
ON public.citizen_workers 
FOR SELECT 
TO authenticated
USING (
  -- Allow workers to see their own data
  (auth.uid() = user_id)
  OR
  -- Allow government to see all data
  (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.user_type = 'government'
  ))
  -- Contractors must use the secure function, no direct access
);

-- Create function for contractors to get contact info of hired workers only
CREATE OR REPLACE FUNCTION public.get_worker_contact_info(worker_id uuid)
RETURNS TABLE(
  phone_number text,
  alternate_phone text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cw.phone_number,
    cw.alternate_phone
  FROM citizen_workers cw
  WHERE cw.id = worker_id
    AND EXISTS (
      -- Only allow if contractor has hired this worker
      SELECT 1 FROM workforce_applications wa
      JOIN workforce_jobs wj ON wa.job_id = wj.id
      WHERE wa.worker_id = worker_id
        AND wj.created_by = auth.uid()
        AND wa.status = 'accepted'
    )
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.user_type = 'contractor'
    );
$$;