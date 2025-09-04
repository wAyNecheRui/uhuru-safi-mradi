-- Create a secure view for contractors that only shows work-related information
CREATE VIEW public.contractor_worker_view AS
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
  county, -- Only general location, not specific address
  created_at,
  updated_at
FROM public.citizen_workers
WHERE availability_status = 'available' 
  AND verification_status = 'verified';

-- Enable RLS on the view
ALTER VIEW public.contractor_worker_view SET (security_invoker = true);

-- Drop the existing contractor policy that exposes sensitive data
DROP POLICY IF EXISTS "Contractors can view available workers" ON public.citizen_workers;

-- Create new restrictive policy for contractors on the main table
CREATE POLICY "Contractors cannot directly access citizen_workers" 
ON public.citizen_workers 
FOR SELECT 
TO authenticated
USING (false); -- Block all direct access from contractors

-- Create policy for the secure view
CREATE POLICY "Contractors can view safe worker info" 
ON public.contractor_worker_view 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.user_type = 'contractor'
  )
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
    );
$$;

-- Update existing policies to be more explicit about government access
DROP POLICY IF EXISTS "Government can view worker profiles" ON public.citizen_workers;
CREATE POLICY "Government can view all worker profiles" 
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

-- Ensure workers can still manage their own profiles
DROP POLICY IF EXISTS "Workers can manage their profiles" ON public.citizen_workers;
CREATE POLICY "Workers can manage their own profiles" 
ON public.citizen_workers 
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);