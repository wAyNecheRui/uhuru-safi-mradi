
-- Create a SECURITY DEFINER function to check user type without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.user_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Drop the problematic policy on user_profiles that causes recursion
DROP POLICY IF EXISTS "Job creators can view applicant profiles" ON public.user_profiles;

-- Recreate it using a SECURITY DEFINER approach (no RLS on referenced tables)
CREATE POLICY "Job creators can view applicant profiles" ON public.user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.workforce_jobs wj ON wj.id = ja.job_id
    WHERE ja.applicant_id = user_profiles.user_id
    AND wj.created_by = auth.uid()
  )
);

-- Fix job_applications policy that references user_profiles (causes the circular ref)
DROP POLICY IF EXISTS "Job creators and government can view applications" ON public.job_applications;

CREATE POLICY "Job creators and government can view applications" ON public.job_applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workforce_jobs wj
    WHERE wj.id = job_applications.job_id AND wj.created_by = auth.uid()
  )
  OR public.get_user_type(auth.uid()) = 'government'
);

-- Fix workforce_jobs government policy
DROP POLICY IF EXISTS "Government can manage jobs" ON public.workforce_jobs;

CREATE POLICY "Government can manage jobs" ON public.workforce_jobs
FOR ALL USING (
  public.get_user_type(auth.uid()) = 'government'
);
